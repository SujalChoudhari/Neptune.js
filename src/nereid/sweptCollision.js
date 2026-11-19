import { Component } from "../components/component.js";

/**
 * Validates finite number.
 * @param {number} value
 * @param {string} name
 * @returns {number}
 */
function finiteNumber(value, name) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`${name} must be a finite number`);
    }
    return value;
}

/**
 * Continuous Swept AABB collision detection to prevent tunneling of fast-moving
 * projectiles and actors through thin walls or across long timesteps.
 */
export class SweptAABB {
    /**
     * Compute swept AABB collision between a moving box and a static target box.
     * Uses Minkowski sum raycast against the expanded target box.
     *
     * @param {Object} movingBox Moving entity bounds { left, right, top, bottom }
     * @param {number} dx Displacement in X
     * @param {number} dy Displacement in Y
     * @param {Object} staticBox Obstacle bounds { left, right, top, bottom }
     * @returns {Object} { hit: boolean, toi: number, normal: {x: number, y: number}, contactPoint: {x: number, y: number} }
     */
    static sweepBoxAgainstBox(movingBox, dx, dy, staticBox) {
        finiteNumber(dx, "dx");
        finiteNumber(dy, "dy");

        const boxWidth = movingBox.right - movingBox.left;
        const boxHeight = movingBox.bottom - movingBox.top;

        // Expanded target box by half-extents of the moving box
        const expandedLeft = staticBox.left - (boxWidth / 2);
        const expandedRight = staticBox.right + (boxWidth / 2);
        const expandedTop = staticBox.top - (boxHeight / 2);
        const expandedBottom = staticBox.bottom + (boxHeight / 2);

        // Center of moving box
        const rayOriginX = (movingBox.left + movingBox.right) / 2;
        const rayOriginY = (movingBox.top + movingBox.bottom) / 2;

        // Check if moving box center is already inside expanded box (overlapping spawn)
        if (rayOriginX >= expandedLeft && rayOriginX <= expandedRight &&
            rayOriginY >= expandedTop && rayOriginY <= expandedBottom) {
            return {
                hit: true,
                toi: 0,
                normal: { x: 0, y: 0 },
                contactPoint: { x: rayOriginX, y: rayOriginY }
            };
        }

        let nearTimeX = -Infinity;
        let farTimeX = Infinity;
        let normalX = 0;

        if (dx !== 0) {
            const invDx = 1 / dx;
            const t1 = (expandedLeft - rayOriginX) * invDx;
            const t2 = (expandedRight - rayOriginX) * invDx;

            if (t1 < t2) {
                nearTimeX = t1;
                farTimeX = t2;
                normalX = -1;
            } else {
                nearTimeX = t2;
                farTimeX = t1;
                normalX = 1;
            }
        } else {
            if (rayOriginX <= expandedLeft || rayOriginX >= expandedRight) {
                return { hit: false, toi: 1, normal: { x: 0, y: 0 }, contactPoint: null };
            }
        }

        let nearTimeY = -Infinity;
        let farTimeY = Infinity;
        let normalY = 0;

        if (dy !== 0) {
            const invDy = 1 / dy;
            const t1 = (expandedTop - rayOriginY) * invDy;
            const t2 = (expandedBottom - rayOriginY) * invDy;

            if (t1 < t2) {
                nearTimeY = t1;
                farTimeY = t2;
                normalY = -1;
            } else {
                nearTimeY = t2;
                farTimeY = t1;
                normalY = 1;
            }
        } else {
            if (rayOriginY <= expandedTop || rayOriginY >= expandedBottom) {
                return { hit: false, toi: 1, normal: { x: 0, y: 0 }, contactPoint: null };
            }
        }

        const entryTime = Math.max(nearTimeX, nearTimeY);
        const exitTime = Math.min(farTimeX, farTimeY);

        // No collision if entry happens after exit, or entry is outside [0, 1] range
        if (entryTime > exitTime || entryTime < 0 || entryTime > 1) {
            return { hit: false, toi: 1, normal: { x: 0, y: 0 }, contactPoint: null };
        }

        // Determine surface normal based on which axis was struck first
        let finalNormalX = 0;
        let finalNormalY = 0;
        if (nearTimeX > nearTimeY) {
            finalNormalX = normalX;
            finalNormalY = 0;
        } else if (nearTimeY > nearTimeX) {
            finalNormalX = 0;
            finalNormalY = normalY;
        } else {
            finalNormalX = normalX;
            finalNormalY = normalY;
        }

        const contactX = rayOriginX + (dx * entryTime);
        const contactY = rayOriginY + (dy * entryTime);

        return {
            hit: true,
            toi: entryTime,
            normal: { x: finalNormalX, y: finalNormalY },
            contactPoint: { x: contactX, y: contactY }
        };
    }

