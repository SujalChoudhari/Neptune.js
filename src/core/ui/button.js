import CollidableTransform from "../physics/collidable_transform.js";
import Color from "../basic/color.js";
import Text from "./text.js";
import Mouse from "../events/mouse.js";
export default class Button extends CollidableTransform {
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
    isClicked() {
        if(Mouse.isLeftButtonClicked() && this.containsPoint(Mouse.x,Mouse.y)){
            return true;
        }
        else return false;
    }
    isHovered() {
        if(containsPoint(Mouse.x,Mouse.y)){
            return true;
        }
        else return false;
    }
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