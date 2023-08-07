import { Transform } from "./uitransform.js";
import { Renderable } from "../components/renderable/renderable.js";
import { Maths } from "../maths/math.js"

/**
 * UISprite is a special Sprite class wihch is used to render Images on UI elements.
 * This is a UI component, so it should be added to an entity with a UITransform component.
 * @class UISprite
 * @extends Renderable
 * 
 * @property {string} path="" - The path to the image to display.
 * 
 * @example
 * // Create a new entity with a UITransform component and a UISprite component.
 * let entity = new Entity();
 * entity.AddComponent(new UITransform());
 * entity.AddComponent(new UISprite("assets/sprites/texture.png"));
 * 
 */
export class Sprite extends Renderable {
    #image;
    #transform = null;
    constructor(path) {
        super();
        this._properties.path = path;
        this.#image = new Image();
        this.#image.src = path;
    }

    /**
     * The path to the image to display.
     * Note: While hosting the game on a server, this might give errors thus use path with hhtps:// or http://
     * @type {string}
     */
    get path() {
        return this._properties.path;
    }

    set path(path) {
        this._properties.path = path;
        this.#image.src = path;
    }

    draw(ctx) {
        super.draw(ctx);
        
        if (this.#transform === null)
            this.#transform = this.entity.GetComponent(Transform);

        let x = this.#transform.x * Maths.METER_TO_PIXEL;
        let y = this.#transform.y * Maths.METER_TO_PIXEL;
        let width = this.#transform.width * Maths.METER_TO_PIXEL;
        let height = this.#transform.height * Maths.METER_TO_PIXEL;

        ctx.save();
        ctx.translate(x, y);
        ctx.translate(width / 2, height / 2);
        ctx.rotate(this.#transform.rotation * Math.PI / 180);
        ctx.globalCompositeOperation = this.blendMode;
        ctx.filter = this.filter;
        ctx.translate(-width / 2, -height / 2);
        ctx.drawImage(this.#image, 0, 0, width, height);

        let children = this.entity.GetComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }

        ctx.restore();
    }

}