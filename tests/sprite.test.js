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

    it("draws children renderables", () => {
        const parent = new npt.Entity("Parent");
        const child = new npt.Entity("Child");

        const parentSprite = new npt.Sprite("parent.png", 1, 1);
        const childShape = new npt.Shape(npt.Shape.CIRCLE, { radius: 1 });

        parent.AddComponent(new npt.Transform());
        child.AddComponent(new npt.Transform());
        parent.AddComponent(parentSprite);
        child.AddComponent(childShape);
        parent.AddChild(child);

        const ctx = createMockContext();
        parentSprite.draw(ctx);

        const drawImageCalls = ctx.calls.filter((c) => Array.isArray(c) && c[0] === "drawImage");
        const arcCalls = ctx.calls.filter((c) => Array.isArray(c) && c[0] === "arc");
        expect(drawImageCalls.length).toBe(1);
        expect(arcCalls.length).toBe(1);
    });
});
