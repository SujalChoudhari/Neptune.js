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
});
