import { UITransform } from "./transform.js";
import { Renderable } from "../renderable/renderable.js";
import { Component } from "../component.js";

export class UISprite extends Renderable {
    #image;
    constructor(path){
        super();
        this._properties.path = path;
        this.#image = new Image();
        this.#image.src = path;
    }

    get path(){
        return this._properties.path;
    }

    set path(path){
        this._properties.path = path;
        this.#image.src = path;
    }
    

    getPath() {
        return this._properties.path;
    }

    setPath(path) {
        this._properties.path = path;
    }


    draw(ctx) {
        let image = this.#image;
        let path = this._properties.path;
        let transform = this.entity.getComponent(UITransform);
        let x = transform.getX();
        let y = transform.getY();
        let width = transform.getWidth();
        let height = transform.getHeight();

        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(image, 0, 0, width, height);
        
        let children = this.entity.getComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }
        
        ctx.restore();

    }
}