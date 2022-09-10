import { UITransform } from "./transform.js";
import { Color } from "../../basic/color.js";

export class Panel extends UITransform {
    constructor(x = 0, y = 0, width = 0, height = 0,rot=0, color = Color.white) {
        super(x, y, width, height,rot);
        this.properties.color = color;
    }

    getColor() {
        return this.properties.color;
    }

    setColor(color) {
        this.properties.color = color;
    }

    draw(ctx) {
        let x = this.getX();
        let y = this.getY();
        let width = this.getWidth();
        let height = this.getHeight();
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.getRot());

        ctx.fillStyle = this.properties.color.toString();
        ctx.fillRect(0,0, width, height);
        ctx.restore();
    }
}