    /**
     * Cast moving box against multiple obstacles and find the earliest impact.
     * @param {Object} movingBox
     * @param {number} dx
     * @param {number} dy
     * @param {Array<Object>} staticObstacles
     * @returns {Object}
     */
    static sweepAgainstObstacles(movingBox, dx, dy, staticObstacles) {
        let earliestHit = null;
        let minToi = 1.0;

        for (const obs of staticObstacles) {
            const result = SweptAABB.sweepBoxAgainstBox(movingBox, dx, dy, obs);
            if (result.hit && result.toi <= minToi) {
                minToi = result.toi;
                earliestHit = { ...result, obstacle: obs };
            }
        }

        if (earliestHit) {
            return earliestHit;
        }

        return {
            hit: false,
            toi: 1.0,
            normal: { x: 0, y: 0 },
            contactPoint: null,
            obstacle: null
        };
    }
}

/**
 * Checks vertical height interval overlaps (elevation).
 * Prevents projectiles or actors from colliding if their elevation intervals do not overlap.
 */
export class ElevationFilter {
    /**
     * Check if two elevation intervals overlap.
     * @param {number} elevation1 Base elevation of entity 1
     * @param {number} height1 Height span of entity 1
     * @param {number} elevation2 Base elevation of entity 2
     * @param {number} height2 Height span of entity 2
     * @returns {boolean}
     */
    static overlaps(elevation1 = 0, height1 = 1, elevation2 = 0, height2 = 1) {
        const top1 = elevation1 + height1;
        const top2 = elevation2 + height2;
        return Math.max(elevation1, elevation2) < Math.min(top1, top2);
    }
}

/**
 * Manages directional knockback impulse, deceleration friction, and collision against solid walls.
 */
export class KnockbackMotor extends Component {
    /**
     * @param {Object} [config]
     * @param {number} [config.decay=8.0] Friction/decay rate per second
     * @param {number} [config.minVelocity=0.01] Threshold to stop knockback
     */
    constructor({ decay = 8.0, minVelocity = 0.01 } = {}) {
        super();
        this.decay = Math.max(0.1, decay);
        this.minVelocity = minVelocity;
        this.vx = 0;
        this.vy = 0;
        this.isActive = false;
        this.listeners = new Set();
    }

