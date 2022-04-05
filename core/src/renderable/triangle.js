import Transform from "../maths/transform.js";
import Color from "../basic/color.js";

/**
 * Triangle
 * ========
 * @class Triangle
 * @extends Transform
 * @classdesc Triangle object. Create Triangle objects to display triangles on the screen.
 * 
 * Properties:
 * @property {Object} kwargs - The keyword arguments.
 * @property {Number} kwargs.color - The color of the triangle.
 * @property {Array} kwargs.points - The points of the triangle. (Vector2)
 */
export default class Triangle extends Transform{
    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * @param {Array} kwargs.points - The points of the triangle. (Vector2)
     * @param {Color} kwargs.color - The color of the triangle.
     */
    constructor(kwargs){
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
        this.points = kwargs["points"] || [];
    }

    update(deltaTime){
        super.update(deltaTime);
    }

    draw(ctx){
        ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
        ctx.beginPath();
        ctx.moveTo(this.worldPos.x + this.points[0].x,this.worldPos.y + this.points[0].y);
        for(var i = 1; i < this.points.length; i++){
            ctx.lineTo(this.worldPos.x + this.points[i].x,this.worldPos.y + this.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
    }
}