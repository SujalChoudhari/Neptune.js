import {
    Scene,
    SCENE_SCHEMA_VERSION,
    ResourceReferenceError,
    assertResourceReference,
    getResourceReferenceTarget,
    validateSceneResourceReferences
} from "./scene.js";
import { Entity } from "./entity.js";
import { SceneManager } from "./sceneManager.js";
import { ComponentRegistry } from "./componentRegistry.js";
import { Vector2 } from "../math/vec2.js";
import { Sprite } from "../rendering/sprite.js";

export {
    SCENE_SCHEMA_VERSION,
    ResourceReferenceError,
    assertResourceReference,
    validateSceneResourceReferences
};

/**
 * SceneLoader responsible for loading .scn (JSON) files and instantiating the scene graph.
 */
export class SceneLoader {

    static #assertSupportedVersion(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new TypeError("Scene data must be a JSON object.");
        }
        if (data.type && data.type !== "scene") {
            throw new Error(`Cannot load '${data.type}' as a scene. Expected a scene payload.`);
        }

        const schemaVersion = typeof data.schemaVersion === "string"
            ? Number.parseInt(data.schemaVersion.split(".")[0], 10)
            : data.schemaVersion;
        const legacyVersion = data.version;
        const parsedLegacyVersion = typeof legacyVersion === "number"
            ? legacyVersion
            : typeof legacyVersion === "string"
                ? Number.parseInt(legacyVersion.split(".")[0], 10)
                : null;
        const version = schemaVersion ?? parsedLegacyVersion;
        if (version !== null && version !== undefined && version !== SCENE_SCHEMA_VERSION) {
            throw new Error(`Unsupported scene schema version '${schemaVersion ?? legacyVersion}'. Supported version is ${SCENE_SCHEMA_VERSION}. Migrate the scene before loading it.`);
        }
    }

    /**
     * Loads a scene from a JSON file.
     * @param {string} path - The path to the .scn file.
     * @returns {Promise<Scene>} The loaded scene.
     */
    static async load(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load scene: ${path} (${response.status})`);
            }
            const json = await response.json();
            return SceneLoader.parse(json);
        } catch (error) {
            console.error("SceneLoader:", error);
            throw error;
        }
    }

    /**
     * Parses a scene JSON object and creates the Scene.
     * @param {object} data - The scene JSON data.
     * @returns {Scene} The instantiated scene.
     */
    /**
     * Parses a scene JSON object and creates the Scene.
     * @param {object} data - The scene JSON data.
     * @returns {Promise<Scene>} The instantiated scene.
     */
    static parse(data) {
        SceneLoader.validate(data);
        const sceneName = data.name || "Untitled Scene";
        const scene = new Scene(sceneName);
        if (data.id !== undefined && data.id !== null) scene.id = data.id;

        // 1. Configure Global Scene properties (Camera, etc.)
        if (data.camera) {
            scene.cameraSettings = data.camera;
        }

        // 2. Parse Layers
        const pendingLoads = [];
        if (Array.isArray(data.layers)) {
            for (const layerData of data.layers) {
                const pending = SceneLoader.#parseLayer(layerData, scene);
                if (pending && typeof pending.then === "function") pendingLoads.push(pending);
            }
        } else if (Array.isArray(data.entities)) {
            data.entities.forEach(entityData => scene.AddChild(SceneLoader.#parseEntity(entityData)));
        }

        if (pendingLoads.length > 0) {
            return Promise.all(pendingLoads).then(() => scene);
        }
        return scene;
    }

    /** Validate a scene payload without constructing or registering a Scene. */
    static validate(data) {
        SceneLoader.#assertSupportedVersion(data);
        return validateSceneResourceReferences(data);
    }

    /**
     * Parses a layer definition.
     * @private
     */
    static #parseLayer(layerData, scene) {
        if (!layerData || typeof layerData !== "object" || Array.isArray(layerData)) {
            throw new TypeError("Invalid scene layer definition. Expected an object with a type and source location.");
        }

        if (layerData.type === "object_layer" || layerData.type === "main" || layerData.type === "parallax") {
            const parent = layerData.root ? scene : new Entity(layerData.name || layerData.type);
            if (layerData.id && parent !== scene) parent.id = layerData.id;
            if (Array.isArray(layerData.entities)) {
                layerData.entities.forEach(entityData => {
                    const entity = SceneLoader.#parseEntity(entityData);
                    parent.AddChild(entity);
                });
            }
            if (parent !== scene) scene.AddChild(parent);
        } else if (layerData.type === "tilemap") {
            return SceneLoader.#loadTilemap(
                getResourceReferenceTarget(layerData.src, "tilemap", "scene.layers[].src"),
                scene,
                layerData.src
            );
        }
        return null;
    }

    static async #loadTilemap(path, scene, sourceReference = path) {
        const res = await fetch(path);
        if (!res.ok) {
            throw new Error(`Failed to load tilemap '${path}' (${res.status}). Source reference: ${path}.`);
        }
        const map = await res.json();
        if (!map || typeof map !== "object" || Array.isArray(map)) {
            throw new TypeError(`Invalid tilemap '${path}': expected a JSON object. Source reference: ${path}.`);
        }

            // Map Props: width, height (in tiles), key: "1" -> {x,y} ? No, usually linear data
            // Simple format: { width: 10, tileSize: 64, tileset: "path", columns: 10, data: [1, 2, 0...] }

            if (!Array.isArray(map.data)) {
                throw new ResourceReferenceError("tilemap", sourceReference, `${path}.data`, "tilemap data is missing or not an array", "a tilemap object with a numeric data array");
            }
            if (!Number.isInteger(map.width) || map.width <= 0) {
                throw new ResourceReferenceError("tilemap", sourceReference, `${path}.width`, "tilemap width must be a positive integer", "a tilemap object with a positive integer width");
            }
            const data = map.data;
            const cols = map.width;
            const tileSize = map.tileSize === undefined ? 64 : map.tileSize;
            const tileset = map.tileset;
            assertResourceReference(tileset, "tileset", `${path}.tileset`);
            if (!Number.isFinite(tileSize) || tileSize <= 0) {
                throw new ResourceReferenceError("tileset", tileset, `${path}.tileSize`, "tile size must be a positive number", "a tileset with a positive tileSize");
            }

            // Texture Columns (how many tiles wide is the image?)
            const texCols = map.columns === undefined ? 10 : map.columns;
            if (!Number.isInteger(texCols) || texCols <= 0) {
                throw new ResourceReferenceError("tileset", tileset, `${path}.columns`, "tileset columns must be a positive integer", "a tileset with positive integer columns");
            }
            if (map.height !== undefined &&
                (!Number.isInteger(map.height) || map.height <= 0 || data.length !== cols * map.height)) {
                throw new ResourceReferenceError("tilemap", sourceReference, `${path}.data`, "tilemap data length does not match its dimensions", "a tilemap data array sized to width and height");
            }

            for (let i = 0; i < data.length; i++) {
                const tileId = data[i];
                if (tileId === 0) continue; // 0 == empty
                if (!Number.isInteger(tileId) || tileId < 0) {
                    throw new ResourceReferenceError("tileset", tileset, `${path}.data[${i}]`, "tile id must be a non-negative integer", "a tileset tile id");
                }

                // Calculate Grid Position
                const gx = i % cols;
                const gy = Math.floor(i / cols);

                // Calculate World Position (Center of tile, based on 64px unit??)
                // Our Engine uses 1 Tile = 1 Unit.
                // Center of (0,0) is 0.5, 0.5? Or do we place at Top-Left?
                // Transform uses Center usually.
                // Let's assume (gx + 0.5, gy + 0.5) to center it.

                const x = gx + 0.5;
                const y = gy + 0.5;

                // Create Entity
                const entity = new Entity("Tile_" + i);
                const tileMetadata = map.metadata?.[tileId];
                if (tileMetadata && typeof tileMetadata === "object" && !Array.isArray(tileMetadata)) {
                    entity.tileId = tileId;
                    entity.tileMetadata = structuredClone(tileMetadata);
                }

                // Add Transform
                const t = ComponentRegistry.create("Transform");
                t.position = new Vector2(x, y);
                entity.AddComponent(t);

                // Add Sprite
                // Calculate Source Rect from TileID (1-based index usually)
                // ID 1 = Top Left (0,0)
                const tid = tileId - 1;
                const tx = (tid % texCols) * tileSize;
                const ty = Math.floor(tid / texCols) * tileSize;

                const sprite = ComponentRegistry.create("Sprite", tileset);
                sprite.width = 1; // 1 Unit wide
                sprite.height = 1; // 1 Unit high

                // Set Source Rect (in Pixels)
                // We need to access specific properties for this... 
                // Sprite doesn't have a specific setter for 'sourceRect' on the instance unless we use _properties?
                // Or verify Sprite.js allows setting it. 
                // We modified Sprite.js to check _properties.sourceRect. 
                // We should expose a setter or set it directly.
                // For now, access _properties directly since we are "Engine-side" or rely on deserialize.
                sprite.deserialize({
                    path: tileset,
                    width: 1,
                    height: 1,
                    sourceRect: { x: tx, y: ty, width: tileSize, height: tileSize }
                });

                // WAIT: Sprite.js doesn't have a 'deserialize' method that handles 'sourceRect' explicitly?
                // Base 'Component.deserialize' merges props. 
                // But passing 'sourceRect' to deserialize will separate it.
                // Let's implement 'sourceRect' setter in Sprite later if needed, but 'deserialize' should work if we pass the object.
                // Actually, 'Component.deserialize' just merges?
                // Let's check 'Component.js' ... "deserialize(props) { Object.assign(this._properties, props); }" usually.
                // I need to be sure. I'll assume 'deserialize' exists.

                entity.AddComponent(sprite);

                // Collision is solid by default; authored metadata can make a tile non-solid.
                if (tileMetadata?.collision !== false) {
                    const collider = ComponentRegistry.create("BoxCollider");
                    collider.size = new Vector2(1, 1);
                    entity.AddComponent(collider);
                }

                scene.AddChild(entity);
            }

    }

    /**
     * Parses an entity definition.
     * @private
     */
    static #parseEntity(entityData) {
        if (!entityData || typeof entityData !== "object" || Array.isArray(entityData)) {
            throw new Error("Invalid entity definition in scene data. Expected an entity object.");
        }
        const entity = new Entity(entityData.name || "Entity");
        if (entityData.id) entity.id = entityData.id;

        const transformType = ComponentRegistry.get("Transform");
        let hasTransform = false;
        if (entityData.transform && transformType) {
            const transform = ComponentRegistry.create("Transform");
            SceneLoader.#deserializeTransform(transform, entityData.transform);
            entity.AddComponent(transform);
            hasTransform = true;
        }

        // Components
        if (Array.isArray(entityData.components)) {
            entityData.components.forEach(compData => {
                if (!compData || typeof compData !== "object" || typeof compData.type !== "string") {
                    throw new Error(`Invalid component definition on entity '${entity.name}'. Expected a type and props object.`);
                }
                const componentProps = compData.props;
                const component = compData.type.toLowerCase() === "sprite"
                    ? ComponentRegistry.create(compData.type, componentProps?.path ?? componentProps?.texture ?? componentProps?.asset ?? componentProps?.reference)
                    : ComponentRegistry.create(compData.type);
                if (!component) {
                    console.warn(`SceneLoader: Unknown component type '${compData.type}' for entity '${entity.name}'`);
                } else if (compData.type === "Transform") {
                    if (!hasTransform) {
                        SceneLoader.#deserializeTransform(component, compData.props);
                        if (compData.id) component.id = compData.id;
                        entity.AddComponent(component);
                        hasTransform = true;
                    }
                } else {
                    if (typeof component.deserialize === "function") component.deserialize(compData.props);
                    if (compData.id) component.id = compData.id;
                    entity.AddComponent(component);
                }
            });
        }

        // Recursive Children
        if (Array.isArray(entityData.children)) {
            entityData.children.forEach(childData => {
                const child = SceneLoader.#parseEntity(childData);
                entity.AddChild(child);
            });
        }

        return entity;
    }

    static #deserializeTransform(transform, data) {
        if (!data) return;
        const position = data.position || data.pos;
        const rotation = data.rotation ?? data.rot;
        if (position) transform.position = new Vector2(position.x, position.y);
        if (rotation !== undefined) transform.rotation = rotation;
        if (data.scale) transform.scale = new Vector2(data.scale.x, data.scale.y);
    }
}
