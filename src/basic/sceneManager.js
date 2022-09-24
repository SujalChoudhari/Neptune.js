import { Scene } from "./scene.js";

export class SceneManager{
    static #scenes =[];
    static #loadedScenes = [];
    static #currentSceneIndex = -1;
    
    static addScene(scene){
        if (! scene instanceof Scene) { console.error("scene is not an instance of Scene"); return;}
        SceneManager.#scenes.push(scene);
        if (SceneManager.#scenes.length == 1) SceneManager.loadScene(0);
    }

    static getScene(id){
        return SceneManager.#scenes.find(scene => scene.id == id);
    }

    static #unloadScene(id){
        let scene = SceneManager.getScene(id);
        if(scene){
            SceneManager.#loadedScenes.splice(SceneManager.#loadedScenes.indexOf(scene),1);
        }
    }

    static loadScene(id){
        if(id == SceneManager.#currentSceneIndex){console.warn("Scene already loaded"); return;}
        SceneManager.#unloadScene(this.#currentSceneIndex);
        SceneManager.#currentSceneIndex = id;
        SceneManager.#loadedScenes.push(SceneManager.getScene(id));
    }


    static loadSceneAdditive(id){
        SceneManager.#loadedScenes.push(SceneManager.getScene(id));
    }

    static unloadAllAdditiveScenes(){
        SceneManager.#loadedScenes.splice(1,SceneManager.#loadedScenes.length-1);
    }

    static Draw(ctx){
        SceneManager.#loadedScenes.forEach(scene => {
            scene.draw(ctx);
        });
    }
    
        



}