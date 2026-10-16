import "./setup_mocks.js";
import * as npt from "../src/neptune.js";
import { describe, it, expect } from "./tester.js";

function createMockContext() {
    const calls = [];
    const ctx = {
        calls,
        save: () => calls.push("save"),
        restore: () => calls.push("restore"),
        translate: (...args) => calls.push(["translate", ...args]),
        rotate: (...args) => calls.push(["rotate", ...args]),
        scale: (...args) => calls.push(["scale", ...args]),
        drawImage: (...args) => calls.push(["drawImage", ...args]),
        beginPath: () => calls.push(["beginPath"]),
        arc: (...args) => calls.push(["arc", ...args]),
        fill: () => calls.push(["fill"]),
        stroke: () => calls.push(["stroke"]),
        rect: (...args) => calls.push(["rect", ...args]),
        moveTo: (...args) => calls.push(["moveTo", ...args]),
        lineTo: (...args) => calls.push(["lineTo", ...args]),
        closePath: () => calls.push(["closePath"]),
        set globalCompositeOperation(value) { calls.push(["globalCompositeOperation", value]); },
        set filter(value) { calls.push(["filter", value]); }
    };
    return ctx;
}

describe("Sprite", () => {
    it("rejects an explicit missing sprite reference", () => {
        expect(() => new npt.Sprite("", 1, 1)).toThrow(/sprite resource reference/);
    });

    it("stores constructor values and supports sourceRect rendering", () => {
        const sprite = new npt.Sprite("sprite.png", 2, 3);
        expect(sprite.path).toBe("sprite.png");
        expect(sprite.width).toBe(2);
        expect(sprite.height).toBe(3);

        sprite.deserialize({ sourceRect: { x: 1, y: 2, width: 3, height: 4 } });
        expect(sprite._properties.sourceRect.width).toBe(3);

        const entity = new npt.Entity("SpriteEntity");
        entity.AddComponent(new npt.Transform(new npt.Vector2(1, 1), 0, new npt.Vector2(1, 1)));
        entity.AddComponent(sprite);

        const ctx = createMockContext();
        sprite.draw(ctx);

        const drawCall = ctx.calls.find((c) => Array.isArray(c) && c[0] === "drawImage");
        expect(drawCall.length).toBe(10);
    });

    it("draws child renderables in renderOrder", () => {
        const parent = new npt.Entity("Parent");
        const parentSprite = new npt.Sprite("parent.png", 1, 1);
        parent.AddComponent(new npt.Transform());
        parent.AddComponent(parentSprite);

        const addShape = (name, radius, renderOrder) => {
            const child = new npt.Entity(name);
            child.AddComponent(new npt.Transform());
            const shape = new npt.Shape(npt.Shape.CIRCLE, { radius });
            shape.renderOrder = renderOrder;
            child.AddComponent(shape);
            parent.AddChild(child);
        };
        addShape("High", 5, 5);
        addShape("Low", 1, -1);

        const ctx = createMockContext();
        parentSprite.draw(ctx);

        const drawImageCalls = ctx.calls.filter((c) => Array.isArray(c) && c[0] === "drawImage");
        const arcRadii = ctx.calls
            .filter((c) => Array.isArray(c) && c[0] === "arc")
            .map((c) => c[3]);
        expect(drawImageCalls.length).toBe(1);
        expect(arcRadii).toEqual([1, 5]);
    });
});
