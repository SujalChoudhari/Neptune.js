import {Shape} from "../graphics.js";
import {Color} from "../../basic/color.js";

/**
 * @class Text
 * @classdesc A Text is a class that represents a text.
 * @extends Transform
 * @param {Object} kwargs - The keyword arguments.
 * @param {String} [kwargs.text=""] - The text.
 * @param {Color} [kwargs.color=Color.random()] - The color.
 * @param {String} [kwargs.font=""] - The font size.
 * @param {String} [kwargs.align="center"] - The alignment.
 * 
 * @example
 * // Create a text.
 * let text = new Text({
 *      text: "Hello World",
 *      color: Color.random(),
 *      font: "30px Arial",
 *      align: "center"
 * });
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Text extends Shape{
    constructor(kwargs){
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
        this.text = kwargs["text"] || "";
        this.font = kwargs["font"] || "";
        this.alignText = kwargs["align"] || "center";
    }


    /**
     * @method
     * @description Updates the text.
     * @param {Number} deltaTime - The delta time.
     * 
     * @example
     * // Update the text.
     * text.update(deltaTime);
     * 
     */
    update(deltaTime){
        super.update(deltaTime);
    }


    /**
     * @method
     * @description Renders the text.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * 
     * @example
     * // Render the text.
     * text.draw(ctx);
     * 
     */
    draw(ctx){
        ctx.rotate(this.rot * Math.PI / 180);
        ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
        ctx.font = this.font;
        ctx.textAlign = this.alignText;
        this.size.x =  ctx.measureText(this.text).width;
        let lines = this.text.split("\n");
        for(let i = 0; i < lines.length; i++){
            ctx.fillText(lines[i], this.worldPos.x, this.size.y +this.worldPos.y + i * this.size.y);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
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
}