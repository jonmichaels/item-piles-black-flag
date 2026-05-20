# Item Piles — Black Flag / Tales of the Valiant

> **⚠️ Disclaimer:** This module was created by an AI coding agent (Hephaestus, via Hermes Agent) under the direction of Jon Michaels. While tested and functional, users should verify behavior in their own games before relying on it in critical sessions.

[![Foundry VTT](https://img.shields.io/badge/Foundry-v13-orange)](https://foundryvtt.com)
[![Black Flag](https://img.shields.io/badge/System-Black%20Flag%20%2F%20ToV-blue)](https://github.com/koboldpress/black-flag)
[![Version](https://img.shields.io/badge/Version-0.1.0-green)](https://github.com/jonmichaels/item-piles-black-flag/releases)

Adds **Black Flag Roleplaying (Tales of the Valiant)** system support for the [Item Piles](https://foundryvtt.com/packages/item-piles) module — enabling loot piles, merchants, vaults, and currency handling for the Black Flag system.

## Installation

**In Foundry VTT:**
1. Go to **Add-on Modules** → **Install Module**
2. Paste the manifest URL: `https://github.com/jonmichaels/item-piles-black-flag/releases/latest/download/module.json`
3. Click **Install**

**Manual:**
Download the latest release zip and extract to `Data/modules/item-piles-black-flag/`.

## Requirements

- **Foundry VTT** v13+
- **[Item Piles](https://foundryvtt.com/packages/item-piles)** v3.2.7+
- **[Black Flag Roleplaying](https://foundryvtt.com/packages/black-flag)** (Tales of the Valiant) v2.0+

## How It Works

This module configures Item Piles with Black Flag–specific data, including:

| Feature | Configuration |
|---------|--------------|
| **Actor type** | Item pile actors created as `pc` |
| **Item filters** | Non-physical types (class, spell, feature, background, etc.) excluded from piles |
| **Currencies** | pp, gp, sp, cp — referenced from the Black Flag system compendium |
| **Container support** | Container items transfer their contents when looted |
| **Vault styling** | Rarity-based border colors (uncommon → artifact) |
| **Item transformation** | Strips attunement flags when items enter piles |

After installation, Item Piles recognizes the Black Flag system automatically — no manual configuration required.

## Credits

- **D&D 5E compatibility module:** [fantasycalendar/FoundryVTT-ItemPilesDnD5e](https://github.com/fantasycalendar/FoundryVTT-ItemPilesDND5e) — created by Wasp / Fantasy Computerworks, used as reference
- **Item Piles core:** [fantasycalendar/FoundryVTT-ItemPiles](https://github.com/fantasycalendar/FoundryVTT-ItemPiles) — by Fantasy Computerworks
- **Black Flag port:** This module — by Jon Michaels, coded by Hephaestus (AI agent via Hermes Agent)

## License

MIT
