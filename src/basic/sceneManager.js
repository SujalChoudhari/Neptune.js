import { Scene } from "./scene.js";

/**
 * SceneManager is used to load and unload scenes. All scenes will automatically be added to SceneManager.
 * Only first scene will be loaded by default. To load a scene, use SceneManager.loadScene(sceneId).
 * @class SceneManager
 * 
 */
export class SceneManager{
    static #scenes =[];
    static #loadedScenes = [];
    static #currentSceneIndex = -1;
    
    /**
     * Add a scene to the SceneManager. This is called by the SceneManager.
     * All Scenes will automatically be added to SceneManager.
     * @param {Scene} scene - Scene to be added.
     * @method
     */
    static addScene(scene){
        if (! scene instanceof Scene) { console.error("scene is not an instance of Scene"); return;}
        SceneManager.#scenes.push(scene);
        SceneManager.#scenes.sort((a,b) => a.id - b.id);
    }

    /**
     * Get a scene by id.
     * @param {number} id - Id of the scene.
     */
    static getScene(id){
        return SceneManager.#scenes.find(scene => scene.id == id);
    }
    
    static #unloadScene(id){
        let scene = SceneManager.getScene(id);
        if(scene){
            SceneManager.#loadedScenes.splice(SceneManager.#loadedScenes.indexOf(scene),1);
        }
    }

    /**
     * Load a scene by id. This will unload the current scene and load the new scene.
     * @param {number} id - Id of the scene to be loaded.
     * @method
     */
    static loadScene(id){
        if(id == SceneManager.#currentSceneIndex){console.warn("Scene already loaded"); return;}
        SceneManager.#unloadScene(this.#currentSceneIndex);
        SceneManager.#currentSceneIndex = id;
        SceneManager.#loadedScenes.push(SceneManager.getScene(id));
    }

    /**
     * Load a new scene in additive mode. This will not unload the current scene.
     * But currentSceneIndex will not set to the new scene.
     * @param {number} id - Id of the scene to be loaded.
     */
    static loadSceneAdditive(id){
        SceneManager.#loadedScenes.push(SceneManager.getScene(id));
    }

    /**
     * Unload all added scenes. This will not unload the current scene.
     * @method
     */
    static unloadAllAdditiveScenes(){
        SceneManager.#loadedScenes.splice(1,SceneManager.#loadedScenes.length-1);
    }

    static Init(){
        if(SceneManager.#scenes.length == 0){
            throw new Error("No scenes added to SceneManager");
        }

        if(SceneManager.#currentSceneIndex == -1){
            SceneManager.loadScene(0);
        }
    }

    /**
     * Draw all loaded scenes. This will draw all the entities in the scene.
     * This method is called automatically by the game loop.
     * Order of drawing is based on the order of the scenes in the SceneManager or the order of scene Ids.
     * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on.
     * @method
     * 
     */
    static Draw(ctx){
        SceneManager.#loadedScenes.forEach(scene => {
            scene.Draw(ctx);
        });
    }
}