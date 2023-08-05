import { Renderable } from "../components/renderable/renderable.js";
import { Entity } from "./entity.js";
import { SceneManager } from "./sceneManager.js";

/**
 * Scene is a container for entities. It is used to organize the game objects in the game.
 * SceneManager is used to load and unload scenes. A scene can be used to only load specific entities.
 * If any entity is not part of a scene, it will be loaded by default.
 * @class Scene
 * @extends Entity
 * @property {number} id - Id of the scene. This is used to load the scene.
 */
export class Scene extends Entity {

    /** Called when The scene is loaded */
    OnSceneLoad = () => { };
    /** Called when the scene is unloaded */
    OnSceneUnload = () => { };
    /** Called when the scene is loaded in additive mode */
    OnSceneLoadAdditive = () => { };
    /** Called when the scene is unloaded in additive mode */
    OnSceneUnloadAdditive = () => { };

    constructor(name) {
        super(name);
        this.id = SceneManager.getIdForNewScene();
        SceneManager.addScene(this);
    }

    /** @private */
    draw(ctx) {
        this.GetComponentsInChildren(Renderable).forEach(renderable => {
            renderable.draw(ctx);
        });
    }
}
