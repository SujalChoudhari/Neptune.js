import { Shape } from "../components/shape.js";
import { Sprite } from "../components/sprite.js";
import { Entity } from "./entity.js";


export class Scene extends Entity{
    constructor(name){
        super(name);
    }

    init(){
    }

    draw(ctx){
        this.getChildrenWithComponent(Sprite).forEach(child => {
            child.getComponent(Sprite).draw(ctx);
        });
        this.getChildrenWithComponent(Shape).forEach(child => {
            child.getComponent(Shape).draw(ctx);
        });
    }

    addComponent(component){
        throw new Error("Cannot add component to scene");
    }
}