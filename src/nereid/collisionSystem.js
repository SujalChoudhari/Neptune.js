import { Collider } from "./collider.js";
import { isEntityActive } from "../core/entity.js";

/** Deterministic AABB broadphase for solid, trigger, combat, hazard, and interaction colliders. */
export class CollisionSystem {
    /** Determine whether a moving AABB crossed the allowed face of a one-way collider. */
    static canResolveOneWay(surface, surfaceBounds, previous, current) {
        if (!(surface instanceof Collider) || !surface.oneWay) return true;
        const bounds = [surfaceBounds, previous, current];
        if (bounds.some(box => !box || ![box.left, box.top, box.right, box.bottom].every(Number.isFinite))) {
            throw new TypeError("One-way resolution requires finite surface, previous, and current AABB bounds");
        }
        if (current.left >= surfaceBounds.right || current.right <= surfaceBounds.left ||
            current.top >= surfaceBounds.bottom || current.bottom <= surfaceBounds.top) return false;
        switch (surface.oneWay) {
            case "up": return previous.bottom <= surfaceBounds.top && current.bottom > surfaceBounds.top;
            case "down": return previous.top >= surfaceBounds.bottom && current.top < surfaceBounds.bottom;
            case "left": return previous.right <= surfaceBounds.left && current.right > surfaceBounds.left;
            case "right": return previous.left >= surfaceBounds.right && current.left < surfaceBounds.right;
            default: return true;
        }
    }

    constructor() {
        this._pairs = new Map();
        this._ids = new WeakMap();
        this._nextId = 1;
        this._listeners = new Map();
    }

    on(event, listener) {
        if (typeof event !== "string" || !event || typeof listener !== "function") throw new TypeError("CollisionSystem.on requires an event name and function");
        if (!this._listeners.has(event)) this._listeners.set(event, new Set());
        this._listeners.get(event).add(listener);
        return () => this._listeners.get(event)?.delete(listener);
    }

    _id(collider) {
        if (!this._ids.has(collider)) this._ids.set(collider, this._nextId++);
        return this._ids.get(collider);
    }

    _publish(type, phase, first, second) {
        const payload = { type, phase, collider: first.collider, other: second.collider, entity: first.entity ?? null, otherEntity: second.entity ?? null };
        first.collider.emit(type === "overlap" ? phase : type, payload);
        const reverseType = type === "hit" ? "hurt" : type === "hurt" ? "hit" : type;
        second.collider.emit(reverseType === "overlap" ? phase : reverseType, { ...payload, collider: second.collider, other: first.collider, entity: second.entity ?? null, otherEntity: first.entity ?? null });
        for (const listener of [...(this._listeners.get(`${type}:${phase}`) ?? [])]) listener(payload);
        for (const listener of [...(this._listeners.get(type) ?? [])]) listener(payload);
    }

    _events(a, b, phase) {
        const roles = [a.collider.role, b.collider.role];
        if (roles.includes("hitbox") && roles.includes("hurtbox")) {
            const hitbox = a.collider.role === "hitbox" ? a : b;
            const hurtbox = hitbox === a ? b : a;
            this._publish("hit", phase, hitbox, hurtbox);
        }
        if (roles.includes("hazard")) {
            const hazard = a.collider.role === "hazard" ? a : b;
            const target = hazard === a ? b : a;
            this._publish("hazard", phase, hazard, target);
        }
        if (roles.includes("interaction")) {
            const area = a.collider.role === "interaction" ? a : b;
            const target = area === a ? b : a;
            this._publish("interaction", phase, area, target);
        }
        if (roles.includes("trigger") || roles.includes("hitbox") || roles.includes("hurtbox") || roles.includes("hazard") || roles.includes("interaction")) {
            this._publish("overlap", phase, a, b);
        } else {
            this._publish("collision", phase, a, b);
        }
        if (a.collider.climbable || b.collider.climbable) this._publish("climbable", phase, a, b);
    }

    /**
     * Process collider entries in stable array order. Each entry is { collider, x, y, entity? }.
     * Returns the current overlapping pair count.
     */
    step(entries) {
        if (!Array.isArray(entries)) throw new TypeError("CollisionSystem.step requires an array");
        const active = entries.map(entry => {
            if (!entry || !(entry.collider instanceof Collider) || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
                throw new TypeError("Each collision entry requires a Collider and finite x/y coordinates");
            }
            return { ...entry, id: this._id(entry.collider) };
        }).filter(entry => entry.collider.enabled && isEntityActive(entry.entity ?? entry.collider.entity)).sort((a, b) => a.id - b.id);
        const current = new Map();
        for (let i = 0; i < active.length; i++) {
            for (let j = i + 1; j < active.length; j++) {
                const a = active[i], b = active[j];
                if (a.collider === b.collider) continue;
                if (((a.collider.mask & b.collider.layer) >>> 0) === 0 || ((b.collider.mask & a.collider.layer) >>> 0) === 0) continue;
                if (!a.collider.overlaps(b.collider, a.x, a.y, b.x, b.y)) continue;
                const key = `${a.id}:${b.id}`;
                current.set(key, [a, b]);
                this._events(a, b, this._pairs.has(key) ? "stay" : "enter");
            }
        }
        for (const [key, [a, b]] of this._pairs) {
            if (!current.has(key)) this._events(a, b, "exit");
        }
        this._pairs = current;
        return current.size;
    }
}
