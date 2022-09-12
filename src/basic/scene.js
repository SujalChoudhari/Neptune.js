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

    getHirarchy(){
        let hirarchy = [];
        this.children.forEach(child => {
            hirarchy.push(child);
            hirarchy = hirarchy.concat(child.getHirarchy());
        });
        return hirarchy;
    }
}
