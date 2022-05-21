import { Transform } from "../maths/transform.js";
import { Color } from "../basic/color.js";
import { Vector2 } from "../maths/vec2.js";

/**
 * @class Triangle
 * @classdesc A Triangle is a class that represents a triangle.
 * @extends Transform
 * @param {Object} kwargs - The keyword arguments.
 * @param {Vector2<Vector2>} kwargs.points - The points.
 * 
 * @example
 * // Create a new triangle.
 * let triangle = new Triangle({
 *   points: [
 *      new Vector2(0, 0),
 *      new Vector2(10, 0),
 *      new Vector2(10, 10)
 *   ],
 *   color: new Color(255, 0, 0)
 * });
 */
export class Triangle extends Transform {
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
     * @description Updates the Triangle.
     * @param {Number} deltaTime - The time since the last update.
     * 
     * @example
     * // Update the triangle.
     * triangle.update(deltaTime);
     * 
     */
    update(deltaTime) {
        super.update(deltaTime);
    }

    /**
     * @method
     * @description Draws the Triangle.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * 
     * @example
     * // Draw the triangle.
     * triangle.draw(ctx);
     */
    draw(ctx) {
        ctx.translate(this.worldPos.x, this.worldPos.y);
        ctx.rotate(this.worldRot * Math.PI / 180);
        ctx.fillStyle = this.color.toString();
        ctx.beginPath();
        ctx.moveTo(this.points[0].x+this.worldPos.x, this.points[0].y+this.worldPos.y);
        ctx.lineTo(this.points[1].x+this.worldPos.x, this.points[1].y+this.worldPos.y);
        ctx.lineTo(this.points[2].x+this.worldPos.x, this.points[2].y+this.worldPos.y);
        ctx.closePath();
        ctx.fill();
    }
}