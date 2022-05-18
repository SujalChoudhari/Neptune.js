import Transform from "../maths/transform.js";
import Color from "../basic/color.js";
export default class Rect extends Transform{
    constructor(kwargs){
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
    }
    
    update(deltaTime){
        super.update(deltaTime);
    }

    draw(ctx){
        if (this.parent){
            ctx.translate(this.parent.worldPos.x, this.parent.worldPos.y);
            ctx.rotate(this.worldRot* Math.PI / 180);
            ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
            ctx.fillRect(-this.centerPos.x +this.pos.x, -this.centerPos.y+this.pos.y, this.size.x, this.size.y);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }else{
            ctx.translate(this.worldPos.x,this.worldPos.y); 
            ctx.rotate(this.worldRot* Math.PI / 180);
            ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
            ctx.fillRect(-this.centerPos.x ,-this.centerPos.y, this.size.x, this.size.y);
            ctx.setTransform(1, 0, 0, 1, 0, 0);

        }
    }
}