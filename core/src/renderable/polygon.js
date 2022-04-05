import Transform from "../maths/transform.js";
import Color from "../basic/color.js";
/**
 * Polygon
 * ======
 * @class Polygon
 * @extends Transform
 * @classdesc Polygon object. Create Polygon objects to display polygons on the screen.
 * 
 * Properties:
 * @property {Object} kwargs - The keyword arguments.
 * @property {Array} kwargs.points - The points of the polygon. (Vector2)
 * @property {Color} kwargs.color - The color of the polygon.
 */
export default class Polygon extends Transform{

    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * @param {Array} kwargs.points - The points of the polygon. (Vector2)
     * @param {Color} kwargs.color - The color of the polygon.
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