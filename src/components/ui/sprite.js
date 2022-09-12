import { Sprite } from "../renderable/sprite.js";
import { UITransform } from "./transform.js";
import { Renderable } from "../renderable/renderable.js";

export class UISprite extends Sprite {
    draw(ctx) {
        let image = this.properties.image;
        let path = this.properties.path;
        let width = this.properties.width;
        let height = this.properties.height;
        let position = this.entity.getComponent(UITransform).getPosition();
        let rotation = this.entity.getComponent(UITransform).getRotation();
        let scale = this.entity.getComponent(UITransform).getScale();

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);

        if (image.src != path) {
            image.src = path;
        }

        ctx.drawImage(image, -width / 2, -height / 2, width, height);
        let children = this.entity.getComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }
        ctx.restore();
    }
}