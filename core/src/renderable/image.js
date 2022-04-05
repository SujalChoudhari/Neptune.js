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
        ctx.drawImage(this.image, this.worldPos.x, this.worldPos.y, this.size.x, this.size.y);
    }

    update(deltaTime) {
        super.update(deltaTime);
    }
}