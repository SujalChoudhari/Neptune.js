import { Component } from "../components/component.js";
import { BoxCollider } from "../components/boxCollider.js";
import { Transform } from "../components/transform.js";
import { SceneManager } from "../core/sceneManager.js";
import { isEntityActive } from "../core/entity.js";
import { Collider } from "./collider.js";

/** Adapt the engine's legacy BoxCollider dimensions to Nereid's overlap contract. */
export function boxColliderToCollider(box, options = {}) {
    if (!(box instanceof BoxCollider)) throw new TypeError("boxColliderToCollider requires a BoxCollider");
    const { width, height } = { width: box.size?.x, height: box.size?.y };
    const offsetX = box.offset?.x ?? 0;
    const offsetY = box.offset?.y ?? 0;
    if (![width, height, offsetX, offsetY].every(Number.isFinite) || width <= 0 || height <= 0) {
        throw new TypeError("BoxCollider must have positive finite dimensions and finite offsets");
    }
    const collider = new Collider(width, height, offsetX - width / 2, offsetY - height / 2, {
        role: options.role ?? "solid",
        layer: box.layer ?? box.properties?.layer ?? 1,
        mask: box.mask ?? box.properties?.mask ?? 0xffffffff
    });
    collider.enabled = options.enabled ?? (box.enabled !== false && box.properties?.enabled !== false);
    return collider;
}

function collidersForEntity(entity) {
    const result = [];
    for (const component of entity.components ?? []) {
        if (component instanceof Collider) result.push(component);
        else if (component instanceof BoxCollider) result.push(boxColliderToCollider(component));
    }
    return result;
}

function collectSceneEntries(scene, excludedEntity) {
    const entries = [];
    const visit = entity => {
        if (!isEntityActive(entity)) return;
        if (entity !== excludedEntity) {
            const transform = entity.GetComponent?.(Transform);
            if (transform) for (const collider of collidersForEntity(entity)) entries.push({ entity, collider, x: transform.position.x, y: transform.position.y });
        }
        for (const child of entity.children ?? []) visit(child);
    };
    for (const child of scene?.children ?? []) visit(child);
    return entries;
}

/**
 * Configurable top-down movement in world units per second. Movement resolves
 * X and Y separately against solid Nereid colliders, including adapted legacy
 * BoxCollider components, and subdivides travel to prevent tunneling.
 */
export class TopDownController extends Component {
    constructor({ speed = 4, maxSubstep = 0.2, collider = null, obstacles = null } = {}) {
        super();
        if (!Number.isFinite(speed) || speed < 0) throw new TypeError("TopDownController speed must be finite and non-negative");
        if (!Number.isFinite(maxSubstep) || maxSubstep <= 0) throw new TypeError("maxSubstep must be positive and finite");
        if (collider !== null && !(collider instanceof Collider) && !(collider instanceof BoxCollider)) throw new TypeError("collider must be a Nereid Collider or BoxCollider");
        if (collider instanceof Collider && collider.role !== "solid") throw new TypeError("TopDownController requires a solid movement collider");
        if (obstacles !== null && !Array.isArray(obstacles)) throw new TypeError("obstacles must be an array of collider entries");
        this.speed = speed;
        this.maxSubstep = maxSubstep;
        this.collider = collider;
        this.obstacles = obstacles;
    }

    /** Move by a direction vector and elapsed seconds; returns the final position. */
    move(direction, deltaTime, obstacles = this.obstacles) {
        if (!direction || !Number.isFinite(direction.x) || !Number.isFinite(direction.y)) throw new TypeError("direction must have finite x and y");
        if (!Number.isFinite(deltaTime) || deltaTime < 0) throw new TypeError("deltaTime must be finite and non-negative");
        if (obstacles !== null && !Array.isArray(obstacles)) throw new TypeError("obstacles must be an array or null");
        const transform = this.entity?.GetComponent?.(Transform);
        if (!transform) throw new Error("TopDownController requires an entity with Transform");
        let collider = this.collider ?? collidersForEntity(this.entity).find(item => item.role === "solid") ?? null;
        if (collider instanceof BoxCollider) collider = boxColliderToCollider(collider);
        if (!(collider instanceof Collider)) collider = new Collider(0.5, 0.5, -0.25, -0.25);

        const magnitude = Math.hypot(direction.x, direction.y);
        if (magnitude === 0 || deltaTime === 0 || this.speed === 0) return { x: transform.position.x, y: transform.position.y };
        const normalized = magnitude > 1 ? { x: direction.x / magnitude, y: direction.y / magnitude } : direction;
        const dx = normalized.x * this.speed * deltaTime;
        const dy = normalized.y * this.speed * deltaTime;
        const automatic = obstacles === null ? collectSceneEntries(SceneManager.GetActiveScene(), this.entity) : null;
        const entries = obstacles ?? automatic;
        const allEntries = entries.map(entry => {
            if (entry instanceof Collider || entry instanceof BoxCollider) return { collider: entry instanceof BoxCollider ? boxColliderToCollider(entry) : entry, x: entry.entity?.GetComponent?.(Transform)?.position.x ?? 0, y: entry.entity?.GetComponent?.(Transform)?.position.y ?? 0, entity: entry.entity };
            if (!entry || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) throw new TypeError("Obstacle entries require finite x/y and a collider");
            const obstacle = entry.collider instanceof BoxCollider ? boxColliderToCollider(entry.collider) : entry.collider;
            if (!(obstacle instanceof Collider)) throw new TypeError("Obstacle entries require a Nereid Collider or BoxCollider");
            return { ...entry, collider: obstacle };
        }).filter(entry => entry.collider.enabled && entry.collider.role === "solid" && entry.entity !== this.entity
            && isEntityActive(entry.entity ?? entry.collider.entity)
            && (((collider.mask & entry.collider.layer) >>> 0) !== 0)
            && (((entry.collider.mask & collider.layer) >>> 0) !== 0));

        const maxStep = Math.min(this.maxSubstep, collider.width / 2, collider.height / 2);
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep));
        if (steps > 256) throw new RangeError("TopDownController movement exceeds the safe 256-substep limit");
        const stepX = dx / steps, stepY = dy / steps;
        let x = transform.position.x, y = transform.position.y;
        const overlaps = (candidateX, candidateY) => allEntries.some(entry =>
            collider.overlaps(entry.collider, candidateX, candidateY, entry.x, entry.y));

        for (let index = 0; index < steps; index++) {
            const nextX = x + stepX;
            if (!overlaps(nextX, y)) x = nextX;
            const nextY = y + stepY;
            if (!overlaps(x, nextY)) y = nextY;
        }
        transform.position.x = x;
        transform.position.y = y;
        return { x, y };
    }
}
