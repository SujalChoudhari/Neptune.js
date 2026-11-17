import test from "node:test";
import assert from "node:assert/strict";
import { createEditorExtensionHost, loadProjectEditorExtensions } from "../triton/src/lib/editorExtensions.mjs";
import colliderExtension from "../examples/editor-extensions/box-collider-area.mjs";
import { SceneLoader } from "../src/core/sceneLoader.js";
import { SceneManager } from "../src/core/sceneManager.js";
import { validateAuthoredUI } from "../src/ui/authoredUi.js";
import { ComponentRegistry } from "../src/core/componentRegistry.js";
import { Transform } from "../src/components/transform.js";
import { BoxCollider } from "../src/components/boxCollider.js";

const makeScene = () => ({ entities: [{ id: "wall", name: "Wall", transform: { position: { x: 3, y: 4 } }, components: { BoxCollider: { size: { x: 2, y: 1 } } } }] });

test("BoxCollider editor extension resizes through one transaction and persisted scene data", () => {
    const scene = makeScene();
    const history = [];
    let pending = null;
    const host = createEditorExtensionHost({
        projectId: "sample",
        sceneId: "ruins",
        queryEntity: id => scene.entities.find(entity => entity.id === id),
        commands: {
            beginSceneEdit(label) {
                const before = structuredClone(scene.entities[0].components.BoxCollider.size);
                pending = { label, before };
                return {
                    commit() { history.push({ label, before, after: structuredClone(scene.entities[0].components.BoxCollider.size) }); pending = null; },
                    cancel() { scene.entities[0].components.BoxCollider.size = before; pending = null; }
                };
            },
            updateComponent(id, component, patch) {
                const entity = scene.entities.find(item => item.id === id);
                if (!entity || component !== "BoxCollider") return false;
                Object.assign(entity.components.BoxCollider, structuredClone(patch));
                return true;
            }
        }
    });
    host.enable(colliderExtension);
    const tool = host.registrations("tool").find(item => item.id === "box-collider-area").value;
    assert.deepEqual(tool.getArea("wall"), { x: 2, y: 3.5, width: 2, height: 1 });
    const drag = tool.beginResize("wall");
    assert.equal(tool.resize(drag, { x: 3.5, y: 2 }), true);
    tool.commit(drag);
    assert.equal(history.length, 1);
    assert.equal(history[0].label, "Resize Box Collider");
    const saved = JSON.stringify(scene);
    const reopened = JSON.parse(saved);
    assert.deepEqual(reopened.entities[0].components.BoxCollider.size, { x: 3.5, y: 2 });

    const cancelDrag = tool.beginResize("wall");
    tool.resize(cancelDrag, { x: 8, y: 9 });
    tool.cancel(cancelDrag);
    assert.deepEqual(scene.entities[0].components.BoxCollider.size, { x: 3.5, y: 2 });
    host.dispose();
});

test("extension cleanup removes registrations, drawings, overlay objects and stale capabilities", () => {
    const host = createEditorExtensionHost();
    const apis = [];
    host.enable({ id: "example.lifecycle", apiVersion: 1, activate(api) {
        apis.push(api);
        api.registerTool("tool", { run() {} });
        api.draw.add({ type: "circle", x: 0, y: 0, radius: 1 });
        api.editorOverlay.add({ id: "marker", x: 1, y: 2 });
    } });
    assert.equal(host.registrations("tool").length, 1);
    assert.equal(host.drawings().length, 1);
    assert.equal(host.overlayObjects().length, 1);
    host.switchScene("next");
    assert.equal(host.registrations("tool").length, 1);
    assert.equal(host.drawings().length, 1);
    assert.throws(() => apis[0].draw.add({ type: "text", x: 0, y: 0, text: "stale" }), /no longer active/);
    host.switchProject("other");
    assert.equal(host.registrations("tool").length, 0);
    assert.equal(host.overlayObjects().length, 0);
});

