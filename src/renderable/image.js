import { Transform } from "../maths/transform.js";

/**
 * @class Sprite
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
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Sprite extends Transform {
    constructor(kwargs) {
        super(kwargs);
        this.image = new Image();
        this.image.src = kwargs["src"];

        /**
         * @property {Number} drawRect.x - The x position of the crop.
         * @property {Number} drawRect.y - The y position of the crop.
         * @property {Number} drawRect.w - The width of the crop.
         * @property {Number} drawRect.h - The height of the crop.
         */
        this.drawRect ={
            x: 0,
            y: 0,
            w: this.size.x, 
            h: this.size.y
        }
        this.isLoaded = false;
        this.image.onload = function () {
            this.isLoaded = true;
        }
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
     * @description Draws the image.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * 
     * @example
     * // Draw the image.
     * image.draw(ctx);
     * 
     */
    draw(ctx) {
        super.draw(ctx);
        if (this.isLoaded) return;
        
        ctx.drawImage(this.image,
            this.drawRect.x,this.drawRect.y,this.drawRect.w,this.drawRect.h,
            this.worldPos.x,this.worldPos.y,this.size.x,this.size.y);


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


    /**
     * @method
     * @description Crops the Image to a specific area.
     * @param {Number} x - The x position of the crop.
     * @param {Number} y - The y position of the crop.
     * @param {Number} w - The width of the crop.
     * @param {Number} h - The height of the crop.
     * 
     * @example
     * // Crop the image.
     * image.crop(0, 0, 100, 100);
     */
    crop(x, y, width, height) {
        this.drawRect.x = x;
        this.drawRect.y = y;
        this.drawRect.w = width;
        this.drawRect.h = height;
    }
}