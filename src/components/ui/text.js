import { Color } from '../../basic/color.js';
import { Renderable } from "../renderable/renderable.js";
import { UITransform } from "./transform.js";


/**
 * Text component allows to display text on UI elements.
 * This is a UI component, so it should be added to an entity with a UITransform component.
 * @class Text
 * @extends Renderable
 * 
 * @property {string} text="Hello, World!" - The text to display.
 * @property {string} font=20px Arial bold - The font to use.
 * @property {string} align=Text.ALIGN_CENTER - The alignment of the text.
 * @property {Color} color=Color.white - The color of the text.
 * 
 * @example
 * let text = new Text("Hello World!", "20px Arial", Text.ALIGN_LEFT, Color.white);
 */
export class Text extends Renderable {
    constructor(text="Hello, World!",font="20px Arial bold" ,align=Text.ALIGN_CENTER, color=Color.white) {
        super();
        this._properties.text = text;
        this._properties.font = font;
        this._properties.align = align;
        this._properties.color = color;
    }

    /**
     * The text to display.
     * @type {string}
     */
    get text(){
        return this._properties.text;
    }

    set text(text){
        this._properties.text = text;
    }

    /**
     * Font the text should be displayed in.
     * The all fonts supported by the browser/HTML5 canvas can be used.
     * Example: "30px Arial bold"
     * @type {string}
     * 
     */
    get font(){
        return this._properties.font;
    }

    set font(font){
        this._properties.font = font;
    }

    /**
     * Align the text.
     * | Value | Description |
     * | --- | --- |
     * | Text.ALIGN_LEFT | Align the text to the left. |
     * | Text.ALIGN_CENTER | Align the text to the center. |
     * | Text.ALIGN_RIGHT | Align the text to the right. |
     * | Text.ALIGN_START | Align the text to the start. |
     * | Text.ALIGN_END | Align the text to the end. |
     * @type {string}
     */
    get align(){
        return this._properties.align;
    }

    set align(align){
        this._properties.align = align;
    }

    /**
     * The text color to be used.
     * @type {Color}
     */
    get color(){
        return this._properties.color;
    }

    set color(color){
        this._properties.color = color;
    }


    getText() {
        return this._properties.text;
    }

    setText(text) {
        this._properties.text = text;
    }

    getFont() {
        return this._properties.font;
    }

    setFont(font) {
        this._properties.font = font;
    }

    getColor() {
        return this._properties.color;
    }

    setColor(color) {
        this._properties.color = color;
    }

    getAlign() {
        return this._properties.align;
    }

    setAlign(align) {
        this._properties.align = align;
    }

    draw(ctx){
        let transform = this.entity.getComponent(UITransform);
        ctx.font = this.getFont();
        ctx.fillStyle = this.getColor().toString();
        ctx.textAlign = this.getAlign();
        ctx.fillText(this.getText(), transform.getX(), transform.getY());
    }
}


Text.ALIGN_LEFT = "left";
Text.ALIGN_RIGHT = "right";
Text.ALIGN_CENTER = "center";
Text.ALIGN_START = "start";
Text.ALIGN_END = "end";