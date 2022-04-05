import Transform from "../maths/transform.js";
import Color from "../basic/color.js";

/**
 * Circle
 * ======
 * @class Circle
 * @extends Transform
 * @classdesc Circle object. Create Circle objects to display circles on the screen.
 * 
 * Properties:
 * @property {Object} kwargs - The keyword arguments.
 * @property {Number} kwargs.radius - The radius of the circle.
 * @property {Color} kwargs.color - The color of the circle.
 * 
 */
export default class Circle extends Transform{
    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * @param {Number} kwargs.radius - The radius of the circle.
     * @param {Color} kwargs.color - The color of the circle.
     */
    constructor(kwargs){
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
        this.radius = kwargs["radius"] || 1;
    }

    update(deltaTime){
        super.update(deltaTime);
    }

    draw(ctx){
        ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
        ctx.beginPath();
        ctx.arc(this.worldPos.x,this.worldPos.y,this.radius,0,2*Math.PI);
        ctx.fill();
    }
}