import { describe, it, expect, beforeEach, afterEach } from "./tester.js";
import { Entity, Component, Scene, SceneManager } from "../src/neptune.js";

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

    it('Correctly responds to HasComponent',()=>{
        expect(entity.HasComponent(mockComponent.constructor)).toBe(true);
        expect(entity.HasComponent(Scene)).toBe(false);
    });

    it('AddComponent does not add duplicate components', () => {
        entity.AddComponent(mockComponent);
        expect(entity.components.length).toBe(1);
    });

    it("Returns the correct component",()=>{
        expect(entity.GetComponent(mockComponent.constructor)).toBe(mockComponent);
        expect(entity.GetComponent(mockComponent.constructor)).toNotBe(new Component());
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

    it('Gets the correct Children',()=>{
        const child1 = new Entity('Child1');
        const child2 = new Entity('Child2');
        entity.AddChildren(child1, child2);
        expect(entity.GetChildren().length).toEqual(2);
    });

    it('Gets the correct Parent',()=>{
        const parent = new Entity('Parent');
        parent.AddChild(entity);
        expect(entity.GetParent()).toBe(parent);
    });

    it("Gets correct Components in Children",()=>{
        const child1 = new Entity('Child4');
        const child2 = new Entity('Child2');
        child1.AddComponent(mockComponent);
        entity.AddChildren(child1, child2);
        expect(entity.GetComponentsInChildren(Component)[0]).toBe(mockComponent);
        expect(entity.GetComponentsInChildren(Component)[0]).toNotBe(new Component());
    });

    it("Gets child with a Component",()=>{
        const child1 = new Entity('Child4');
        const child2 = new Entity('Child2');
        child1.AddComponent(mockComponent);
        entity.AddChildren(child1, child2);
        expect(entity.GetChildWithComponent(Component)[0]).toBe(child1);
        expect(entity.GetChildWithComponent(Component)[0]).toNotBe(child2);
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

    it
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

})