import { Renderable } from "./renderable.js";
import { Transform } from "../transform.js";
import { Maths } from "../../maths/math.js"

/**
 * A Sprite Component is responsible for rendering a sprite to the screen.
 * Any Image (supported by the browser) can be used as a sprite.
 * @class Sprite
 * @extends Renderable
 * 
 * @property {string} path="" - The path to the image.
 * @property {number} scaleX=1 - The width of the sprite.
 * @property {number} scaleY=1 - The height of the sprite.
 * 
 * @example
 * // Create a sprite component
 * let sprite = new Sprite("path/to/image.png",10,10);
 * 
 * // Add the sprite component to an entity
 * entity.addComponent(sprite);
 */
export class Sprite extends Renderable {
    #image;
    #transform;
    constructor(path = "", width = 1, height = 1) {
        super();
        this._properties.path = path;
        this._properties.width = width;
        this._properties.height = height;
        this.#image = new Image();
        this.#image.src = path;

    }

    /**
     * The Path to the image. Note: While hosting the game on a server, the path must be relative to the server.
     * @type {string}
     * 
     */
    get path() {
        return this._properties.path;
    }

    set path(path) {
        this._properties.path = path;
        this.#image.src = path;
    }

    /**
     * Width of the sprite in meters.
     */
    get width() {
        return this._properties.width;
    }

    set width(width) {
        this._properties.width = width;
    }

    /**
     * Height of the sprite in meters.
     */
    get height() {
        return this._properties.height;
    }

    set height(height) {
        this._properties.height = height;
    }


    /** @private */
    draw(ctx) {
        super.draw(ctx);
        if (this.#transform == null)
        this.#transform = this.entity.GetComponent(Transform);


        let image = this.#image;
        let path = this._properties.path;
        let width = this._properties.width;
        let height = this._properties.height;
        let position = Maths.MeterToPixelVector2(this.#transform.position);
        let rotation = this.#transform.rotation;
        let scale = Maths.MeterToPixelVector2(this.#transform.scale);

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);
        ctx.globalCompositeOperation = this.blendMode;
        ctx.filter = this.filter;

        if (image.src != path) {
            image.src = path;
        }
        ctx.drawImage(image, -width / 2, -height / 2, width, height);


        let children = this.entity.GetComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }

        ctx.restore();
    }



}