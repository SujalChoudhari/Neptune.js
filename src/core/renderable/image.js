import {Transform} from "../maths/transform.js";

/**
 * @class Image
 * @classdesc A Image is a class that represents an image.
 * @extends Transform
 * @param {Object} kwargs - The keyword arguments.
 * @param {String} kwargs.src - The image source.
 * 
 * @example
 * // Create a new image.
 * let image = new Image({
 *      src: "./assets/images/image.png",
 *      pos: new Vector2(10, 10),
 *      size: new Vector2(10, 10)
 * });
 */
export class Image extends Transform {
    constructor(kwargs) {
        super(kwargs);
        this.image = new Image();
        this.image.src = kwargs["src"];
        this.isLoaded = false
        this.image.onload = function () {
            this.isLoaded = true;
            console.log(this.name, " is loaded");
        }
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
     * @description Draws the image.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * 
     * @example
     * // Draw the image.
     * image.draw(ctx);
     * 
     */
    draw(ctx) {
        if (this.isLoaded) return;
        
        if (this.parent) {
            ctx.translate(this.parent.worldPos.x, this.parent.worldPos.y);
            ctx.rotate(this.worldRot * Math.PI / 180);
            ctx.drawImage(this.image, -this.centerPos.x + this.pos.x, -this.centerPos.y + this.pos.y, this.size.x, this.size.y);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else {
            ctx.translate(this.worldPos.x, this.worldPos.y);
            ctx.rotate(this.worldRot * Math.PI / 180);
            ctx.drawImage(this.image, -this.centerPos.x, -this.centerPos.y, this.size.x, this.size.y);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    /**
     * @method
     * @description Updates the image.
     * @param {Number} deltaTime - The time since the last update.
     * 
     * @example
     * // Update the image.
     * image.update(deltaTime);
     * 
     */
    update(deltaTime) {
        super.update(deltaTime);
    }
}