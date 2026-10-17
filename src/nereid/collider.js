import { Component } from "../components/component.js";

/** AABB collider with explicit collision role, category/mask filtering, events, and debug drawing. */
export class Collider extends Component {
    constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) {
        super();
        if (![width, height, offsetX, offsetY].every(Number.isFinite) || width <= 0 || height <= 0) {
            throw new TypeError("Collider dimensions must be positive finite numbers and offsets must be finite");
        }
        if (!options || typeof options !== "object" || Array.isArray(options)) throw new TypeError("Collider options must be an object");
        const layer = options.layer ?? 1;
        const mask = options.mask ?? 0xffffffff;
        if (!Number.isInteger(layer) || layer <= 0 || layer > 0x7fffffff || !Number.isInteger(mask) || mask < 0 || mask > 0xffffffff) {
            throw new TypeError("Collider layer must be a positive 31-bit mask and mask must be a 32-bit mask");
        }
        const role = options.role ?? "solid";
        if (!["solid", "trigger", "hitbox", "hurtbox", "interaction", "hazard"].includes(role)) {
            throw new TypeError(`Unsupported collider role: ${role}`);
        }
        const oneWay = options.oneWay ?? null;
        if (oneWay !== null && !["up", "down", "left", "right"].includes(oneWay)) throw new TypeError("oneWay must be up, down, left, right, or null");
        const climbable = options.climbable ?? false;
        if (typeof climbable !== "boolean") throw new TypeError("climbable must be a boolean");
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.layer = layer;
        this.mask = mask >>> 0;
        this.role = role;
        this.isTrigger = role !== "solid";
        this.enabled = true;
        this.oneWay = oneWay;
        this.hazard = options.hazard ?? null;
        this.climbable = climbable;
        this._listeners = new Map();
    }

    getBounds(x, y) {
        return {
            left: x + this.offsetX,
            top: y + this.offsetY,
            right: x + this.offsetX + this.width,
            bottom: y + this.offsetY + this.height
        };
    }

    overlaps(other, x1, y1, x2, y2) {
        if (!(other instanceof Collider)) throw new TypeError("overlaps requires another Collider");
        const a = this.getBounds(x1, y1);
        const b = other.getBounds(x2, y2);
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    containsPoint(px, py, entityX, entityY) {
        if (![px, py, entityX, entityY].every(Number.isFinite)) return false;
        const bounds = this.getBounds(entityX, entityY);
        return px >= bounds.left && px <= bounds.right && py >= bounds.top && py <= bounds.bottom;
    }

    on(event, listener) {
        if (typeof event !== "string" || !event || typeof listener !== "function") throw new TypeError("Collider.on requires an event name and function");
        if (!this._listeners.has(event)) this._listeners.set(event, new Set());
        this._listeners.get(event).add(listener);
        return () => this.off(event, listener);
    }

    off(event, listener) {
        const listeners = this._listeners.get(event);
        if (!listeners) return false;
        const removed = listeners.delete(listener);
        if (listeners.size === 0) this._listeners.delete(event);
        return removed;
    }

    emit(event, payload) {
        for (const listener of [...(this._listeners.get(event) ?? [])]) listener(payload);
    }

    /** Render the world-space collider bounds for diagnostics. */
    debugDraw(ctx, x, y, color = "#ff00ff") {
        if (!ctx || typeof ctx.strokeRect !== "function") throw new TypeError("debugDraw requires a 2D canvas context");
        const bounds = this.getBounds(x, y);
        const previous = ctx.strokeStyle;
        ctx.strokeStyle = color;
        ctx.strokeRect(bounds.left, bounds.top, this.width, this.height);
        ctx.strokeStyle = previous;
    }
}

export class SolidCollider extends Collider {
    constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) { super(width, height, offsetX, offsetY, { ...options, role: "solid" }); }
}
export class TriggerCollider extends Collider {
    constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) { super(width, height, offsetX, offsetY, { ...options, role: "trigger" }); }
}
export class Hitbox extends Collider {
    constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) { super(width, height, offsetX, offsetY, { ...options, role: "hitbox" }); }
}
export class Hurtbox extends Collider {
    constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) { super(width, height, offsetX, offsetY, { ...options, role: "hurtbox" }); }
}
export class InteractionArea extends Collider {
    constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) { super(width, height, offsetX, offsetY, { ...options, role: "interaction" }); }
}
export class HazardArea extends Collider {
    constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) {
        super(width, height, offsetX, offsetY, { ...options, role: "hazard" });
        this.hazard = options.hazard ?? { damage: 1 };
        if (!this.hazard || typeof this.hazard !== "object" || Array.isArray(this.hazard)) throw new TypeError("HazardArea hazard must be an object");
    }
}