    onKnockbackEvent(listener) {
        if (typeof listener !== "function") throw new TypeError("Listener must be a function");
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    _emit(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    /**
     * Apply a directional knockback impulse.
     * @param {number} vx
     * @param {number} vy
     */
    applyImpulse(vx, vy) {
        finiteNumber(vx, "vx");
        finiteNumber(vy, "vy");
        this.vx += vx;
        this.vy += vy;
        this.isActive = true;
        this._emit({ type: "impulse", vx: this.vx, vy: this.vy });
    }

    /**
     * Step knockback displacement against solid obstacles.
     * If knockback collides into a wall, movement stops at the wall surface
     * and normal velocity is zeroed (preventing wall clipping).
     *
     * @param {number} deltaTime
     * @param {Object} currentBounds Entity bounds { left, right, top, bottom }
     * @param {Array<Object>} solidObstacles List of static { left, right, top, bottom }
     * @returns {Object} { dx: number, dy: number, hitWall: boolean }
     */
    step(deltaTime, currentBounds, solidObstacles = []) {
        finiteNumber(deltaTime, "deltaTime");
        if (!this.isActive || deltaTime <= 0) {
            return { dx: 0, dy: 0, hitWall: false };
        }

        let proposedDx = this.vx * deltaTime;
        let proposedDy = this.vy * deltaTime;

        let hitWall = false;
        if (solidObstacles.length > 0) {
            const sweep = SweptAABB.sweepAgainstObstacles(currentBounds, proposedDx, proposedDy, solidObstacles);
            if (sweep.hit) {
                hitWall = true;
                // Move up to the point of impact
                proposedDx *= sweep.toi;
                proposedDy *= sweep.toi;

                // Zero velocity along surface normal
                if (sweep.normal.x !== 0) this.vx = 0;
                if (sweep.normal.y !== 0) this.vy = 0;

                this._emit({ type: "wall-impact", normal: sweep.normal, contactPoint: sweep.contactPoint });
            }
        }

        // Apply friction decay
        const friction = Math.max(0, 1 - (this.decay * deltaTime));
        this.vx *= friction;
        this.vy *= friction;

        if (Math.hypot(this.vx, this.vy) < this.minVelocity) {
            this.vx = 0;
            this.vy = 0;
            this.isActive = false;
            this._emit({ type: "stopped" });
        }

        return {
            dx: proposedDx,
            dy: proposedDy,
            hitWall
        };
    }

    /**
     * Clear active knockback immediately.
     */
    stop() {
        this.vx = 0;
        this.vy = 0;
        this.isActive = false;
    }
}

/**
 * Manages hazard zones with periodic damage ticks and elevation awareness.
 */
export class HazardSystem {
    constructor() {
        this.zones = new Map();
        this.activeTargets = new Map(); // targetId:zoneId -> state
        this._nextId = 1;
    }

    /**
     * Register a hazard zone.
     * @param {Object} config
     * @param {Object} config.bounds { left, right, top, bottom }
     * @param {number} [config.elevation=0]
     * @param {number} [config.height=2]
     * @param {number} [config.damagePerTick=10]
     * @param {number} [config.tickInterval=0.5]
     * @param {string} [config.damageType="hazard"]
     * @returns {string} Zone ID
     */
    addZone(config) {
        if (!config || !config.bounds) throw new TypeError("Hazard zone requires bounds");
        const id = `hazard_${this._nextId++}`;
        this.zones.set(id, {
            id,
            bounds: { ...config.bounds },
            elevation: config.elevation ?? 0,
            height: config.height ?? 2,
            damagePerTick: config.damagePerTick ?? 10,
            tickInterval: config.tickInterval ?? 0.5,
            damageType: config.damageType ?? "hazard",
            enabled: true
        });
        return id;
    }

    removeZone(id) {
        return this.zones.delete(id);
    }

    /**
     * Step hazard zones against targets (combatants/entities).
     * Targets only take damage if their 2D bounds overlap AND their elevation intervals overlap.
     *
     * @param {number} deltaTime
     * @param {Array<Object>} targets Array of { id, bounds, elevation?, height?, receiveDamage }
     * @returns {Array<Object>} List of damage events applied
     */
    step(deltaTime, targets) {
        finiteNumber(deltaTime, "deltaTime");
        if (deltaTime <= 0 || !Array.isArray(targets)) return [];

        const damageEvents = [];

        for (const zone of this.zones.values()) {
            if (!zone.enabled) continue;

            for (const target of targets) {
                if (!target || !target.bounds) continue;

                // Check 2D bounding overlap
                const ox = Math.min(target.bounds.right, zone.bounds.right) - Math.max(target.bounds.left, zone.bounds.left);
                const oy = Math.min(target.bounds.bottom, zone.bounds.bottom) - Math.max(target.bounds.top, zone.bounds.top);
                const overlaps2D = ox > 0 && oy > 0;

                // Check elevation overlap
                const targetElevation = target.elevation ?? 0;
                const targetHeight = target.height ?? 2;
                const overlapsElevation = ElevationFilter.overlaps(
                    zone.elevation,
                    zone.height,
                    targetElevation,
                    targetHeight
                );

                const key = `${target.id}:${zone.id}`;

                if (overlaps2D && overlapsElevation) {
                    let state = this.activeTargets.get(key);
                    if (!state) {
                        state = { timer: 0 };
                        this.activeTargets.set(key, state);
                    }

                    state.timer += deltaTime;
                    if (state.timer >= zone.tickInterval) {
                        state.timer -= zone.tickInterval;
                        const event = {
                            targetId: target.id,
                            zoneId: zone.id,
                            damage: zone.damagePerTick,
                            damageType: zone.damageType
                        };

                        if (typeof target.receiveDamage === "function") {
                            target.receiveDamage({
                                amount: zone.damagePerTick,
                                type: zone.damageType
                            });
                        }

                        damageEvents.push(event);
                    }
                } else {
                    this.activeTargets.delete(key);
                }
            }
        }

        return damageEvents;
    }
}
