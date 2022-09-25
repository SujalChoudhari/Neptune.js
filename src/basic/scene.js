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
export class Scene extends Entity{
    constructor(name,id=0){
        super(name);
        this.id = id;
        SceneManager.addScene(this);
    }


    /**
     * Draw the scene. This will draw all the entities in the scene.
     * This function is called by the SceneManager.
     * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on.
     * 
     */
    Draw(ctx){
        this.getComponentsInChildren(Renderable).forEach(renderable => {
            renderable.draw(ctx);
        });
    }


}
