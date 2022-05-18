import Transform from "../maths/transform.js";
import Color from "../basic/color.js";
export default class Circle extends Transform{
    constructor(kwargs){
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
        this.radius = kwargs["radius"] || 1;
    }

    update(deltaTime){
        super.update(deltaTime);
    }

    draw(ctx){
        if (this.parent){
            ctx.translate(this.parent.worldPos.x, this.parent.worldPos.y);
            ctx.rotate(this.worldRot* Math.PI / 180);
            ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI);
            ctx.fill();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }else{
            ctx.translate(this.worldPos.x,this.worldPos.y);
            ctx.rotate(this.worldRot* Math.PI / 180);
            ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, 2*Math.PI);
            ctx.fill();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
}