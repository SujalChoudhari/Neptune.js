import { Component } from "../component.js";
import { Renderable } from "../renderable/renderable.js";
import { UITransform } from "./transform.js";

export class Text extends Renderable {
    constructor(text, font,align, color) {
        super();
        this.properties.text = text;
        this.properties.font = font;
        this.properties.align = align;
        this.properties.color = color;
    }

    getText() {
        return this.properties.text;
    }

    setText(text) {
        this.properties.text = text;
    }

    getFont() {
        return this.properties.font;
    }

    setFont(font) {
        this.properties.font = font;
    }

    getColor() {
        return this.properties.color;
    }

    setColor(color) {
        this.properties.color = color;
    }

    getAlign() {
        return this.properties.align;
    }

    setAlign(align) {
        this.properties.align = align;
    }

    draw(ctx){
        let transform = this.entity.getComponent(UITransform);
        ctx.font = this.getFont();
        ctx.fillStyle = this.getColor().toString();
        ctx.textAlign = this.getAlign();
        ctx.fillText(this.getText(), transform.getX(), transform.getY());
    }
}


Text.ALIGN_LEFT = "left";
Text.ALIGN_RIGHT = "right";
Text.ALIGN_CENTER = "center";
Text.ALIGN_START = "start";
Text.ALIGN_END = "end";