import {Transform} from "../maths/transform.js";
import {Color} from "../basic/color.js";
/**
 * @class Circle
 * @classdesc A Circle is a class that represents a circle.
 * @extends Transform
 * @param {Object} kwargs - The keyword arguments.
 * @param {Number} kwargs.radius - The radius.
 * @param {Color} [kwargs.color] - The color.
 * 
 * @example
 * // Create a new circle.
 * let circle = new Circle({
 *     radius: 10,
 *     color: new Color(255, 0, 0)
 * });
 * 
 */
export class Circle extends Transform{
    constructor(kwargs){
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
        this.radius = kwargs["radius"] || 1;
    }

    /** 
     * @method
     * @description Initializes the Entity.

     * @example
     * // Initialize the entity.
     * entity.init();
     */
    init(){
        super.init();
    }

    /**
     * @method
     * @description Updates the Circle.
     * @param {Number} deltaTime - The time since the last update.
     * 
     * @example
     * // Update the circle.
     * circle.update(deltaTime);
     */
    update(deltaTime){
        super.update(deltaTime);
    }

    /**
     * @method
     * @description Draws the Circle.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * 
     * @example
     * // Draw the circle.
     * circle.draw(ctx);
     */
    draw(ctx){
        if (this.parent){
            ctx.translate(this.parent.worldCenterPos.x, this.parent.worldCenterPos.y);
            ctx.rotate(this.worldRot * Math.PI / 180);
            ctx.translate(-this.parent.worldCenterPos.x,- this.parent.worldCenterPos.y);
        }
        
        // rotation about self
        ctx.translate(this.worldCenterPos.x, this.worldCenterPos.y); 
        ctx.rotate(this.rot* Math.PI / 180);
        ctx.translate(-this.worldCenterPos.x, -this.worldCenterPos.y);
        ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, 2*Math.PI);
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}