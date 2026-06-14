# Item Piles: Black Flag / Tales of the Valiant

Module that registers Black Flag system support with Item Piles (3.3.1+ / verified 3.3.2).

**Repo:** `jonmichaels/item-piles-black-flag`
**Module ID:** `item-piles-black-flag`
**Current version:** 0.1.3

## Architecture

Single-bundle module — **no build step.** The source IS `dist/module.js`. Edit it directly.
`module.json` is the manifest. `module.zip` is the distribution bundle.

## What It Does

Registers Black Flag as a system with Item Piles via `game.itempiles.API.addSystemIntegration()`.
This enables:
- Lootable piles with BF currencies (PP, GP, SP, CP)
- Item filters that hide non-physical types (spells, classes, features, etc.)
- Merchant trading with BF pricing
- Vault styling based on BF rarity
- Container item handling (BF containers use `system.container` ID reference)

## Integration Data

Key differences from dnd5e's integration:

| Setting | dnd5e | Black Flag |
|---------|-------|------------|
| Actor class type | `"character"` | `"pc"` |
| Loot item type | `"loot"` | `"sundry"` |
| Equipment type | `"equipment"` | `"gear"` |
| Currency model | `attribute` (actor.currency) | `item` (compendium UUID) |
| Currency decimal | n/a | `1e-5` |
| Item filters | spell, feat, class, subclass, background, race | background, class, feature, heritage, lineage, spell, subclass, talent |
| Unstackable types | `["container"]` | `["container", "armor", "weapon"]` |
| Item similarities | name, type, system.container | name, type |

### Currency Model

BF currencies are **items** in the `black-flag.currencies` compendium. Each currency definition
includes a compendium UUID so Item Piles can look up the actual item.

Currencies are built dynamically from `CONFIG.BlackFlag.currencies` — only currencies with
a `uuid` field are included. If currencies lack UUIDs (compendiums not yet loaded), the
integration waits for `blackFlag.registrationComplete` hook and retries.

### ITEM_TYPE_HANDLERS

BF containers differ from dnd5e — container contents reference the container by item ID
(`item.system.container === id`) rather than being nested in `item.system.contents`.

## Foundry v13/v14 Compatibility — CRITICAL


### Foundry v14 / Black Flag v3 handoff

For v14 manual testing, the module is symlinked from `/home/jon/foundryuserdata14/Data/modules/item-piles-black-flag` to this repo. The v14 local stack uses Foundry 14 on port 30001 with Black Flag 3.0.075 and Item Piles 3.3.2 installed. After compatibility metadata changes, rebuild `module.zip` even though there is no JS build step. Never add `compatibility.maximum` to `module.json`; it breaks installs as soon as a newer Foundry/system/module version is released.

### Problem 1: `html.find is not a function` (Item Piles chat-api.js:56)

Item Piles 3.3.1 registers on `renderChatMessageHTML` but calls `html.find()` — a jQuery API.
Foundry v13 passes a native `HTMLElement`, not jQuery. This crashes on any chat message.

**Fix (v0.1.2):** jQuery `.find()` / `.closest()` polyfill registered on `renderChatMessageHTML`
hook at `init` time:

```js
Hooks.on("renderChatMessageHTML", (_app, html, _context) => {
    if (html && !html.find) {
        html.find = (sel) => $(html).find(sel);
        html.closest = (sel) => $(html).closest(sel);
    }
});
```

This is registered in TWO places:
1. Directly in `Hooks.once("init", ...)` — guarantees it fires regardless of Item Piles timing
2. In `SYSTEM_HOOKS` — fired by Item Piles during `addSystemIntegration()`

### Problem 2: Top-level `game` access

In Foundry v13 ES modules, `game` is undefined at module parse time. The registration
code MUST be inside `Hooks.once("init", ...)`.

```js
// WRONG — game is undefined here:
Hooks.once("item-piles-ready", registerBlackFlagIntegration);

// CORRECT:
Hooks.once("init", () => {
    Hooks.once("item-piles-ready", registerBlackFlagIntegration);
    if (game.itempiles) registerBlackFlagIntegration();
});
```

### Problem 3: Deprecation warnings

Foundry v13 emits three deprecation warnings — all are **harmless core noise**, not bugs:

1. `renderChatMessage is deprecated` — Foundry core fires the old hook for backwards compat
   on every chat render. Fires once per session. Not fixable, not harmful.
2. `renderTemplate is deprecated` — from `retroactive-advantage-bf` (separate module).
   Fixed in that module's repo.

## Testing

### Via MCP

```js
// Check module active
game.modules.get('item-piles-black-flag').active

// Check integration
game.itempiles.API.ACTOR_CLASS_TYPE  // should be "pc"
game.itempiles.API.CURRENCIES?.length // should be 4

// Trigger chat message to test polyfill
ChatMessage.create({ content: "test" })

// Check for errors: F12 console → no "html.find is not a function"
```

### Manual
1. Enable module + Item Piles in a Black Flag world
2. Create an actor with items
3. Drop items on a scene → should create a loot pile
4. Open the loot pile → should show BF items and currencies
5. Post a chat message or activate an item → no console errors

## Release Workflow

1. Bump version in BOTH `module.json` AND `dist/module.js` (VERSION field)
2. Update README if needed
3. Commit and push
4. Create GitHub release: tag `v0.1.X`, attach `module.json` and `module.zip`
5. Submit to Foundry package registry: `POST https://registry.foundryvtt.com/api/package/submit`
   with `module.json` as body, `Authorization: PACKAGE_SUBMIT <token>` header

## Key Files

| File | Purpose |
|------|---------|
| `module.json` | Foundry manifest (version, relationships, download URL) |
| `dist/module.js` | **Source** — single-file module, no build step |
| `module.zip` | Distribution zip (module.json + dist/ + README + LICENSE) |
| `README.md` | Standard format matching other jonmichaels modules |
| `CLAUDE.md` | This file |

## Dependencies

- **Item Piles** v3.2.7+ (`fantasycalendar/FoundryVTT-ItemPiles`), verified with 3.3.2
- **Black Flag** v2.0.0+ (verified with v3.0.075; no `maximum` cap in manifest)
- **Foundry VTT** v13+ (verified with v14; no `maximum` cap in manifest)

## Reference

- Item Piles system config docs: https://fantasycomputer.works/FoundryVTT-ItemPiles/#/configuring-item-piles
- Item Piles API docs: https://fantasycomputer.works/FoundryVTT-ItemPiles/#/api
- DnD5e integration reference: `fantasycalendar/FoundryVTT-ItemPilesDnD5e` (dist/module.js)
- BF currency compendium: `black-flag.currencies`
- BF CONFIG: `CONFIG.BlackFlag.currencies` — { abbreviation: { label, uuid, conversion } }
