import { Scene } from "./scene.js";

/**
 * SceneManager is used to load and unload scenes. All scenes will automatically be added to SceneManager.
 * Only the first scene will be loaded by default. To load a scene, use SceneManager.LoadScene(sceneId).
 * @class SceneManager
 */
export class SceneManager {
    /** @private */
    static #scenes = [];
    /** @private */
    static #loadedScenes = [];
    /** @private */
    static #currentSceneIndex = -1;

    /**
     * Get a scene by id.
     * @param {number} id - Id of the scene.
     * @returns {Scene} The scene with the specified id.
     */
    static GetScene(id) {
        return SceneManager.#scenes.find(scene => scene.id === id);
    }

    /**
     * Load a scene by id. This will unload the current scene and load the new scene.
     * @param {number} id - Id of the scene to be loaded.
     * @method
     */
    static LoadScene(id) {
        if (id === SceneManager.#currentSceneIndex) {
            console.warn("Scene already loaded");
            return;
        }

        SceneManager.#unloadScene(SceneManager.#currentSceneIndex);
        SceneManager.#currentSceneIndex = id;
        SceneManager.#loadedScenes.push(SceneManager.GetScene(id));
    }

    /**
     * Load a new scene in additive mode. This will not unload the current scene.
     * @param {number} id - Id of the scene to be loaded.
     * @method
     */
    static LoadSceneAdditive(id) {
        SceneManager.#loadedScenes.push(SceneManager.GetScene(id));
    }

    /**
     * Unload all added scenes. This will not unload the current scene.
     * @method
     */
    static UnloadAllAdditiveScenes() {
        SceneManager.#loadedScenes = SceneManager.#loadedScenes.slice(0, 1);
    }

    /**
     * Initialize the SceneManager. Loads the first scene if not already loaded.
     * @method
     * @private
     */
    static init() {
        if (SceneManager.#scenes.length === 0) {
            console.error("No scenes added to SceneManager");
            return;
        }

        if (SceneManager.#currentSceneIndex === -1) {
            SceneManager.LoadScene(0);
        }
    }

    /**
     * Add a scene to the SceneManager.
     * @param {Scene} scene - The scene to be added.
     * @private
     */
    static addScene(scene) {
        if (!(scene instanceof Scene)) {
            console.error(scene + " is not an instance of Scene");
            return;
        }
        SceneManager.#scenes.push(scene);
        SceneManager.#scenes.sort((a, b) => a.id - b.id);
    }

    /**
     * @private
     * Unload a scene by its id.
     * @param {number} id - Id of the scene to be unloaded.
     */
    static #unloadScene(id) {
        const scene = SceneManager.GetScene(id);
        if (scene) {
            SceneManager.#loadedScenes = SceneManager.#loadedScenes.filter(s => s !== scene);
        }
    }

    /**
     * Draw all loaded scenes.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     * @private
     */
    static draw(ctx) {
        SceneManager.#loadedScenes.forEach(scene => {
            scene.draw(ctx);
        });
    }

    /**
     * Get a id for a new Scene
     * @returns {number} The id for a new scene.
     * @private
     */
    static getIdForNewScene() {
        return SceneManager.#scenes.length;
    }
}
