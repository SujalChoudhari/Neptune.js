import { UITransform } from "./transform.js";
import { Renderable } from "../renderable/renderable.js";
import { Component } from "../component.js";

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
 * entity.addComponent(new UITransform());
 * entity.addComponent(new UISprite("assets/sprites/texture.png"));
 * 
 */
export class UISprite extends Renderable {
    #image;
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


    getPath() {
        return this._properties.path;
    }

    setPath(path) {
        this._properties.path = path;
    }

    /** @private */
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