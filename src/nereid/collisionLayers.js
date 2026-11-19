import { Collider } from "./collider.js";
import { isEntityActive } from "../core/entity.js";

/**
 * Built-in standard collision layer flags for 2D bitmask filtering.
 */
export const CollisionLayers = Object.freeze({
    NONE: 0,
    DEFAULT: 1 << 0,       // 1
    PLAYER: 1 << 1,        // 2
    ENEMY: 1 << 2,         // 4
    TERRAIN: 1 << 3,       // 8
    PROJECTILE: 1 << 4,    // 16
    TRIGGER: 1 << 5,       // 32
    HAZARD: 1 << 6,        // 64
    INTERACTION: 1 << 7,   // 128
    ITEM: 1 << 8,          // 256
    NPC: 1 << 9,           // 512
    ALL: 0xFFFFFFFF
});

/**
 * Create a bitmask from multiple layer bit flags.
 * @param {...number} layers
 * @returns {number}
 */
export function createCollisionMask(...layers) {
    let mask = 0;
    for (const layer of layers) {
        if (Number.isInteger(layer)) {
            mask |= layer;
        }
    }
    return mask >>> 0;
}

/**
 * Checks whether two collision layers/masks match according to symmetric or asymmetric rules.
 * In symmetric mode, both A must mask B and B must mask A.
 * In asymmetric mode, evaluates whether candidate A detects candidate B: (maskA & layerB) !== 0.
 * @param {number} layerA
 * @param {number} maskA
 * @param {number} layerB
 * @param {number} maskB
 * @param {Object} [options]
 * @param {boolean} [options.symmetric=true]
 * @returns {boolean}
 */
export function canLayersCollide(layerA, maskA, layerB, maskB, { symmetric = true } = {}) {
    const aDetectsB = ((maskA & layerB) >>> 0) !== 0;
    if (!symmetric) {
        return aDetectsB;
    }
    const bDetectsA = ((maskB & layerA) >>> 0) !== 0;
    return aDetectsB && bDetectsA;
}

/**
 * Resolves static and dynamic solid collisions, calculating Minimum Translation Vectors (MTV),
 * penetration depths, contact normals, and corner sliding.
 */
export class ContactSolver {
    /**
     * Compute AABB intersection and separation normal/depth between box A and box B.
     * @param {Object} boundsA { left, right, top, bottom }
     * @param {Object} boundsB { left, right, top, bottom }
     * @returns {Object|null} Collision contact or null if no overlap
     */
    static getAABBContact(boundsA, boundsB) {
        const ox = Math.min(boundsA.right, boundsB.right) - Math.max(boundsA.left, boundsB.left);
        const oy = Math.min(boundsA.bottom, boundsB.bottom) - Math.max(boundsA.top, boundsB.top);

        if (ox <= 0 || oy <= 0) return null;

        const centerAX = (boundsA.left + boundsA.right) / 2;
        const centerAY = (boundsA.top + boundsA.bottom) / 2;
        const centerBX = (boundsB.left + boundsB.right) / 2;
        const centerBY = (boundsB.top + boundsB.bottom) / 2;

        let normalX = 0;
        let normalY = 0;
        let depth = 0;

        if (ox < oy) {
            depth = ox;
            normalX = centerAX < centerBX ? -1 : 1;
        } else if (oy < ox) {
            depth = oy;
            normalY = centerAY < centerBY ? -1 : 1;
        } else {
            // Corner tie: resolve along shallower axis or primary velocity
            depth = ox;
            normalX = centerAX < centerBX ? -1 : 1;
            normalY = centerAY < centerBY ? -1 : 1;
            // Normalize normal vector
            const len = Math.hypot(normalX, normalY);
            normalX /= len;
            normalY /= len;
        }

        return {
            overlap: true,
            depth,
            overlapX: ox,
            overlapY: oy,
            normal: { x: normalX, y: normalY },
            separation: { x: normalX * depth, y: normalY * depth }
        };
    }

    /**
     * Separate an actor overlapping one or more static solid obstacles (e.g. overlapping spawn).
     * @param {Object} actorBounds { left, right, top, bottom }
     * @param {Array<Object>} obstacleBoundsList Array of { left, right, top, bottom }
     * @param {number} [maxIterations=8]
     * @returns {Object} { x: number, y: number, resolved: boolean } Displacements applied
     */
    static resolveOverlappingSpawn(actorBounds, obstacleBoundsList, maxIterations = 8) {
        let current = { ...actorBounds };
        let totalDisplacementX = 0;
        let totalDisplacementY = 0;
        let resolved = true;

        for (let iter = 0; iter < maxIterations; iter++) {
            let collisionFound = false;

            for (const obstacle of obstacleBoundsList) {
                const contact = ContactSolver.getAABBContact(current, obstacle);
                if (contact) {
                    collisionFound = true;
                    // Push actor away along contact normal
                    const pushX = contact.normal.x * (contact.overlapX + 0.001);
                    const pushY = contact.normal.y * (contact.overlapY + 0.001);

                    // Choose minimum push axis
                    if (contact.overlapX < contact.overlapY) {
                        current.left += pushX;
                        current.right += pushX;
                        totalDisplacementX += pushX;
                    } else {
                        current.top += pushY;
                        current.bottom += pushY;
                        totalDisplacementY += pushY;
                    }
                }
            }

            if (!collisionFound) {
                resolved = true;
                break;
            }
            if (iter === maxIterations - 1) {
                resolved = false;
            }
        }

        return {
            displacementX: totalDisplacementX,
            displacementY: totalDisplacementY,
            resolved
        };
    }

