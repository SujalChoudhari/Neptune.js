import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const guideUrl = new URL("../docs/tutorials/html-ui-bridge.md", import.meta.url);

test("HTML UI bridge guide matches the exported bridge and navigation APIs", async () => {
    const guide = await readFile(guideUrl, "utf8");
    const bridge = await readFile(new URL("../src/ui/bridge.js", import.meta.url), "utf8");
    const ui = await readFile(new URL("../src/ui/ui.js", import.meta.url), "utf8");

    for (const name of ["createUIBridge", "createHTMLUIClient", "installHTMLUI", "installUINavigation"]) {
        assert.ok(ui.includes(name), `UI module should export ${name}`);
        assert.ok(guide.includes(name), `guide should document ${name}`);
    }
    for (const method of ["subscribe", "onAction", "emit", "destroy", "postMessage", "targetOrigin"]) {
        assert.ok(bridge.includes(method), `bridge implementation should contain ${method}`);
        assert.ok(guide.includes(method), `guide should document ${method}`);
    }
    assert.match(guide, /wildcard `\*` is rejected/);
    assert.match(guide, /cyclic objects/);
    assert.match(guide, /onNavigate/);
    assert.match(guide, /returned cleanup callback/);
    assert.match(guide, /removes the window message listener/);
});
