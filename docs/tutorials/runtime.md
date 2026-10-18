# Neptune runtime and scene lifecycle

The runtime uses entities as game objects and components for behavior/data. Scenes organize entities; the browser `Application` owns the canvas loop. The public entry module is `src/neptune.js` (also the package `main`), and it expects a browser DOM with `window` and `document` when imported.

## Compose an entity

```js
import { Entity, Transform, Vector2, Sprite } from "../../src/neptune.js";

const player = new Entity("Player");
player.AddComponent(new Transform(new Vector2(2, 3)));
player.AddComponent(new Sprite("assets/player.png"));

const weapon = new Entity("Weapon");
weapon.AddComponent(new Transform());
player.AddChild(weapon);

const transform = player.GetComponent(Transform);
transform.Translate(new Vector2(1, 0));
```

An entity can have at most one component of a given constructor. `AddComponent` attaches a component instance and assigns its `entity`; adding a duplicate constructor is ignored. `GetComponent(Type)` retrieves by `instanceof`; `HasComponent(Type)` checks presence and `RemoveComponent(Type)` removes the first match. `AddChild` and `AddChildren` build the hierarchy; `GetChildren`, `GetParent`, and `GetComponentsInChildren(Type)` inspect it. Names are useful labels, not unique identifiers.

`Transform` stores a `Vector2` position, rotation in degrees, and a `Vector2` render scale. `Translate(Vector2)` adds to the position, `Rotate(angle)` adds degrees, and `Scale(Vector2)` multiplies each scale axis. Scale affects rendering only; it does not change collider dimensions. Add the render/collision components required by the behavior you use; a transform is not silently added to every entity.

## Scenes and transitions

Constructing a `Scene(name)` registers it with `SceneManager`. Add root entities with `scene.AddChild(entity)`, then select it with `SceneManager.LoadScene(scene.id)`. Switching scenes invokes unload/load callbacks. `LoadSceneAdditive(id)` loads another scene without unloading the current scene; `UnloadAllAdditiveScenes()` removes additive scenes. `TransitionToScene(id, entities)` transfers selected entity instances to the destination so their runtime state survives; it returns false if the destination ID is missing.

```js
import { Scene, SceneManager } from "../../src/neptune.js";

const town = new Scene("Town");
const dungeon = new Scene("Dungeon");
town.AddChild(player);
SceneManager.LoadScene(town.id);
SceneManager.TransitionToScene(dungeon.id, [player]);
```

Use `OnSceneLoad`, `OnSceneUnload`, `OnSceneLoadAdditive`, and `OnSceneUnloadAdditive` callbacks on a scene for lifecycle work. For saved scene JSON, `SceneLoader.load(path)` fetches and parses a resource and `SceneLoader.parse(data)` constructs a scene from data. Parsing validates schema/resource references and can return a promise when a layer needs asynchronous loading.

## Behaviours and the application loop

Create a `Behaviour` to receive initialization and per-frame updates. The engine calls `Init()` when the application starts and `Update(deltaTime)` while the game is running. Delta time is measured in seconds and clamped to at most 0.1 seconds per frame. `Application.pause()` stops behavior updates but continues rendering; `resume()` re-enables updates.

```js
import { Behaviour, Entity, Transform, Vector2 } from "../../src/neptune.js";

class MoveRight extends Behaviour {
  constructor() {
    super("MoveRight");
  }
  Update(deltaTime) {
    this.entity.GetComponent(Transform).Translate(new Vector2(deltaTime, 0));
  }
}

const player = new Entity("Player");
player.AddComponent(new Transform());
player.AddComponent(new MoveRight());
```

The `application` export is the browser runtime singleton; the built-in Play button calls `application.start()`. It initializes input and the scene manager, then runs update, draw, input clearing, and deferred destruction each animation frame. `application.scene` returns the active scene, `application.deltaTime` exposes the last frame duration, and `application.loadScene(pathOrData)` accepts a scene URL or data object (errors are reported to the console).

## Custom components and serialized scenes

Register custom component constructors with `ComponentRegistry.register("Health", Health)` when they need to be constructed from serialized scene data. `get(name)`, `has(name)`, `nameOf(componentOrClass)`, and `create(name, ...args)` inspect and instantiate registered types. A component can override `deserialize(props)` to restore non-primitive properties. Entity and scene `serialize()` methods produce the versioned JSON contract used by the loader and editor.

See [saving and loading](save-load.md) for project persistence, [tilemaps and tilesets](tilemaps.md) for world maps, and the [first-game tutorial](first-game.md) for a runnable browser example.
