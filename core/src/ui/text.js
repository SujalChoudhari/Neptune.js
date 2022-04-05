import Transform from "../maths/transform.js";
import Color from "../basic/color.js";

/**
 * Text
 * ======
 * @class Text
 * @extends Transform
 * @classdesc Text object. Create Text objects to display text on the screen.
 * 
 * Properties:
 * @property {Object} kwargs - The keyword arguments.
 * @property {String} kwargs.text - The text of the text.
 * @property {Color} kwargs.color - The color of the text.
 * @property {String} kwargs.font - The font of the text.
 * @property {String} kwargs.alignText - The alignment of the text.
 * 
 */
export default class Text extends Transform{
    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * @param {String} kwargs.text - The text of the text.
     * @param {Color} kwargs.color - The color of the text.
     * @param {String} kwargs.font - The font of the text.
     * @param {String} kwargs.alignText - The alignment of the text.
     */
    constructor(kwargs){
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
        this.text = kwargs["text"] || "";
        this.font = kwargs["font"] || "";
        this.alignText = kwargs["align"] || "center";
    }

    update(deltaTime){
        super.update(deltaTime);
    }

    draw(ctx){
        ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
        ctx.font = this.font;
        ctx.textAlign = this.alignText;
        this.size.x =  ctx.measureText(this.text).width;
        let lines = this.text.split("\n");
        for(let i = 0; i < lines.length; i++){
            ctx.fillText(lines[i], this.worldPos.x, this.worldPos.y + i * this.size.y);
        }
        // ctx.fillText(this.text,this.worldPos.x,this.worldPos.y);
    }
}