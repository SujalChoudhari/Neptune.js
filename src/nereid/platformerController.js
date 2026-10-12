import { Component } from "../components/component.js";
import { Body } from "./body.js";

/**
 * PlatformerController handles player input for platformer movement.
 * Includes coyote time, jump buffering, and variable jump height.
 * @class PlatformerController
 * @extends Component
 */
export class PlatformerController extends Component {
    constructor() {
        super();

        // Movement
        this.moveSpeed = 300;
        this.acceleration = 2000;
        this.deceleration = 2500;

        // Jump
        this.jumpForce = 400;
        this.variableJumpMultiplier = 0.5; // Cut jump when releasing

        // Coyote time (allows jumping shortly after leaving ground)
        this.coyoteTime = 0.1; // seconds
        this.coyoteTimer = 0;

        // Jump buffer (remembers jump input before landing)
        this.jumpBufferTime = 0.1;
        this.jumpBufferTimer = 0;

        // State
        this.facingRight = true;
        this.isJumping = false;
        this._body = null;
    }

    /**
     * Move horizontally.
     * @param {number} direction - -1 for left, 1 for right, 0 for none.
     * @param {number} deltaTime 
     */
    move(direction, deltaTime) {
        if (!this._body && this.entity) {
            this._body = this.entity.GetComponent(Body);
        }
        if (!this._body) return;

        const targetSpeed = direction * this.moveSpeed;
        const speedDiff = targetSpeed - this._body.velocity.x;
        const accel = Math.abs(targetSpeed) > 0.1 ? this.acceleration : this.deceleration;
        const force = Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), accel * deltaTime);

        this._body.velocity.x += force;

        if (direction !== 0) {
            this.facingRight = direction > 0;
        }
    }

    /**
     * Request a jump. Uses coyote time and jump buffering.
     */
    jump() {
        this.jumpBufferTimer = this.jumpBufferTime;
    }

    /**
     * Release jump button (for variable jump height).
     */
    releaseJump() {
        if (!this._body) return;

        if (this.isJumping && this._body.velocity.y < 0) {
            this._body.velocity.y *= this.variableJumpMultiplier;
        }
        this.isJumping = false;
    }

    /**
     * Update controller state. Call each frame.
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        if (!this._body && this.entity) {
            this._body = this.entity.GetComponent(Body);
        }
        if (!this._body) return;

        // Coyote timer
        if (this._body.grounded) {
            this.coyoteTimer = this.coyoteTime;
            this.isJumping = false;
        } else {
            this.coyoteTimer -= deltaTime;
        }

        // Jump buffer timer
        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer -= deltaTime;
        }

        // Execute jump if conditions met
        if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
            this._body.velocity.y = -this.jumpForce;
            this.isJumping = true;
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            this._body.grounded = false;
        }
    }
}
