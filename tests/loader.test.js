import "./setup_mocks.js";
import { describe, it, expect } from "./tester.js";
import { SceneLoader } from "../src/core/sceneLoader.js";
import { Scene } from "../src/core/scene.js";
import { Entity } from "../src/core/entity.js";
import { Vector2 } from "../src/math/vec2.js";
import { ComponentRegistry } from "../src/core/componentRegistry.js";
import { Transform } from "../src/components/transform.js";
import { Sprite } from "../src/rendering/sprite.js";
import { BoxCollider } from "../src/components/boxCollider.js";

// Manually register components since we aren't loading neptune.js
ComponentRegistry.register("Transform", Transform);
ComponentRegistry.register("Sprite", Sprite);
ComponentRegistry.register("BoxCollider", BoxCollider);

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

    it("rejects a missing sprite reference with its serialized source location", () => {
        expect(() => SceneLoader.parse({
            type: "scene",
            schemaVersion: 1,
            layers: [{ type: "object_layer", entities: [{
                name: "Player",
                components: [{ type: "Sprite", props: {} }]
            }] }]
        })).toThrow(/Invalid sprite resource reference '<missing>' at scene\.layers\[0\]\.entities\[0\]\.components\[0\]\.props\.path/);
    });

    it("rejects an incompatible audio reference without coercing it", () => {
        expect(() => SceneLoader.parse({
            type: "scene",
            schemaVersion: 1,
            entities: [{
                name: "Music",
                components: [{ type: "Sound", props: {
                    src: { type: "sprite", path: "assets/music.wav" }
                } }]
            }]
        })).toThrow(/declared type 'sprite' is incompatible/);
    });

    it("rejects malformed prefab references with the entity source key", () => {
        expect(() => SceneLoader.parse({
            type: "scene",
            schemaVersion: 1,
            entities: [{ name: "Enemy", prefab: { type: "prefab" } }]
        })).toThrow(/prefab resource reference.*entities\[0\]\.prefab/);
    });

    it("keeps valid object references compatible with existing sprite loading", () => {
        const scene = SceneLoader.parse({
            type: "scene",
            schemaVersion: 1,
            entities: [{
                name: "Player",
                components: [{ type: "Sprite", props: {
                    path: { type: "image", path: "assets/player.png" }, width: 1, height: 1
                } }]
            }]
        });
        expect(scene.children[0].GetComponent(Sprite).path).toBe("assets/player.png");
    });

    it("loads a valid tilemap layer and creates its tile entity", async () => {
        const originalFetch = global.fetch;
        global.fetch = async path => {
            expect(path).toBe("maps/start.json");
            return {
                ok: true,
                json: async () => ({
                    width: 1,
                    height: 1,
                    data: [1],
                    metadata: { 1: { walkable: false, collision: false } },
                    tileset: "tiles.png"
                })
            };
        };

        try {
            const scene = await SceneLoader.parse({
                type: "scene",
                schemaVersion: 1,
                layers: [{ type: "tilemap", src: "maps/start.json" }]
            });

            expect(scene.children.length).toBe(1);
            expect(scene.children[0].name).toBe("Tile_0");
            expect(scene.children[0].GetComponent(Sprite).path).toBe("tiles.png");
            expect(scene.children[0].tileId).toBe(1);
            expect(scene.children[0].tileMetadata).toEqual({ walkable: false, collision: false });
            expect(scene.children[0].GetComponent(BoxCollider)).toBe(undefined);
        } finally {
            global.fetch = originalFetch;
        }
    });
});
