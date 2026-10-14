import { Renderable } from "../rendering/renderable.js";
import { Entity } from "./entity.js";
import { SceneManager } from "./sceneManager.js";
import { Maths } from "../math/math.js";

export const SCENE_SCHEMA_VERSION = 1;
export const SCENE_DATA_VERSION = "1.0.0";

const cloneSerializable = (value, seen = new WeakSet()) => {
    if (value === null || typeof value !== "object") return value;
    if (seen.has(value)) return undefined;
    seen.add(value);
    if (Array.isArray(value)) return value.map(item => cloneSerializable(item, seen));
    const result = {};
    for (const [key, item] of Object.entries(value)) {
        const cloned = cloneSerializable(item, seen);
        if (cloned !== undefined) result[key] = cloned;
    }
    return result;
};

/**
 * Scene is a container for entities. It is used to organize the game objects in the game.
 * SceneManager is used to load and unload scenes. A scene can be used to only load specific entities.
 * If any entity is not part of a scene, it will be loaded by default.
 * @class Scene
 * @extends Entity
 * @property {number} id - Id of the scene. This is used to load the scene.
 */
export class Scene extends Entity {

    static SCHEMA_VERSION = SCENE_SCHEMA_VERSION;
    static DATA_VERSION = SCENE_DATA_VERSION;

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

    /** Serialize the scene graph using the versioned scene contract. */
    serialize() {
        return {
            type: "scene",
            version: SCENE_DATA_VERSION,
            schemaVersion: SCENE_SCHEMA_VERSION,
            id: this.id,
            name: this.name,
            camera: this.cameraSettings ? cloneSerializable(this.cameraSettings) : undefined,
            layers: [{
                name: "Main",
                type: "object_layer",
                root: true,
                entities: this.children.map(child => child.serialize())
            }]
        };
    }

    toJSON() {
        return this.serialize();
    }

    Serialize() {
        return this.serialize();
    }

    /** @private */
    draw(ctx) {
        ctx.save();
        if (this.activeCamera) {
            this.activeCamera.apply(ctx);
        } else if (this.cameraSettings && this.cameraSettings.bounds) {
            const x = this.cameraSettings.bounds.x || 0;
            const y = this.cameraSettings.bounds.y || 0;
            const px = Maths.MeterToPixel(x);
            const py = Maths.MeterToPixel(y);
            ctx.translate(-px, -py);
        }

        this.GetComponentsInChildren(Renderable).forEach(renderable => {
            renderable.draw(ctx);
        });
        ctx.restore();
    }
}
