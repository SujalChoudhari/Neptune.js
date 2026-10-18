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
import { TriggerCollider, Hitbox, Hurtbox } from "../src/nereid/collider.js";
import { Dialogue } from "../src/components/dialogue.js";
import { QuestDefinition } from "../src/components/questDefinition.js";
import { EnemyConfig } from "../src/components/enemyConfig.js";
import { SceneTransition } from "../src/components/sceneTransition.js";

// Manually register components since we aren't loading neptune.js
ComponentRegistry.register("Transform", Transform);
ComponentRegistry.register("Sprite", Sprite);
ComponentRegistry.register("BoxCollider", BoxCollider);
ComponentRegistry.register("TriggerCollider", TriggerCollider);
ComponentRegistry.register("Hitbox", Hitbox);
ComponentRegistry.register("Hurtbox", Hurtbox);
ComponentRegistry.register("Dialogue", Dialogue);
ComponentRegistry.register("QuestDefinition", QuestDefinition);
ComponentRegistry.register("EnemyConfig", EnemyConfig);
ComponentRegistry.register("SceneTransition", SceneTransition);

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
                    type: "spawn-point",
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
        expect(player.type).toBe("spawn-point");
        expect(player.components[0].id).toBe("component-stable");
        expect(player.GetComponent(Transform).position.x).toBe(4);
        expect(player.GetComponent(Transform).scale.y).toBe(3);
    });

    it("loads editor-authored trigger areas as runtime trigger colliders", () => {
        const scene = SceneLoader.parse({
            type: "scene",
            schemaVersion: 1,
            entities: [{
                id: "trigger-area-1",
                name: "Trigger Area",
                type: "trigger-area",
                components: [{
                    id: "trigger-component-1",
                    type: "TriggerCollider",
                    props: { width: 1, height: 1, offsetX: 0, offsetY: 0 }
                }]
            }]
        });
        const triggerEntity = scene.children[0];
        const trigger = triggerEntity.GetComponent(TriggerCollider);

        expect(triggerEntity.type).toBe("trigger-area");
        expect(trigger.id).toBe("trigger-component-1");
        expect(trigger.width).toBe(1);
        expect(trigger.height).toBe(1);
        expect(trigger.role).toBe("trigger");
        expect(trigger.isTrigger).toBe(true);
    });

    it("loads editor-authored hitboxes and hurtboxes with their combat roles", () => {
        const scene = SceneLoader.parse({
            type: "scene",
            schemaVersion: 1,
            entities: [
                { id: "hitbox-1", name: "Hitbox", type: "hitbox", components: [{ id: "hitbox-component", type: "Hitbox", props: { width: 2, height: 1, offsetX: 0.5, offsetY: 0 } }] },
                { id: "hurtbox-1", name: "Hurtbox", type: "hurtbox", components: [{ id: "hurtbox-component", type: "Hurtbox", props: { width: 1, height: 2, offsetX: 0, offsetY: 0.5 } }] }
            ]
        });
        const hitbox = scene.children[0].GetComponent(Hitbox);
        const hurtbox = scene.children[1].GetComponent(Hurtbox);

        expect(scene.children[0].type).toBe("hitbox");
        expect(hitbox.width).toBe(2);
        expect(hitbox.height).toBe(1);
        expect(hitbox.role).toBe("hitbox");
        expect(scene.children[1].type).toBe("hurtbox");
        expect(hurtbox.width).toBe(1);
        expect(hurtbox.height).toBe(2);
        expect(hurtbox.role).toBe("hurtbox");
    });

    it("loads editor-authored dialogue data on its runtime entity", () => {
        const scene = SceneLoader.parse({
            type: "scene",
            schemaVersion: 1,
            entities: [{
                id: "dialogue-npc",
                name: "Village Guide",
                type: "dialogue",
                components: [{
                    id: "dialogue-data",
                    type: "Dialogue",
                    props: { speaker: "Guide", text: "Welcome to town.", next: "quest-start" }
                }]
            }]
        });
        const entity = scene.children[0];
        const dialogue = entity.GetComponent(Dialogue);

        expect(entity.type).toBe("dialogue");
        expect(dialogue.id).toBe("dialogue-data");
        expect(dialogue.properties).toEqual({ speaker: "Guide", text: "Welcome to town.", next: "quest-start" });
    });

    it("loads editor-authored quest definitions on their runtime entities", () => {
        const scene = SceneLoader.parse({
            type: "scene",
            schemaVersion: 1,
            entities: [{
                id: "quest-entity",
                name: "Slime Trouble",
                type: "quest",
                components: [{
                    id: "quest-definition",
                    type: "QuestDefinition",
                    props: { name: "Slime Trouble", description: "Help the town.", objectiveId: "defeat-slimes", objective: "Defeat slimes", required: 3 }
                }]
            }]
        });
        const entity = scene.children[0];
        const quest = entity.GetComponent(QuestDefinition);

        expect(entity.type).toBe("quest");
        expect(quest.id).toBe("quest-definition");
        expect(quest.properties).toEqual({ name: "Slime Trouble", description: "Help the town.", objectiveId: "defeat-slimes", objective: "Defeat slimes", required: 3 });
    });

    it("loads editor-authored enemy configuration on its runtime entity", () => {
        const scene = SceneLoader.parse({
            type: "scene",
            schemaVersion: 1,
            entities: [{
                id: "enemy-slime",
                name: "Slime",
                type: "enemy",
                components: [{
                    id: "enemy-config",
                    type: "EnemyConfig",
                    props: { maxHealth: 40, moveSpeed: 1.5, contactDamage: 6, behavior: "chase" }
                }]
            }]
        });
        const entity = scene.children[0];
        const config = entity.GetComponent(EnemyConfig);

        expect(entity.type).toBe("enemy");
        expect(config.id).toBe("enemy-config");
        expect(config.properties).toEqual({ maxHealth: 40, moveSpeed: 1.5, contactDamage: 6, behavior: "chase" });
    });

    it("loads an editor-authored scene transition from saved scene JSON", () => {
        const serialized = JSON.stringify({
            type: "scene",
            schemaVersion: 1,
            entities: [{
                id: "transition-door",
                name: "Dungeon Door",
                type: "scene-transition",
                components: [
                    { id: "transition-config", type: "SceneTransition", props: { targetScene: "scenes/dungeon.scene", spawnPoint: "entrance", trigger: "interact" } },
                    { id: "transition-trigger", type: "TriggerCollider", props: { width: 1, height: 2, offsetX: 0, offsetY: 0 } }
                ]
            }]
        });
        const scene = SceneLoader.parse(JSON.parse(serialized));
        const entity = scene.children[0];
        const transition = entity.GetComponent(SceneTransition);
        const trigger = entity.GetComponent(TriggerCollider);

        expect(entity.type).toBe("scene-transition");
        expect(transition.properties).toEqual({ targetScene: "scenes/dungeon.scene", spawnPoint: "entrance", trigger: "interact" });
        expect(trigger.width).toBe(1);
        expect(trigger.height).toBe(2);
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
                    cellMetadata: { 0: { collision: true, walkable: true, terrain: "bridge" } },
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
            expect(scene.children[0].tileMetadata).toEqual({ walkable: true, collision: true, terrain: "bridge" });
            expect(scene.children[0].GetComponent(BoxCollider)).not.toBe(undefined);
        } finally {
            global.fetch = originalFetch;
        }
    });
});
