import { Shape } from "./graphics.js";
import { Color } from "../basic/color.js";

export class Polygon extends Shape {
    constructor(kwargs) {
        super(kwargs);
        this.color = kwargs["color"] || Color.random();
        this.points = kwargs["points"] || [];
    }

    update(deltaTime){
        super.update(deltaTime);
    }

    draw(ctx){
        ctx.beginPath();
        ctx.fillStyle = this.color.toString();
        ctx.moveTo(this.worldPos.x + this.points[0].x,this.worldPos.y + this.points[0].y);
        for(let i = 1; i < this.points.length; i++){
            ctx.lineTo(this.worldPos.x + this.points[i].x,this.worldPos.y + this.points[i].y);
        }
        ctx.fill();   
    }
}
