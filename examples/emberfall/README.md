# Emberfall — The First Ember

A two-area top-down ARPG slice using a versioned `project.npt`, editable scenes, ordinary entities/components and project-local gameplay code. The classic single-room starter remains available for regression and quick engine examples.

## Play

From the Neptune repository root, run `npm run serve`, then open http://127.0.0.1:8000/examples/emberfall/adventure.html. Choose **Begin journey** or **Continue** at the title screen. The older one-room sample remains at http://127.0.0.1:8000/examples/emberfall/ (**Play Game**).

WASD/arrows move, J strikes, Space dodges, E interacts, Esc pauses, O saves, L loads, and R rises after death at the last lantern. Speak to Mira in Briar Hollow, cross the bridge, search the coffer, defeat the sentinel and the Keeper, then use the heartstone and return to Mira. The Keeper's yellow wind-up cues a heavy attack; step out before it lands. Settings and the world save use browser local storage. A fresh game resets world progress while keeping sound settings. Browser and desktop editor saves are separate.

## Open in Triton

Start `Neptune.cmd`, import/open the `examples/emberfall` folder and choose Edit. The editor reads `project.npt` and auto-loads `scenes/ruins.scene`. Select Wanderer or a guardian, edit its transform, save, and reopen. Switch to Game View and use Play/Pause/Stop. Click inside the game before using its keyboard controls.

`ProjectBehaviour` components retain the module path and settings in scene JSON. Their code starts on the first gameplay update; the paused Scene View does not execute project gameplay. The room camera scales the game to the available Game View. Stop halts the current runtime; reopen the scene to restore authored state.

## Project structure

- `project.npt`: schema version, project name, and main scene path. `scenes` is reserved for embedded scene objects; it is not an array of filenames.
- `scenes/ruins.scene`: preserved original classic starter scene.
- `scenes/adventure.scene`: Briar Hollow, the bridge and the Drowned Keep, with a coffer, sentinel and phased Keeper.
- `scripts/game.js`: project behaviours using existing Combatant/CombatSystem, Inventory, SaveManager, KeyboardInput and collider helpers. No Triton or Tauri imports.
- `scripts/adventure-game.js`: bundled Blob-loaded adventure module; uses Combatant/CombatSystem, Inventory, SaveManager and Nereid overlap helpers.
- `main.js`: browser bootstrap that reads the same `.npt` and scene.
- `adventure.html`, `adventure.js`, `adventure.css`: title, Continue, pause and sound settings flow.

## Project modules

A `ProjectBehaviour` component has `{ "module": "scripts/game.js", "settings": { ... } }`. The path is relative to the project root. Modules export `create({ entity, engine, properties })`, returning optional `start()`, `update(deltaTime)` and `destroy()` callbacks. Use the injected engine API; relative ES imports from these Blob-loaded modules are not supported. Bundle dependencies into one module if needed.

The injected API includes Transform, Shape, Color, KeyboardInput, Camera, SceneManager, SaveManager, BoxCollider, Larissa and Nereid. Destroy must release project-owned listeners and DOM nodes. Invalid module paths and loading errors appear as `PROJECT_BEHAVIOUR_LOAD_FAILED` in the game/editor console.

## Slice scope and limits

The adventure covers two connected areas in one editable scene, one main objective, one optional coffer, a sentinel and a three-phase boss with telegraphed melee attacks. The game saves position, health, reward currency, enemy health/positions/phases, coffer state, quest and ending state with strict scene-reference validation. Settings are stored separately. Character presentation is original shape-based artwork with a small idle bob and combat color feedback; this is not a finished sprite-sheet animation or authored audio pipeline. Music and sound feedback are synthesized at runtime. The old ruins sample remains a separate classic regression path. No measured completion duration is published yet, so this should be treated as a bounded slice implementation awaiting a playtest for the 10–15 minute quality target.
