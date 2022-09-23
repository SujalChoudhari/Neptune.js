import { Renderable } from "./renderable.js";
import { Color } from "../../basic/color.js";
import { Transform } from "../transform.js";
import { Maths } from "../../neptune.js";

export class Polygon extends Renderable {
    constructor(vertices = [], color = Color.fuchsia, fill = true, outline = Color.black, thickness = 1) {
        super();
        this._properties.vertices = vertices;
        this._properties.color = color;
        this._properties.fill = fill;
        this._properties.outline = outline;
        this._properties.thickness = thickness;
    }

    get vertices() {
        return this._properties.vertices;
    }

    set vertices(vertices) {
        this._properties.vertices = vertices;
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

    get outline() {
        return this._properties.outline;
    }

    set outline(outline) {
        this._properties.outline = outline;
    }

    get thickness() {
        return this._properties.thickness;
    }

    set thickness(thickness) {
        this._properties.thickness = thickness;
    }

    getVertices() {
        return this._properties.vertices;
    }

    setVertices(vertices) {
        this._properties.vertices = vertices;
    }

    draw(ctx) {
        super.draw(ctx);
        let transform = this.entity.getComponent(Transform);
        let position = Maths.meterToPixelVector2(transform.position);
        let rotation = transform.rotation;
        let scale = Maths.meterToPixelVector2(transform.scale);
        let vertices = this._properties.vertices;
        let fill = this._properties.fill;
        let color = this._properties.color;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);
        ctx.fillStyle = color.toString();
        if (this._properties.outline) ctx.strokeStyle = this._properties.outline.toString();
        if (this._properties.thickness) ctx.lineWidth = this._properties.thickness;

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();

        if (fill) ctx.fill();
        if (this._properties.outline) ctx.stroke();

        let children = this.entity.getComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }
        ctx.restore();
    }
}