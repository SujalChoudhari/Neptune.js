import { Scene } from "./scene.js";
import { Entity } from "./entity.js";
import { SceneManager } from "./sceneManager.js";
import { ComponentRegistry } from "./componentRegistry.js";
import { Vector2 } from "../math/vec2.js";

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
    static parse(data) {
        const sceneName = data.name || "Untitled Scene";
        const scene = new Scene(sceneName);

        // 1. Configure Global Scene properties (Camera, etc.)
        // Note: SceneManager might need updates to handle camera per-scene via data
        if (data.camera && data.camera.bounds) {
            // For now, we assume a Camera system that might read from the active scene,
            // or we attach a CameraBounds component to the scene root?
            // Since Scene extends Entity, we can attach components to it!
            // Let's store it in properties for now or a dedicated Camera component?
            scene.cameraSettings = data.camera;
        }

        // 2. Parse Layers
        if (Array.isArray(data.layers)) {
            data.layers.forEach(layerData => {
                SceneLoader.#parseLayer(layerData, scene);
            });
        }

        return scene;
    }

    /**
     * @private
     * Parses a layer definition.
     */
    static #parseLayer(layerData, scene) {
        // Create a root entity for the layer to keep hierarchy clean
        const layerEntity = new Entity(layerData.name || "Layer");
        scene.AddChild(layerEntity);

        if (layerData.type === "object_layer" || layerData.type === "main") { // "main" from SRS
            if (Array.isArray(layerData.entities)) {
                layerData.entities.forEach(entityData => {
                    const entity = SceneLoader.#parseEntity(entityData);
                    layerEntity.AddChild(entity);
                });
            }
        } else if (layerData.type === "tilemap") {
            // TODO: Instantiate Tilemap Entity/Component
            // const tilemap = new Entity("Tilemap");
            // tilemap.AddComponent(ComponentRegistry.create("TilemapRenderer", layerData));
            // layerEntity.AddChild(tilemap);
        } else if (layerData.type === "parallax") {
            // TODO: Instantiate Parallax Entity/Component
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
