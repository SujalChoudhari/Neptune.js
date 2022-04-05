import Transform from "../maths/transform.js";
import Color from "../basic/color.js";
/**
 * Rect
 * =====
 * @class Rect
 * @extends Transform
 * @classdesc Rect object. Create Rect objects to display rectangles on the screen.
 * 
 * Properties:
 * @property {Object} kwargs - The keyword arguments.
 * @property {Number} kwargs.color - The color of the rectangle.
 */
export default class Rect extends Transform{
    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * @param {Color} kwargs.color - The color of the rectangle
     */
    constructor(kwargs){
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
    }
    
    update(deltaTime){
        super.update(deltaTime);
    }

    draw(ctx){
        ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
        ctx.fillRect(this.worldPos.x,this.worldPos.y,this.size.x,this.size.y);
    }
}