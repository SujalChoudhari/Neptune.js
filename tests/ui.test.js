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
        drawImage: (...args) => calls.push(["drawImage", ...args]),
        fillRect: (...args) => calls.push(["fillRect", ...args]),
        set globalCompositeOperation(value) { calls.push(["globalCompositeOperation", value]); },
        set filter(value) { calls.push(["filter", value]); },
        set fillStyle(value) { calls.push(["fillStyle", String(value)]); }
    };
}

describe("UI", () => {
    it("fills parent and applies margins to child layout", () => {
        const panel = new npt.Entity("Panel");
        panel.AddComponent(new npt.UI.UITransform(0, 0, 2, 2, 0));
        panel.AddComponent(new npt.UI.Panel());
        panel.AddComponent(new npt.UI.MarginContainer(0.1, 0.1, 0.2, 0.2));

        const child = new npt.Entity("Child");
        child.AddComponent(new npt.UI.UITransform(0, 0, 0.5, 0.5, 0));
        child.AddComponent(new npt.UI.UISprite("child.png"));
        panel.AddChild(child);

        panel.GetComponent(npt.UI.UITransform).Fill("both", 0.1, 0.1);
        panel.GetComponent(npt.UI.MarginContainer).Update();

        const childTransform = child.GetComponent(npt.UI.UITransform);
        expect(childTransform.y).toBeGreaterThan(0);
        expect(childTransform.height).toBeGreaterThan(0);
    });

    it("renders panel and sprite", () => {
        const panelEntity = new npt.Entity("PanelRender");
        panelEntity.AddComponent(new npt.UI.UITransform(1, 2, 3, 4, 0));

        const panel = new npt.UI.Panel(npt.Color.white);
        const sprite = new npt.UI.UISprite("image.png");
        panelEntity.AddComponent(panel);
        panelEntity.AddComponent(sprite);

        const ctx = createMockContext();
        panel.draw(ctx);
        sprite.draw(ctx);

        const fillRectCalls = ctx.calls.filter((c) => Array.isArray(c) && c[0] === "fillRect");
        const drawImageCalls = ctx.calls.filter((c) => Array.isArray(c) && c[0] === "drawImage");

        expect(fillRectCalls.length).toBe(1);
        expect(drawImageCalls.length).toBe(1);
    });
});
