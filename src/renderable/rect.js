import {Transform} from "../maths/transform.js";
import {Color} from "../basic/color.js";

/**
 * @class Rect
 * @classdesc A Rect is a class that represents a rectangle.
 * @extends Transform
 * @param {Object} kwargs - The keyword arguments.
 * @param {Color} [kwargs.color=COlor.random()] - The color.
 * 
 * @example
 * // Create a new rectangle.
 * let rect = new Rect({
 *      color: new Color(255, 0, 0)
 * });
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Rect extends Transform{
    constructor(kwargs){
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
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
     * @description Updates the Rect.
     * @param {Number} deltaTime - The time since the last update.
     * 
     * @example
     * // Update the rectangle.
     * rect.update(deltaTime);
     */
    update(deltaTime){
        super.update(deltaTime);
    }


    /**
     * @method
     * @description Draws the Rect.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * 
     * 
     * @example
     * // Draw the rectangle.
     * rect.draw(ctx);
     */
    draw(ctx){
        ctx.fillStyle = this.color.toString();
        ctx.fillRect(this.worldPos.x,this.worldPos.y, this.size.x, this.size.y);
    }
}