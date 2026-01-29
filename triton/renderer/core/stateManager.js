/**
 * Triton Editor - State Manager
 * Centralized reactive state management
 */

/**
 * StateManager class for centralized state with subscriptions
 */
export class StateManager {
    constructor() {
        this.state = {
            project: null,
            currentScene: null,
            selectedEntities: [],
            tool: 'select',
            layers: [],
            activeLayer: null,
            zoom: 1,
            pan: { x: 0, y: 0 }
        };

        /** @type {Map<string, Set<Function>>} */
        this.subscribers = new Map();
    }

    /**
     * Get a value from state by dot-notation path
     * @param {string} path - Path like "project.name"
     * @returns {*} Value at path
     */
    get(path) {
        if (!path) return this.state;

        const keys = path.split('.');
        let value = this.state;

        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[key];
        }

        return value;
    }

    /**
     * Set a value in state by dot-notation path
     * @param {string} path - Path like "project.name"
     * @param {*} value - Value to set
     */
    set(path, value) {
        if (!path) {
            throw new Error('Path is required');
        }

        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;

        for (const key of keys) {
            if (target[key] === undefined) {
                target[key] = {};
            }
            target = target[key];
        }

        const oldValue = target[lastKey];
        target[lastKey] = value;

        // Notify subscribers
        this.notify(path, value, oldValue);
    }

    /**
     * Subscribe to state changes at a path
     * @param {string} path - Path to watch
     * @param {Function} callback - Handler (newValue, oldValue)
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        this.subscribers.get(path).add(callback);

        // Return unsubscribe function
        return () => {
            const subs = this.subscribers.get(path);
            if (subs) {
                subs.delete(callback);
                if (subs.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }

    /**
     * Notify subscribers of a change
     * @param {string} path - Changed path
     * @param {*} newValue - New value
     * @param {*} oldValue - Old value
     */
    notify(path, newValue, oldValue) {
        // Notify exact path subscribers
        const exactSubs = this.subscribers.get(path);
        if (exactSubs) {
            exactSubs.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`Error in state subscriber for "${path}":`, error);
                }
            });
        }

        // Notify parent path subscribers
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            const parentSubs = this.subscribers.get(parentPath);
            if (parentSubs) {
                const parentValue = this.get(parentPath);
                parentSubs.forEach(callback => {
                    try {
                        callback(parentValue, null);
                    } catch (error) {
                        console.error(`Error in state subscriber for "${parentPath}":`, error);
                    }
                });
            }
        }

        // Notify root subscribers
        const rootSubs = this.subscribers.get('*');
        if (rootSubs) {
            rootSubs.forEach(callback => {
                try {
                    callback({ path, newValue, oldValue });
                } catch (error) {
                    console.error('Error in root state subscriber:', error);
                }
            });
        }
    }

    /**
     * Update multiple state values at once
     * @param {Object} updates - Object with path:value pairs
     */
    batch(updates) {
        for (const [path, value] of Object.entries(updates)) {
            this.set(path, value);
        }
    }

    /**
     * Get a snapshot of the entire state
     * @returns {Object} Deep copy of state
     */
    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.state = {
            project: null,
            currentScene: null,
            selectedEntities: [],
            tool: 'select',
            layers: [],
            activeLayer: null,
            zoom: 1,
            pan: { x: 0, y: 0 }
        };
        this.notify('*', this.state, null);
    }
}
