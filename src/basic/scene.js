import { Renderable } from "../components/renderable/renderable.js";
import { Entity } from "./entity.js";
import { SceneManager } from "./sceneManager.js";


export class Scene extends Entity{
    constructor(name,id=0){
        super(name);
        this.id = id;
        SceneManager.addScene(this);
    }

    init(){
    }

    draw(ctx){
        this.getComponentsInChildren(Renderable).forEach(renderable => {
            renderable.draw(ctx);
        });
    }

}
