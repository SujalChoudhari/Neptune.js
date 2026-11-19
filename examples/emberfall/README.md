# Emberfall — The First Ember

A two-area top-down ARPG slice using a versioned `project.npt`, editable scenes, ordinary entities/components and project-local gameplay code. The classic single-room starter remains available for regression and quick engine examples.

## Play

From the Neptune repository root, run `npm run serve`, then open http://127.0.0.1:8000/examples/emberfall/adventure.html. Choose **Begin journey** or **Continue** at the title screen. The short practice route is available at http://127.0.0.1:8000/examples/emberfall/adventure.html?practice=1. The older one-room sample remains at http://127.0.0.1:8000/examples/emberfall/ (**Play Game**).

WASD/arrows move, J strikes, Space dodges, E interacts, Esc pauses, O saves, L loads, and R rises after death at the last lantern. Speak to Mira in Briar Hollow, cross the bridge and recover the three guarded seals in the west vault, archive and crypt. The journal points toward the next seal. Defeat the Keeper in the southeastern vault, light the heartstone and return to Mira; the coffer is optional. The Keeper's yellow wind-up cues a heavy attack; step out before it lands. Settings and the world save use browser local storage. The expedition and practice scenes use different world identities; a save from one cannot be continued in the other. Older version 1 prototype saves cannot be continued. A fresh game resets world progress while keeping sound settings. Browser and desktop editor saves are separate.

## Open in Triton

Start `Neptune.cmd`, import/open the `examples/emberfall` folder and choose Edit. The editor reads `project.npt` and auto-loads `scenes/ruins.scene`. Open `scenes/expedition.scene` to play or edit the expedition, or select the classic ruins scene. Switch to Game View and use Play/Pause/Stop. Click inside the game before using its keyboard controls.

`ProjectBehaviour` components retain the module path and settings in scene JSON. Their code starts on the first gameplay update; the paused Scene View does not execute project gameplay. The room camera scales the game to the available Game View. Stop halts the current runtime; reopen the scene to restore authored state.

## Project structure

- `project.npt`: schema version, project name, and main scene path. `scenes` is reserved for embedded scene objects; it is not an array of filenames.
- `scenes/ruins.scene`: preserved original classic starter scene.
- `scenes/expedition.scene`: the larger connected keep with three guarded seals and the Keeper.
- `scenes/adventure.scene`: the shorter practice route.
- `scripts/game.js`: project behaviours using existing Combatant/CombatSystem, Inventory, SaveManager, KeyboardInput and collider helpers. No Triton or Tauri imports.
- `scripts/adventure-game.js`: bundled Blob-loaded adventure module; uses Combatant/CombatSystem, Inventory, SaveManager and Nereid overlap helpers.
- `main.js`: browser bootstrap that reads the same `.npt` and scene.
- `adventure.html`, `adventure.js`, `adventure.css`: title, Continue, pause and sound settings flow.

## Project modules

A `ProjectBehaviour` component has `{ "module": "scripts/game.js", "settings": { ... } }`. The path is relative to the project root. Modules export `create({ entity, engine, properties })`, returning optional `start()`, `update(deltaTime)` and `destroy()` callbacks. Use the injected engine API; relative ES imports from these Blob-loaded modules are not supported. Bundle dependencies into one module if needed.

The injected API includes Transform, Shape, Color, KeyboardInput, Camera, SceneManager, SaveManager, BoxCollider, Larissa and Nereid. Destroy must release project-owned listeners and DOM nodes. Invalid module paths and loading errors appear as `PROJECT_BEHAVIOUR_LOAD_FAILED` in the game/editor console.

## Slice scope and limits

The expedition covers a hollow and connected keep rooms in one editable scene, three guarded seals, an optional coffer and a three-phase boss with telegraphed melee attacks. The game saves world identity, position, health, reward currency, enemy health/positions/phases, coffer and seal state, quest and ending state with scene-reference validation. Settings are stored separately. Character presentation uses original SVG artwork with PNG copies for the editor, including walk, strike, enemy wind-up and Keeper phase frames; this is not a finished sprite-sheet animation or authored audio pipeline. The scene uses project-root `/assets/` references for the editor, and the browser bootstrap resolves them against the project URL. Music and sound feedback are synthesized at runtime. The old ruins sample remains a separate classic regression path. An automated ordinary-input expedition route took 140.7 seconds including one retry and a reload. The earlier practice route took 24.1 seconds including a reload. Neither measurement establishes fresh-player duration or the requested polished 10–15 minute quality target. More purposeful content and playtesting are needed.
