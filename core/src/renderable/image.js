import Transform from "../maths/transform.js";

/**
 * Image
 * ======
 * @class Image
 * @extends Transform
 * @classdesc Image object. Create Image objects to display images on the screen.
 * 
 * Properties:
 * @property {Object} kwargs - The keyword arguments.
 * @property {String} kwargs.src - The source of the image.
 * @property {Image} image - Actual Js Image object.
 * @property {Boolean} isLoaded - Whether the image is loaded.
 */
export default class IMAGE extends Transform {

    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * @param {String} kwargs.src - The source of the image.
     * @param {Image} kwargs.image - Actual Js Image object.
     */
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