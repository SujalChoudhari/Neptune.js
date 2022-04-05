import CollidableTransform from "../physics/collidable_transform.js";
import Color from "../basic/color.js";
import Text from "./text.js";
import Mouse from "../events/mouse.js";
/**
 * Button
 * ======
 * @class Button
 * @extends CollidableTransform
 * @classdesc Button object.
 * 
 * Properties:
 * @property {Object} kwargs - The keyword arguments.
 * @property {String} kwargs.text - The text of the button.
 * @property {Color} kwargs.color - The color of the button.
 * @property {String} kwargs.font - The font of the button.
 * @property {String} kwargs.alignText - The alignment of the text.
 * @property {Color} kwargs.bgColor - The background color of the button.
 * 
 * Methods:
 * @method isClicked(mouse) - Checks if the button is clicked.
 * @method isHovered(mouse) - Checks if the button is hovered.
 * @method isPressed(mouse) - Checks if the button is pressed.
 */
export default class Button extends CollidableTransform {
    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * @param {String} kwargs.text - The text of the button.
     * @param {Color} kwargs.color - The color of the button.
     * @param {String} kwargs.font - The font of the button.
     * @param {String} kwargs.alignText - The alignment of the text.
     * @param {Color} kwargs.bgColor - The background color of the button.
     */
    constructor(kwargs) {
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
        this.text = kwargs["text"] || "";
        this.font = kwargs["font"] || "";
        this.alignText = kwargs["align"] || "center";
        this.bgColor = kwargs["bgColor"] || null;
        this.textObj = new Text({
            "color": this.color,
            "text": this.text,
            "font": this.font,
            "align": this.alignText
        });
        this.textObj.setParent(this);
    }

    /**
     * Check if Button is clicked.
     * @param {Mouse} mouse - The mouse object.
     * @returns {Boolean} - True if clicked, false if not.
     */
    isClicked() {
        if(Mouse.isLeftButtonClicked() && this.containsPoint(Mouse.x,Mouse.y)){
            return true;
        }
        else return false;
    }

    /**
     * Check if Button is hovered.
     * @param {Mouse} mouse - The mouse object.
     * @returns {Boolean} - True if hovered, false if not.
     */
    isHovered() {
        if(containsPoint(Mouse.x,Mouse.y)){
            return true;
        }
        else return false;
    }

    /**
     * Check if Button is pressed.
     * @param {Mouse} mouse - The mouse object.
     * @returns {Boolean} - True if pressed, false if not.
     */
    isPressed() {
        if(this.isHovered() && Mouse.isLeftButtonPressed()){
            return true;
        }
        else return false;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.textObj.update(deltaTime);
        this.size.x = this.textObj.size.x * 1.5;

        this.textObj.color = this.color;
        this.textObj.font = this.font;
        this.textObj.alignText = this.alignText;

        
        // alignText the text to the center of the button relativly to the button position
        this.textObj.worldPos.x = this.worldPos.x + this.size.x / 2;
        this.textObj.worldPos.y = this.worldPos.y + 0.9 *this.size.y;

    }

    draw(ctx) {
        super.draw(ctx);
        if (this.bgColor){
            ctx.fillStyle = `rgb(${this.bgColor.r},${this.bgColor.g},${this.bgColor.b})`;
            ctx.fillRect(this.worldPos.x,this.worldPos.y,this.size.x,this.size.y*1.2);
        }
        this.textObj.draw(ctx);
    }
}