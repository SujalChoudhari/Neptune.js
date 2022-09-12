
import { Vector2 } from "../../maths/vec2.js";
import { Component } from "../component.js";
import { Input } from "../../events/input.js"

export class UITransform extends Component {

    constructor(x = 0, y = 0, width = 0, height = 0,rot=0) {
        super();
        this.properties.x = x;
        this.properties.y = y;
        this.properties.width = width;
        this.properties.height = height;
        this.properties.rot = rot;

    }

    getX() {
        return this.properties.x;
    }

    setX(x) {
        this.properties.x = x;
    }

    getY() {
        return this.properties.y;
    }

    setY(y) {
        this.properties.y = y;
    }

    getWidth() {
        return this.properties.width;
    }

    setWidth(width) {
        this.properties.width = width;
    }

    getHeight() {
        return this.properties.height;
    }

    setHeight(height) {
        this.properties.height = height;
    }

    getCenter() {
        return new Vector2(this.properties.x + this.properties.width / 2, this.properties.y + this.properties.height / 2);
    }

    setCenter(center) {
        this.properties.x = center.x - this.properties.width / 2;
        this.properties.y = center.y - this.properties.height / 2;
    }

    getRot() {
        return this.properties.rot;
    }

    setRot(rot) {
        this.properties.rot = rot;
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
                this.properties.x = x;
                break;
            case "right":
                this.properties.x = x + width - this.properties.width;
                break;
            case "top":
                this.properties.y = y;
                break;
            case "bottom":
                this.properties.y = y + height - this.properties.height;
                break;
            case "center":
                this.properties.x = x + width / 2 - this.properties.width / 2;
                break;
            case "middle":
                this.properties.y = y + height / 2 - this.properties.height / 2;
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
                this.properties.x = x + padX;
                this.properties.y = y + padY;
                this.properties.width = width - padX * 2;
                this.properties.height = height - padY * 2;
                break;
            case "x":
                this.properties.x = x + padX;
                this.properties.width = width - padX * 2;
                break;
            case "y":
                this.properties.y = y + padY;
                this.properties.height = height - padY * 2;
                break;
        }
    }
            

    isPointInside(point) {
        return point.x >= this.properties.x && point.x <= this.properties.x + this.properties.width && point.y >= this.properties.y && point.y <= this.properties.y + this.properties.height;
    }

    isHovered() {
        return this.isPointInside(Input.getPosition());
    }

    isClicked() {
        return this.isHovered() && Input.isLeftClicked();
    }

    rotate(rot) {
        this.properties.rot += rot;
    }
}