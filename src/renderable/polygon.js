import { Transform } from "../maths/transform.js";
import { Color } from "../basic/color.js";

/**
 * @class Polygon
 * @classdesc A Polygon is a class that represents a polygon.
 * @extends Transform
 * @param {Object} kwargs - The keyword arguments.
 * @param {Vector2[]} [kwargs.points=[]] - The points.
 * @param {Color} [kwargs.color=Color.random()] - The color.
 * 
 * @example
 * // Create a new polygon.
 * let polygon = new Polygon({
 *    points: [
 *       new Vector2(0, 0),
 *       new Vector2(10, 0),
 *       new Vector2(10, 10),
 *       new Vector2(0, 10)
 *      ],
 *    color: new Color(255, 0, 0)
 * });
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Polygon extends Transform {
    constructor(kwargs) {
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
        this.points = kwargs["points"] || [];
    }

    /** 
     * @method
     * @description Initializes the Entity.

     * @example
     * // Initialize the entity.
     * entity.init();
     */
    init() {
        super.init();
    }


    /**
     * @method
     * @description Updates the Polygon.
     * @param {Number} deltaTime - The time since the last update.
     * 
     * @example 
     * // Update the polygon.
     * polygon.update(deltaTime);
     * 
     */
    update(deltaTime) {
        super.update(deltaTime);
    }

    /**
     * @method
     * @description Draws the Polygon.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * 
     * @example
     * // Draw the polygon.
     * polygon.draw(ctx);
     */
    draw(ctx) {

        ctx.fillStyle = this.color.toString();
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x + this.worldPos.x, this.points[i].y + this.worldPos.y);
        }
        ctx.closePath();
        ctx.fill();
    }
}