
import { Vector2 } from "../../maths/vec2.js";
import { Component } from "../component.js";
import { Input } from "../../events/input.js"

export class UITransform extends Component {

    constructor(x = 0, y = 0, width = 0, height = 0,rot=0) {
        super();
        this._properties.x = x;
        this._properties.y = y;
        this._properties.width = width;
        this._properties.height = height;
        this._properties.rot = rot;

    }

    get x(){
        return this._properties.x;
    }

    set x(x){
        this._properties.x = x;
    }

    get y(){
        return this._properties.y;
    }

    set y(y){
        this._properties.y = y;
    }

    get width(){
        return this._properties.width;
    }

    set width(width){
        this._properties.width = width;
    }

    get height(){
        return this._properties.height;
    }

    set height(height){
        this._properties.height = height;
    }

    get rotation(){
        return this._properties.rot;
    }

    set rotation(rot){
        this._properties.rot = rot;
    }

    get center(){
        let center = new Vector2(this._properties.x + this._properties.width / 2, this._properties.y + this._properties.height / 2);
        return center;
    }

    set center(center){
        this._properties.x = center.x - this._properties.width / 2;
        this._properties.y = center.y - this._properties.height / 2;
    }


    getX() {
        return this._properties.x;
    }

    setX(x) {
        this._properties.x = x;
    }

    getY() {
        return this._properties.y;
    }

    setY(y) {
        this._properties.y = y;
    }

    getWidth() {
        return this._properties.width;
    }

    setWidth(width) {
        this._properties.width = width;
    }

    getHeight() {
        return this._properties.height;
    }

    setHeight(height) {
        this._properties.height = height;
    }

    getCenter() {
        return new Vector2(this._properties.x + this._properties.width / 2, this._properties.y + this._properties.height / 2);
    }

    setCenter(center) {
        this._properties.x = center.x - this._properties.width / 2;
        this._properties.y = center.y - this._properties.height / 2;
    }

    getRot() {
        return this._properties.rot;
    }

    setRot(rot) {
        this._properties.rot = rot;
    }

    align(mode="center"){
        let parent = this.entity.parent;
        if (parent != undefined){
            var parentTransform = parent.getComponent(UITransform);
            var x = parentTransform.getX();
            var y = parentTransform.getY();
            var width = parentTransform.getWidth();
            var height = parentTransform.getHeight();
        }
        else{
            var x = 0;
            var y = 0;
            var width = window.innerWidth;
            var height = window.innerHeight;
        }

        switch(mode){
            case "left":
                this._properties.x = x;
                break;
            case "right":
                this._properties.x = x + width - this._properties.width;
                break;
            case "top":
                this._properties.y = y;
                break;
            case "bottom":
                this._properties.y = y + height - this._properties.height;
                break;
            case "center":
                this._properties.x = x + width / 2 - this._properties.width / 2;
                break;
            case "middle":
                this._properties.y = y + height / 2 - this._properties.height / 2;
                break;
        }


    }

    fill(mode="",padX=0,padY=0){
        let parent = this.entity.parent;
        if (parent != undefined){
            var parentTransform = parent.getComponent(UITransform);
            var x = parentTransform.getX();
            var y = parentTransform.getY();
            var width = parentTransform.getWidth();
            var height = parentTransform.getHeight();
        }
        else{
            var x = 0;
            var y = 0;
            var width = window.innerWidth;
            var height = window.innerHeight;
        }

        switch(mode){
            case "both":
                this._properties.x = x + padX;
                this._properties.y = y + padY;
                this._properties.width = width - padX * 2;
                this._properties.height = height - padY * 2;
                break;
            case "x":
                this._properties.x = x + padX;
                this._properties.width = width - padX * 2;
                break;
            case "y":
                this._properties.y = y + padY;
                this._properties.height = height - padY * 2;
                break;
        }
    }
            
    #isPointInside(point) {
        return point.x >= this._properties.x && point.x <= this._properties.x + this._properties.width && point.y >= this._properties.y && point.y <= this._properties.y + this._properties.height;
    }

    isHovered() {
        return this.#isPointInside(Input.getPosition());
    }

    isClicked() {
        return this.isHovered() && Input.isLeftClicked();
    }

    rotate(rot) {
        this._properties.rot += rot;
    }
}