import { Renderable } from "../components/renderable/renderable.js";
import { Entity } from "./entity.js";


export class Scene extends Entity{
    constructor(name){
        super(name);
    }

    init(){
    }

    draw(ctx){
        this.getComponentsInChildren(Renderable).forEach(renderable => {
            renderable.draw(ctx);
        });
    }

}
