import {Entity} from "../basic/entity.js";
import {Vector2} from "./vec2.js";

/**
 * @class Transform
 * @classdesc A Transform is a class that represents a position and a size.
 * @extends Entity
 * @param {Object} kwargs - The keyword arguments.
 * @param {Vector2} [kwargs.pos]- The world position. (Optional with x and y properties)
 * @param {Vector2} [kwargs.size] - The world size. (Optional with w and h properties)
 * @param {Number} kwargs.rot - The world rotation.
 * @param {Number} kwargs.x - The x position.
 * @param {Number} kwargs.y - The y position.
 * @param {Number} kwargs.w - The width.
 * @param {Number} kwargs.h - The height.
 * 
 * @example
 * // Create a new transform.
 * let transform = new Transform({
 *      pos: new Vector2(10, 10),
 *      size: new Vector2(10, 10),
 *      rot: 0
 *    });
 * 
 */
export class Transform extends Entity {
    constructor(kwargs) {
        super(kwargs);
        this.pos = kwargs["pos"] || new Vector2(kwargs["x"] || 0, kwargs["y"] || 0);
        this.size = kwargs["size"] || new Vector2(kwargs["w"] || 1, kwargs["h"] || 1);
        this.worldPos = new Vector2(this.pos.x, this.pos.y);

    }

    /**
     * @method
     * @description Initializes the transform.
     * 
     * @example
     * // Initialize the transform.
     * transform.init();
     */
    init() {
        this.calculateWorldPos();
    }

    /**
     * @method
     * @description Updates the Transform.
     *  Calculates the world position and rotation.
     * @param {Number} deltaTime - The time since the last update.
     * 
     * @example
     * // Update the transform.
     * transform.update(deltaTime);
     */
    update(deltaTime) {
        this.calculateWorldPos();
        super.update(deltaTime);
    }

    /**
     * @method
     * @description Draw the transform.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * 
     * @example
     * // Draw the transform. // Transform cannot been drawn.
     * transform.draw(ctx);
     * 
     */
    draw(ctx) {
        super.draw(ctx);
    }

    /**
     * @method
     * @description Calculates the world position.
     * 
     * @example
     * // Calculate the world position.
     * transform.calculateWorldPos(); // auto called by update
     * 
     */
    calculateWorldPos(){
        //calculate world position based of of the parents position and rotation
        this.worldPos.x = this.pos.x;
        this.worldPos.y = this.pos.y;
        if (this.parent) {
            this.worldPos.x += this.parent.worldPos.x;
            this.worldPos.y += this.parent.worldPos.y;
        }
    }

    /**
     * @method
     * @description Aligns the transform to the parent.
     * |Available Types|        Description                                 |
     * |---------------|----------------------------------------------------|
     * | center        | Aligns the transform to the center of the parent.  |
     * | top           | Aligns the transform to the top of the parent.     |
     * | bottom        | Aligns the transform to the bottom of the parent.  |
     * | left          | Aligns the transform to the left of the parent.    |
     * | right         | Aligns the transform to the right of the parent.   |
     * | middle        | Aligns the transform to the middle of the parent.  |
     * 
     * @param {String} type - The type of alignment.
     * 
     * @example
     * // Align the transform to the top.
     * transform.align("top");
     */
    align(type) {
        if ("center" == type) {
            this.pos.x = this.parent.size.x / 2 - this.size.x / 2;
        }
        else if ("left" == type) {
            this.pos.x = 0;
        }
        else if ("right" == type) {
            this.pos.x = this.parent.size.x - this.size.x;
        }

        if ("middle" == type) {
            this.pos.y = this.parent.size.y / 2 - this.size.y / 2;
        }
        else if ("top" == type) {
            this.pos.y = 0;
        }
        else if ("bottom" == type) {
            this.pos.y = this.parent.size.y - this.size.y;
        }

    }

    /**
     * @method
     * @description Fills the transform to the Parent size with the given padding.
     * @param {Number} padx - The x padding.
     * @param {Number} pady - The y padding.
     * 
     * @example
     * // Fill the transform to the parent size with padding.
     * transform.fill(10, 10);
     */
    fill(padx, pady) {
        this.pos.x = padx;
        this.pos.y = pady;
        this.size.x = this.parent.size.x - padx * 2;
        this.size.y = this.parent.size.y - pady * 2;
    }
    
}