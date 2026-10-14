
export const PROJECT_SCHEMA_VERSION = 1;
export const PROJECT_DATA_VERSION = "1.0.0";
export const SCENE_SCHEMA_VERSION = 1;
export const SCENE_DATA_VERSION = "1.0.0";

const memoryStores = {
    session: new Map(),
    persistent: new Map()
};

function getStorageArea(persistent) {
    const name = persistent ? "localStorage" : "sessionStorage";
    const area = globalThis[name];
    if (area && typeof area.getItem === "function") return area;

    const memory = persistent ? memoryStores.persistent : memoryStores.session;
    return {
        setItem(key, value) { memory.set(String(key), String(value)); },
        getItem(key) { return memory.has(String(key)) ? memory.get(String(key)) : null; },
        removeItem(key) { memory.delete(String(key)); },
        clear() { memory.clear(); }
    };
}

function parseVersion(value) {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return null;
    const major = Number.parseInt(value.split(".")[0], 10);
    return Number.isInteger(major) ? major : null;
}

function normalizeSchemaVersion(value) {
    return typeof value === "string" ? parseVersion(value) : value;
}

function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
}

function assertProjectVersion(data) {
    const version = normalizeSchemaVersion(data?.schemaVersion ?? parseVersion(data?.version));
    if (version !== null && version !== undefined && version !== PROJECT_SCHEMA_VERSION) {
        throw new Error(`Unsupported project schema version '${data.schemaVersion ?? data.version}'. Supported version is ${PROJECT_SCHEMA_VERSION}. Migrate the project before loading it.`);
    }
}

function serializeScenePayload(scene = {}) {
    const source = typeof scene.serialize === "function" ? scene.serialize() : scene;
    const payload = clone(source || {});
    payload.type = "scene";
    payload.version = SCENE_DATA_VERSION;
    payload.schemaVersion = SCENE_SCHEMA_VERSION;
    return payload;
}

/**
 * @class Storage
 * @description A class for storing data in the browser's local storage or session storage.
 * @example
 * // Set a value in the session storage
 * Storage.Set("key", "value");
 * 
 * // Get a value from the session storage
 * let value = Storage.Get("key");
 * @static
 */
export class Storage {

    /**
     * Set a value in the browser's local storage or session storage.
     * @param {string} key The key of the data to be stored.
     * @param {string} value The value of the data to be stored.
     * @param {boolean} persistent Whether the data should be stored in the local storage or session storage.
     */
    static Set(key, value, persistent = false) {
        getStorageArea(persistent).setItem(key, value);
    }

    /**
     * Get a value from the browser's local storage or session storage.
     * @param {string} key The key of the data to be retrieved.
     * @returns {string} The data stored in the browser's local storage or session storage.
     */
    static Get(key) {
        let data = getStorageArea(false).getItem(key);
        if (!data)
            data = getStorageArea(true).getItem(key);
        return data;
    }

    /**
     * Remove a value from the browser's local storage or session storage.
     * @param {string} key The key of the data to be removed.
     * @returns {string} The data stored in the browser's local storage or session storage.
     * 
     */
    static Remove(key) {
        getStorageArea(false).removeItem(key);
        getStorageArea(true).removeItem(key);
    }

    /**
     * Clear the browser's local storage or session storage.
     */
    static Clear() {
        getStorageArea(false).clear();
        getStorageArea(true).clear();
    }

    /** Store a versioned JSON value without exposing JSON parsing to callers. */
    static SetJSON(key, value, persistent = false) {
        Storage.Set(key, JSON.stringify(value), persistent);
    }

    static GetJSON(key) {
        const value = Storage.Get(key);
        if (value === null || value === undefined) return null;
        try {
            return JSON.parse(value);
        } catch (error) {
            throw new Error(`Stored value '${key}' is not valid JSON: ${error.message}`);
        }
    }

    static SerializeProject(project = {}) {
        const source = typeof project.serialize === "function" ? project.serialize() : project;
        const payload = clone(source || {});
        payload.type = "project";
        payload.version = PROJECT_DATA_VERSION;
        payload.schemaVersion = PROJECT_SCHEMA_VERSION;
        if (!Array.isArray(payload.scenes)) payload.scenes = [];
        payload.scenes = payload.scenes.map(scene => serializeScenePayload(scene));
        return payload;
    }

    static DeserializeProject(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new TypeError("Project data must be a JSON object.");
        }
        assertProjectVersion(data);
        return Storage.SerializeProject(data);
    }

    static SaveProject(key, project, persistent = false) {
        Storage.SetJSON(key, Storage.SerializeProject(project), persistent);
        return Storage.GetJSON(key);
    }

    static LoadProject(key) {
        const data = Storage.GetJSON(key);
        return data === null ? null : Storage.DeserializeProject(data);
    }

    static SaveScene(key, scene, persistent = false) {
        const payload = serializeScenePayload(scene);
        Storage.SetJSON(key, payload, persistent);
        return Storage.GetJSON(key);
    }

    static LoadScene(key) {
        const data = Storage.GetJSON(key);
        if (data === null) return null;
        const version = normalizeSchemaVersion(data.schemaVersion ?? parseVersion(data.version));
        if (version !== null && version !== undefined && version !== 1) {
            throw new Error(`Unsupported scene schema version '${data.schemaVersion ?? data.version}'. Supported version is 1. Migrate the scene before loading it.`);
        }
        return data;
    }

    static setJSON(...args) { return Storage.SetJSON(...args); }
    static getJSON(...args) { return Storage.GetJSON(...args); }
    static saveProject(...args) { return Storage.SaveProject(...args); }
    static loadProject(...args) { return Storage.LoadProject(...args); }
    static saveScene(...args) { return Storage.SaveScene(...args); }
    static loadScene(...args) { return Storage.LoadScene(...args); }

}