    /**
     * Slide movement against a contact surface normal (corner / wall sliding).
     * @param {number} vx
     * @param {number} vy
     * @param {number} normalX
     * @param {number} normalY
     * @returns {Object} { vx: number, vy: number }
     */
    static slideAlongNormal(vx, vy, normalX, normalY) {
        const dot = (vx * normalX) + (vy * normalY);
        if (dot >= 0) {
            // Velocity is already moving away from normal
            return { vx, vy };
        }
        // Project out velocity along normal: v_slide = v - (v . n) * n
        return {
            vx: vx - (dot * normalX),
            vy: vy - (dot * normalY)
        };
    }
}

/**
 * Trigger lifecycle tracker supporting enter, stay, and exit events with asymmetric mask
 * evaluation and defensive callback removal safety.
 */
export class TriggerLifecycleSystem {
    constructor({ asymmetric = true } = {}) {
        this.asymmetric = Boolean(asymmetric);
        this.activePairs = new Map(); // key -> { entryA, entryB }
        this.listeners = new Map();
        this._nextId = 1;
        this._colliderIds = new WeakMap();
    }

    _getColliderId(collider) {
        if (!this._colliderIds.has(collider)) {
            this._colliderIds.set(collider, this._nextId++);
        }
        return this._colliderIds.get(collider);
    }

    on(event, listener) {
        if (typeof event !== "string" || typeof listener !== "function") {
            throw new TypeError("on requires event name and callback function");
        }
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(listener);
        return () => this.listeners.get(event)?.delete(listener);
    }

    _publish(type, phase, entryA, entryB) {
        const payload = {
            type,
            phase,
            collider: entryA.collider,
            other: entryB.collider,
            entity: entryA.entity ?? null,
            otherEntity: entryB.entity ?? null
        };

        // Notify collider directly if emit function exists
        if (typeof entryA.collider.emit === "function") {
            entryA.collider.emit(phase, payload);
        }

        const listeners = [...(this.listeners.get(`${type}:${phase}`) ?? []), ...(this.listeners.get(phase) ?? [])];
        for (const listener of listeners) {
            try {
                listener(payload);
            } catch (err) {
                // Safeguard against user callback errors corrupting the lifecycle pipeline
                console.error("Error in trigger lifecycle listener:", err);
            }
        }
    }

    /**
     * Step the trigger lifecycle across a collection of active colliders.
     * Safely handles removal of colliders or entities during callbacks.
     * @param {Array<Object>} entries Array of { collider, x, y, entity? }
     * @returns {number} Current overlapping pair count
     */
    step(entries) {
        if (!Array.isArray(entries)) throw new TypeError("step requires an array of entries");

        // Filter valid entries defensively
        const validEntries = [];
        for (const entry of entries) {
            if (!entry || !(entry.collider instanceof Collider) || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
                continue;
            }
            if (!entry.collider.enabled) continue;
            if (entry.entity && !isEntityActive(entry.entity)) continue;

            validEntries.push({
                ...entry,
                id: this._getColliderId(entry.collider)
            });
        }

        validEntries.sort((a, b) => a.id - b.id);

        const currentPairs = new Map();

        // Detect overlaps (unordered pairs)
        for (let i = 0; i < validEntries.length; i++) {
            const a = validEntries[i];
            for (let j = i + 1; j < validEntries.length; j++) {
                const b = validEntries[j];

                // Check collision masks (asymmetric or symmetric)
                const aDetectsB = canLayersCollide(
                    a.collider.layer,
                    a.collider.mask,
                    b.collider.layer,
                    b.collider.mask,
                    { symmetric: false }
                );
                const bDetectsA = canLayersCollide(
                    b.collider.layer,
                    b.collider.mask,
                    a.collider.layer,
                    a.collider.mask,
                    { symmetric: false }
                );

                const collides = this.asymmetric ? (aDetectsB || bDetectsA) : (aDetectsB && bDetectsA);
                if (!collides) continue;

                // Check geometric overlap
                if (!a.collider.overlaps(b.collider, a.x, a.y, b.x, b.y)) continue;

                const pairKey = `${a.id}:${b.id}`;
                currentPairs.set(pairKey, [a, b]);

                const wasOverlapping = this.activePairs.has(pairKey);
                const phase = wasOverlapping ? "stay" : "enter";

                const primary = aDetectsB ? a : b;
                const secondary = primary === a ? b : a;

                this._publish(primary.collider.role ?? "trigger", phase, primary, secondary);
            }
        }

        // Detect exits (pairs present previously but not in current step)
        for (const [pairKey, [a, b]] of this.activePairs.entries()) {
            if (!currentPairs.has(pairKey)) {
                this._publish(a.collider.role ?? "trigger", "exit", a, b);
            }
        }

        this.activePairs = currentPairs;
        return currentPairs.size;
    }

    /**
     * Reset active pairs state.
     */
    clear() {
        this.activePairs.clear();
    }
}
