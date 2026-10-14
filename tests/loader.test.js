import { describe, it, expect } from "./tester.js";
import { SceneLoader } from "../src/core/sceneLoader.js";
import { Scene } from "../src/core/scene.js";
import { Entity } from "../src/core/entity.js";
import { Vector2 } from "../src/math/vec2.js";
import { ComponentRegistry } from "../src/core/componentRegistry.js";
import { Transform } from "../src/components/transform.js";
import { Sprite } from "../src/rendering/sprite.js";

// Manually register components since we aren't loading neptune.js
ComponentRegistry.register("Transform", Transform);
ComponentRegistry.register("Sprite", Sprite);

describe("SceneLoader Integration", () => {
    it("should load a scene from JSON", async () => {
        // Mock fetch for the test
        const mockJson = {
            "name": "Integration Test Scene",
            "layers": [
                {
                    "name": "Main",
                    "type": "object_layer",
                    "entities": [
                        {
                            "name": "Player",
                            "transform": { "pos": { "x": 10, "y": 20 } }
                        }
                    ]
                }
            ]
        };

        // We can test 'parse' directly to avoid mocking fetch global
        const scene = SceneLoader.parse(mockJson);

        expect(scene).toBeInstanceOf(Scene);
        expect(scene.name).toBe("Integration Test Scene");

        // Find the layer
        const layer = scene.children.find(c => c.name === "Main");
        expect(layer).toBeInstanceOf(Entity);

        // Find the entity
        const player = layer.children.find(c => c.name === "Player");
        expect(player).toBeInstanceOf(Entity);

        // Check transform
        const transform = player.components.find(c => c.constructor.name === "Transform");
        expect(transform).toBeDefined();
        expect(transform.position.x).toBe(10);
        expect(transform.position.y).toBe(20);
    });

    it("restores entity and component identifiers from a versioned scene", () => {
        const scene = SceneLoader.parse({
            type: "scene",
            schemaVersion: 1,
            version: "1.0.0",
            id: "scene-stable",
            name: "Stable Scene",
            layers: [{
                name: "Main",
                type: "object_layer",
                entities: [{
                    id: "entity-stable",
                    name: "Player",
                    components: [{
                        id: "component-stable",
                        type: "Transform",
                        props: { position: { x: 4, y: 5 }, rotation: 0.5, scale: { x: 2, y: 3 } }
                    }]
                }]
            }]
        });

        const player = scene.children[0].children[0];
        expect(scene.id).toBe("scene-stable");
        expect(player.id).toBe("entity-stable");
        expect(player.components[0].id).toBe("component-stable");
        expect(player.GetComponent(Transform).position.x).toBe(4);
        expect(player.GetComponent(Transform).scale.y).toBe(3);
    });

    it("rejects unsupported scene schema versions with an actionable error", () => {
        expect(() => SceneLoader.parse({ type: "scene", schemaVersion: 99 })).toThrow(/Unsupported scene schema version/);
        expect(() => SceneLoader.parse({ type: "scene", schemaVersion: 99 })).toThrow(/Migrate the scene/);
    });
});
