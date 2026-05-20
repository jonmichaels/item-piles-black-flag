# Item Piles: Black Flag / Tales of the Valiant

Adds [Black Flag Roleplaying](https://foundryvtt.com/packages/black-flag) / Tales of the Valiant system support for the [Item Piles](https://foundryvtt.com/packages/item-piles) module.

## Requirements

- [Item Piles](https://foundryvtt.com/packages/item-piles) v3.2.7+
- [Black Flag Roleplaying](https://foundryvtt.com/packages/black-flag) v2.0.0+

## Features

- Item pile creation and loot distribution
- Physical item detection (filters out classes, spells, features, etc.)
- Black Flag currency support (pp, gp, sp, cp handled as item-based currency)
- Container nesting and transfer
- Merchant price support with denomination conversion
- Vault rarity styling (common through artifact)

## Installation

Install via Foundry VTT module browser, or paste this manifest URL:

```
https://github.com/jonmichaels/item-piles-black-flag/releases/latest/download/module.json
```

## Known Limitations

- Black Flag stores currency as Items rather than Actor attributes — this module uses item-based currency configuration. Certain advanced merchant features may behave differently than in dnd5e.
- Black Flag does not have a dedicated "loot" item type. The `sundry` type is used as the default.
- Context menu "Give to Character" may require additional hook integration (pending verification).

## License

MIT
