import { Color } from "../basic/color.js";
import { Entity } from "../basic/entity.js";
import { Vector2 } from "../maths/vec2.js";


/**
 * @class WireLine
 * @extends Entity
 * @classdesc Creates a line 
 * 
 * @param {Object} kwargs - Keyword arguments
 * @param {Color} [kwargs.color=Color.fuchsia] - Color of the wire
 * @param {Vector2} [kwargs.start=Vector2(0,0)] - Position of the wire (Optional with pos1)
 * @param {Vector2} [kwargs.end=Vector2(0,0)]- Position of the wire (Optional with pos2)
 * @param {Vector2} [kwargs.pos1=Vector2(0,0)] - Position of the wire
 * @param {Vector2} [kwargs.pos2=Vector2(0,0)]- Position of the wire
 * 
 * @example
 * // Create a new WireLine
 * let wireLine = new WireLine({
 *      color: Color.fromRGBA(0,0,0,0.3),
 *      start : new Vector2(10, 10),
 *      end : new Vector2(20, 20),
 *      app: this
 * });
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class WireLine extends Entity {
    constructor(kwargs) {
        super(kwargs);
        this.color = kwargs["color"] || Color.fuchsia;
        this.start = kwargs["start"] || new Vector2(0, 0) || kwargs["pos1"];
        this.end = kwargs["end"] || new Vector2(0, 0) || kwargs["pos2"];
    }


    /**
     * @method
     * @description Draws the wire line
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * 
     * @example
     * // Draw the wire line
     * wireLine.draw(ctx);
     * 
     */
    draw(ctx) {
        super.draw(ctx);
        ctx.strokeStyle = this.color.toString();
        ctx.fillStyle = this.color.toString();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.end.x, this.end.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}
