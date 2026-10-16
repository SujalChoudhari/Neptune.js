import "./setup_mocks.js";
import { describe, it, expect, beforeEach, afterEach } from "./tester.js";
import { Entity, Component, Scene, SceneManager, Shape, Color, Transform, Vector2, application } from "../src/neptune.js";
import { Camera } from "../src/thalassa/camera.js";

describe('Entity', () => {
    let entity;
    let mockComponent;
    beforeEach(() => {
        entity = new Entity('TestEntity');
        mockComponent = new Component();
        entity.AddComponent(mockComponent);
    });

    afterEach(() => {
        entity = null;
    });

    it('AddComponent adds a component', () => {
        expect(entity.components).toContain(mockComponent);
    });

    it('Correctly responds to HasComponent', () => {
        expect(entity.HasComponent(mockComponent.constructor)).toBe(true);
        expect(entity.HasComponent(Scene)).toBe(false);
    });

    it('AddComponent does not add duplicate components', () => {
        entity.AddComponent(mockComponent);
        expect(entity.components.length).toBe(1);
    });

    it("Returns the correct component", () => {
        expect(entity.GetComponent(mockComponent.constructor)).toBe(mockComponent);
        expect(entity.GetComponent(mockComponent.constructor)).not.toBe(new Component());
    });

    it('RemoveComponent removes a component', () => {
        entity.RemoveComponent(mockComponent.constructor);
        expect(entity.components).toEqual([]);
    });

    it('AddChildren adds child entities', () => {
        const child1 = new Entity('Child1');
        const child2 = new Entity('Child2');
        entity.AddChildren(child1, child2);
        expect(entity.children).toContain(child1);
        expect(entity.children).toContain(child2);
        expect(child1.parent).toBe(entity);
        expect(child2.parent).toBe(entity);
    });

    it('AddChildren does not add duplicate children', () => {
        const child = new Entity('Child');
        entity.AddChildren(child, child);
        expect(entity.children.length).toBe(1);
    });

    it('Gets the correct Children', () => {
        const child1 = new Entity('Child1');
        const child2 = new Entity('Child2');
        entity.AddChildren(child1, child2);
        expect(entity.GetChildren().length).toEqual(2);
    });

    it('Gets the correct Parent', () => {
        const parent = new Entity('Parent');
        parent.AddChild(entity);
        expect(entity.GetParent()).toBe(parent);
    });

    it("Gets correct Components in Children", () => {
        const child1 = new Entity('Child4');
        const child2 = new Entity('Child2');
        child1.AddComponent(mockComponent);
        entity.AddChildren(child1, child2);
        expect(entity.GetComponentsInChildren(Component)[0]).toBe(mockComponent);
        expect(entity.GetComponentsInChildren(Component)[0]).not.toBe(new Component());
    });

    it("Gets child with a Component", () => {
        const child1 = new Entity('Child4');
        const child2 = new Entity('Child2');
        child1.AddComponent(mockComponent);
        entity.AddChildren(child1, child2);
        expect(entity.GetChildWithComponent(Component)[0]).toBe(child1);
        expect(entity.GetChildWithComponent(Component)[0]).not.toBe(child2);
    });

    it('GetTree generates the correct tree structure', () => {
        const child1 = new Entity('Child1');
        const child2 = new Entity('Child2');
        entity.AddChildren(child1, child2);

        const tree = entity.GetTree();
        expect(tree.name).toBe('TestEntity');
        expect(tree.children.length).toBe(2);
        expect(tree.children[0].name).toBe('Child1');
        expect(tree.children[1].name).toBe('Child2');
    });

    it('serializes stable entity and component identifiers', () => {
        const child = new Entity('Child');
        entity.AddChild(child);
        const payload = entity.serialize();

        expect(payload.id).toBe(entity.id);
        expect(payload.components[0].id).toBe(mockComponent.id);
        expect(payload.children[0].id).toBe(child.id);
        expect(payload.components[0].props).toEqual(mockComponent.properties);
    });
});


describe("Scene", () => {
    let scene;

    beforeEach(() => {
        scene = new Scene();
    });

    afterEach(() => {
        scene = null;
    });

    it("adds itself in SceneManager", () => {
        expect(SceneManager.getIdForNewScene()).toEqual(scene.id + 1);
    })

    it("can retrieve the active scene", () => {
        SceneManager.removeAllScenes();
        const scene1 = new Scene("Scene1");
        SceneManager.LoadScene(scene1.id);
        expect(SceneManager.GetActiveScene()).toBe(scene1);
    });

    it("switches active scene correctly", () => {
        SceneManager.removeAllScenes();
        const scene1 = new Scene("Scene1");
        const scene2 = new Scene("Scene2");
        SceneManager.LoadScene(scene1.id);
        expect(SceneManager.GetActiveScene()).toBe(scene1);

        SceneManager.LoadScene(scene2.id);
        expect(SceneManager.GetActiveScene()).toBe(scene2);
    });

    it("serializes an explicitly versioned scene payload", () => {
        const payload = scene.serialize();

        expect(payload.type).toBe("scene");
        expect(payload.schemaVersion).toBe(1);
        expect(payload.version).toBe("1.0.0");
    });

    it("draws an active camera fade as a viewport overlay", () => {
        const fadeScene = new Scene("FadeScene");
        const camera = new Camera(100, 80);
        camera.position.x = 10;
        camera.position.y = 20;
        camera.setZoom(2);
        camera.transitionTo(new Vector2(30, 50), 2, { fade: true });
        camera.update(0.5);
        fadeScene.activeCamera = camera;

        const overlays = [];
        const savedStates = [];
        const ctx = {
            globalAlpha: 0.8,
            fillStyle: "#fff",
            save() {
                savedStates.push({ globalAlpha: this.globalAlpha, fillStyle: this.fillStyle });
            },
            restore() {
                Object.assign(this, savedStates.pop());
            },
            scale() {},
            translate() {},
            fillRect(x, y, width, height) {
                overlays.push({ x, y, width, height, alpha: this.globalAlpha, fillStyle: this.fillStyle });
            }
        };

        fadeScene.draw(ctx);

        expect(overlays).toEqual([{
            x: 15,
            y: 27.5,
            width: 50,
            height: 40,
            alpha: 0.4,
            fillStyle: "#000"
        }]);
        expect(ctx.globalAlpha).toBe(0.8);
    });
})
