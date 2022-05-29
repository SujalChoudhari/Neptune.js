import { SpriteSheet } from "./spritesheet.js";



/**
 * @class SpriteSheetAnimation
 * @description A SpriteSheetAnimation is a collection of sprites that can be animated.
 * @param {Object} kwargs - A dictionary of keyword arguments passed to the constructor
 * 
 * @example
 * // Create a new SpriteSheetAnimation.
 * let spriteSheetAnimation = new SpriteSheetAnimation({
 *     src: "assets/spritesheet.png",
 *     pos: new Vector2(0, 0),
 *     size: new Vector2(100, 100),
 *     name: "SpriteSheetAnimation",
 *   });
 * 
 * 
 * @since 1.1.2
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * 
 */
export class SpriteSheetAnimation extends SpriteSheet {

    /**
     * @method
     * @description Constructs a new SpriteSheetAnimation.
     */
    constructor(kwargs) {
        super(kwargs);
        this.currentFrame = 0;
    }

    /**
     * @method
     * @description Prepare next frame of animation.
     * 
     * @example
     * // Prepare next frame of animation.
     * spriteSheetAnimation.nextFrame();
     * 
     * 
     */
    nextFrame() {
        this.currentFrame++;
        if (this.currentFrame >= Object.keys(this.sprites).length) {
            this.currentFrame = 0;
        }
    }


    /**
     * @method
     * @description Start a timed animation loop
     * @param {Number} fps - The frames per second.
     * 
     * @example
     * // Start a timed animation loop.
     * init(){
     *      spriteSheetAnimation.startTimedAnimation(10);
     * }
     */
    startTimedAnimation(fps){
        this.currentFrame++;
        if (this.currentFrame >= Object.keys(this.sprites).length) {
            this.currentFrame = 0;
        }
        setTimeout(() => {
            this.startTimedAnimation(fps);
        },  1000/fps);
    }


    /**
     * @method
     * @description Reset the animation to the first frame.
     * 
     * @example
     * // Reset the animation to the first frame.
     * spriteSheetAnimation.reset();
     * 
     * 
     */
    reset(){
        this.currentFrame = 0;
    }

    /**
     * @method
     * @description Draw the animation.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {Number} x - The x position.
     * @param {Number} y - The y position.
     * 
     * @example
     * // Draw the animation.
     * draw(ctx){
     *      super.draw(ctx);
     *      spriteSheetAnimation.draw(ctx, 10,20);
     * }
     * 
     * 
     */
    draw(ctx,x,y) {
        super.draw(ctx,`${this.name}_${this.currentFrame}`, x,y);
    }
}