import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../dist/module.js', import.meta.url), 'utf8');

assert(
  source.includes('game.user?.isGM'),
  'registerBlackFlagIntegration must tolerate game.user being null during Foundry v13 startup'
);

assert(
  source.includes('Hooks.once("ready"'),
  'registerBlackFlagIntegration must defer GM settings persistence when game.user is not ready'
);

const onceHooks = new Map();
const onHooks = new Map();
let integrationRegistered = false;
let settingsPersisted = false;

const context = {
  console,
  CONFIG: {
    BlackFlag: {
      currencies: {
        gp: { label: 'Gold', uuid: 'Compendium.black-flag.currencies.Gold', conversion: 1 },
      },
    },
  },
  Hooks: {
    once(name, fn) { onceHooks.set(name, fn); },
    on(name, fn) { onHooks.set(name, fn); },
  },
  foundry: {
    utils: {
      getProperty(obj, path) {
        return path.split('.').reduce((value, key) => value?.[key], obj);
      },
      setProperty(obj, path, value) {
        const parts = path.split('.');
        const last = parts.pop();
        let target = obj;
        for (const part of parts) target = target[part] ??= {};
        target[last] = value;
      },
    },
  },
  Item: class Item {},
  $: () => ({ find: () => [], closest: () => [] }),
  game: {
    user: null,
    itempiles: null,
  },
};

vm.createContext(context);
vm.runInContext(source, context, { filename: 'dist/module.js' });

assert.equal(typeof onceHooks.get('init'), 'function', 'module must register init hook');
onceHooks.get('init')();
assert.equal(typeof onceHooks.get('item-piles-ready'), 'function', 'module must register item-piles-ready hook');

context.game.itempiles = {
  CONSTANTS: {
    ITEM_TYPE_METHODS: {
      IS_CONTAINED: 'isContained',
      IS_CONTAINED_PATH: 'isContainedPath',
      HAS_CURRENCY: 'hasCurrency',
      CONTENTS: 'contents',
      TRANSFER: 'transfer',
    },
  },
  API: {
    async addSystemIntegration() { integrationRegistered = true; },
    async setActorClassType() { settingsPersisted = true; },
    async setItemQuantityAttribute() {},
    async setItemPriceAttribute() {},
    async setItemFilters() {},
    async setItemSimilarities() {},
    async setUnstackableItemTypes() {},
    async setPileDefaults() {},
    async setCurrencies() {},
  },
};

await onceHooks.get('item-piles-ready')();

assert.equal(integrationRegistered, true, 'integration should register even before game.user exists');
assert.equal(settingsPersisted, false, 'settings persistence must wait until a GM user exists');
assert.equal(typeof onceHooks.get('ready'), 'function', 'missing game.user should register a ready-hook retry');

context.game.user = { isGM: true };
await onceHooks.get('ready')();
assert.equal(settingsPersisted, true, 'GM settings should persist once game.user becomes available on ready');

console.log('module guard tests passed');
