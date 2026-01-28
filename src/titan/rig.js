import { Component } from "../components/component.js";
import { Transform } from "../components/transform.js";

/**
 * Rig component manages a limb hierarchy for skeletal animation.
 * Attaches to the root entity of a character and maps child entities as limbs.
 * @class Rig
 * @extends Component
 */
export class Rig extends Component {
    constructor() {
        super();
        this.limbMap = {}; // { limbName: Entity }
    }

    /**
     * Register a child entity as a limb.
     * @param {string} name - Limb name (e.g., "LegL", "ArmR").
     * @param {Entity} entity - The child entity representing this limb.
     * @returns {Rig} This rig (for chaining).
     */
    addLimb(name, entity) {
        this.limbMap[name] = entity;
        return this;
    }

    /**
     * Get a limb entity by name.
     * @param {string} name - Limb name.
     * @returns {Entity|null}
     */
    getLimb(name) {
        return this.limbMap[name] || null;
    }

    /**
     * Get all registered limb names.
     * @returns {string[]}
     */
    getLimbNames() {
        return Object.keys(this.limbMap);
    }

    /**
     * Apply a pose to all limbs.
     * @param {Pose} pose - The pose to apply.
     */
    applyPose(pose) {
        for (const limbName of pose.getLimbNames()) {
            const limbEntity = this.getLimb(limbName);
            if (!limbEntity) continue;

            const transform = limbEntity.GetComponent(Transform);
            if (!transform) continue;

            const limbData = pose.getLimb(limbName);

            // Apply rotation
            if (limbData.rotation !== undefined) {
                transform.rotation = limbData.rotation;
            }

            // Apply position offset if specified
            if (limbData.position) {
                transform.position.x = limbData.position.x;
                transform.position.y = limbData.position.y;
            }

            // Apply scale if specified
            if (limbData.scale) {
                transform.scale.x = limbData.scale.x;
                transform.scale.y = limbData.scale.y;
            }
        }
    }

    /**
     * Auto-discover limbs from child entities.
     * Uses entity names as limb names.
     */
    autoDiscover() {
        if (!this.entity) return;

        const children = this.entity.GetChildren();
        for (const child of children) {
            if (child.name && child.HasComponent(Transform)) {
                this.addLimb(child.name, child);
            }
        }
    }
}
