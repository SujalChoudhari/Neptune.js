import { Component } from "./component.js";
import { Transform } from "./transform.js";

export class Sprite extends Component {
    constructor(path="", width=10, height=10) {
        super();
        this.properties.path = path;
        this.properties.width = width;
        this.properties.height = height;
        this.properties.image = new Image();
        this.properties.image.src = path;

    }

    getPath() {
        return this.properties.path;
    }

    setPath(path) {
        this.properties.path = path;
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

    getImage() {
        return this.properties.image;
    }

    setImage(image) {
        this.properties.image = image;
    }

    draw(ctx) {
        let image = this.properties.image;
        let path = this.properties.path;
        let width = this.properties.width;
        let height = this.properties.height;
        let position = this.entity.getComponent(Transform).getPosition();
        let rotation = this.entity.getComponent(Transform).getRotation();
        let scale = this.entity.getComponent(Transform).getScale();

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);

        if (image.src != path) {
            image.src = path;
        }

        ctx.drawImage(image, -width / 2, -height / 2, width, height);
        let children = this.entity.getChildWithComponent(Sprite);
        for (let child of children) {
            child.getComponent(Sprite).draw(ctx);
        }

        ctx.restore();
    }


        
}