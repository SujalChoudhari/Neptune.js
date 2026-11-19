import { Component } from "../components/component.js";
import { Transform } from "../components/transform.js";

/**
 * Built-in archetype profiles with configured perception and memory budgets.
 */
export const ARCHETYPES = Object.freeze({
    sentinel: Object.freeze({
        visionRange: 350,
        fov: Math.PI * 0.5,
        hearingRadius: 120,
        alertRadius: 120,
        maxEntries: 8,
        decayRate: 0.05,
        forgetThreshold: 0
    }),
    patrol: Object.freeze({
        visionRange: 250,
        fov: Math.PI * 0.65,
        hearingRadius: 100,
        alertRadius: 100,
        maxEntries: 12,
        decayRate: 0.1,
        forgetThreshold: 0
    }),
    civilian: Object.freeze({
        visionRange: 150,
        fov: Math.PI * 0.75,
        hearingRadius: 80,
        alertRadius: 80,
        maxEntries: 4,
        decayRate: 0.25,
        forgetThreshold: 0
    }),
    boss: Object.freeze({
        visionRange: 500,
        fov: Math.PI * 0.9,
        hearingRadius: 250,
        alertRadius: 250,
        maxEntries: 25,
        decayRate: 0.02,
        forgetThreshold: 0
    })
});

/**
 * Normalize an angle into [-PI, PI].
 * @param {number} rad
 * @returns {number}
 */
export function normalizeAngle(rad) {
    let a = rad % (2 * Math.PI);
    if (a > Math.PI) a -= 2 * Math.PI;
    if (a < -Math.PI) a += 2 * Math.PI;
    return a;
}

/**
 * Safely extracts a 2D coordinate from an object, component, or entity.
 * @param {Object} obj
 * @returns {Object|null}
 */
export function extractPosition(obj) {
    if (!obj || typeof obj !== "object") return null;

    if (typeof obj.GetComponent === "function") {
        const tr = obj.GetComponent(Transform);
        if (tr && tr.position && Number.isFinite(tr.position.x) && Number.isFinite(tr.position.y)) {
            return { x: tr.position.x, y: tr.position.y };
        }
    }

    if (obj.transform) {
        const tPos = obj.transform.position ?? obj.transform;
        if (Number.isFinite(tPos.x) && Number.isFinite(tPos.y)) {
            return { x: tPos.x, y: tPos.y };
        }
    }

    if (obj.position && Number.isFinite(obj.position.x) && Number.isFinite(obj.position.y)) {
        return { x: obj.position.x, y: obj.position.y };
    }

    if (Number.isFinite(obj.x) && Number.isFinite(obj.y)) {
        return { x: obj.x, y: obj.y };
    }

    if (Array.isArray(obj) && Number.isFinite(obj[0]) && Number.isFinite(obj[1])) {
        return { x: obj[0], y: obj[1] };
    }

    return null;
}

/**
 * Safely extracts facing angle in radians from an observer.
 * @param {Object} obj
 * @returns {number}
 */
export function extractFacing(obj) {
    if (!obj || typeof obj !== "object") return 0;

    let val = obj.facing ?? obj.direction ?? obj.rotation ?? obj.angle;
    if (val === undefined && obj.transform) {
        val = obj.transform.rotation ?? obj.transform.facing ?? obj.transform.direction;
    }

    if (typeof val === "number") {
        if (Math.abs(val) > 2 * Math.PI) {
            return (val * Math.PI) / 180;
        }
        return val;
    }

    if (typeof val === "string") {
        const s = val.toLowerCase().trim();
        switch (s) {
            case "right":
            case "east":
                return 0;
            case "down-right":
            case "southeast":
                return Math.PI / 4;
            case "down":
            case "south":
                return Math.PI / 2;
            case "down-left":
            case "southwest":
                return (Math.PI * 3) / 4;
            case "left":
            case "west":
                return Math.PI;
            case "up-left":
            case "northwest":
                return (-Math.PI * 3) / 4;
            case "up":
            case "north":
                return -Math.PI / 2;
            case "up-right":
            case "northeast":
                return -Math.PI / 4;
            default: {
                const parsed = Number(s);
                if (Number.isFinite(parsed)) {
                    return Math.abs(parsed) > 2 * Math.PI ? (parsed * Math.PI) / 180 : parsed;
                }
                return 0;
            }
        }
    }

    if (val && typeof val === "object" && Number.isFinite(val.x) && Number.isFinite(val.y)) {
        if (val.x !== 0 || val.y !== 0) {
            return Math.atan2(val.y, val.x);
        }
    }

    return 0;
}

