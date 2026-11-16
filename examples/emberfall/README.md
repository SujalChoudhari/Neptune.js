# Emberfall — The First Ember

A small playable top-down ARPG starter using a versioned `project.npt`, an editable scene, ordinary entities/components and project-local gameplay code. It is a foundation for the demo, not the completed engine roadmap.

## Play

From the Neptune repository root, run `npm run serve`, then open http://127.0.0.1:8000/examples/emberfall/ and select **Play Game**.

WASD/arrows move, J attacks in your facing direction, E interacts, O saves, L loads, and R revives/repositions the player. Defeat the three guardians, then approach the golden altar in the northeast and press E. Saves use the browser's local storage; browser and desktop editor saves are separate. R preserves defeated guardians and rewards; reload the page for a fresh encounter.

## Open in Triton

Start `Neptune.cmd`, import/open the `examples/emberfall` folder and choose Edit. The editor reads `project.npt` and auto-loads `scenes/ruins.scene`. Select Wanderer or a guardian, edit its transform, save, and reopen. Switch to Game View and use Play/Pause/Stop. Click inside the game before using its keyboard controls.

`ProjectBehaviour` components retain the module path and settings in scene JSON. Their code starts on the first gameplay update; the paused Scene View does not execute project gameplay. The room camera scales the game to the available Game View. Stop halts the current runtime; reopen the scene to restore authored state.

## Project structure

- `project.npt`: schema version, project name, and main scene path. `scenes` is reserved for embedded scene objects; it is not an array of filenames.
- `scenes/ruins.scene`: floor, solid walls/columns, altar, player and guardians with stable IDs.
- `scripts/game.js`: project behaviours using existing Combatant/CombatSystem, Inventory, SaveManager, KeyboardInput and collider helpers. No Triton or Tauri imports.
- `main.js`: browser bootstrap that reads the same `.npt` and scene.

## Project modules

A `ProjectBehaviour` component has `{ "module": "scripts/game.js", "settings": { ... } }`. The path is relative to the project root. Modules export `create({ entity, engine, properties })`, returning optional `start()`, `update(deltaTime)` and `destroy()` callbacks. Use the injected engine API; relative ES imports from these Blob-loaded modules are not supported. Bundle dependencies into one module if needed.

The injected API includes Transform, Shape, Color, KeyboardInput, Camera, SceneManager, SaveManager, BoxCollider, Larissa and Nereid. Destroy must release project-owned listeners and DOM nodes. Invalid module paths and loading errors appear as `PROJECT_BEHAVIOUR_LOAD_FAILED` in the game/editor console.

## Current limits

This is one room, three melee guardians and an altar objective, with placeholder shapes. It does not yet include a village, multiple maps, ranged skills, quest dialogue, equipment UI or a phased boss. Current settings are authored in scene JSON; the general inspector does not yet provide a specialized behaviour-settings form. Gameplay geometry is editable; keep the room's 14×9 world bounds and altar at (12, 2) while using the starter script.
