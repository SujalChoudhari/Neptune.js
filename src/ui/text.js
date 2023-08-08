import { Color } from "../basic/color.js"
import { Renderable } from "../components/renderable/renderable.js";
import { Transform } from "./uitransform.js";
import { Font } from "../basic/font.js";
import { Maths } from "../maths/math.js"


/**
 * Text component allows to display text on UI elements.
 * This is a UI component, so it should be added to an entity with a UITransform component.
 * @class Text
 * @extends Renderable
 * 
 * @property {string} text="Hello, World!" - The text to display.
 * @property {Font} font=20px Arial bold - The font to use.
 * @property {Text.ALIGN} align=Text.ALIGN_CENTER - The alignment of the text.
 * @property {Color} color=Color.white - The color of the text.
 * 
 * @example
 * let text = new Text("Hello World!", new Font(), Text.ALIGN_LEFT, Color.white);
 */
export class Text extends Renderable {
    #transform;
    constructor(text = "Hello, World!", font = new Font(), align = Text.ALIGN.LEFT, color = Color.white) {
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
    get text() {
        return this._properties.text;
    }

    set text(text) {
        this._properties.text = text;
    }

    /**
     * Font the text should be displayed in.
     * The all fonts supported by the browser/HTML5 canvas can be used.
     * Example: "30px Arial bold"
     * @type {Font}
     * 
     */
    get font() {
        return this._properties.font;
    }

    set font(font) {
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
    get align() {
        return this._properties.align;
    }

    set align(align) {
        this._properties.align = align;
    }

    /**
     * The text color to be used.
     * @type {Color}
     */
    get color() {
        return this._properties.color;
    }

    set color(color) {
        this._properties.color = color;
    }



    draw(ctx) {
        if (this.#transform == null)
            this.#transform = this.entity.GetComponent(Transform);

        ctx.save();
        ctx.translate(this.#transform.x * Maths.METER_TO_PIXEL, this.#transform.y * Maths.METER_TO_PIXEL);
        ctx.rotate(this.#transform.rotate);
        ctx.scale(Maths.METER_TO_PIXEL, Maths.METER_TO_PIXEL);

        ctx.font = this.font.toString();
        ctx.fillStyle = this.color.toString();
        ctx.textAlign = this.align;
        ctx.fillText(this.text, 0, this.font.size, this.#transform.width * Maths.METER_TO_PIXEL);


        let children = this.entity.GetComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }

        ctx.restore();
    }
}

/**
 * Align the text
 * @readonly
 * @enum {string}
 */
Text.ALIGN = {
    LEFT: "left",
    CENTER: "center",
    RIGHT: "right",
    START: "start",
    END: "end"
}