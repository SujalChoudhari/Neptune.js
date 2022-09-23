import { Renderable } from "../renderable/renderable.js";
import {UITransform} from "./transform.js";

export class Panel extends Renderable {
    constructor(color) {
        super();
        this._properties.color = color;
    }

    get color() {
        return this._properties.color;
    }

    set color(color) {
        this._properties.color = color;
    }


    getColor() {
        return this._properties.color;
    }

    setColor(color) {
        this._properties.color = color;
    }

    draw(ctx) {
        let transform = this.entity.getComponent(UITransform);
        let x = transform.getX();
        let y = transform.getY();
        let width = transform.getWidth();
        let height = transform.getHeight();

        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = this._properties.color;
        ctx.fillRect(0, 0, width, height);

        let children = this.entity.getComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }

        ctx.restore();
    }
}