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

    get bodyA() {
        return this.#bodyA;
    }

    get bodyB() {
        return this.#bodyB;
    }

    get normal() {
        return this.#normal;
    }

    get depth() {
        return this.#depth;
    }

    get contactPointCount() {
        return this.#contactPointCount;
    }

    get contactPoint1() {
        return this.#contactPoint1;
    }

    get contactPoint2() {
        return this.#contactPoint2;
    }
}