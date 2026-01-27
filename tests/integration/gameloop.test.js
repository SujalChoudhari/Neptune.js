import { describe, it, expect, beforeEach, afterEach } from "../tester.js";
import { Scene, SceneManager, Entity, Component, Transform, Vector2 } from "../../src/neptune.js";

/**
 * Integration tests for the game loop and system interactions.
 * Note: Full game loop requires browser environment with canvas.
 * These tests verify the integration between systems without rendering.
 */

describe("Integration: Entity-Component System", () => {
    beforeEach(() => {
        SceneManager.removeAllScenes();
    });

    it("Entity can be created with Transform and added to Scene", () => {
        const scene = new Scene("TestScene");
        const entity = new Entity("Player");
        const transform = new Transform(new Vector2(10, 20));

        entity.AddComponent(transform);
        scene.AddChild(entity);

        expect(entity.HasComponent(Transform)).toBe(true);
        expect(entity.GetComponent(Transform).position.x).toBe(10);
        expect(entity.GetComponent(Transform).position.y).toBe(20);
        expect(entity.parent).toBe(scene);
    });

    it("Nested entities maintain parent-child relationships", () => {
        const scene = new Scene("TestScene");
        const parent = new Entity("Parent");
        const child = new Entity("Child");
        const grandchild = new Entity("Grandchild");

        scene.AddChild(parent);
        parent.AddChild(child);
        child.AddChild(grandchild);

        expect(grandchild.GetParent()).toBe(child);
        expect(child.GetParent()).toBe(parent);
        expect(parent.GetParent()).toBe(scene);
    });

    it("GetComponentsInChildren works through hierarchy", () => {
        const scene = new Scene("TestScene");
        const parent = new Entity("Parent");
        const child1 = new Entity("Child1");
        const child2 = new Entity("Child2");

        child1.AddComponent(new Transform(new Vector2(1, 1)));
        child2.AddComponent(new Transform(new Vector2(2, 2)));

        parent.AddChildren(child1, child2);
        scene.AddChild(parent);

        const transforms = parent.GetComponentsInChildren(Transform);
        expect(transforms.length).toBe(2);
    });

    it("Scene loads and can be retrieved from SceneManager", () => {
        const scene = new Scene("GameLevel");
        SceneManager.LoadScene(scene.id);

        expect(SceneManager.GetSceneByName("GameLevel")).toBe(scene);
    });

    it("Multiple scenes can coexist with additive loading", () => {
        const mainScene = new Scene("Main");
        const uiScene = new Scene("UI");

        SceneManager.LoadScene(mainScene.id);
        SceneManager.LoadSceneAdditive(uiScene.id);

        expect(SceneManager.GetSceneByName("Main")).toBe(mainScene);
        expect(SceneManager.GetSceneByName("UI")).toBe(uiScene);
    });
});

describe("Integration: Transform Operations", () => {
    it("Transform.Translate updates position correctly", () => {
        const entity = new Entity("MovingEntity");
        const transform = new Transform(new Vector2(0, 0));
        entity.AddComponent(transform);

        transform.Translate(new Vector2(5, 3));
        transform.Translate(new Vector2(2, 1));

        expect(transform.position.x).toBe(7);
        expect(transform.position.y).toBe(4);
    });

    it("Transform.Rotate accumulates rotation", () => {
        const entity = new Entity("RotatingEntity");
        const transform = new Transform();
        entity.AddComponent(transform);

        transform.Rotate(0.5);
        transform.Rotate(0.5);
        transform.Rotate(0.5);

        expect(transform.rotation).toBeCloseTo(1.5, 10);
    });

    it("Transform.Scale compounds scale", () => {
        const entity = new Entity("ScalingEntity");
        const transform = new Transform(Vector2.Zero(), 0, new Vector2(1, 1));
        entity.AddComponent(transform);

        transform.Scale(new Vector2(2, 2));
        transform.Scale(new Vector2(2, 2));

        expect(transform.scale.x).toBe(4);
        expect(transform.scale.y).toBe(4);
    });
});

describe("Integration: Component Lifecycle", () => {
    it("Components can be added and removed dynamically", () => {
        const entity = new Entity("DynamicEntity");
        const transform = new Transform();

        entity.AddComponent(transform);
        expect(entity.HasComponent(Transform)).toBe(true);

        entity.RemoveComponent(Transform);
        expect(entity.HasComponent(Transform)).toBe(false);
    });

    it("Entity correctly tracks component", () => {
        const entity = new Entity("SingleComponent");
        const transform = new Transform();

        entity.AddComponent(transform);

        // Entity should have 1 component
        expect(entity.components.length).toBe(1);
        expect(entity.HasComponent(Transform)).toBe(true);
        expect(entity.GetComponent(Transform)).toBe(transform);
    });
});
