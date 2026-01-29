/**
 * Triton Editor - Event Bus
 * Centralized event system for inter-module communication
 */

/**
 * EventBus class for pub/sub messaging
 */
export class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler to remove
     */
    off(event, callback) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.delete(callback);
            if (handlers.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for "${event}":`, error);
                }
            });
        }

        // Also emit to wildcard listeners
        const wildcardHandlers = this.listeners.get('*');
        if (wildcardHandlers) {
            wildcardHandlers.forEach(callback => {
                try {
                    callback({ event, data });
                } catch (error) {
                    console.error('Error in wildcard event handler:', error);
                }
            });
        }
    }

    /**
     * Check if event has listeners
     * @param {string} event - Event name
     * @returns {boolean}
     */
    hasListeners(event) {
        return this.listeners.has(event) && this.listeners.get(event).size > 0;
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name (optional, removes all if not provided)
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number}
     */
    listenerCount(event) {
        const handlers = this.listeners.get(event);
        return handlers ? handlers.size : 0;
    }
}
