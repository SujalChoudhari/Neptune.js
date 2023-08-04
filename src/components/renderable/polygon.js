import { Renderable } from "./renderable.js";
import { Color } from "../../basic/color.js";
import { Transform } from "../transform.js";
import { Maths } from "../../maths/math.js";

/**
 * A Polygon Component is responsible for rendering a polygon to the screen.
 * Polygons are defined by an array of points.
 * @class Polygon
 * @extends Renderable
 * 
 * @property {Vector2[]} vertices=[] - The points of the polygon.
 * @property {Color} color=Color.fuchsia - The color of the polygon.
 * @property {boolean} fill=true - Whether the polygon is filled or not.
 * @property {Color} outline=Color.black - The color of the outline of the polygon.
 * @property {number} thickness=1 - The thickness of the outline of the polygon.
 * 
 * @example
 * // Create a polygon component
 * let polygon = new Polygon(
 *      [new Vector2(0,0),
 *      new Vector2(100,0),
 *      new Vector2(100,100),
 *      new Vector2(0,100)],
 *  Color.fuchsia,true,Color.black,1);
 * 
 * // Add the polygon component to an entity
 * entity.addComponent(polygon);
 */
export class Polygon extends Renderable {
    constructor(vertices = [], color = Color.fuchsia, fill = true, outline = Color.black, thickness = 1) {
        super();
        this._properties.vertices = vertices;
        this._properties.color = color;
        this._properties.fill = fill;
        this._properties.outline = outline;
        this._properties.thickness = thickness;
    }

    /**
     * Vertices of the polygon. These are individual points that define the polygon.
     * @type {Vector2[]}
     */
    get vertices() {
        return this._properties.vertices;
    }

    set vertices(vertices) {
        this._properties.vertices = vertices;
    }

    /**
     * Color of the polygon. This is the color of the polygon if it is filled.
     * @type {Color}
     */
    get color() {
        return this._properties.color;
    }

    set color(color) {
        this._properties.color = color;
    }

    get fill() {
        return this._properties.fill;
    }
    
    /**
     * Fill the polygon with the specified color. If false, the polygon will be drawn as an outline.
     * @param {boolean} fill - Whether the polygon is filled or not.
     */
    set fill(fill) {
        this._properties.fill = fill;
    }

    /**
     * Specifies outline color. If left undefined, the polygon will not have an outline.
     * @type {Color}
     */
    get outline() {
        return this._properties.outline;
    }

    set outline(outline) {
        this._properties.outline = outline;
    }

    /**
     * Thickness of the outline of the polygon. Note: it is in meters.
     * @type {number}
     * @default 1
     * 
     */
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


    /** @private */
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
        ctx.globalCompositeOperation = this.blendMode;
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