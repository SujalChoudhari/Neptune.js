import Transform from "../maths/transform.js";
import Color from "../basic/color.js";
export default class Polygon extends Transform{
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
            for(let i = 1; i < this.points.length; i++){
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else {
            ctx.translate(this.worldPos.x, this.worldPos.y);
            ctx.rotate(this.worldRot * Math.PI / 180);
            ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for(let i = 1; i < this.points.length; i++){
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
}