test("a failed extension is isolated and partial registrations are disposed", () => {
    const diagnostics = [];
    const host = createEditorExtensionHost({ onDiagnostic: diagnostic => diagnostics.push(diagnostic) });
    host.enable({ id: "example.broken", apiVersion: 1, activate(api) {
        api.registerTool("partial", {});
        api.editorOverlay.add({ id: "leak", x: 0, y: 0 });
        throw new Error("activation failed");
    } });
    host.enable({ id: "example.healthy", apiVersion: 1, activate(api) { api.registerTool("healthy", {}); } });
    assert.equal(host.registrations("tool").some(item => item.extensionId === "example.broken"), false);
    assert.equal(host.overlayObjects().length, 0);
    assert.equal(host.registrations("tool").some(item => item.extensionId === "example.healthy"), true);
    assert.equal(diagnostics[0].message, "activation failed");
});

test('late overlay changes invalidate the live view and disposal is idempotent', () => {
    let changes = 0;
    let api;
    const host = createEditorExtensionHost({ onChange: () => changes++ });
    host.enable({ id: 'example.async-overlay', apiVersion: 1, activate(value) { api = value; } });
    const remove = api.draw.add({ type: 'circle', x: 1, y: 1, radius: 1 });
    assert.equal(changes, 1);
    assert.equal(host.drawings().length, 1);
    remove();
    assert.equal(changes, 2);
    assert.equal(host.drawings().length, 0);
    remove();
    assert.equal(changes, 2);
    host.dispose();
});

test("project extensions load only from explicit, safe project-relative opt-in entries", async () => {
    const reads = [];
    const reports = [];
    const project = { editorExtensions: { version: 1, entries: [
        { id: "off", path: "extensions/off.mjs", enabled: false },
        { id: "bad", path: "../outside.mjs", enabled: true },
        { id: "good", path: "examples/tool.mjs", enabled: true }
    ] } };
    const loaded = await loadProjectEditorExtensions(project, {
        readEntry: async path => { reads.push(path); return "source"; },
        importSource: async () => ({ default: { id: "good", apiVersion: 1, activate() {} } }),
        report: value => reports.push(value)
    });
    assert.deepEqual(reads, ["examples/tool.mjs"]);
    assert.equal(loaded.length, 1);
    assert.equal(reports.length, 1);
    assert.deepEqual(await loadProjectEditorExtensions({}, {}), []);
});

test("authored UI scene data validates and survives runtime scene load and serialization", () => {
    ComponentRegistry.register("Transform", Transform);
    ComponentRegistry.register("BoxCollider", BoxCollider);
    const source = {
        type: "scene", version: "1.0.0", schemaVersion: 1, id: "ui-scene", name: "UI Scene",
        ui: { version: 1, elements: [{ id: "title", type: "text", x: 0, y: 12, anchor: { x: "center", y: "top" }, text: "Welcome", zIndex: 5 }] },
        entities: [{ id: "wall", name: "Wall", components: [
            { type: "Transform", props: { position: { x: 3, y: 4 } } },
            { type: "BoxCollider", props: { size: { x: 2, y: 1 } } }
        ] }]
    };
    const scene = SceneLoader.parse(source);
    assert.deepEqual(scene.ui, validateAuthoredUI(source.ui));
    assert.deepEqual(scene.serialize().ui, validateAuthoredUI(source.ui));
    const host = createEditorExtensionHost();
    host.enable({ id: "editor.overlay-only", apiVersion: 1, activate(api) {
        api.editorOverlay.add({ id: "not-a-game-entity", x: 0, y: 0 });
        api.draw.add({ type: "rect", x: 0, y: 0, width: 2, height: 1 });
    } });
    const savedScene = scene.serialize();
    assert.equal(JSON.stringify(savedScene).includes("not-a-game-entity"), false);
    assert.equal(savedScene.layers[0].entities[0].components.find(component => component.type === "BoxCollider").props.size.x, 2);
    host.dispose();
    SceneManager.removeScene(scene);
    assert.throws(() => SceneLoader.validate({ ...source, ui: { version: 1, elements: [{ id: "bad", type: "text", color: "url(javascript:alert(1))" }] } }), /color\/background/);
    ComponentRegistry.clear();
});
