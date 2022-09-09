import { Component } from "./component.js";
import { Color } from "../basic/color.js";
import { Transform } from "./transform.js";

export class Shape extends Component {
    constructor(geometry = Shape.CIRCLE, color = Color.fuchsia, fill = true, param = { radius: 10, width: 10, height: 10 }) {
        super();
        this.properties = {
            geometry : geometry,
            color : color,
            fill : fill,
            param : param,
        }
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
        let transform = this.entity.getComponent(Transform);
        let position = transform.getPosition();
        let rotation = transform.getRotation();
        let scale = transform.getScale();
        let param = this.properties.param;
        let fill = this.properties.fill;
        let color = this.properties.color;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);
        ctx.fillStyle = color.toString();
        ctx.strokeStyle = color.toString();

        switch (this.properties.geometry) {
            case Shape.CIRCLE:
                ctx.beginPath();
                ctx.arc(0, 0, param.radius, 0, Math.PI * 2);
                break;
            case Shape.RECTANGLE:
                ctx.beginPath();
                ctx.rect(-param.width / 2, -param.height / 2, param.width, param.height);
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

        let children = this.entity.getChildWithComponent(Shape);
        for (let child of children) {
            child.getComponent(Shape).draw(ctx);
        }
        ctx.restore();
    }
}


Shape.CIRCLE = "circle";
Shape.RECTANGLE = "rectangle";
Shape.TRIANGLE = "triangle";
