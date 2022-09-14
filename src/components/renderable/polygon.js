import { Renderable } from "./renderable.js";
import { Color } from "../../basic/color.js";
import { Transform } from "../transform.js";
import { Maths } from "../../neptune.js";

export class Polygon extends Renderable {
    constructor(vertices = [], color = Color.fuchsia, fill = true, outline = Color.black, thickness = 1) {
        super();
        this.properties.vertices = vertices;
        this.properties.color = color;
        this.properties.fill = fill;
        this.properties.outline = outline;
        this.properties.thickness = thickness;
    }

    getVertices(){
        return this.properties.vertices;
    }

    setVertices(vertices){
        this.properties.vertices = vertices;
    }

    draw(ctx) {
        super.draw(ctx);
        let transform = this.entity.getComponent(Transform);
        let position = Maths.meterToPixelVector2(transform.getPosition());
        let rotation = transform.getRotation();
        let scale = Maths.meterToPixelVector2(transform.getScale());
        let vertices = this.properties.vertices;
        let fill = this.properties.fill;
        let color = this.properties.color;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);
        ctx.fillStyle = color.toString();
        if (this.properties.outline) ctx.strokeStyle = this.properties.outline.toString();
        if (this.properties.thickness) ctx.lineWidth = this.properties.thickness;

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();

        if (fill) ctx.fill();
        if (this.properties.outline) ctx.stroke();
        ctx.restore();
    }
}