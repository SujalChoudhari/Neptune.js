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
 */
export class Sprite extends Transform {
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
        ctx.drawImage(this.image, this.worldPos.x, this.worldPos.y, this.size.x, this.size.y);


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