import Transform from "../maths/transform.js";
import Color from "../basic/color.js";
export default class Text extends Transform{
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
        ctx.rotate(this.rot * Math.PI / 180);
        ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
        ctx.font = this.font;
        ctx.textAlign = this.alignText;
        this.size.x =  ctx.measureText(this.text).width;
        let lines = this.text.split("\n");
        for(let i = 0; i < lines.length; i++){
            ctx.fillText(lines[i], this.worldPos.x, this.worldPos.y + i * this.size.y);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}