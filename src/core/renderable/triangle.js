import Transform from "../maths/transform.js";
import Color from "../basic/color.js";
export default class Triangle extends Transform{
    constructor(kwargs){
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
        this.points = kwargs["points"] || [];
    }

    update(deltaTime){
        super.update(deltaTime);
    }
    draw(ctx){
        if(this.parent){
            ctx.translate(this.parent.worldPos.x, this.parent.worldPos.y);
            ctx.rotate(this.worldRot * Math.PI / 180);
            ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            ctx.lineTo(this.points[1].x, this.points[1].y);
            ctx.lineTo(this.points[2].x, this.points[2].y);
            ctx.closePath();
            ctx.fill();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else {
            ctx.translate(this.worldPos.x, this.worldPos.y);
            ctx.rotate(this.worldRot * Math.PI / 180);
            ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            ctx.lineTo(this.points[1].x, this.points[1].y);
            ctx.lineTo(this.points[2].x, this.points[2].y);
            ctx.closePath();
            ctx.fill();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
}