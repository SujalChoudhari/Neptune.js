import { Renderable } from "./renderable.js";
import { Transform } from "../transform.js";

export class Sprite extends Renderable {
    #image;
    constructor(path="", width=10, height=10) {
        super();
        this._properties.path = path;
        this._properties.width = width;
        this._properties.height = height;
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

    get width(){
        return this._properties.width;
    }

    set width(width){
        this._properties.width = width;
    }

    get height(){
        return this._properties.height;
    }

    set height(height){
        this._properties.height = height;
    }


    getPath() {
        return this._properties.path;
    }

    setPath(path) {
        this._properties.path = path;
    }

    getWidth() {
        return this._properties.width;
    }

    setWidth(width) {
        this._properties.width = width;
    }

    getHeight() {
        return this._properties.height;
    }

    setHeight(height) {
        this._properties.height = height;
    }


    draw(ctx) {
        super.draw(ctx);
        let image = this.#image;
        let path = this._properties.path;
        let width = this._properties.width;
        let height = this._properties.height;
        let transform = this.entity.getComponent(Transform);
        let position = Maths.meterToPixelVector2(transform.getPosition());
        let rotation = transform.getRotation();
        let scale = Maths.meterToPixelVector2(transform.getScale());

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);

        if (image.src != path) {
            image.src = path;
        }
        ctx.drawImage(image, -width / 2, -height / 2, width, height);


        let children = this.entity.getComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }

        ctx.restore();
    }


        
}