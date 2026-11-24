import { Entity } from "./entity.js";
import { Component } from "../components/component.js";

/**
 * @class DestroyQueue
 * @classdesc A queue of entities to be destroyed. 
 * This is used to prevent entities from being destroyed while they are being iterated over.
 */
export class DestroyQueue {
    static #queue = new Set();

    /**
     * Adds an entity or component to the destroy queue.
     * Note: If a component is added to the destroy queue, the entire entity will be destroyed.
     * If the component has no entity, it is destroyed immediately.
     * @param {Entity|Component} object The entity to be destroyed, or a component whose entity should be destroyed.
     * @returns {void}
     */
    static Add(object) {
        if (!object) return;
        if (object instanceof Entity) {
            if (!object._destroyed) {
                DestroyQueue.#queue.add(object);
            }
        } else if (object instanceof Component) {
            if (object.entity && !object.entity._destroyed) {
                DestroyQueue.#queue.add(object.entity);
            } else if (!object.entity && typeof object.destroy === "function") {
                object.destroy();
            }
        }
    }

    /**
     * Destroy all queued entities in FIFO order.
     * Uses a draining loop so entities queued during destruction callbacks are also processed safely.
     * @private
     */
    static destroy() {
        while (DestroyQueue.#queue.size > 0) {
            const batch = [...DestroyQueue.#queue];
            DestroyQueue.#queue.clear();
            for (const entity of batch) {
                if (entity && !entity._destroyed && typeof entity.destroy === "function") {
                    entity.destroy();
                }
            }
        }
    }

    /**
     * Clear all pending items without destroying them (e.g. for testing or scene teardown).
     */
    static clear() {
        DestroyQueue.#queue.clear();
    }

    /**
     * Returns the count of pending entities to be destroyed.
     * @type {number}
     */
    static get size() {
        return DestroyQueue.#queue.size;
    }
}
