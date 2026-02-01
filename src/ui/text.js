import { Color } from "../rendering/color.js"
import { Renderable } from "../rendering/renderable.js";
import { Transform } from "./uitransform.js";
import { Transform as WorldTransform } from "../components/transform.js";
import { Font } from "../rendering/font.js";
import { Maths } from "../math/math.js"


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

    deserialize(props) {
        if (!props) return;
        if (props.text !== undefined) this.text = props.text;
        if (props.align !== undefined) this.align = props.align;

        if (props.color && !(props.color instanceof Color)) {
            this.color = new Color(props.color.r, props.color.g, props.color.b, props.color.a);
        }

        if (props.font) {
            // Assuming Font has basic properties in JSON
            const f = new Font();
            if (props.font.size) f.size = props.font.size;
            if (props.font.family) f.family = props.font.family;
            if (props.font.weight) f.weight = props.font.weight;
            this.font = f;
        }
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
        if (this.#transform == null) {
            this.#transform = this.entity.GetComponent(Transform);
            // If UITransform not found, try finding standard Transform.
            // But we need to import it or rely on duck typing if we are in module system.
            // Since we can't easily import standard Transform here without circular deps or ambiguity, 
            // let's rely on finding *any* component that looks like a transform if the primary check fails.

            if (!this.#transform) {
                // ComponentRegistry is not available here. 
                // Let's iterate components and find one with 'position' property? 
                // Or simpler: The Entity.GetComponent(Type) relies on 'instanceof'.
                // We can import standard Transform as 'WorldTransform' to differentiate.
            }
        }

        let x = 0, y = 0, rot = 0;
        let scaleX = 1, scaleY = 1;

        if (this.#transform) {
            // Check if it's UITransform (has x, y) or WorldTransform (has position)
            if (this.#transform.x !== undefined) {
                x = this.#transform.x;
                y = this.#transform.y;
                rot = this.#transform.rotation;
            } else if (this.#transform.position !== undefined) {
                x = this.#transform.position.x;
                y = this.#transform.position.y;
                rot = this.#transform.rotation;
                scaleX = this.#transform.scale.x;
                scaleY = this.#transform.scale.y;
            } else {
                console.warn("Text: Transform found but has no known coordinates:", this.#transform);
            }
        } else {
            // Force find ANY transform
            const t = this.entity.components.find(c => c.position || c.x !== undefined);
            if (t) {
                this.#transform = t;
                console.log("Text: Force found transform via iteration", t);
                if (t.position) {
                    x = t.position.x;
                    y = t.position.y;
                }
            } else {
                console.error("Text: No Transform found on entity " + this.entity.name);
            }
        }

        ctx.save();
        ctx.translate(x * Maths.METER_TO_PIXEL, y * Maths.METER_TO_PIXEL);

        ctx.rotate(rot);
        ctx.scale(Maths.METER_TO_PIXEL * scaleX, Maths.METER_TO_PIXEL * scaleY);

        ctx.font = this.font.toString();
        ctx.fillStyle = this.color.toString();
        ctx.textAlign = this.align;
        // Adjust for scale being applied twice if we aren't careful? 
        // METER_TO_PIXEL scaling is for converting unity units to pixels.

        ctx.fillText(this.text, 0, this.font.size / 4);
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