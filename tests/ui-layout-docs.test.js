import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const guideUrl = new URL("../docs/tutorials/ui-layout.md", import.meta.url);

test("canvas UI guide matches exported components and layout behavior", async () => {
    const guide = await readFile(guideUrl, "utf8");
    const ui = await readFile(new URL("../src/ui/ui.js", import.meta.url), "utf8");
    const transform = await readFile(new URL("../src/ui/uitransform.js", import.meta.url), "utf8");
    const grid = await readFile(new URL("../src/ui/containers/grid.js", import.meta.url), "utf8");
    const hbox = await readFile(new URL("../src/ui/containers/hbox.js", import.meta.url), "utf8");
    const vbox = await readFile(new URL("../src/ui/containers/vbox.js", import.meta.url), "utf8");
    const margin = await readFile(new URL("../src/ui/containers/margin.js", import.meta.url), "utf8");

    for (const name of ["UITransform", "Text", "UISprite", "Panel", "Container", "GridContainer", "HBoxContainer", "VBoxContainer", "MarginContainer"]) {
        assert.ok(ui.includes(name), `UI module should export ${name}`);
        assert.ok(guide.includes(name), `guide should document ${name}`);
    }
    for (const method of ["Align", "Fill", "IsHovered", "IsClicked", "center"]) {
        assert.ok(transform.includes(method), `UITransform should implement ${method}`);
        assert.ok(guide.includes(method), `guide should document ${method}`);
    }
    for (const [source, name] of [[grid, "GridContainer"], [hbox, "HBoxContainer"], [vbox, "VBoxContainer"], [margin, "MarginContainer"]]) {
        assert.ok(source.includes("Update()"), `${name} should implement Update`);
        assert.ok(guide.includes(name), `guide should document ${name}`);
    }
    assert.match(guide, /Call `Update\(\)`/);
    assert.match(guide, /spacing\/margins are added to placement strides/);
});
