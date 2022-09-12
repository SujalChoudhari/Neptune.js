import { UITransform } from "./transform.js";
import { Renderable } from "../renderable/renderable.js";
import { Component } from "../component.js";

export class UISprite extends Renderable {
    constructor(path){
        super();
        this.properties.path = path;
        this.properties.image = new Image();
        this.properties.image.src = path;
    }

    getPath() {
        return this.properties.path;
    }

    setPath(path) {
        this.properties.path = path;
    }

    getImage() {
        return this.properties.image;
    }   

    setImage(image) {
        this.properties.image = image;
    }

    draw(ctx) {
        let image = this.properties.image;
        let path = this.properties.path;
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