import "./setup_mocks.js";
import { describe, it, expect, beforeEach, afterEach } from "./tester.js";
import { Entity, Component, Scene, SceneManager, Shape, Color, Transform, Vector2, application } from "../src/neptune.js";
import { Camera } from "../src/thalassa/camera.js";
import { Renderable } from "../src/rendering/renderable.js";

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

    it('reparents children without leaving stale parent links', () => {
        const previousParent = new Entity('Previous');
        const nextParent = new Entity('Next');
        const child = new Entity('Child');
        previousParent.AddChild(child);

        nextParent.AddChild(child);

        expect(previousParent.children).toEqual([]);
        expect(nextParent.children).toEqual([child]);
        expect(child.parent).toBe(nextParent);
    });

    it('rejects self-parenting and ancestor cycles without mutating the hierarchy', () => {
        const root = new Entity('Root');
        const child = new Entity('Child');
        root.AddChild(child);

        expect(() => root.AddChild(root)).toThrow(TypeError);
        expect(() => child.AddChild(root)).toThrow(TypeError);
        expect(root.children).toEqual([child]);
        expect(child.children).toEqual([]);
        expect(root.parent).toBe(null);
        expect(child.parent).toBe(root);
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

    it('destroys a nested entity hierarchy once and detaches every node', () => {
        const root = new Entity('Root');
        const parent = new Entity('Parent');
        const child = new Entity('Child');
        let destroyCount = 0;
        class TrackedComponent extends Component {
            destroy() {
                destroyCount++;
                super.destroy();
            }
        }
        root.AddChild(parent);
        parent.AddChild(child);
        parent.AddComponent(new TrackedComponent());
        child.AddComponent(new TrackedComponent());

        parent.destroy();
        parent.destroy();

        expect(root.children).toEqual([]);
        expect(parent.parent).toBe(null);
        expect(parent.children).toEqual([]);
        expect(child.parent).toBe(null);
        expect(parent.components).toEqual([]);
        expect(child.components).toEqual([]);
        expect(destroyCount).toBe(2);
    });

    it('destroys a root entity without requiring a parent', () => {
        const root = new Entity('Root');
        expect(() => root.destroy()).not.toThrow();
        expect(root.parent).toBe(null);
        expect(root.children).toEqual([]);
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

    it("draws renderables in ascending render order with insertion order as a stable tie-breaker", () => {
        const orderedScene = new Scene("OrderedScene");
        const firstLayer = new Entity("FirstLayer");
        const secondLayer = new Entity("SecondLayer");
        const drawOrder = [];
        orderedScene.AddChildren(firstLayer, secondLayer);
        const makeRenderable = (name, order, layer) => {
            const entity = new Entity(name);
            const renderable = new (class extends Renderable {
                constructor() {
                    super();
                    if (order !== undefined) this.renderOrder = order;
                }
                draw() { drawOrder.push(name); }
            })();
            entity.AddComponent(renderable);
            layer.AddChild(entity);
        };
        makeRenderable("late", 5, firstLayer);
        makeRenderable("non-finite", Number.NaN, firstLayer);
        makeRenderable("default-order", undefined, secondLayer);
        makeRenderable("early", -1, secondLayer);
        makeRenderable("middle", 2, firstLayer);
        makeRenderable("same-order", 2, firstLayer);

        orderedScene.draw({ save() {}, restore() {} });

        expect(drawOrder).toEqual(["early", "non-finite", "default-order", "middle", "same-order", "late"]);
    });

    it("uses zero as the default render order", () => {
        const entity = new Entity("DefaultOrderEntity");
        const renderable = new Renderable();
        entity.AddComponent(renderable);

        expect(renderable.renderOrder).toBe(0);
        expect(entity.serialize().components[0].props.renderOrder).toBe(0);
    });

    it("serializes render order with the component properties", () => {
        const entity = new Entity("OrderedEntity");
        const renderable = new Renderable();
        entity.AddComponent(renderable);
        renderable.renderOrder = 7;

        expect(entity.serialize().components[0].props.renderOrder).toBe(7);
    });

    it("orders nested renderables inside non-renderable scene layers", () => {
        const layeredScene = new Scene("LayeredScene");
        const layer = new Entity("Layer");
        const parent = new Entity("Parent");
        const drawOrder = [];
        layeredScene.AddChild(layer);
        layer.AddChild(parent);

        const addRenderable = (entity, name, order, drawChildren = false) => {
            const renderable = new (class extends Renderable {
                constructor() {
                    super();
                    this.renderOrder = order;
                }
                draw(ctx) {
                    drawOrder.push(name);
                    if (drawChildren) this.drawChildren(ctx);
                }
            })();
            entity.AddComponent(renderable);
        };
        addRenderable(parent, "parent", 0, true);
        const high = new Entity("High");
        const low = new Entity("Low");
        parent.AddChildren(high, low);
        addRenderable(high, "high", 5);
        addRenderable(low, "low", -1);

        layeredScene.draw({ save() {}, restore() {} });

        expect(drawOrder).toEqual(["parent", "low", "high"]);
    });

    it("draws nested renderables once during a scene pass", () => {
        const multiRenderableScene = new Scene("MultiRenderableScene");
        const parent = new Entity("MultiRenderableParent");
        const drawOrder = [];
        multiRenderableScene.AddChild(parent);

        const addRenderable = (entity, name, renderOrder, drawChildren = false) => {
            const renderable = new (class extends Renderable {
                constructor() {
                    super();
                    this.renderOrder = renderOrder;
                }
                draw(ctx) {
                    drawOrder.push(name);
                    if (drawChildren) this.drawChildren(ctx);
                }
            })();
            entity.AddComponent(renderable);
        };

        addRenderable(parent, "parent-low", 0, true);
        addRenderable(parent, "parent-high", 1, true);
        const child = new Entity("NestedRenderable");
        parent.AddChild(child);
        addRenderable(child, "child", 0);

        multiRenderableScene.draw({ save() {}, restore() {} });

        expect(drawOrder).toEqual(["parent-low", "child", "parent-high"]);
    });

    it("renders a cyclic non-renderable hierarchy without recurring forever", () => {
        const cyclicScene = new Scene("CyclicScene");
        const firstLayer = new Entity("FirstLayer");
        const secondLayer = new Entity("SecondLayer");
        const drawableEntity = new Entity("Drawable");
        let drawCount = 0;
        cyclicScene.AddChild(firstLayer);
        firstLayer.AddChild(secondLayer);
        // Simulate a malformed deserialized graph; the public API rejects cycles.
        secondLayer.children.push(firstLayer);
        secondLayer.AddChild(drawableEntity);
        drawableEntity.AddComponent(new (class extends Renderable {
            draw() { drawCount += 1; }
        })());

        cyclicScene.draw({ save() {}, restore() {} });

        expect(drawCount).toBe(1);
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
