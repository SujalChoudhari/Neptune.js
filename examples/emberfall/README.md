# Emberfall — The First Ember

A top-down 2D action-RPG demo built entirely with the Neptune.js engine runtime (`src/`) and versioned project data (`project.npt`). Features full game UX: atmospheric title screen with animated particles, full keyboard-navigable menus, interactive on-screen tutorial, original character and environment art, multi-track synthesized audio, camera shake, floating combat text, and multi-phase boss encounters.

## Features

- **Atmospheric Title & Pause Menus**: Atmospheric dark fantasy presentation with floating ember particle background, sound & effects volume controls, full keyboard navigation (`installUINavigation` supporting Arrow/WASD + Enter/Space), and safe Continue flow from browser storage.
- **Interactive On-Screen Tutorial**: Progressive tutorial ribbon guiding fresh players through Movement, Speaking with Mira, Blade Strikes, Evasion/Dodging, Vault Navigation, and Saving.
- **Original High-Resolution Art**: Hand-crafted vector SVGs and transparent PNGs for all entities:
  - *Wanderer*: Resting, walking, striking with turquoise blade arc, and evasive dodge dash.
  - *Mira*: Keeper of the Hollow in flowing emerald sage robes with her lantern staff.
  - *Corrupted Sentinels*: Stone-armored automatons with glowing runic cores, notched poleaxes, and telegraphed golden windups.
  - *The Keeper*: Towering three-phase dungeon boss in dark plate armor wielding a colossal cleaver, with cracking molten fissures in Phase 2 and blazing hellfire wings in Phase 3.
  - *World Objects*: Iron-bound treasure coffers (closed & open states), floating runic vault seals, ancient tiered heartstone altar (dormant & blazing ignited states), and the glowing Briar Hollow lantern tree.
- **Synthesized Dynamic Audio**: Multi-track synthesized procedural music for Briar Hollow (warm pentatonic arpeggios), the Old Keep (low gothic drone), and the Keeper battle (driving combat pulse), alongside procedural SFX for swings, impacts, dodges, coffers, seals, and dialogue.
- **Combat & Game Feel**: Smooth camera tracking with trauma-based screen shake on heavy blows, floating damage numbers (+27 DMG, +15 Marks, SEAL CLAIMED!), animated vitality gauge with lag bar, and telegraphed enemy combatants.
- **Full Engine Compatibility**: Pure entity-component architecture with `Transform`, `Sprite`, `Shape`, `BoxCollider`, `ProjectBehaviour`, `Combatant`, `CombatSystem`, `Inventory`, and `SaveManager`. 100% compliant with Triton editor previews and automated browser test contracts.

## Play

From the Neptune repository root, start the local server:
```sh
npm run serve
```

- **Main Adventure & Expedition**: Open http://127.0.0.1:8000/examples/emberfall/adventure.html. Choose **Begin journey** or **Continue**.
- **Tutorial & Practice Route**: Open http://127.0.0.1:8000/examples/emberfall/adventure.html?practice=1.
- **Classic Ruins Starter**: Open http://127.0.0.1:8000/examples/emberfall/.

### Controls

| Action | Keyboard Binding |
| --- | --- |
| **Move** | `W` `A` `S` `D` or Arrow Keys |
| **Strike** | `J` |
| **Dodge / Evade** | `Space` (while moving) |
| **Interact** | `E` (near NPC, Coffer, Seal, or Altar) |
| **Save Journey** | `O` (saves to browser local storage) |
| **Load Journey** | `L` |
| **Pause / Menu** | `Esc` |
| **Rise after Death** | `R` (revives at last visited lantern) |

## Project Structure

- `project.npt`: Project manifest and startup scene descriptor.
- `scenes/expedition.scene`: The complete 10-room keep with three guarded seals, optional treasure coffer, and the three-phase Keeper.
- `scenes/adventure.scene`: Practice and tutorial route.
- `scenes/ruins.scene`: Preserved single-room classic ruins starter.
- `scripts/adventure-game.js`: Full adventure gameplay orchestrator (combat, tutorial, audio, HUD, camera FX, and save engine).
- `scripts/game.js`: Classic ruins gameplay script.
- `adventure.html`, `adventure.js`, `adventure.css`: Title screen, settings modal, and pause overlay with keyboard navigation.
- `assets/`: Vector SVGs and pre-rendered PNG copies for characters, bosses, interactables, and environment props.
