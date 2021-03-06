import {CollidableTransform} from "../physics/DeprecatedCollisionTransform.js";
import {Color} from "../basic/color.js";
import {Text} from "./text.js";
import {Pointer} from "../events/pointer.js";

/**
 * @class Button
 * @deprecated Due to changes in Physics/Collision, the buttons are temporarily disabled.
 * @classdesc A Button is a class that represents a button.
 * @extends CollidableTransform
 * @param {Object} kwargs - The keyword arguments.
 * @param {String} [kwargs.text=""] - The text.
 * @param {Color} [kwargs.color=Color.random()] - The color.
 * @param {String} [kwargs.font=""] - The font.
 * @param {String} [kwargs.align="center"] - The alignment.
 * @param {Color} [kwargs.bgColor=null] - The background color.
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Button extends CollidableTransform {
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
     * @method
     * @description Checks if the button is Clicked.
     * @param {Pointer} mouse - The mouse.
     * @returns {Boolean} - True if the button is clicked.
     * @deprecated Due to changes in Physics/Collision, the buttons are temporarily disabled.
     * 
     * @example
     * // Check if the button is clicked.
     * if(button.isClicked(mouse)){
     *    // Do something.
     * }    
     */
    isClicked(mouse) {
        if(mouse.isLeftButtonClicked() && this.containsPoint(mouse.x,mouse.y)){
            return true;
        }
        else return false;
    }

    /**
     * @method
     * @description Checks if the button is hovered.
     * @returns {Boolean} - True if the button is hovered.
     * @deprecated Due to changes in Physics/Collision, the buttons are temporarily disabled.
     * @example
     * // Check if the button is hovered.
     * if(button.isHovered(mouse)){
     *   // Do something.
     * }
     */
    isHovered(mouse) {
        if(containsPoint(mouse.x,mouse.y)){
            return true;
        }
        else return false;
    }

    /**
     * @method
     * @description Checks if the button is pressed.
     * @param {Pointer} mouse - The mouse.
     * @returns {Boolean} - True if the button is pressed.
     * @deprecated Due to changes in Physics/Collision, the buttons are temporarily disabled.
     * @example
     * // Check if the button is pressed.
     * if(button.isPressed(mouse)){
     *   // Do something.
     * }
     */
    isPressed(mouse) {
        if(this.isHovered() && mouse.isLeftButtonPressed()){
            return true;
        }
        else return false;
    }


    /**
     * @method
     * @description Updates the button.
     * @param {Number} deltaTime - The time since the last update.
     * @deprecated Due to changes in Physics/Collision, the buttons are temporarily disabled.
     * @example
     * // Update the button.
     * button.update(deltaTime);
     */
    update(deltaTime) {
        super.update(deltaTime);
        this.textObj.update(deltaTime);
        this.size.x = this.textObj.size.x * 1.5;

        this.textObj.color = this.color;
        this.textObj.font = this.font;
        this.textObj.alignText = this.alignText;
        this.textObj.worldPos.x = this.worldPos.x + this.size.x / 2;
        this.textObj.worldPos.y = this.worldPos.y + 0.9 *this.size.y;

    }


    /**
     * @method
     * @description Draws the button.
     * @param {CanvasRenderingContext2D} context - The context.
     * @deprecated Due to changes in Physics/Collision, the buttons are temporarily disabled.
     * @example
     * // Draw the button.
     * button.draw(context);
     * 
     */
    draw(ctx) {
        super.draw(ctx);
        if (this.bgColor){
            ctx.fillStyle = `rgb(${this.bgColor.r},${this.bgColor.g},${this.bgColor.b})`;
            ctx.fillRect(this.worldPos.x,this.worldPos.y,this.size.x,this.size.y*1.2);
        }
        this.textObj.draw(ctx);
    }

    /** 
     * @method
     * @description Initializes the Entity.
     * @deprecated Due to changes in Physics/Collision, the buttons are temporarily disabled.
     * @example
     * // Initialize the entity.
     * entity.init();
     */
    init(){
        super.init();
    }
}