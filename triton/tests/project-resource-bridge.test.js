import assert from "node:assert/strict";
import test from "node:test";
import { installProjectResourceBridge, resolveProjectResourcePath } from "../src/lib/projectResourceBridge.mjs";

function createFrameWindow() {
    const listeners = new Set();
    const requests = [];
    class FakeImage {
        set src(value) { this.value = value; }
        get src() { return this.value; }
    }
    class FakeMedia {
        set src(value) { this.value = value; }
        get src() { return this.value; }
    }
    class FakeAudio extends FakeMedia {}
    const frame = {
        HTMLImageElement: FakeImage,
        HTMLMediaElement: FakeMedia,
        Audio: FakeAudio,
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
            const event = { data: { type: "editor:project-resource-response", payload: { id, content, error } } };
            for (const listener of listeners) listener(event);
        }
    };
}

test("selected-project paths are normalized and cannot escape the project root", () => {
    assert.equal(resolveProjectResourcePath("./assets\\hero.png"), "assets/hero.png");
    assert.throws(() => resolveProjectResourcePath("../outside.json"), /inside the selected project/);
});

test("relative runtime fetch is fulfilled from the selected-project bridge", async () => {
    const harness = createFrameWindow();
    const dispose = installProjectResourceBridge(harness.frame);
    const responsePromise = harness.frame.fetch("./maps/level.json");
    const request = harness.requests[0];
    assert.deepEqual(request, {
        type: "editor:project-resource-request",
        payload: { id: "project-resource-1", path: "maps/level.json", kind: "text" }
    });
    harness.respond(request.payload.id, '{"width":12}');
    const response = await responsePromise;
    assert.equal(await response.text(), '{"width":12}');
    dispose();
});

test("relative image sources use the selected-project image reader", async () => {
    const harness = createFrameWindow();
    const dispose = installProjectResourceBridge(harness.frame);
    const image = new harness.frame.HTMLImageElement();
    image.src = "assets/hero.png";
    const request = harness.requests[0];
    assert.equal(request.payload.kind, "image");
    assert.equal(request.payload.path, "assets/hero.png");
    harness.respond(request.payload.id, "data:image/png;base64,AAAA");
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(image.src, "data:image/png;base64,AAAA");
    dispose();
});

test("Audio constructor sources use the selected-project audio reader", async () => {
    const harness = createFrameWindow();
    const dispose = installProjectResourceBridge(harness.frame);
    const audio = new harness.frame.Audio("sounds/hit.ogg");
    const request = harness.requests[0];
    assert.equal(request.payload.kind, "audio");
    assert.equal(request.payload.path, "sounds/hit.ogg");
    harness.respond(request.payload.id, "data:audio/ogg;base64,T2dnUw==");
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(audio.src, "data:audio/ogg;base64,T2dnUw==");
    dispose();
});

test("resource read failures are surfaced as editor diagnostics", async () => {
    const harness = createFrameWindow();
    const dispose = installProjectResourceBridge(harness.frame);
    const responsePromise = harness.frame.fetch("maps/missing.json");
    const request = harness.requests[0];
    harness.respond(request.payload.id, null, "file not found");
    await assert.rejects(responsePromise, /maps\/missing\.json.*file not found/);
    assert.equal(harness.requests[1].type, "editor:scene-diagnostic");
    assert.equal(harness.requests[1].payload.code, "EDITOR_PROJECT_RESOURCE_LOAD_FAILED");
    dispose();
});
