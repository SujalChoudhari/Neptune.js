
import { Vector2 } from "../../maths/vec2.js";
import { Component } from "../component.js";

export class UITransform extends Component {

    constructor(x = 0, y = 0, width = 0, height = 0) {
        super();
        this.properties = {
            x: x,
            y: y,
            width: width,
            height: height
        }
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

    align(alignX, alignY) {
        let x = this.properties.x;
        let y = this.properties.y;
        let width = this.properties.width;
        let height = this.properties.height;

        if (alignX == "left") {
            x = 0;
        } else if (alignX == "center") {
            x = (window.innerWidth - width) / 2;
        } else if (alignX == "right") {
            x = window.innerWidth - width;
        }

        if (alignY == "top") {
            y = 0;
        } else if (alignY == "center") {
            y = (window.innerHeight - height) / 2;
        } else if (alignY == "bottom") {
            y = window.innerHeight - height;
        }

        this.properties.x = x;
        this.properties.y = y;
    }

    fill(options,padX=0,padY=0) {
        let x = this.properties.x;
        let y = this.properties.y;
        let width = this.properties.width;
        let height = this.properties.height;

        if (options == "horizontal") {
            x = 0;
            width = window.innerWidth;
        } else if (options == "vertical") {
            y = 0;
            height = window.innerHeight;
        } else if (options == "both") {
            x = 0;
            y = 0;
            width = window.innerWidth;
            height = window.innerHeight;
        }

        this.properties.x = x+padX;
        this.properties.y = y+padY;
        this.properties.width = width-padX*2;
        this.properties.height = height-padY*2;
    }


}