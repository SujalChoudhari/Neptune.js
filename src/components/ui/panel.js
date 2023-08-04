import { Renderable } from "../renderable/renderable.js";
import {UITransform} from "./transform.js";

/**
 * A flat color rectangle that can be used to display UI elements.
 * This is a UI component, so it should be added to an entity with a UITransform component.
 * 
 * @class Panel
 * @extends Renderable
 * 
 * @property {Color} color=Color.white - The color of the panel.
 * 
 * @example
 * // Create a new entity with a UITransform component and a Panel component.
 * let entity = new Entity();
 * entity.addComponent(new UITransform());
 * entity.addComponent(new Panel(Color.white));
 */
export class Panel extends Renderable {
    constructor(color) {
        super();
        this._properties.color = color;
    }

    /**
     * The color of the panel.
     * @type {Color}
     */
    get color() {
        return this._properties.color;
    }

    set color(color) {
        this._properties.color = color;
    }


    getColor() {
        return this._properties.color;
    }

    setColor(color) {
        this._properties.color = color;
    }

    /** @private */
    draw(ctx) {
        let transform = this.entity.getComponent(UITransform);
        let x = transform.getX();
        let y = transform.getY();
        let width = transform.getWidth();
        let height = transform.getHeight();

        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = this._properties.color;
        ctx.fillRect(0, 0, width, height);

        let children = this.entity.getComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }

        ctx.restore();
    }
}