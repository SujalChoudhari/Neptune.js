import { Color } from "../basic/color.js";
import { Entity } from "../basic/entity.js";
import { Vector2 } from "../maths/vec2.js";


/**
 * @class WireRect
 * @extends Entity
 * @classdesc Creates a wire rectangle
 * 
 * @param {Object} kwargs - Keyword arguments
 * @param {Color} kwargs.color - Color of the wire
 * @param {Vector2} kwargs.pos - Position of the wire
 * @param {Vector2} kwargs.size - Size of the wire
 * 
 * @example
 * // Create a new WireRect
 * let wireRect = new WireRect({
 *     color: Color.fromRGBA(0,0,0,0.3),
 *     pos : new Vector2(10, 10),
 *     size: new Vector2(40,40),
 *     app: this
 * });
 */
export class WireRect extends Entity {
    constructor(kwargs) {
        super(kwargs);
        this.color = kwargs["color"] || Color.fuchsia;
        this.pos = kwargs["pos"] || new Vector2(0, 0);
        this.size = kwargs["size"] || new Vector2(100, 100);
    }

    /**
     * @method
     * @description Draws the wire rectangle
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * 
     * @example
     * // Draw the wire rectangle
     * wireRect.draw(ctx);
     */
    draw(ctx) {
        super.draw(ctx);
        // draw a wire frame for the given pos and size
        ctx.strokeStyle = this.color.toString();
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < this.size.x; i += 20) {
            ctx.moveTo(this.pos.x + i, this.pos.y);
            ctx.lineTo(this.pos.x + i, this.pos.y + this.size.y);
        }

        for (let i = 0; i < this.size.y; i += 10) {
            ctx.moveTo(this.pos.x, this.pos.y + i);
            ctx.lineTo(this.pos.x + this.size.x, this.pos.y + i);
        }
        ctx.stroke();

        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + this.size.x, this.pos.y);
        ctx.lineTo(this.pos.x + this.size.x, this.pos.y + this.size.y);
        ctx.lineTo(this.pos.x, this.pos.y + this.size.y);
        ctx.lineTo(this.pos.x, this.pos.y);
        ctx.stroke();


    }
}
