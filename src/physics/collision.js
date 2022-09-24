
/**
 * A Collision Manifold.
 * It contains the information related to a specific collision.
 * @class Collision
 * @property {Body} bodyA - The first body in the collision.
 * @property {Body} bodyB - The second body in the collision.
 * @property {Vector} normal - The normal of the collision.
 * @property {number} depth - The depth of the collision.
 * @property {number} contactCount - The number of contact points.
 * @property {Vector} contactPoint1 - The first contact point.
 * @property {Vector} contactPoint2 - The second contact point.
 * 
 */
export class Collision {
    #bodyA;
    #bodyB;
    #normal;
    #depth;
    #contactPointCount;
    #contactPoint1;
    #contactPoint2;
    constructor(bodyA, bodyB,
        normal, depth,
        contactPointCount, contactPoint1, contactPoint2) {

        this.#bodyA = bodyA;
        this.#bodyB = bodyB;
        this.#normal = normal;
        this.#depth = depth;
        this.#contactPointCount = contactPointCount;
        this.#contactPoint1 = contactPoint1;
        this.#contactPoint2 = contactPoint2;
    }

    /**
     * First body in the collision.
     * @type {Body}
     * @readonly
     */
    get bodyA() {
        return this.#bodyA;
    }

    /**
     * Second body in the collision.
     * @type {Body}
     * @readonly
     */
    get bodyB() {
        return this.#bodyB;
    }

    /**
     * The normal of the collision.
     * @type {Vector}
     * @readonly
     */
    get normal() {
        return this.#normal;
    }

    /**
     * The depth of the collision.
     * @type {number}
     * @readonly
     */
    get depth() {
        return this.#depth;
    }

    /**
     * The number of contact points.
     * @type {number}
     * @readonly    
     */
    get contactPointCount() {
        return this.#contactPointCount;
    }

    /**
     * The first contact point.
     * @type {Vector}
     * @readonly
     */
    get contactPoint1() {
        return this.#contactPoint1;
    }

    /**
     * The second contact point.
     * @type {Vector}
     * @readonly
     */
    get contactPoint2() {
        return this.#contactPoint2;
    }
}