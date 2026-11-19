import { Component } from "../components/component.js";

/**
 * Validates finite number.
 * @param {number} value
 * @param {string} name
 * @returns {number}
 */
function finiteNumber(value, name) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`${name} must be a finite number`);
    }
    return value;
}

/**
 * Validates non-empty string.
 * @param {string} value
 * @param {string} name
 * @returns {string}
 */
function nonEmptyString(value, name) {
    if (typeof value !== "string" || !value.trim()) {
        throw new TypeError(`${name} must be a non-empty string`);
    }
    return value.trim();
}

/**
 * Represents a single audio bus node in a hierarchical mixing tree.
 */
export class AudioBus {
    /**
     * @param {string} name
     * @param {Object} [config]
     * @param {AudioBus} [config.parent=null]
     * @param {number} [config.volume=1.0]
     * @param {boolean} [config.muted=false]
     */
    constructor(name, { parent = null, volume = 1.0, muted = false } = {}) {
        this.name = nonEmptyString(name, "bus name");
        this.parent = parent;
        this.volume = Math.max(0, Math.min(1, finiteNumber(volume, "volume")));
        this.muted = Boolean(muted);
    }

    /**
     * Compute composed effective volume through the ancestor chain.
     * If this bus or any ancestor is muted, effective volume is 0.0.
     * @returns {number} Composed volume in range [0, 1]
     */
    getEffectiveVolume() {
        if (this.muted) return 0;
        if (!this.parent) return this.volume;
        return this.volume * this.parent.getEffectiveVolume();
    }

    /**
     * Check if this bus or any of its parents is muted.
     * @returns {boolean}
     */
    isEffectivelyMuted() {
        if (this.muted) return true;
        if (!this.parent) return false;
        return this.parent.isEffectivelyMuted();
    }
}

/**
 * Hierarchical audio bus mixer managing master, music, sfx, and UI channels
 * with composed gain calculation, volume clamping, and preference persistence.
 */
export class AudioBusSystem extends Component {
    constructor() {
        super();
        this.buses = new Map();
        this.listeners = new Set();

        // Create standard hierarchy: master -> music, sfx, ui
        this.createBus("master", { parent: null, volume: 1.0, muted: false });
        this.createBus("music", { parent: "master", volume: 0.8, muted: false });
        this.createBus("sfx", { parent: "master", volume: 1.0, muted: false });
        this.createBus("ui", { parent: "master", volume: 0.9, muted: false });
    }

    /**
     * Add change listener.
     * @param {Function} listener
     * @returns {Function} Unsubscribe
     */
    onBusChanged(listener) {
        if (typeof listener !== "function") throw new TypeError("Listener must be a function");
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    _emit(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    /**
     * Create or retrieve an audio bus.
     * @param {string} name
     * @param {Object} [config]
     * @param {string|AudioBus} [config.parent="master"]
     * @param {number} [config.volume=1.0]
     * @param {boolean} [config.muted=false]
     * @returns {AudioBus}
     */
    createBus(name, { parent = "master", volume = 1.0, muted = false } = {}) {
        nonEmptyString(name, "name");
        let parentBus = null;
        if (parent) {
            parentBus = typeof parent === "string" ? this.buses.get(parent) ?? null : parent;
        }

        const bus = new AudioBus(name, { parent: parentBus, volume, muted });
        this.buses.set(name, bus);
        return bus;
    }

    /**
     * Get audio bus by name. Throws if missing.
     * @param {string} name
     * @returns {AudioBus}
     */
    getBus(name) {
        nonEmptyString(name, "name");
        if (!this.buses.has(name)) {
            throw new Error(`Audio bus "${name}" not found`);
        }
        return this.buses.get(name);
    }

    /**
     * Set volume for a bus, clamped strictly between 0 and 1.
     * Throws if volume is not a finite number.
     * @param {string} name
     * @param {number} volume
     */
    setVolume(name, volume) {
        finiteNumber(volume, "volume");
        const bus = this.getBus(name);
        bus.volume = Math.max(0, Math.min(1, volume));
        this._emit({ type: "volume", bus: name, volume: bus.volume, effective: bus.getEffectiveVolume() });
    }

    /**
     * Set mute state for a bus.
     * @param {string} name
     * @param {boolean} muted
     */
    setMuted(name, muted) {
        const bus = this.getBus(name);
        bus.muted = Boolean(muted);
        this._emit({ type: "mute", bus: name, muted: bus.muted, effective: bus.getEffectiveVolume() });
    }

    /**
     * Toggle mute state for a bus.
     * @param {string} name
     * @returns {boolean} New mute state
     */
    toggleMute(name) {
        const bus = this.getBus(name);
        this.setMuted(name, !bus.muted);
        return bus.muted;
    }

    /**
     * Get composed effective volume for a bus.
     * If the bus or any of its parents is muted, returns 0.0.
     * @param {string} name
     * @returns {number}
     */
    getEffectiveVolume(name) {
        return this.getBus(name).getEffectiveVolume();
    }

    /**
     * Check if a bus is muted directly or via any parent.
     * @param {string} name
     * @returns {boolean}
     */
    isMuted(name) {
        return this.getBus(name).isEffectivelyMuted();
    }

    /**
     * Export user audio preferences separately from game progress saves.
     * @returns {Object}
     */
    exportPreferences() {
        const prefs = {};
        for (const [name, bus] of this.buses.entries()) {
            prefs[name] = {
                volume: bus.volume,
                muted: bus.muted
            };
        }
        return prefs;
    }

    /**
     * Import user audio preferences. Can be called before audio unlock or scene loading.
     * @param {Object} prefs
     */
    importPreferences(prefs) {
        if (!prefs || typeof prefs !== "object") return;
        for (const [name, config] of Object.entries(prefs)) {
            if (this.buses.has(name) && config && typeof config === "object") {
                if (typeof config.volume === "number" && Number.isFinite(config.volume)) {
                    this.buses.get(name).volume = Math.max(0, Math.min(1, config.volume));
                }
                if (typeof config.muted === "boolean") {
                    this.buses.get(name).muted = config.muted;
                }
            }
        }
        this._emit({ type: "preferences-loaded" });
    }

    toJSON() {
        return this.exportPreferences();
    }

    static fromJSON(data) {
        const system = new AudioBusSystem();
        system.importPreferences(data);
        return system;
    }
}
