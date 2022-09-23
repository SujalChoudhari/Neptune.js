import { Renderable } from "./renderable.js";
import { Color } from "../../basic/color.js";
import { Transform } from "../transform.js";
import { Maths } from "../../neptune.js";

export class Shape extends Renderable {
    constructor(geometry = Shape.CIRCLE, color = Color.fuchsia, fill = true, param = { radius: 10, width: 10, height: 10, outline: Color.black,thickness:1 }) {
        super();
        this._properties.geometry = geometry;
        this._properties.color = color;
        this._properties.fill = fill;
        this._properties.param = param;


    }

    get geometry() {
        return this._properties.geometry;
    }

    set geometry(geometry) {
        this._properties.geometry = geometry;
    }

    get color() {
        return this._properties.color;
    }

    set color(color) {
        this._properties.color = color;
    }

    get fill() {
        return this._properties.fill;
    }

    set fill(fill) {
        this._properties.fill = fill;
    }

    get radius() {
        return this._properties.param.radius;
    }

    set radius(radius) {
        this._properties.param.radius = radius;
    }

    get width() {
        return this._properties.param.width;
    }

    set width(width) {
        this._properties.param.width = width;
    }

    get height() {
        return this._properties.param.height;
    }

    set height(height) {
        this._properties.param.height = height;
    }

    get outline() {
        return this._properties.param.outline;
    }

    set outline(outline) {
        this._properties.param.outline = outline;
    }

    get thickness() {
        return this._properties.param.thickness;
    }

    set thickness(thickness) {
        this._properties.param.thickness = thickness;
    }


    getGeometry() {
        return this._properties.geometry;
    }

    setGeometry(geometry) {
        this._properties.geometry = geometry;
    }

    getColor() {
        return this._properties.color;
    }

    setColor(color) {
        this._properties.color = color;
    }

    draw(ctx) {
        super.draw(ctx);
        let transform = this.entity.getComponent(Transform);
        let position = Maths.meterToPixelVector2(transform.getPosition());
        let rotation = transform.getRotation();
        let radius = transform.getRadius();
        let scale = Maths.meterToPixelVector2(transform.getScale());
        let param = this._properties.param;
        let fill = this._properties.fill;
        let color = this._properties.color;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);
        ctx.fillStyle = color.toString();
        if (param.outline) ctx.strokeStyle = param.outline.toString();
        if (param.thickness) ctx.lineWidth = param.thickness;

        switch (this._properties.geometry) {
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
            case Shape.POLYGON:
                ctx.beginPath();
                ctx.moveTo(param.points[0].x, param.points[0].y);
                for (let i = 1; i < param.points.length; i++) {
                    ctx.lineTo(param.points[i].x, param.points[i].y);
                }
                ctx.closePath();
                break;
        }
        if (fill) {
            ctx.fill();
            if (param.outline) ctx.stroke();
        } else {
            ctx.stroke();
        }

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
Shape.POLYGON = "polygon";