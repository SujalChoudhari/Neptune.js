import { Component } from "../components/component.js";

/**
 * AABB Collider component for collision detection.
 * @class Collider
 * @extends Component
 */
export class Collider extends Component {
    /**
     * @param {number} width - Collider width.
     * @param {number} height - Collider height.
     * @param {number} offsetX - Offset from entity position.
     * @param {number} offsetY - Offset from entity position.
     */
    constructor(width = 32, height = 32, offsetX = 0, offsetY = 0) {
        super();
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.isTrigger = false;
    }

    /**
     * Get the AABB bounds based on position.
     * @param {number} x - Entity X position.
     * @param {number} y - Entity Y position.
     * @returns {{ left: number, top: number, right: number, bottom: number }}
     */
    getBounds(x, y) {
        return {
            left: x + this.offsetX,
            top: y + this.offsetY,
            right: x + this.offsetX + this.width,
            bottom: y + this.offsetY + this.height
        };
    }

    /**
     * Check AABB overlap with another collider.
     * @param {Collider} other 
     * @param {number} x1 - This entity X.
     * @param {number} y1 - This entity Y.
     * @param {number} x2 - Other entity X.
     * @param {number} y2 - Other entity Y.
     * @returns {boolean}
     */
    overlaps(other, x1, y1, x2, y2) {
        const a = this.getBounds(x1, y1);
        const b = other.getBounds(x2, y2);

        return a.left < b.right &&
            a.right > b.left &&
            a.top < b.bottom &&
            a.bottom > b.top;
    }

    /**
     * Check if a point is inside this collider.
     * @param {number} px 
     * @param {number} py 
     * @param {number} entityX 
     * @param {number} entityY 
     * @returns {boolean}
     */
    containsPoint(px, py, entityX, entityY) {
        const bounds = this.getBounds(entityX, entityY);
        return px >= bounds.left && px <= bounds.right &&
            py >= bounds.top && py <= bounds.bottom;
    }
}
