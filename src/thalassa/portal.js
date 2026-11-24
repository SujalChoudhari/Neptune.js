import { Component } from "../components/component.js";
import { Vector2 } from "../math/vec2.js";

/**
 * Registry and link resolver for chunk and scene portals.
 */
export class PortalRegistry {
    static #portals = new Map();

    static register(id, portal) {
        if (!id || typeof id !== "string") throw new TypeError("Portal ID must be a non-empty string");
        PortalRegistry.#portals.set(id, portal);
    }

    static unregister(id) {
        PortalRegistry.#portals.delete(id);
    }

    static get(id) {
        return PortalRegistry.#portals.get(id) ?? null;
    }

    static clear() {
        PortalRegistry.#portals.clear();
    }

    /**
     * Resolve destination portal and validate traversability.
     * @param {string} sourcePortalId
     * @param {object} [options]
     * @param {object} [options.inventory] - Player inventory to check keys
     * @returns {Object} Result with canTraverse, destination, and optional reason
     */
    static resolve(sourcePortalId, options = {}) {
        const source = PortalRegistry.get(sourcePortalId);
        if (!source) {
            throw new Error(`PORTAL_NOT_FOUND: Source portal '${sourcePortalId}' is not registered`);
        }

        const targetId = source.targetPortalId;
        if (!targetId) {
            throw new Error(`PORTAL_TARGET_UNDEFINED: Portal '${sourcePortalId}' has no targetPortalId configured`);
        }

        if (targetId === sourcePortalId) {
            return { canTraverse: false, destination: null, reason: "self_loop" };
        }

        const target = PortalRegistry.get(targetId);
        if (!target && !source.targetScene) {
            throw new Error(`PORTAL_DESTINATION_NOT_FOUND: Target portal '${targetId}' not found in registry`);
        }

        if (source.isLocked) {
            const hasKey = options.inventory?.hasItem ? options.inventory.hasItem(source.keyItem) : false;
            if (!hasKey) {
                return { canTraverse: false, destination: null, reason: "locked", keyItem: source.keyItem };
            }
        }

        return {
            canTraverse: true,
            destination: target ? {
                portalId: target.portalId,
                position: target.position,
                scene: target.scene || source.targetScene
            } : {
                portalId: targetId,
                scene: source.targetScene,
                position: source.targetPosition
            }
        };
    }
}

/**
 * Portal component for doorway, cave entrance, or chunk link points.
 * @class Portal
 * @extends Component
 */
export class Portal extends Component {
    constructor({ portalId = "", targetPortalId = "", targetScene = "", position = new Vector2(0, 0), isLocked = false, keyItem = "" } = {}) {
        super();
        this.portalId = portalId;
        this.targetPortalId = targetPortalId;
        this.targetScene = targetScene;
        this.position = position instanceof Vector2 ? position.Copy() : new Vector2(position?.x ?? 0, position?.y ?? 0);
        this.isLocked = Boolean(isLocked);
        this.keyItem = keyItem;

        if (portalId) {
            PortalRegistry.register(portalId, this);
        }
    }

    unlock() {
        this.isLocked = false;
    }

    lock(keyItem = "") {
        this.isLocked = true;
        if (keyItem) this.keyItem = keyItem;
    }

    destroy() {
        if (this.portalId) {
            PortalRegistry.unregister(this.portalId);
        }
        super.destroy();
    }
}
