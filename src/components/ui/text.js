import { Component } from "../component.js";
import { Renderable } from "../renderable/renderable.js";
import { UITransform } from "./transform.js";

export class Text extends Renderable {
    constructor(text, font,align, color) {
        super();
        this._properties.text = text;
        this._properties.font = font;
        this._properties.align = align;
        this._properties.color = color;
    }

    get text(){
        return this._properties.text;
    }

    set text(text){
        this._properties.text = text;
    }

    get font(){
        return this._properties.font;
    }

    set font(font){
        this._properties.font = font;
    }

    get align(){
        return this._properties.align;
    }

    set align(align){
        this._properties.align = align;
    }

    get color(){
        return this._properties.color;
    }

    set color(color){
        this._properties.color = color;
    }


    getText() {
        return this._properties.text;
    }

    setText(text) {
        this._properties.text = text;
    }

    getFont() {
        return this._properties.font;
    }

    setFont(font) {
        this._properties.font = font;
    }

    getColor() {
        return this._properties.color;
    }

    setColor(color) {
        this._properties.color = color;
    }

    getAlign() {
        return this._properties.align;
    }

    setAlign(align) {
        this._properties.align = align;
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