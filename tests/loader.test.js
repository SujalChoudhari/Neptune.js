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
});
