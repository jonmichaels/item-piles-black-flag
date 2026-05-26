async function registerBlackFlagIntegration() {
    console.log("Item Piles: Black Flag | Registering system integration...");

    // ─── Item filters (non-physical BF item types) ───
    const ITEM_FILTERS = [
        {
            path: "type",
            filters: "background,class,feature,heritage,lineage,spell,subclass,talent"
        }
    ];

    const ITEM_SIMILARITIES = ["name", "type"];
    const UNSTACKABLE_ITEM_TYPES = ["container", "armor", "weapon"];

    // ─── Dynamic currency builder ───
    function buildCurrencies() {
        const bfCurrencies = CONFIG.BlackFlag?.currencies ?? {};
        return Object.entries(bfCurrencies)
            .filter(([, config]) => config?.uuid)
            .map(([abbreviation, config]) => ({
                type: "item",
                name: config.label,
                img: null,
                abbreviation: `{#}${abbreviation.toUpperCase()}`,
                data: { uuid: config.uuid },
                primary: abbreviation === "gp",
                exchangeRate: config.conversion
            }));
    }

    const currencyEntries = buildCurrencies();
    console.log(
        `Item Piles: Black Flag | ${Object.keys(CONFIG.BlackFlag?.currencies ?? {}).length} BF currencies, ` +
        `${currencyEntries.length} with UUIDs`
    );

    // ─── Integration data (applies to all users via SUPPORTED_SYSTEMS) ───
    const integrationData = {
"VERSION": "0.1.2",
        ACTOR_CLASS_TYPE: "pc",
        ITEM_CLASS_LOOT_TYPE: "sundry",
        ITEM_CLASS_WEAPON_TYPE: "weapon",
        ITEM_CLASS_EQUIPMENT_TYPE: "gear",
        ITEM_QUANTITY_ATTRIBUTE: "system.quantity",
        ITEM_PRICE_ATTRIBUTE: "system.price.value",
        QUANTITY_FOR_PRICE_ATTRIBUTE: "flags.item-piles.system.quantityForPrice",

        ITEM_FILTERS: ITEM_FILTERS,
        ITEM_SIMILARITIES: ITEM_SIMILARITIES,
        UNSTACKABLE_ITEM_TYPES: UNSTACKABLE_ITEM_TYPES,
        CURRENCIES: currencyEntries,
        CURRENCY_DECIMAL_DIGITS: 1e-5,

        PILE_DEFAULTS: {},

        ITEM_TRANSFORMER: (itemData) => {
            if (itemData?.flags?.["black-flag"]?.relationship?.attuned) {
                foundry.utils.setProperty(itemData, "flags.black-flag.relationship.attuned", false);
            }
            return itemData;
        },

        PRICE_MODIFIER_TRANSFORMER: ({ buyPriceModifier, sellPriceModifier } = {}) => {
            return { buyPriceModifier, sellPriceModifier };
        },

        ITEM_COST_TRANSFORMER: (item, currencies) => {
            const overallCost = Number(foundry.utils.getProperty(item, "system.price.value")) ?? 0;
            const priceDenomination = foundry.utils.getProperty(item, "system.price.denomination");
            if (priceDenomination && currencies) {
                const match = currencies.find(c =>
                    c.type === "item" && c.data?.uuid
                        ? false  // uuid-based: match handled by Item Piles internally
                        : c.data?.item?.system?.identifier?.value === priceDenomination
                );
                if (match) return overallCost * match.exchangeRate;
            }
            return overallCost ?? 0;
        },

        ITEM_TYPE_HANDLERS: {
            GLOBAL: {
                [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED]: ({ item }) => {
                    const itemData = item instanceof Item ? item.toObject() : item;
                    return itemData?.system?.container;
                },
                [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED_PATH]: "system.container"
            },
            container: {
                [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.HAS_CURRENCY]: true,
                [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.CONTENTS]: ({ item }) => {
                    if (!item.parent) return [];
                    return item.parent.items.filter(i => i.system.container === item.id);
                },
                [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.TRANSFER]: ({ item, items, raw = false } = {}) => {
                    if (!item.parent) return items;
                    return [
                        ...items,
                        ...item.parent.items
                            .filter(i => i.system.container === item.id)
                            .map(i => raw ? i : i.toObject())
                    ];
                }
            }
        },

        VAULT_STYLES: [
            { path: "system.rarity", value: "artifact",   styling: { "box-shadow": "inset 0px 0px 7px 0px rgba(255,191,0,1)" } },
            { path: "system.rarity", value: "legendary",  styling: { "box-shadow": "inset 0px 0px 7px 0px rgba(255,119,0,1)" } },
            { path: "system.rarity", value: "veryRare",   styling: { "box-shadow": "inset 0px 0px 7px 0px rgba(255,0,247,1)" } },
            { path: "system.rarity", value: "rare",       styling: { "box-shadow": "inset 0px 0px 7px 0px rgba(0,136,255,1)" } },
            { path: "system.rarity", value: "uncommon",   styling: { "box-shadow": "inset 0px 0px 7px 0px rgba(0,255,9,1)" } }
        ],

        SYSTEM_HOOKS: () => {
            // Foundry v13 passes native DOM elements in render hooks.
            // Item Piles 3.3.1 expects jQuery .find() on the html parameter
            // (chat-api.js:56 _renderChatMessage calls html.find(...)).
            // Polyfill .find/.closest on the specific element before Item
            // Piles' renderChatMessageHTML hook processes it.
            Hooks.on("renderChatMessageHTML", (_app, html, _context) => {
                if (html && !html.find) {
                    html.find = (sel) => $(html).find(sel);
                    html.closest = (sel) => $(html).closest(sel);
                }
            });
        }
    };

    // ─── Register integration (all users) ───
    try {
        await game.itempiles.API.addSystemIntegration(integrationData);
        console.log("Item Piles: Black Flag | Integration registered");
    } catch (err) {
        console.error("Item Piles: Black Flag | addSystemIntegration failed:", err);
        return;
    }

    // ─── Persist settings (GM only) ───
    // Non-GM users can't modify world settings. They get display data from
    // SUPPORTED_SYSTEMS (populated by addSystemIntegration above).
    // The GM persists settings once; they're stored in the world DB for all users.

    if (!game.user.isGM) {
        console.log("Item Piles: Black Flag | Non-GM user, settings already persisted by GM");
        return;
    }

    const API = game.itempiles.API;

    async function persistSettings(currencies) {
        await API.setActorClassType("pc");
        await API.setItemQuantityAttribute("system.quantity");
        await API.setItemPriceAttribute("system.price.value");
        await API.setItemFilters(ITEM_FILTERS);
        await API.setItemSimilarities(ITEM_SIMILARITIES);
        await API.setUnstackableItemTypes(UNSTACKABLE_ITEM_TYPES);
        await API.setPileDefaults({});

        if (currencies && currencies.length > 0) {
            await API.setCurrencies(currencies);
            console.log(`Item Piles: Black Flag | ${currencies.length} currencies set`);
        }
    }

    try {
        if (currencyEntries.length > 0) {
            await persistSettings(currencyEntries);
            console.log("Item Piles: Black Flag | Settings persisted");
        } else {
            // Currencies don't have UUIDs yet — BF compendiums haven't loaded.
            // Persist everything else now, register currencies when BF is ready.
            await persistSettings(null);
            console.log("Item Piles: Black Flag | Core settings persisted, waiting for BF currency registration...");

            Hooks.once("blackFlag.registrationComplete", async () => {
                const currencies = buildCurrencies();
                if (currencies.length === 0) {
                    console.warn("Item Piles: Black Flag | BF registration complete but still no currency UUIDs");
                    return;
                }
                try {
                    await API.setCurrencies(currencies);
                    console.log(`Item Piles: Black Flag | ${currencies.length} currencies set (deferred)`);
                } catch (err) {
                    console.error("Item Piles: Black Flag | Deferred setCurrencies failed:", err);
                }
            });
        }
    } catch (err) {
        console.error("Item Piles: Black Flag | Failed to persist settings:", err);
    }
}

// jQuery polyfill for Foundry v13 native HTMLElement in renderChatMessageHTML
// Item Piles 3.3.1 chat-api.js calls html.find() which requires jQuery.
// Foundry v13 deprecated renderChatMessage → use renderChatMessageHTML instead.
Hooks.once("init", () => {
    Hooks.on("renderChatMessageHTML", (_app, html, _context) => {
        if (html && !html.find) {
            html.find = (sel) => $(html).find(sel);
            html.closest = (sel) => $(html).closest(sel);
        }
    });

    // Register Black Flag integration when Item Piles is ready
    Hooks.once("item-piles-ready", registerBlackFlagIntegration);
    if (game.itempiles) {
        registerBlackFlagIntegration();
    }
});
