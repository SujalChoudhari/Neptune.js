import { Vector2 } from "../../maths/vec2.js";
import { Color } from "../../basic/color.js";

export class Wireframe{
    static circle(ctx,pos=new Vector2(100,100),radius=10,color=new Color(0,0,0,0.3)){
        ctx.strokeStyle = color.toString();
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < radius; i += 5) {
            ctx.arc(pos.x,pos.y, i, 0, 2 * Math.PI);
        }
        ctx.stroke();
    }

    static grid(ctx,size=100,space=10,color=new Color(0,0,0,0.3)){
        ctx.strokeStyle = color.toString();
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < size; i += space) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
        }
        ctx.stroke();
    }

    static rect(ctx,pos=new Vector2(100,100),size=new Vector2(100,100),color=new Color(0,0,0,0.3)){
        ctx.strokeStyle = color.toString();
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < size.x; i += 20) {
            ctx.moveTo(pos.x + i, pos.y);
            ctx.lineTo(pos.x + i, pos.y + size.y);
        }

        for (let i = 0; i < size.y; i += 10) {
            ctx.moveTo(pos.x, pos.y + i);
            ctx.lineTo(pos.x + size.x, pos.y + i);
        }
        ctx.stroke();

        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x + size.x, pos.y);
        ctx.lineTo(pos.x + size.x, pos.y + size.y);
        ctx.lineTo(pos.x, pos.y + size.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    static line(ctx,pos1=new Vector2(100,100),pos2=new Vector2(200,200),color=new Color(0,0,0,0.3)){
        // Line
        ctx.strokeStyle = color.toString();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.stroke();
        
        ctx.fillStyle = color.toString();
        // end point
        ctx.beginPath();
        ctx.arc(pos2.x, pos2.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}