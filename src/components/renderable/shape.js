import { Renderable } from "./renderable.js";
import { Color } from "../../basic/color.js";
import { Transform } from "../transform.js";
import { Maths } from "../../maths/math.js";
/**
 * Shape Component is responsible for rendering a shape to the screen.
 * Basic Shapes such as circles, rectangles, etc. can be rendered using this component.
 * ```
 * Shape.CIRCLE = 0;
 * Shape.RECTANGLE = 1;
 * Shape.LINE = 2;
 * Shape.TRIANGLE = 3;
 * Shape.POLYGON = 4;
 * ```
 * 
 * @class Shape
 * @extends Renderable
 * @property {number} geometry=Shape.CIRCLE - The Geometry of the shape.
 * @property {Color} color=Color.fuchsia - The color of the shape.
 * @property {boolean} fill=true - Whether the shape is filled or not.
 * @property {Object} param - More Optional parameters for the shape.
 * @property {number} param.radius=10 - The radius of the shape.
 * @property {number} param.width=10 - The width of the shape.
 * @property {number} param.height=10 - The height of the shape.
 * @property {Color} param.outline=Color.black - The color of the outline of the shape.
 * @property {number} param.thickness=1 - The thickness of the outline of the shape.
 * 
 * @example
 * // Create a shape component
 * let shape = new Shape(Shape.CIRCLE,Color.fuchsia,true,{radius:10});
 * 
 * // Add the shape component to an entity
 * entity.addComponent(shape);
 */
export class Shape extends Renderable {
    _properties = {
        geometry: Shape.CIRCLE,
        param: { radius: 10, color: Color.fuchsia, fill: true, width: 10, height: 10, outline: Color.black, thickness: 1, points: [] }
    }

    constructor(geometry = Shape.CIRCLE, param = { radius: 10, color: Color.fuchsia, fill: true, width: 10, height: 10, outline: Color.black, thickness: 1, points: [] }) {
        super();
        this._properties.geometry = geometry;

        param = Object.assign(this._properties.param, param);
    }

    /**
     * Geometry of the shape. Can be one of the following:
     * ```
     * Shape.CIRCLE = 0;
     * Shape.RECTANGLE = 1;
     * Shape.LINE = 2;
     * Shape.TRIANGLE = 3;
     * Shape.POLYGON = 4;
     * ```
     * @type {number}
     */
    get geometry() {
        return this._properties.geometry;
    }

    set geometry(geometry) {
        this._properties.geometry = geometry;
    }


    /**
     * Color of the shape.
     * @type {Color}
     * 
     */
    get color() {
        return this._properties.param.color;
    }

    set color(color) {
        this._properties.param.color = color;
    }

    /**
     * Fill the shape or not.
     * @type {boolean}
     */
    get fill() {
        return this._properties.param.fill;
    }

    set fill(fill) {
        this._properties.param.fill = fill;
    }


    /**
     * If shape is Circle. The radius of the circle.
     * @type {number}
     */
    get radius() {
        return this._properties.param.radius;
    }

    set radius(radius) {
        this._properties.param.radius = radius;
    }

    /**
     * If the shape is Rectangle. The width of the rectangle.
     * @type {number}
     */
    get width() {
        return this._properties.param.width;
    }

    set width(width) {
        this._properties.param.width = width;
    }

    /**
     * If the shape is Rectangle. The height of the rectangle.
     */
    get height() {
        return this._properties.param.height;
    }

    set height(height) {
        this._properties.param.height = height;
    }

    /**
     * Outline of the shape.
     * @type {Color}
     */
    get outline() {
        return this._properties.param.outline;
    }

    set outline(outline) {
        this._properties.param.outline = outline;
    }

    /**
     * The thickness of the outline of the shape.
     * @type {number}
     */
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
        return this._properties.param.color;
    }

    setColor(color) {
        this._properties.param.color = color;
    }

    /** @private */
    draw(ctx) {
        super.draw(ctx);
        let transform = this.entity.GetComponent(Transform);
        let position = Maths.MeterToPixelVector2(transform.getPosition());
        let rotation = transform.getRotation();
        let radius = this._properties.param.radius;
        let scale = Maths.MeterToPixelVector2(transform.getScale());
        let param = this._properties.param;
        let fill = this._properties.param.fill;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);
        ctx.globalCompositeOperation = this.blendMode;
        ctx.fillStyle = param.color.toString();
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
                ctx.strokeStyle = param.color.toString();
                ctx.lineTo(param.width, param.height);
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

        let children = this.entity.GetComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }

        ctx.restore();
    }
}

Shape.CIRCLE = 0;
Shape.RECTANGLE = 1;
Shape.LINE = 2;
Shape.TRIANGLE = 3;
Shape.POLYGON = 4;
