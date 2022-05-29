import { Color } from "../basic/color.js";
import { Entity } from "../basic/entity.js";
import { Vector2 } from "../maths/vec2.js";



/**
 * @class WireGrid
 * @extends Entity
 * @classdesc Creates Grid of wires
 * @pr {Object} kwargs - Keyword arguments
 * @param {Color} [kwargs.color=Color.fuchsia] - Color of the grid
 * @param {Number} [kwargs.size=200] - Size of the grid
 * @param {Number} [kwargs.space=10] - Space between each wire
 * 
 * @example
 * // Create a new WireGrid
 * let grid = new WireGrid({
 *      color: Color.fromRGBA(0,0,0,0.3),
 *      size: this.width,
 *      space: 100,
 *      app: this
 *  });
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class WireGrid extends Entity {
    constructor(kwargs) {
        super(kwargs);
        this.color = kwargs["color"] || Color.fuchsia;
        this.size = kwargs["size"] || 200;
        this.space = kwargs["space"] || 10;
    }

    /**
     * @method
     * @description Draws the grid
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * 
     * @example
     * // Draw the grid
     * grid.draw(ctx);
     * 
     */
    draw(ctx) {
        super.draw(ctx);
        ctx.strokeStyle = this.color.toString();
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < this.size; i += this.space) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, this.size);
            ctx.moveTo(0, i);
            ctx.lineTo(this.size, i);
        }
        ctx.stroke();

    }
}