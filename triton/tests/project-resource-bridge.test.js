import assert from "node:assert/strict";
import test from "node:test";
import { installProjectResourceBridge, resolveProjectResourcePath } from "../src/lib/projectResourceBridge.mjs";

function harness() {
    const listeners = new Set();
    const requests = [];
    class Image {
        set src(value) { this.value = value; }
        get src() { return this.value; }
    }
    const frame = {
        HTMLImageElement: Image,
        Response,
        console,
        parent: { postMessage: message => requests.push(message) },
        addEventListener: (type, listener) => type === "message" && listeners.add(listener),
        removeEventListener: (type, listener) => type === "message" && listeners.delete(listener),
        fetch: async () => new Response("network")
    };
    return {
        frame,
        requests,
        respond(id, content, error = null) {
            for (const listener of listeners) listener({ data: { type: "editor:project-resource-response", payload: { id, content, error } } });
        }
    };
}

test("project resource paths normalize separators and reject escapes", () => {
    assert.equal(resolveProjectResourcePath("./assets\\hero.png"), "assets/hero.png");
    assert.throws(() => resolveProjectResourcePath("../outside.png"), /inside the selected project/);
    assert.throws(() => resolveProjectResourcePath("/etc/passwd"), /relative to the selected project/);
});

test("runtime fetch and images resolve from the selected project", async () => {
    const h = harness();
    const dispose = installProjectResourceBridge(h.frame);
    const responsePromise = h.frame.fetch("maps/level.json");
    const image = new h.frame.HTMLImageElement();
    image.src = "assets/hero.png";
    assert.deepEqual(h.requests.map(({ payload }) => [payload.path, payload.kind]), [
        ["maps/level.json", "text"], ["assets/hero.png", "image"]
    ]);
    h.respond(h.requests[0].payload.id, '{"ok":true}');
    h.respond(h.requests[1].payload.id, "data:image/png;base64,AAAA");
    assert.equal(await (await responsePromise).text(), '{"ok":true}');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(image.src, "data:image/png;base64,AAAA");
    dispose();
});
