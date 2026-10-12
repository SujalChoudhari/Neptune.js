# Neptune.js 2D Action-RPG Product Contract

**Status:** M01 target contract. This document defines the intended first completion target; it does not claim that every capability below is already implemented or shipped.

## Product goal and supported scope

Neptune.js will support building a complete 2D action-RPG vertical slice for the browser. The first completion target brings together authored maps, player and enemy entities, combat, RPG progression, HTML user interfaces, and saved game/world state. The target includes 2D rendering, tilemaps and transitions, tile-aware navigation and collision, configurable encounters, dialogue or menus, and project data that can be used by both the game runtime and Triton.

3D and multiplayer are explicitly out of scope for the first completion target. M01 defines the product boundary only; it does not implement engine gameplay, Triton editor workflows, packaging, release, or deployment.

## Movement model

Navigation and collision are tile-aware: authored map tiles provide the grid and navigation/collision constraints used to place and move actors. Real-time movement and combat are optional on top of that tile-aware world. A project can use grid-oriented movement, real-time movement, or a mix, but movement and attacks must still respect authored collision and navigation constraints. Tile awareness describes the world model; it does not require every actor to move only in whole-tile steps.

## Runtime, editor, and data boundary

- **Runtime:** loads a project and its scenes/resources, then executes the game for players: input, 2D rendering, movement/collision, encounters and combat, progression, HTML UI, and save/load.
- **Triton editor:** is a separate authoring tool for opening projects and editing scenes, entities, components, tile/navigation data, and other supported game content. It may preview or control a running game, but editor panels and editor-only services are not runtime dependencies.
- **Shared project data:** the editor authors and saves project data that the runtime can load directly. Running a game does not require launching Triton or manually rewriting editor output.

The data-model direction is portable, serializable, explicitly versioned project and scene data, with stable identifiers for authored entities/components and validated references to resources such as tilesets, sprites, animations, audio, and prefabs. Runtime state that changes during play (for example, player/world progression) is kept distinct from editor authoring data. Runtime and editor share the data contract; neither owns a private incompatible copy. The exact schemas, migration rules, and serialization implementation are deferred to the project-data milestone rather than frozen here.

## First action-RPG vertical-slice checklist

Run these checks against one clean project authored through supported project data. Each item passes only when its observable result can be reproduced after starting the project from its saved state.

- [ ] **Maps:** load a 2D tilemap with authored navigation/collision and transition from one map to another; the player appears at the destination's authored entry point and blocked tiles remain impassable.
- [ ] **Enemies:** load at least one configured enemy from project data into an authored map and observe it participate in the encounter without hand-editing runtime state.
- [ ] **Combat:** resolve an authored player attack against an enemy; a valid hit applies its declared effect and produces an observable change in enemy/game state, while an invalid hit does not.
- [ ] **Progression:** complete one supported encounter or progression action and observe the corresponding character/world progression value change in game data.
- [ ] **HTML UI:** display an in-game HTML UI flow (menu or dialogue), accept player input, and observe the selected action change the game state or scene.
- [ ] **Save/load:** save after changing map and progression state, restart the runtime, load that save, and verify the saved map, player entry/location, and progression state are restored.

These checks define the minimum integrated product outcome; later milestones may refine mechanics and add coverage without changing the 2D-only, tile-aware, runtime/editor, or persistence boundaries above.
