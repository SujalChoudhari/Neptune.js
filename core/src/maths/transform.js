import Entity from "../basic/entity.js";
import Vector2 from "./vec2.js";

/**
 * Transform
 * ========
 * @class Transform
 * @extends Entity
 * @classdesc A Transform is a class that is used to store the position, rotation and scale of an Entity.
 * 
 * Properties:
 * @property {Vector2} pos - The position of the transform.
 * @property {Vector2} size - The scale of the transform.
 * @property {Vector2} worldPos - The world position of the transform.
 * 
 * Methods:
 * @method init() - Initializes the transform.
 * @method update(deltaTime) - Updates the transform.
 * @method draw(ctx) - Draws the transform.
 * @method calculateWorldPos() - Calculates the world position of the transform.
 * @method align(type) - Aligns the transform to the parent.
 * @method fill(padx,pady) - Fills the transform in the parent with a padding.
 */
export default class Transform extends Entity {
    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * 
     * Either:
     * @param {Vector2} kwargs.pos - The position of the transform. (Alternative to x and y)
     * @param {Vector2} kwargs.size - The scale of the transform. (Alternative to width and height)
     * @param {Number} kwargs.x - The x position of the transform.
     * @param {Number} kwargs.y - The y position of the transform.
     * @param {Number} kwargs.w - The width of the transform.
     * @param {Number} kwargs.h - The height of the transform.
     */
    constructor(kwargs) {
        super(kwargs);
        this.pos = kwargs["pos"] || new Vector2(kwargs["x"] || 0, kwargs["y"] || 0);
        this.size = kwargs["size"] || new Vector2(kwargs["w"] || 1, kwargs["h"] || 1);
        this.worldPos = new Vector2(this.pos.x, this.pos.y);
    }

    /**
     * Initializes the transform.
     */
    init() {
        this.calculateWorldPos();
    }

    /**
     * Updates the transform.
     * @param {Number} deltaTime Time since last update.
     */
    update(deltaTime) {
        this.calculateWorldPos();
        super.update(deltaTime);
    }

    /**
     * Draws the transform.
     * @param {CanvasRenderingContext2D} ctx The canvas context.
     */
    draw(ctx) {
        super.draw(ctx);
    }

    /**
     * Calculates the world position of the transform.
     */
    calculateWorldPos() {
        this.worldPos.x = this.pos.x;
        this.worldPos.y = this.pos.y;
        if (this.parent) {
            this.worldPos.x += this.parent.worldPos.x;
            this.worldPos.y += this.parent.worldPos.y;
        }
    }


    /**
     * Aligns the transform to the parent.
     * @param {string} type The type of alignment.
     * - "center" - Centers the transform in the parent Horizontally.
     * - "left" - Aligns the transform to the left of the parent.
     * - "right" - Aligns the transform to the right of the parent.
     * 
     * - "middle" - Centers the transform in the parent Vertically.
     * - "top" - Aligns the transform to the top of the parent.
     * - "bottom" - Aligns the transform to the bottom of the parent.
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
     * Fills the transform in the parent with a padding.
     * @param {Number} padx The padding on the x axis.
     * @param {Number} pady The padding on the y axis.
     */
    fill(padx, pady) {
        this.pos.x = padx;
        this.pos.y = pady;
        this.size.x = this.parent.size.x - padx * 2;
        this.size.y = this.parent.size.y - pady * 2;
    }
}