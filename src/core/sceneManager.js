import { Scene } from "./scene.js";
import { Storage } from "./storage.js";

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
    /** @private */
    static #nextSceneId = 0;

    /**
     * Get a scene by id.
     * @param {number} id - Id of the scene.
     * @returns {Scene} The scene with the specified id.
     */
    static GetScene(id) {
        return SceneManager.#scenes.find(scene => scene.id === id);
    }

    /**
     * Get a scene by name.
     * @param {string} name - Name of the scene.
     * @returns {Scene} The scene with the specified name.
     */
    static GetSceneByName(name) {
        return SceneManager.#scenes.find(scene => scene.name === name);
    }

    /** Return a snapshot of all registered scenes for project serialization. */
    static GetScenes() {
        return [...SceneManager.#scenes];
    }

    /** Remove a registered scene that is not currently active. */
    static removeScene(scene) {
        const index = SceneManager.#scenes.indexOf(scene);
        if (index === -1 || SceneManager.GetActiveScene() === scene) return false;

        if (SceneManager.#loadedScenes.includes(scene)) scene.OnSceneUnloadAdditive();
        SceneManager.#loadedScenes = SceneManager.#loadedScenes.filter(loadedScene => loadedScene !== scene);
        SceneManager.#scenes.splice(index, 1);
        return true;
    }

    /**
     * Get the currently active scene.
     * @returns {Scene} The active scene.
     */
    static GetActiveScene() {
        return SceneManager.GetScene(SceneManager.#currentSceneIndex);
    }

    /**
     * Load a scene by id. This will unload the current scene and load the new scene.
     * @param {number} id - Id of the scene to be loaded.
     * @method
     */
    static LoadScene(id) {
        const scene = SceneManager.GetScene(id);

        if (scene) {
            SceneManager.#unloadScene(SceneManager.#currentSceneIndex);
            scene.OnSceneUnloadAdditive(); // Call the unload additive callback of the current scene
            scene.OnSceneLoad(); // Call the load callback of the new scene
            SceneManager.#loadedScenes.push(scene);
            SceneManager.#currentSceneIndex = id;
        }
    }

    /**
     * Transition to another scene while moving selected runtime entities into it.
     * Entity instances are transferred rather than serialized so their runtime state survives.
     * @param {number} id - Id of the destination scene.
     * @param {Entity[]} entities - Entities to preserve across the transition.
     */
    static TransitionToScene(id, entities = []) {
        const destination = SceneManager.GetScene(id);
        if (!destination) return false;
        if (!Array.isArray(entities)) {
            throw new TypeError("SceneManager.TransitionToScene expects an array of entities.");
        }

        const source = SceneManager.GetActiveScene();
        for (const entity of entities) {
            if (!entity || typeof entity !== "object" || !Array.isArray(entity.children)) {
                throw new TypeError("SceneManager.TransitionToScene expects entity instances.");
            }
        }

        for (const entity of entities) {
            if (entity.parent && Array.isArray(entity.parent.children)) {
                const index = entity.parent.children.indexOf(entity);
                if (index !== -1) entity.parent.children.splice(index, 1);
            } else if (source) {
                const index = source.children.indexOf(entity);
                if (index !== -1) source.children.splice(index, 1);
            }
            entity.parent = null;
            destination.AddChild(entity);
        }
        SceneManager.LoadScene(id);
        return true;
    }

    /**
     * Load a new scene in additive mode. This will not unload the current scene.
     * @param {number} id - Id of the scene to be loaded.
     * @method
     */
    static LoadSceneAdditive(id) {
        const scene = SceneManager.GetScene(id);
        if (scene) {
            scene.OnSceneLoadAdditive(); // Call the load additive callback of the new scene
            SceneManager.#loadedScenes.push(scene);
        }
    }

    /**
     * Unload all added scenes. This will not unload the current scene.
     * @method
     */
    static UnloadAllAdditiveScenes() {
        SceneManager.#loadedScenes.forEach(scene => {
            scene.OnSceneUnloadAdditive(); // Call the unload additive callback of each loaded scene
        });
        SceneManager.#loadedScenes = [];
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
            SceneManager.LoadScene(SceneManager.#scenes[0].id);
        }
    }

    /**
     * Add a scene to the SceneManager.
     * @param {Scene} scene - The scene to be added.
     * @private
     */
    static addScene(scene) {
        if (SceneManager.#scenes.indexOf(scene) === -1) {
            scene.id = SceneManager.getIdForNewScene();
            SceneManager.#nextSceneId = scene.id + 1;
            SceneManager.#scenes.push(scene);
        }
    }

    /**
     * Replace stale registrations that share a parsed scene's persisted ID.
     * SceneLoader constructs and registers a Scene before restoring its ID from
     * serialized data, so loading an edited scene again can otherwise leave
     * duplicate IDs and make GetScene select the older instance.
     * @param {Scene} scene - The parsed replacement scene.
     * @returns {Scene} The registered replacement scene.
     */
    static replaceScene(scene) {
        if (!scene || typeof scene !== "object") {
            throw new TypeError("SceneManager.replaceScene expects a Scene instance.");
        }

        if (!SceneManager.#scenes.includes(scene)) {
            SceneManager.addScene(scene);
        }

        const duplicates = SceneManager.#scenes.filter(candidate => candidate !== scene && candidate.id === scene.id);
        if (duplicates.length === 0) return scene;

        const activeScene = SceneManager.GetActiveScene();
        const replacesActiveScene = duplicates.includes(activeScene);
        for (const duplicate of duplicates) {
            if (!SceneManager.#loadedScenes.includes(duplicate)) continue;
            if (duplicate === activeScene) duplicate.OnSceneUnload();
            else duplicate.OnSceneUnloadAdditive();
        }

        const firstDuplicateIndex = SceneManager.#scenes.findIndex(candidate => duplicates.includes(candidate));
        const insertionIndex = SceneManager.#scenes
            .slice(0, firstDuplicateIndex)
            .filter(candidate => !duplicates.includes(candidate) && candidate !== scene)
            .length;
        SceneManager.#loadedScenes = SceneManager.#loadedScenes.filter(candidate => !duplicates.includes(candidate));
        SceneManager.#scenes = SceneManager.#scenes.filter(candidate => !duplicates.includes(candidate) && candidate !== scene);
        SceneManager.#scenes.splice(insertionIndex, 0, scene);

        if (replacesActiveScene) SceneManager.#currentSceneIndex = -1;
        return scene;
    }

    /**
     * Unload a scene by its id.
     * @param {number} id - Id of the scene to be unloaded.
     * @private
     */
    static #unloadScene(id) {
        const scene = SceneManager.GetScene(id);
        if (scene) {
            scene.OnSceneUnload();
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
        while (SceneManager.#scenes.some(scene => scene.id === SceneManager.#nextSceneId)) {
            SceneManager.#nextSceneId++;
        }
        return SceneManager.#nextSceneId;
    }

    /** Build a versioned project payload from the currently registered scenes. */
    static SerializeProject(name = "Untitled Project", metadata = {}) {
        return Storage.SerializeProject({
            ...metadata,
            name,
            scenes: SceneManager.#scenes
        });
    }

    static SaveProject(key, name = "Untitled Project", persistent = false, metadata = {}) {
        const project = typeof name === "object"
            ? name
            : SceneManager.SerializeProject(name, metadata);
        return Storage.SaveProject(key, project, persistent);
    }

    /** Close the in-memory project without touching persisted data. */
    static CloseProject() {
        SceneManager.removeAllScenes();
    }

    /**
     * Reopen a saved project. Parsing is dynamic to retain the existing
     * SceneLoader -> SceneManager dependency without introducing a module cycle.
     */
    static async OpenProject(key) {
        const project = Storage.LoadProject(key);
        if (project === null) return null;

        const { SceneLoader } = await import("./sceneLoader.js");
        const scenes = [];
        try {
            for (const sceneData of project.scenes) {
                scenes.push(await SceneLoader.parse(sceneData));
            }
        } catch (error) {
            for (const scene of scenes.reverse()) {
                SceneManager.removeScene(scene);
            }
            throw error;
        }

        SceneManager.#scenes = [...scenes];
        SceneManager.#loadedScenes = [];
        SceneManager.#currentSceneIndex = -1;
        SceneManager.#nextSceneId = 0;
        return { ...project, scenes };
    }

    static serializeProject(...args) { return SceneManager.SerializeProject(...args); }
    static saveProject(...args) { return SceneManager.SaveProject(...args); }
    static closeProject(...args) { return SceneManager.CloseProject(...args); }
    static openProject(...args) { return SceneManager.OpenProject(...args); }

    /**@private */
    static removeAllScenes() {
        SceneManager.#scenes = [];
        SceneManager.#loadedScenes = [];
        SceneManager.#currentSceneIndex = -1;
        SceneManager.#nextSceneId = 0;
    }
}
