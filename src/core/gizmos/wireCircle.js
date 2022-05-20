import { Color } from "../basic/color.js";
import { Entity } from "../basic/entity.js";
import { Vector2 } from "../maths/vec2.js";


/**
 * @class WireCircle
 * @extends Entity
 * @classdesc Creates a wire circle
 * 
 * @param {Object} kwargs - Keyword arguments
 * @param {Color} kwargs.color - Color of the wire
 * @param {Vector2} kwargs.pos - Position of the wire
 * @param {Number} kwargs.radius - Radius of the wire
 * 
 * @example
 * // Create a new WireCircle
 * let wireCircle = new WireCircle({
 *      color: Color.fromRGBA(0,0,0,0.3),
 *      pos : new Vector2(10, 10),
 *      radius: 20,
 *      app: this
 *  });
 */
export class WireCircle extends Entity {
    constructor(kwargs) {
        super(kwargs);
        this.color = kwargs["color"] || Color.fuchsia;
        this.pos = kwargs["pos"] || new Vector2(0, 0);
        this.radius = kwargs["radius"] || 100;
    }


    /**
     * @method
     * @description Draws the wire circle
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * 
     * @example
     * // Draw the wire circle
     * wireCircle.draw(ctx);
     * 
     */
    draw(ctx) {
        super.draw(ctx);
        //draw concentric circles
        ctx.strokeStyle = this.color.toString();
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < this.radius; i += 20) {
            ctx.arc(this.pos.x, this.pos.y, i, 0, 2 * Math.PI);
        }
        ctx.stroke();
    }
}
