# Saving and loading game state

Neptune has two persistence layers. Use `SaveManager` for player/world state owned by your game (inventory, quest flags, clock data). Use `Storage` or `SceneManager` for editor-style project and scene data. They are separate formats and should not be mixed.

## Save player state

`SaveManager` stores JSON-compatible state in named slots. In a browser it uses `localStorage` by default; pass a storage-like object for a different or testable backend.

```js
import { SaveManager } from "../../src/core/saveManager.js";

const saves = new SaveManager({ prefix: "my-game.save" });
const playerState = {
  level: 3,
  inventory: ["key"],
  quests: { foundMap: true }
};
saves.save("slot-1", playerState);

const restored = saves.load("slot-1");
if (restored !== null) {
  player.level = restored.level;
  inventory.replace(restored.inventory);
}
```

`load` returns `null` when a slot is absent. State must be a JSON-serializable object; functions and class instances are not preserved. Slots are namespaced by `prefix`. Use `slots()` to list matching slots and `remove(slot)` to delete one. Do not store secrets in browser storage.

## Evolve save schemas

Each record carries a schema version. Supply a migration for each consecutive version when loading an older record. A migration receives a cloned record and must return a valid record with its version advanced by exactly one.

```js
const restored = saves.load("slot-1", {
  1: old => ({
    ...old,
    schemaVersion: 2,
    state: { ...old.state, difficulty: "normal" }
  })
});
```

The current `SaveManager` schema is version 1. This snippet shows the migration contract for a future schema upgrade; register a migration only when the application is loading that older version. Malformed records, missing migrations, and migrations that skip a version throw errors instead of silently discarding player data.

## Optional autosave

Provide a capture function that returns the state object to save. `autosaveInterval` is in milliseconds; zero disables the timer but leaves manual `autosaveNow()` available.

```js
const saves = new SaveManager({
  prefix: "my-game.save",
  autosaveInterval: 30_000,
  onError: error => console.error("Autosave failed", error)
});
saves.enableAutosave(() => serializePlayerAndWorld(), "autosave");
await saves.autosaveNow(); // save immediately
const recovered = saves.recover();
saves.disableAutosave(); // call when leaving gameplay or disposing the game
```

Autosave errors are reported to `onError` and rethrown by `autosaveNow()`. Disable the timer when its owner is disposed.

## Persist scenes and projects

For editor/project documents, use `SceneManager`'s project helpers or `Storage` directly. Project persistence stores versioned scene data, not arbitrary runtime entity state.

```js
import { SceneManager } from "../../src/core/sceneManager.js";

const project = SceneManager.SerializeProject("My project", { author: "Sujal" });
SceneManager.SaveProject("my-project", project, true); // persistent browser storage
SceneManager.CloseProject(); // clears in-memory scenes, not stored data
const reopened = await SceneManager.OpenProject("my-project");
```

`OpenProject` returns `null` when the key is missing. Individual records use `Storage.SaveScene(key, scene, persistent)` and `Storage.LoadScene(key)`, or `Storage.SaveProject(key, project, persistent)` and `Storage.LoadProject(key)`. The `persistent` flag selects local storage instead of session storage. Unsupported schema versions and invalid resource references are rejected during load.

See [the first-game tutorial](first-game.md) for running a sample and [the action-RPG tutorial](action-rpg.md) for the playable game that exercises save slots.
