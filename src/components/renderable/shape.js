import { Renderable } from "./renderable.js";
import { Color } from "../../basic/color.js";
import { Transform } from "../transform.js";
import { Maths } from "../../neptune.js";

export class Shape extends Renderable {
    constructor(geometry = Shape.CIRCLE, color = Color.fuchsia, fill = true, param = { radius: 10, width: 10, height: 10,outline:Color.black }) {
        super();
        this.properties.geometry = geometry;
        this.properties.color = color;
        this.properties.fill = fill;
        this.properties.param = param;


    }

    getGeometry(){
        return this.properties.geometry;
    }

    setGeometry(geometry){
        this.properties.geometry = geometry;
    }

    getColor(){
        return this.properties.color;
    }

    setColor(color){
        this.properties.color = color;
    }

    draw(ctx) {
        super.draw(ctx);
        let transform = this.entity.getComponent(Transform);
        let position = Maths.meterToPixelVector2(transform.getPosition());
        let rotation = transform.getRotation();
        let radius = transform.getRadius();
        let scale = Maths.meterToPixelVector2(transform.getScale());
        let param = this.properties.param;
        let fill = this.properties.fill;
        let color = this.properties.color;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);
        ctx.fillStyle = color.toString();
        if (param.outline) ctx.strokeStyle = param.outline.toString();
        if (param.thickness) ctx.lineWidth = param.thickness;

        switch (this.properties.geometry) {
            case Shape.CIRCLE:
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                break;
            case Shape.RECTANGLE:
                ctx.beginPath();
                ctx.rect(-param.width / 2, -param.height / 2, param.width, param.height);
                break;
            case Shape.LINE:
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(param.width, param.height);
                ctx.lineWidth = param.thickness || 5;
                ctx.stroke();
                break;
            case Shape.TRIANGLE:
                ctx.beginPath();
                ctx.moveTo(0, -param.height / 2);
                ctx.lineTo(param.width / 2, param.height / 2);
                ctx.lineTo(-param.width / 2, param.height / 2);
                ctx.closePath();
                break;
        }
        if (fill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }

        if (param.outline)
        ctx.stroke();



        let children = this.entity.getComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }

        ctx.restore();
    }
}


Shape.CIRCLE = "circle";
Shape.RECTANGLE = "rectangle";
Shape.TRIANGLE = "triangle";
Shape.LINE = "line";
