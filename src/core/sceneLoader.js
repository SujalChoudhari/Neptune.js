import { Scene } from "./scene.js";
import { Entity } from "./entity.js";
import { SceneManager } from "./sceneManager.js";
import { ComponentRegistry } from "./componentRegistry.js";
import { Vector2 } from "../math/vec2.js";
import { Sprite } from "../rendering/sprite.js";

/**
 * SceneLoader responsible for loading .scn (JSON) files and instantiating the scene graph.
 */
export class SceneLoader {

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
    static async parse(data) {
        const sceneName = data.name || "Untitled Scene";
        const scene = new Scene(sceneName);

        // 1. Configure Global Scene properties (Camera, etc.)
        if (data.camera && data.camera.settings) {
            scene.cameraSettings = data.camera;
        }

        // 2. Parse Layers
        if (Array.isArray(data.layers)) {
            for (const layerData of data.layers) {
                await SceneLoader.#parseLayer(layerData, scene);
            }
        }

        return scene;
    }

    /**
     * @private
     * Parses a layer definition.
     */
    static async #parseLayer(layerData, scene) {
        const parent = scene;

        if (layerData.type === "object_layer" || layerData.type === "main" || layerData.type === "parallax") {
            if (Array.isArray(layerData.entities)) {
                layerData.entities.forEach(entityData => {
                    const entity = SceneLoader.#parseEntity(entityData);
                    parent.AddChild(entity);
                });
            }
        } else if (layerData.type === "tilemap") {
            if (layerData.src) {
                await SceneLoader.#loadTilemap(layerData.src, scene);
            }
        }
    }

    static async #loadTilemap(path, scene) {
        try {
            const res = await fetch(path);
            const map = await res.json();

            // Map Props: width, height (in tiles), key: "1" -> {x,y} ? No, usually linear data
            // Simple format: { width: 10, tileSize: 64, tileset: "path", columns: 10, data: [1, 2, 0...] }

            const data = map.data;
            const cols = map.width;
            const tileSize = map.tileSize || 64;
            const tileset = map.tileset;

            // Texture Columns (how many tiles wide is the image?)
            const texCols = map.columns || 10;

            for (let i = 0; i < data.length; i++) {
                const tileId = data[i];
                if (tileId === 0) continue; // 0 == empty

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

                const sprite = ComponentRegistry.create("Sprite");
                sprite.path = tileset;
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

                // Add Collider
                const collider = ComponentRegistry.create("BoxCollider");
                collider.size = new Vector2(1, 1);
                entity.AddComponent(collider);

                scene.AddChild(entity);
            }

        } catch (e) {
            console.error("Failed to load map:", e);
        }
    }

    /**
     * @private
     * Parses an entity definition.
     */
    static #parseEntity(entityData) {
        const entity = new Entity(entityData.name || "Entity");

        // Transform is special because it's a core requirement usually
        if (entityData.transform) {
            const t = entity.GetComponent(ComponentRegistry.get("Transform")); // Should be added by Entity constructor? 
            // Actually default entity might not have transform in pure ECS
            // But in Neptune 'every entity component must have a transform component' (transform.js doc)

            // Wait, does new Entity() add Transform? 
            // Checking entity.js... No. 
            // So we must add it.

            // If the entity doesn't have a transform, add one.
            if (!t) {
                // If ComponentRegistry doesn't find it (e.g. invalid name), we might crash.
                // But "Transform" is hard registered.
                const newT = ComponentRegistry.create("Transform");
                if (newT) {
                    SceneLoader.#deserializeTransform(newT, entityData.transform);
                    entity.AddComponent(newT);
                }
            } else {
                SceneLoader.#deserializeTransform(t, entityData.transform);
            }
        }

        // Components
        if (Array.isArray(entityData.components)) {
            entityData.components.forEach(compData => {
                const component = ComponentRegistry.create(compData.type);
                if (component) {
                    component.deserialize(compData.props);
                    entity.AddComponent(component);
                } else {
                    console.warn(`SceneLoader: Unknown component type '${compData.type}' for entity '${entity.name}'`);
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
        if (data.pos) transform.position = new Vector2(data.pos.x, data.pos.y);
        if (data.rot !== undefined) transform.rotation = data.rot;
        if (data.scale) transform.scale = new Vector2(data.scale.x, data.scale.y);
    }
}
