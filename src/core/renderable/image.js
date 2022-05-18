import Transform from "../maths/transform.js";
export default class IMAGE extends Transform {
    constructor(kwargs) {
        super(kwargs);
        this.image = new Image();
        this.image.src = kwargs["src"];
        this.isLoaded = false
        this.image.onload = function () {
            this.isLoaded = true;
            console.log(this.name, " is loaded");
        }
    }

    draw(ctx) {
        if (this.isLoaded) return;
        
        if (this.parent) {
            ctx.translate(this.parent.worldPos.x, this.parent.worldPos.y);
            ctx.rotate(this.worldRot * Math.PI / 180);
            ctx.drawImage(this.image, -this.centerPos.x + this.pos.x, -this.centerPos.y + this.pos.y, this.size.x, this.size.y);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else {
            ctx.translate(this.worldPos.x, this.worldPos.y);
            ctx.rotate(this.worldRot * Math.PI / 180);
            ctx.drawImage(this.image, -this.centerPos.x, -this.centerPos.y, this.size.x, this.size.y);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
    }
}