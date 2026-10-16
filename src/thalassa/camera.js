import { Vector2 } from "../math/vec2.js";

/**
 * Camera for 2D viewport control.
 * Supports following targets, bounds, shake, and smoothing.
 * @class Camera
 */
export class Camera {
    constructor(viewWidth, viewHeight) {
        this.position = new Vector2(0, 0);
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;

        // Following
        this.target = null;
        this.followSpeed = 5; // Lerp speed
        this.offset = new Vector2(0, 0);
        this.lookAhead = new Vector2(0, 0);

        // Bounds
        this.bounds = null; // { minX, minY, maxX, maxY }

        // Shake
        this.shakeAmount = 0;
        this.shakeDuration = 0;
        this.shakeOffset = new Vector2(0, 0);

        // Zoom
        this.zoom = 1;
        this.transition = null;
        this.fadeAlpha = 0;
    }

    /**
     * Set the target to follow.
     * @param {Entity} target - Entity with Transform component.
     * @param {Vector2} offset - Offset from target center.
     */
    /**
     * Set the target to follow.
     * @param {Entity} target - Entity with Transform component.
     * @param {Vector2} offset - Offset from target center.
     */
    follow(target, offset = null) {
        this.target = target;
        if (offset) this.offset = offset;
    }

    /**
     * Set world bounds for the camera.
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     */
    setBounds(minX, minY, maxX, maxY) {
        this.bounds = { minX, minY, maxX, maxY };
    }

    /**
     * Clear bounds.
     */
    clearBounds() {
        this.bounds = null;
    }

    /**
     * Trigger screen shake.
     * @param {number} amount - Shake intensity in pixels.
     * @param {number} duration - Duration in seconds.
     */
    shake(amount, duration) {
        this.shakeAmount = amount;
        this.shakeDuration = duration;
    }

    /**
     * Set the zoom level of the camera.
     * @param {number} value - Zoom level. 1 is default.
     */
    setZoom(value) {
        this.zoom = value;
    }

    /** Move the camera to a world position over a fixed duration. */
    transitionTo(position, duration, { fade = false } = {}) {
        if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
            throw new TypeError("Camera transition position must have finite x and y coordinates");
        }
        if (!Number.isFinite(duration) || duration <= 0) {
            throw new RangeError("Camera transition duration must be positive");
        }
        this.transition = {
            from: new Vector2(this.position.x, this.position.y),
            to: new Vector2(position.x, position.y),
            duration,
            elapsed: 0,
            fade
        };
        this.target = null;
        this.fadeAlpha = 0;
    }

    /**
     * Update camera position.
     * @param {number} deltaTime - Time since last frame.
     */
    update(deltaTime) {
        if (!Number.isFinite(deltaTime) || deltaTime < 0) {
            throw new RangeError("Camera deltaTime must be a finite non-negative number");
        }

        if (this.transition) {
            const transition = this.transition;
            transition.elapsed = Math.min(transition.duration, transition.elapsed + deltaTime);
            const progress = transition.elapsed / transition.duration;
            this.position.x = transition.from.x + (transition.to.x - transition.from.x) * progress;
            this.position.y = transition.from.y + (transition.to.y - transition.from.y) * progress;
            this.fadeAlpha = transition.fade
                ? (progress < 0.5 ? progress * 2 : (1 - progress) * 2)
                : 0;
            if (progress >= 1) this.transition = null;
        }
        // Follow target
        if (this.target && !this.transition) {
            const Transform = this.target.GetComponent ?
                this.target.GetComponent(this.target.constructor) : null;

            // Try to get position from target
            let targetPos = null;
            if (this.target.GetComponent) {
                const transform = this.target.components?.find(c => c.position);
                if (transform) {
                    targetPos = transform.position;
                }
            }

            if (this.target.position) {
                targetPos = this.target.position;
            }

            if (targetPos) {
                const targetX = targetPos.x + this.offset.x + this.lookAhead.x;
                const targetY = targetPos.y + this.offset.y + this.lookAhead.y;

                // Smooth follow
                const t = Math.min(1, this.followSpeed * deltaTime);
                this.position.x += (targetX - this.viewWidth / 2 - this.position.x) * t;
                this.position.y += (targetY - this.viewHeight / 2 - this.position.y) * t;
            }
        }

        // Apply bounds
        if (this.bounds) {
            this.position.x = Math.max(this.bounds.minX, Math.min(this.position.x, this.bounds.maxX - this.viewWidth));
            this.position.y = Math.max(this.bounds.minY, Math.min(this.position.y, this.bounds.maxY - this.viewHeight));
        }

        // Update shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            this.shakeOffset.x = (Math.random() - 0.5) * 2 * this.shakeAmount;
            this.shakeOffset.y = (Math.random() - 0.5) * 2 * this.shakeAmount;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }
    }

    /**
     * Get the final camera X offset (including shake).
     */
    get x() {
        return this.position.x + this.shakeOffset.x;
    }

    /**
     * Get the final camera Y offset (including shake).
     */
    get y() {
        return this.position.y + this.shakeOffset.y;
    }

    /**
     * Convert screen position to world position.
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {Vector2}
     */
    screenToWorld(screenX, screenY) {
        return new Vector2(
            (screenX / (this.zoom || 1)) + this.x,
            (screenY / (this.zoom || 1)) + this.y
        );
    }

    /**
     * Convert world position to screen position.
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {Vector2}
     */
    worldToScreen(worldX, worldY) {
        return new Vector2(
            (worldX - this.x) * (this.zoom || 1),
            (worldY - this.y) * (this.zoom || 1)
        );
    }

    /**
     * Apply the camera transform to the context.
     * @param {CanvasRenderingContext2D} ctx 
     */
    apply(ctx) {
        const zoom = this.zoom || 1;
        ctx.scale(zoom, zoom);
        ctx.translate(-this.x, -this.y);
    }
}
