import { Component } from "../components/component.js";
import { Vector2 } from "../math/vec2.js";

/**
 * Body component for physics simulation.
 * Handles velocity, gravity, and grounded state.
 * @class Body
 * @extends Component
 */
export class Body extends Component {
    constructor() {
        super();
        this.velocity = new Vector2(0, 0);
        this.gravity = 980; // pixels/s^2
        this.maxFallSpeed = 800;
        this.grounded = false;
        this.friction = 0.9;
        this.drag = 0.98;
    }

    /**
     * Apply a force to the body.
     * @param {number} x 
     * @param {number} y 
     */
    applyForce(x, y) {
        this.velocity.x += x;
        this.velocity.y += y;
    }

    /**
     * Apply an impulse (instant velocity change).
     * @param {number} x 
     * @param {number} y 
     */
    impulse(x, y) {
        this.velocity.x = x;
        this.velocity.y = y;
    }

    /**
     * Update physics.
     * @param {number} deltaTime - Time in seconds.
     */
    update(deltaTime) {
        // Apply gravity
        if (!this.grounded) {
            this.velocity.y += this.gravity * deltaTime;
            this.velocity.y = Math.min(this.velocity.y, this.maxFallSpeed);
        }

        // Apply friction when grounded
        if (this.grounded) {
            this.velocity.x *= this.friction;
        } else {
            this.velocity.x *= this.drag;
        }

        // Clamp small velocities to zero
        if (Math.abs(this.velocity.x) < 0.1) this.velocity.x = 0;
    }
}
