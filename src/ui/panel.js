import { Renderable } from "../components/renderable/renderable.js";
import { Transform } from "./transform.js";
import { Maths } from "../maths/math.js"
import { Color } from "../basic/color.js"

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
    constructor(color = Color.fuchsia) {
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

    draw(ctx) {
        super.draw(ctx);
        let transform = this.entity.GetComponent(Transform);

        let x = transform.x * Maths.METER_TO_PIXEL;
        let y = transform.y * Maths.METER_TO_PIXEL;
        let width = transform.width * Maths.METER_TO_PIXEL;
        let height = transform.height * Maths.METER_TO_PIXEL;

        ctx.save();
        ctx.rotate(transform.rotation);
        ctx.globalCompositeOperation = this.blendMode;
        ctx.filter = this.filter;
        ctx.fillStyle = this._properties.color;
        ctx.fillRect(x, y, width, height);

        let children = this.entity.GetComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }

        ctx.restore();
    }

}