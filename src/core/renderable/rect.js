import {Transform} from "../maths/transform.js";
import {Color} from "../basic/color.js";

/**
 * @class Rect
 * @classdesc A Rect is a class that represents a rectangle.
 * @extends Transform
 * @param {Object} kwargs - The keyword arguments.
 * @param {Color} [kwargs.color] - The color.
 * 
 * @example
 * // Create a new rectangle.
 * let rect = new Rect({
 *      color: new Color(255, 0, 0)
 * });
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
        if (this.parent){
            ctx.translate(this.parent.worldPos.x, this.parent.worldPos.y);
            ctx.rotate(this.worldRot* Math.PI / 180);
            ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
            ctx.fillRect(-this.centerPos.x +this.pos.x, -this.centerPos.y+this.pos.y, this.size.x, this.size.y);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }else{
            ctx.translate(this.worldPos.x,this.worldPos.y); 
            ctx.rotate(this.worldRot* Math.PI / 180);
            ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
            ctx.fillRect(-this.centerPos.x ,-this.centerPos.y, this.size.x, this.size.y);
            ctx.setTransform(1, 0, 0, 1, 0, 0);

        }
    }
}