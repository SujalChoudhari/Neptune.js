import "./setup_mocks.js";
import * as npt from "../src/neptune.js";
import { describe, it, expect } from "./tester.js";

function createMockContext() {
    const calls = [];
    return {
        calls,
        save: () => calls.push("save"),
        restore: () => calls.push("restore"),
        translate: (...args) => calls.push(["translate", ...args]),
        rotate: (...args) => calls.push(["rotate", ...args]),
        scale: (...args) => calls.push(["scale", ...args]),
        beginPath: () => calls.push(["beginPath"]),
        arc: (...args) => calls.push(["arc", ...args]),
        rect: (...args) => calls.push(["rect", ...args]),
        moveTo: (...args) => calls.push(["moveTo", ...args]),
        lineTo: (...args) => calls.push(["lineTo", ...args]),
        closePath: () => calls.push(["closePath"]),
        fill: () => calls.push(["fill"]),
        stroke: () => calls.push(["stroke"]),
        set globalCompositeOperation(value) { calls.push(["globalCompositeOperation", value]); },
        set filter(value) { calls.push(["filter", value]); },
        set fillStyle(value) { calls.push(["fillStyle", String(value)]); },
        set strokeStyle(value) { calls.push(["strokeStyle", String(value)]); },
        set lineWidth(value) { calls.push(["lineWidth", value]); }
    };
}

describe("Shape", () => {
    it("keeps the default renderOrder after initializing shape properties", () => {
        const shape = new npt.Shape();
        const entity = new npt.Entity("DefaultShapeOrder");
        entity.AddComponent(shape);

        expect(shape.renderOrder).toBe(0);
        expect(entity.serialize().components[0].props.renderOrder).toBe(0);
    });

    it("deserializes renderOrder with shape properties", () => {
        const shape = new npt.Shape();
        shape.deserialize({ renderOrder: 7 });

        expect(shape.renderOrder).toBe(7);
    });

    it("deserializes colors and renders polygons", () => {
        const shape = new npt.Shape();
        shape.deserialize({
            geometry: npt.Shape.POLYGON,
            param: {
                fill: false,
                color: { r: 1, g: 2, b: 3, a: 1 },
                outline: { r: 9, g: 8, b: 7, a: 1 },
                points: [new npt.Vector2(0, 0), new npt.Vector2(5, 0), new npt.Vector2(5, 5)]
            }
        });

        expect(shape.color).toBeInstanceOf(npt.Color);
        expect(shape.outline).toBeInstanceOf(npt.Color);
        expect(shape.geometry).toBe(npt.Shape.POLYGON);

        const entity = new npt.Entity("ShapeEntity");
        entity.AddComponent(new npt.Transform());
        entity.AddComponent(shape);

        const ctx = createMockContext();
        shape.draw(ctx);

        const lineCalls = ctx.calls.filter((c) => Array.isArray(c) && c[0] === "lineTo");
        expect(lineCalls.length).toBe(2);
    });

    it("sorts nested Shapes through a scene and non-renderable layer hierarchy", () => {
        const scene = new npt.Scene("NestedShapeScene");
        const sceneLayer = new npt.Entity("SceneLayer");
        const parent = new npt.Entity("ParentShape");
        const nestedLayer = new npt.Entity("NestedLayer");
        scene.AddChild(sceneLayer);
        sceneLayer.AddChild(parent);
        parent.AddComponent(new npt.Transform());
        parent.AddComponent(new npt.Shape(npt.Shape.CIRCLE, { radius: 10 }));
        parent.AddChild(nestedLayer);

        const addShape = (name, radius, renderOrder) => {
            const entity = new npt.Entity(name);
            entity.AddComponent(new npt.Transform());
            const shape = new npt.Shape(npt.Shape.CIRCLE, { radius });
            shape.renderOrder = renderOrder;
            entity.AddComponent(shape);
            nestedLayer.AddChild(entity);
        };
        addShape("High", 5, 5);
        addShape("Low", 1, -1);

        const ctx = createMockContext();
        scene.draw(ctx);

        const radii = ctx.calls
            .filter((call) => Array.isArray(call) && call[0] === "arc")
            .map((call) => call[3]);
        expect(radii).toEqual([10, 1, 5]);
    });
});