/**
 * Determines whether an entity has been destroyed or flagged as dead.
 * @param {Object} entity
 * @returns {boolean}
 */
export function isDestroyed(entity) {
    if (!entity || typeof entity !== "object") return false;
    return entity._destroyed === true || entity.destroyed === true;
}

/**
 * Tests 2D line segment intersection.
 * @param {Object} p1
 * @param {Object} p2
 * @param {Object} p3
 * @param {Object} p4
 * @returns {boolean}
 */
export function segmentIntersectsSegment(p1, p2, p3, p4) {
    const d = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (Math.abs(d) < 1e-9) return false;

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / d;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / d;

    const eps = 1e-6;
    return (ua > eps && ua < 1 - eps && ub >= 0 && ub <= 1);
}

/**
 * Tests ray segment intersection against an axis-aligned bounding box.
 * @param {Object} p1
 * @param {Object} p2
 * @param {number} left
 * @param {number} top
 * @param {number} right
 * @param {number} bottom
 * @returns {boolean}
 */
export function segmentIntersectsAABB(p1, p2, left, top, right, bottom) {
    const minX = Math.min(left, right);
    const maxX = Math.max(left, right);
    const minY = Math.min(top, bottom);
    const maxY = Math.max(top, bottom);

    if ((p1.x < minX && p2.x < minX) || (p1.x > maxX && p2.x > maxX) ||
        (p1.y < minY && p2.y < minY) || (p1.y > maxY && p2.y > maxY)) {
        return false;
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    let t0 = 0.0;
    let t1 = 1.0;

    if (Math.abs(dx) < 1e-9) {
        if (p1.x < minX || p1.x > maxX) return false;
    } else {
        let tx1 = (minX - p1.x) / dx;
        let tx2 = (maxX - p1.x) / dx;
        if (tx1 > tx2) { const tmp = tx1; tx1 = tx2; tx2 = tmp; }
        t0 = Math.max(t0, tx1);
        t1 = Math.min(t1, tx2);
        if (t0 > t1) return false;
    }

    if (Math.abs(dy) < 1e-9) {
        if (p1.y < minY || p1.y > maxY) return false;
    } else {
        let ty1 = (minY - p1.y) / dy;
        let ty2 = (maxY - p1.y) / dy;
        if (ty1 > ty2) { const tmp = ty1; ty1 = ty2; ty2 = tmp; }
        t0 = Math.max(t0, ty1);
        t1 = Math.min(t1, ty2);
        if (t0 > t1) return false;
    }

    const eps = 1e-5;
    return t1 > eps && t0 < 1.0 - eps;
}

/**
 * Tests ray segment intersection against a circle obstacle.
 * @param {Object} p1
 * @param {Object} p2
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @returns {boolean}
 */
export function segmentIntersectsCircle(p1, p2, cx, cy, radius) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-9) {
        const distSq = (p1.x - cx) ** 2 + (p1.y - cy) ** 2;
        return distSq <= radius * radius;
    }
    let t = ((cx - p1.x) * dx + (cy - p1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closeX = p1.x + t * dx;
    const closeY = p1.y + t * dy;
    const distSq = (closeX - cx) ** 2 + (closeY - cy) ** 2;
    const eps = 1e-5;
    return distSq <= radius * radius && t > eps && t < 1.0 - eps;
}

/**
 * Checks whether a line segment from p1 to p2 intersects an obstacle.
 * @param {Object} p1
 * @param {Object} p2
 * @param {Object} obstacle
 * @returns {boolean}
 */
export function rayIntersectsObstacle(p1, p2, obstacle) {
    if (!obstacle || typeof obstacle !== "object") return false;
    if (isDestroyed(obstacle)) return false;
    if (obstacle.blocksVision === false) return false;

    if (typeof obstacle.blocksLineOfSight === "function") {
        return obstacle.blocksLineOfSight(p1, p2);
    }
    if (typeof obstacle.intersectsRay === "function") {
        return obstacle.intersectsRay(p1, p2);
    }

    if (obstacle.start && obstacle.end) {
        return segmentIntersectsSegment(p1, p2, obstacle.start, obstacle.end);
    }
    if (Number.isFinite(obstacle.x1) && Number.isFinite(obstacle.y1) &&
        Number.isFinite(obstacle.x2) && Number.isFinite(obstacle.y2)) {
        return segmentIntersectsSegment(p1, p2,
            { x: obstacle.x1, y: obstacle.y1 },
            { x: obstacle.x2, y: obstacle.y2 }
        );
    }

    if (Number.isFinite(obstacle.radius) && obstacle.radius > 0) {
        const center = obstacle.center ? extractPosition(obstacle.center) : extractPosition(obstacle);
        if (center) {
            return segmentIntersectsCircle(p1, p2, center.x, center.y, obstacle.radius);
        }
    }

    let bounds = null;
    if (typeof obstacle.getBounds === "function") {
        const pos = extractPosition(obstacle) || { x: 0, y: 0 };
        bounds = obstacle.getBounds(pos.x, pos.y);
    } else if (obstacle.bounds) {
        bounds = obstacle.bounds;
    } else if (obstacle.box) {
        bounds = obstacle.box;
    } else if (Number.isFinite(obstacle.left) && Number.isFinite(obstacle.right) &&
               Number.isFinite(obstacle.top) && Number.isFinite(obstacle.bottom)) {
        bounds = obstacle;
    } else if (Number.isFinite(obstacle.width) && Number.isFinite(obstacle.height)) {
        const pos = extractPosition(obstacle) || { x: 0, y: 0 };
        bounds = {
            left: pos.x,
            top: pos.y,
            right: pos.x + obstacle.width,
            bottom: pos.y + obstacle.height
        };
    }

    if (bounds) {
        const left = bounds.left ?? bounds.x;
        const top = bounds.top ?? bounds.y;
        const right = bounds.right ?? (bounds.left !== undefined ? bounds.right : (left + (bounds.width ?? 0)));
        const bottom = bounds.bottom ?? (bounds.top !== undefined ? bounds.bottom : (top + (bounds.height ?? 0)));
        if (Number.isFinite(left) && Number.isFinite(top) && Number.isFinite(right) && Number.isFinite(bottom)) {
            return segmentIntersectsAABB(p1, p2, left, top, right, bottom);
        }
    }

    return false;
}

/**
 * PerceptionSystem calculates vision, FOV cone, line-of-sight raycasting, and hearing alert detection.
 */
export class PerceptionSystem {
    /**
     * @param {Object} [config]
     */
    constructor(config = {}) {
        this.visionRange = config.visionRange ?? 200;
        this.fov = config.fov !== undefined
            ? (config.fov > 2 * Math.PI ? (config.fov * Math.PI) / 180 : config.fov)
            : Math.PI * 0.5;
        this.hearingRadius = config.hearingRadius ?? config.alertRadius ?? 80;
        this.alertRadius = config.alertRadius ?? this.hearingRadius;
    }

    /**
     * Checks if line-of-sight from source to target is unobstructed by obstacles.
     * @param {Object} from
     * @param {Object} to
     * @param {Array} [obstacles]
     * @returns {boolean}
     */
    hasLineOfSight(from, to, obstacles = []) {
        const p1 = extractPosition(from);
        const p2 = extractPosition(to);
        if (!p1 || !p2) return false;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (dx === 0 && dy === 0) return true;

        if (!Array.isArray(obstacles) || obstacles.length === 0) return true;

        for (const obstacle of obstacles) {
            if (!obstacle || obstacle === from || obstacle === to) continue;
            if (rayIntersectsObstacle(p1, p2, obstacle)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if target is within observer's vision range.
     * @param {Object} observer
     * @param {Object} target
     * @returns {boolean}
     */
    isInVisionRange(observer, target) {
        const p1 = extractPosition(observer);
        const p2 = extractPosition(target);
        if (!p1 || !p2) return false;

        const maxRange = observer?.visionRange ?? observer?.sightRange ?? observer?.perceptionRadius ?? this.visionRange;
        const distSq = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
        return distSq <= maxRange * maxRange;
    }

    /**
     * Checks if target is within observer's field of view (FOV) cone.
     * @param {Object} observer
     * @param {Object} target
     * @returns {boolean}
     */
    isInFov(observer, target) {
        const p1 = extractPosition(observer);
        const p2 = extractPosition(target);
        if (!p1 || !p2) return false;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (dx === 0 && dy === 0) return true;

        let fov = observer?.fov ?? this.fov;
        if (fov > 2 * Math.PI) fov = (fov * Math.PI) / 180;
        if (fov >= 2 * Math.PI) return true;

        const facing = extractFacing(observer);
        const angle = Math.atan2(dy, dx);
        const diff = Math.abs(normalizeAngle(angle - facing));

        return diff <= fov / 2 + 1e-6;
    }

    /**
     * Determines whether a candidate emits sound or alert signals.
     * @param {Object} candidate
     * @returns {boolean}
     */
    isAudibleCandidate(candidate) {
        if (!candidate || typeof candidate !== "object") return false;
        if (candidate.type === "sound" || candidate.type === "noise" || candidate.type === "audio") return true;
        if (candidate.isSound === true || candidate.isAudible === true || candidate.audible === true) return true;
        if (candidate.sound === true || (typeof candidate.noise === "number" && candidate.noise > 0)) return true;
        if (typeof candidate.soundRadius === "number" && candidate.soundRadius > 0) return true;
        if (candidate.type === "alert" || candidate.isAlert === true || candidate.alert === true) return true;
        if (candidate.audibleDanger === true || candidate.dangerSound === true) return true;
        return false;
    }

    /**
     * Checks if observer can see target (in range, in cone, and LOS unobstructed).
     * @param {Object} observer
     * @param {Object} target
     * @param {Array} [obstacles]
     * @returns {boolean}
     */
    canSee(observer, target, obstacles = []) {
        if (!observer || !target) return false;
        if (isDestroyed(target)) return false;
        if (!this.isInVisionRange(observer, target)) return false;
        if (!this.isInFov(observer, target)) return false;
        return this.hasLineOfSight(observer, target, obstacles);
    }

    /**
     * Checks if observer can hear target (within hearing/alert radius and emitting sound/alert).
     * @param {Object} observer
     * @param {Object} target
     * @returns {boolean}
     */
    canHear(observer, target) {
        if (!observer || !target) return false;
        if (isDestroyed(target)) return false;

        const p1 = extractPosition(observer);
        const p2 = extractPosition(target);
        if (!p1 || !p2) return false;

        const hearingRadius = observer?.hearingRadius ?? observer?.alertRadius ?? this.hearingRadius;
        const targetRadius = target?.soundRadius ?? target?.alertRadius ?? target?.radius ?? 0;
        const maxDist = hearingRadius + targetRadius;
        const distSq = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;

        if (distSq > maxDist * maxDist) return false;
        return this.isAudibleCandidate(target);
    }

    /**
     * Filters candidate entities, returning visible and audible candidates.
     * @param {Object} observer
     * @param {Array} candidates
     * @param {Array} [obstacles]
     * @param {Object} [options]
     * @returns {Array}
     */
    observe(observer, candidates = [], obstacles = [], options = {}) {
        if (!observer || !Array.isArray(candidates) || candidates.length === 0) {
            return [];
        }

        const visibleAudible = [];
        const observations = [];

        for (const candidate of candidates) {
            if (!candidate || isDestroyed(candidate)) continue;

            const visible = this.canSee(observer, candidate, obstacles);
            const audible = this.canHear(observer, candidate);

            if (visible || audible) {
                visibleAudible.push(candidate);

                const p1 = extractPosition(observer) || { x: 0, y: 0 };
                const p2 = extractPosition(candidate) || { x: 0, y: 0 };
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                observations.push({
                    target: candidate,
                    candidate,
                    visible,
                    audible,
                    sense: visible && audible ? "both" : (visible ? "vision" : "hearing"),
                    distance: dist,
                    angle,
                    confidence: 1.0,
                    timestamp: Date.now()
                });
            }
        }

        if (options.detailed === true) {
            return observations;
        }

        Object.defineProperty(visibleAudible, "observations", {
            value: observations,
            enumerable: false,
            configurable: true
        });

        return visibleAudible;
    }
}

/**
 * Capacity-capped memory with confidence decay, expiration, and safe handling of missing entities.
 */
export class BoundedMemory {
    /**
     * @param {Object} [config]
     */
    constructor(config = {}) {
        this.maxEntries = config.maxEntries ?? 10;
        this.decayRate = config.decayRate ?? 0.1;
        this.forgetThreshold = config.forgetThreshold ?? 0;
        this.defaultConfidence = config.defaultConfidence ?? 1.0;
        this._entries = new Map();
        this._idCounter = 1;
    }

    get size() {
        return this._entries.size;
    }

    /**
     * Resolves a key for a target entity or id.
     * @param {Object|string|number} target
     * @returns {string|null}
     * @private
     */
    _getKey(target) {
        if (target === null || target === undefined) return null;
        if (typeof target === "string") return target;
        if (typeof target === "number") return String(target);
        if (typeof target === "object") {
            if (target.id !== undefined && target.id !== null) return String(target.id);
            if (target.name !== undefined && target.name !== null) return String(target.name);
            if (target.key !== undefined && target.key !== null) return String(target.key);
            if (!target.__memoryId) {
                target.__memoryId = `mem_ent_${this._idCounter++}`;
            }
            return target.__memoryId;
        }
        return null;
    }

    /**
     * Evicts one entry from memory according to eviction rules:
     * 1. Destroyed/missing targets first.
     * 2. Lowest confidence entry.
     * 3. Oldest entry when confidence ties.
     * @private
     */
    _evictOne() {
        if (this._entries.size === 0) return;

        let candidateKey = null;
        let lowestConfidence = Infinity;
        let oldestTime = Infinity;

        for (const [key, entry] of this._entries) {
            if (isDestroyed(entry.target)) {
                candidateKey = key;
                break;
            }

            const conf = entry.confidence;
            const time = entry.lastSeen ?? entry.timestamp ?? 0;

            if (conf < lowestConfidence - 1e-4) {
                lowestConfidence = conf;
                oldestTime = time;
                candidateKey = key;
            } else if (Math.abs(conf - lowestConfidence) <= 1e-4) {
                if (time < oldestTime) {
                    oldestTime = time;
                    candidateKey = key;
                }
            }
        }

        if (candidateKey !== null) {
            this._entries.delete(candidateKey);
        } else {
            const firstKey = this._entries.keys().next().value;
            if (firstKey !== undefined) this._entries.delete(firstKey);
        }
    }

    /**
     * Removes all destroyed entities currently held in memory.
     * @returns {number}
     */
    pruneDestroyed() {
        const toDelete = [];
        for (const [key, entry] of this._entries) {
            if (isDestroyed(entry.target)) {
                toDelete.push(key);
            }
        }
        for (const key of toDelete) {
            this._entries.delete(key);
        }
        return toDelete.length;
    }

    /**
     * Records or refreshes an observation record in memory.
     * @param {Object|string} target
     * @param {Object} [options]
     * @returns {Object|null}
     */
    record(target, options = {}) {
        if (!target || isDestroyed(target)) return null;
        const key = this._getKey(target);
        if (!key) return null;

        const pos = extractPosition(options.position ?? target);
        const timestamp = options.timestamp ?? Date.now();
        const confidence = options.confidence ?? this.defaultConfidence;

        if (this._entries.has(key)) {
            const entry = this._entries.get(key);
            entry.confidence = confidence;
            entry.lastSeen = timestamp;
            entry.timestamp = timestamp;
            if (pos) entry.position = pos;
            entry.target = target;
            entry.entity = target;
            if (options.sense) entry.sense = options.sense;
            if (options.data) entry.data = { ...entry.data, ...options.data };

            this._entries.delete(key);
            this._entries.set(key, entry);
            return entry;
        }

        this.pruneDestroyed();
        while (this._entries.size >= this.maxEntries) {
            this._evictOne();
        }

        const entry = {
            id: key,
            target,
            entity: target,
            position: pos ? { x: pos.x, y: pos.y } : null,
            confidence,
            lastSeen: timestamp,
            timestamp,
            sense: options.sense ?? "vision",
            decayRate: options.decayRate ?? this.decayRate,
            data: options.data ? { ...options.data } : {}
        };

        this._entries.set(key, entry);
        return entry;
    }

    /**
     * Alias for record.
     * @param {Object|string} target
     * @param {Object} [options]
     * @returns {Object|null}
     */
    remember(target, options = {}) {
        return this.record(target, options);
    }

    /**
     * Decays confidence over time and forgets expired entries.
     * @param {number} [deltaTime=1]
     */
    decay(deltaTime = 1) {
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) return;
        const toDelete = [];

        for (const [key, entry] of this._entries) {
            if (isDestroyed(entry.target)) {
                toDelete.push(key);
                continue;
            }

            const rate = entry.decayRate ?? this.decayRate;
            entry.confidence -= rate * deltaTime;

            if (entry.confidence <= this.forgetThreshold) {
                toDelete.push(key);
            }
        }

        for (const key of toDelete) {
            this._entries.delete(key);
        }
    }

    /**
     * Alias for decay.
     * @param {number} [deltaTime=1]
     */
    update(deltaTime = 1) {
        this.decay(deltaTime);
    }

    /**
     * Retrieves an entry for a target, handling destroyed and expired entities.
     * @param {Object|string} target
     * @returns {Object|null}
     */
    get(target) {
        if (!target) return null;
        const key = this._getKey(target);
        if (!key || !this._entries.has(key)) return null;

        const entry = this._entries.get(key);
        if (isDestroyed(entry.target) || entry.confidence <= this.forgetThreshold) {
            this._entries.delete(key);
            return null;
        }
        return entry;
    }

    /**
     * Returns true if target is remembered with valid confidence.
     * @param {Object|string} target
     * @returns {boolean}
     */
    has(target) {
        return this.get(target) !== null;
    }

    /**
     * Forgets a target immediately.
     * @param {Object|string} target
     * @returns {boolean}
     */
    forget(target) {
        if (!target) return false;
        const key = this._getKey(target);
        if (!key) return false;
        return this._entries.delete(key);
    }

    /**
     * Clears all memory records.
     */
    clear() {
        this._entries.clear();
    }

    /**
     * Returns all active, non-expired memory records.
     * @returns {Array}
     */
    values() {
        this.pruneDestroyed();
        const active = [];
        for (const entry of this._entries.values()) {
            if (!isDestroyed(entry.target) && entry.confidence > this.forgetThreshold) {
                active.push(entry);
            }
        }
        return active;
    }

    /**
     * Returns all active remembered entities.
     * @returns {Array}
     */
    getKnownTargets() {
        return this.values().map(e => e.target).filter(Boolean);
    }

    /**
     * Serializes memory state for save game snapshot.
     * @returns {Object}
     */
    serialize() {
        this.pruneDestroyed();
        const entries = [];
        for (const entry of this._entries.values()) {
            entries.push({
                id: entry.id,
                targetId: entry.target?.id ?? entry.id,
                position: entry.position ? { x: entry.position.x, y: entry.position.y } : null,
                confidence: entry.confidence,
                lastSeen: entry.lastSeen,
                timestamp: entry.timestamp,
                sense: entry.sense,
                decayRate: entry.decayRate,
                data: entry.data ? structuredClone(entry.data) : {}
            });
        }
        return {
            maxEntries: this.maxEntries,
            decayRate: this.decayRate,
            forgetThreshold: this.forgetThreshold,
            defaultConfidence: this.defaultConfidence,
            entries
        };
    }

    /**
     * Restores memory state from a snapshot.
     * @param {Object} snapshot
     * @param {Function} [entityResolver]
     * @returns {BoundedMemory}
     */
    restore(snapshot, entityResolver = null) {
        if (!snapshot || typeof snapshot !== "object") {
            throw new TypeError("Snapshot must be an object");
        }
        this.clear();
        if (Number.isFinite(snapshot.maxEntries)) this.maxEntries = snapshot.maxEntries;
        if (Number.isFinite(snapshot.decayRate)) this.decayRate = snapshot.decayRate;
        if (Number.isFinite(snapshot.forgetThreshold)) this.forgetThreshold = snapshot.forgetThreshold;
        if (Number.isFinite(snapshot.defaultConfidence)) this.defaultConfidence = snapshot.defaultConfidence;

        if (Array.isArray(snapshot.entries)) {
            for (const rec of snapshot.entries) {
                let target = null;
                if (typeof entityResolver === "function") {
                    target = entityResolver(rec.targetId ?? rec.id);
                }
                if (!target) {
                    target = { id: rec.targetId ?? rec.id, position: rec.position };
                }
                this._entries.set(rec.id, {
                    id: rec.id,
                    target,
                    entity: target,
                    position: rec.position ? { ...rec.position } : null,
                    confidence: rec.confidence ?? this.defaultConfidence,
                    lastSeen: rec.lastSeen ?? rec.timestamp ?? Date.now(),
                    timestamp: rec.timestamp ?? rec.lastSeen ?? Date.now(),
                    sense: rec.sense ?? "vision",
                    decayRate: rec.decayRate ?? this.decayRate,
                    data: rec.data ? structuredClone(rec.data) : {}
                });
            }
        }
        return this;
    }

    /**
     * JSON serialization support.
     * @returns {Object}
     */
    toJSON() {
        return this.serialize();
    }
}

/**
 * NPCKnowledge ties together archetype perception settings, bounded memory, and snapshot state.
 */
export class NPCKnowledge extends Component {
    static ARCHETYPES = ARCHETYPES;

    /**
     * @param {string|Object} [archetypeOrConfig="patrol"]
     * @param {Object} [overrides={}]
     */
    constructor(archetypeOrConfig = "patrol", overrides = {}) {
        super();
        let archetype = "patrol";
        let config = {};

        if (typeof archetypeOrConfig === "string") {
            archetype = archetypeOrConfig;
            config = { ...overrides };
        } else if (archetypeOrConfig && typeof archetypeOrConfig === "object") {
            if (archetypeOrConfig instanceof Component || typeof archetypeOrConfig.AddComponent === "function") {
                this.entity = archetypeOrConfig;
                if (typeof overrides === "string") {
                    archetype = overrides;
                } else if (typeof overrides === "object") {
                    archetype = overrides.archetype ?? "patrol";
                    config = { ...overrides };
                }
            } else {
                archetype = archetypeOrConfig.archetype ?? "patrol";
                config = { ...archetypeOrConfig, ...overrides };
            }
        }

        const baseProfile = NPCKnowledge.ARCHETYPES[archetype] ?? NPCKnowledge.ARCHETYPES.patrol;
        this.archetype = archetype in NPCKnowledge.ARCHETYPES ? archetype : "custom";
        this.profile = { ...baseProfile, ...config };

        this.perception = new PerceptionSystem({
            visionRange: this.profile.visionRange,
            fov: this.profile.fov,
            hearingRadius: this.profile.hearingRadius,
            alertRadius: this.profile.alertRadius
        });

        this.memory = new BoundedMemory({
            maxEntries: this.profile.maxEntries,
            decayRate: this.profile.decayRate,
            forgetThreshold: this.profile.forgetThreshold ?? 0,
            defaultConfidence: this.profile.defaultConfidence ?? 1.0
        });

        this.facts = {};
        this.state = config.state ?? "idle";
    }

    /**
     * Performs observation on candidates and records visible/audible entities into memory.
     * @param {Array} [candidates=[]]
     * @param {Array} [obstacles=[]]
     * @param {Object} [observer=null]
     * @returns {Array}
     */
    observe(candidates = [], obstacles = [], observer = null) {
        const actor = observer ?? this.entity;
        const perceived = this.perception.observe(actor, candidates, obstacles);
        for (const cand of perceived) {
            this.memory.record(cand, {
                position: extractPosition(cand),
                timestamp: Date.now()
            });
        }
        return perceived;
    }

    /**
     * Updates NPC knowledge: decays memory confidence and optionally processes observations.
     * @param {number} [deltaTime=1]
     * @param {Array} [candidates=null]
     * @param {Array} [obstacles=null]
     * @param {Object} [observer=null]
     * @returns {Array}
     */
    update(deltaTime = 1, candidates = null, obstacles = null, observer = null) {
        this.memory.decay(deltaTime);
        if (candidates && Array.isArray(candidates)) {
            return this.observe(candidates, obstacles, observer);
        }
        return [];
    }

    /**
     * Records a target into memory.
     * @param {Object|string} target
     * @param {Object} [data={}]
     * @returns {Object|null}
     */
    remember(target, data = {}) {
        return this.memory.record(target, data);
    }

    /**
     * Forgets a target from memory.
     * @param {Object|string} target
     * @returns {boolean}
     */
    forget(target) {
        return this.memory.forget(target);
    }

    /**
     * Returns all remembered entities.
     * @returns {Array}
     */
    getKnownTargets() {
        return this.memory.getKnownTargets();
    }

    /**
     * Serializes NPCKnowledge for save game snapshots.
     * @returns {Object}
     */
    serialize() {
        return {
            archetype: this.archetype,
            state: this.state,
            facts: structuredClone(this.facts),
            profile: structuredClone(this.profile),
            perception: {
                visionRange: this.perception.visionRange,
                fov: this.perception.fov,
                hearingRadius: this.perception.hearingRadius,
                alertRadius: this.perception.alertRadius
            },
            memory: this.memory.serialize()
        };
    }

    /**
     * Restores NPCKnowledge from a serialized snapshot.
     * @param {Object} snapshot
     * @param {Function} [entityResolver]
     * @returns {NPCKnowledge}
     */
    restore(snapshot, entityResolver = null) {
        if (!snapshot || typeof snapshot !== "object") throw new TypeError("Snapshot must be an object");
        if (snapshot.archetype) {
            this.archetype = snapshot.archetype;
            const baseProfile = NPCKnowledge.ARCHETYPES[this.archetype] ?? NPCKnowledge.ARCHETYPES.patrol;
            this.profile = { ...baseProfile, ...(snapshot.profile ?? {}) };
        }
        if (snapshot.state !== undefined) this.state = snapshot.state;
        if (snapshot.facts) this.facts = structuredClone(snapshot.facts);

        if (snapshot.perception) {
            if (Number.isFinite(snapshot.perception.visionRange)) this.perception.visionRange = snapshot.perception.visionRange;
            if (Number.isFinite(snapshot.perception.fov)) this.perception.fov = snapshot.perception.fov;
            if (Number.isFinite(snapshot.perception.hearingRadius)) this.perception.hearingRadius = snapshot.perception.hearingRadius;
            if (Number.isFinite(snapshot.perception.alertRadius)) this.perception.alertRadius = snapshot.perception.alertRadius;
        }

        if (snapshot.memory) {
            this.memory.restore(snapshot.memory, entityResolver);
        }
        return this;
    }

    /**
     * Creates and restores an NPCKnowledge instance from a snapshot.
     * @param {Object} snapshot
     * @param {Function} [entityResolver]
     * @returns {NPCKnowledge}
     */
    static restore(snapshot, entityResolver = null) {
        const instance = new NPCKnowledge(snapshot?.archetype ?? "patrol");
        instance.restore(snapshot, entityResolver);
        return instance;
    }

    /**
     * Populates the component properties from a data object during scene deserialization.
     * @param {Object} props
     */
    deserialize(props) {
        super.deserialize(props);
        if (props) {
            this.restore(props);
        }
    }

    /**
     * JSON serialization support.
     * @returns {Object}
     */
    toJSON() {
        return this.serialize();
    }
}
