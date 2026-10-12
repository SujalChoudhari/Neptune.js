import assert from "node:assert/strict";
import { Entity } from "../src/core/entity.js";
import { Transform as UITransform } from "../src/ui/uitransform.js";
import { Panel } from "../src/ui/panel.js";
import { Sprite as UISprite } from "../src/ui/sprite.js";
import { Text } from "../src/ui/text.js";
import { Maths } from "../src/math/math.js";

class MockImage {
    constructor() {
        this.src = "";
    }
}

globalThis.Image = MockImage;

function createMockContext() {
    const calls = [];
    const ctx = {
        calls,
        save: () => calls.push(["save"]),
        restore: () => calls.push(["restore"]),
        translate: (...args) => calls.push(["translate", ...args]),
        rotate: (...args) => calls.push(["rotate", ...args]),
        scale: (...args) => calls.push(["scale", ...args]),
        fillRect: (...args) => calls.push(["fillRect", ...args]),
        drawImage: (...args) => calls.push(["drawImage", ...args]),
        fillText: (...args) => calls.push(["fillText", ...args]),
    };

    return ctx;
}

function createEntityWith(component, rotation = 90) {
    const entity = new Entity("Rotated UI");
    entity.AddComponent(new UITransform(1, 2, 3, 4, rotation));
    entity.AddComponent(component);
    return entity;
}

function getRotateCall(ctx) {
    return ctx.calls.find(([method]) => method === "rotate");
}

{
    const panel = new Panel();
    createEntityWith(panel);
    const ctx = createMockContext();

    panel.draw(ctx);

    assert.deepEqual(ctx.calls.slice(0, 4), [
        ["save"],
        ["translate", 1 * Maths.METER_TO_PIXEL, 2 * Maths.METER_TO_PIXEL],
        ["translate", 3 * Maths.METER_TO_PIXEL / 2, 4 * Maths.METER_TO_PIXEL / 2],
        ["rotate", 90 * Maths.DEG_TO_RAD],
    ]);
    assert.deepEqual(ctx.calls.find(([method]) => method === "fillRect"), [
        "fillRect",
        0,
        0,
        3 * Maths.METER_TO_PIXEL,
        4 * Maths.METER_TO_PIXEL,
    ]);
}

{
    const sprite = new UISprite("sprite.png");
    createEntityWith(sprite);
    const ctx = createMockContext();

    sprite.draw(ctx);

    assert.equal(getRotateCall(ctx)[1], 90 * Maths.DEG_TO_RAD);
}

{
    const text = new Text("Rotated");
    createEntityWith(text);
    const ctx = createMockContext();

    text.draw(ctx);

    assert.equal(getRotateCall(ctx)[1], 90 * Maths.DEG_TO_RAD);
}
