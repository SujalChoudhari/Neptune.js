import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { buildSync } from "esbuild";

const sourcefile = path.resolve("triton/src/lib/editorGameRunner.ts");
const bundle = buildSync({ bundle: true, format: "cjs", platform: "node", write: false,
    stdin: { contents: fs.readFileSync(sourcefile, "utf8"), loader: "ts", sourcefile, resolveDir: path.dirname(sourcefile) }
}).outputFiles[0].text;
const module = { exports: {} };
const activities = [];
vm.runInNewContext(bundle, { module, exports: module.exports, require: id => { throw new Error(`Unexpected import: ${id}`); },
    window: { dispatchEvent: event => { if (event.type === "editor:activity") activities.push(event.detail); } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
});
const runner = module.exports.EditorGameRunner;
const scene = name => ({ type: "scene", version: "1.0.0", schemaVersion: 1, name,
    entities: [{ id: "hero", name: "Hero", children: [] }], layers: [] });

test("edits made while a scene save is pending remain visible and dirty", async () => {
    runner.openScene(scene("First"), "first.scene");
    let finish;
    let saved;
    const saving = runner.saveScene((path, content) => {
        saved = JSON.parse(content);
        return new Promise(resolve => { finish = resolve; });
    });
    assert.equal(runner.updateEntity("hero", "name", { value: "Edited while saving" }), true);
    finish(true);
    await saving;
    assert.equal(saved.entities[0].name, "Hero");
    assert.equal(runner.currentScene.entities[0].name, "Edited while saving");
    assert.equal(runner.isDirty, true);
});

test("completion of an old scene save cannot replace a newly opened scene", async () => {
    runner.openScene(scene("First"), "first.scene");
    let finish;
    const saving = runner.saveScene(() => new Promise(resolve => { finish = resolve; }));
    runner.openScene(scene("Second"), "second.scene");
    assert.equal(runner.updateEntity("hero", "name", { value: "Second edit" }), true);
    finish(true);
    await saving;
    assert.equal(runner.currentScene.name, "Second");
    assert.equal(runner.currentScene.entities[0].name, "Second edit");
    assert.equal(runner.currentScenePath, "second.scene");
    assert.equal(runner.isDirty, true);
});

test("overlapping saves cannot overwrite the latest editor edit on disk", async () => {
    runner.openScene(scene("First"), "first.scene");
    let finishFirst;
    const writes = [];
    const write = (path, content) => {
        writes.push(JSON.parse(content).entities[0].name);
        if (writes.length === 1) return new Promise(resolve => { finishFirst = resolve; });
        return Promise.resolve(true);
    };
    const first = runner.saveScene(write);
    runner.updateEntity("hero", "name", { value: "Latest" });
    const second = runner.saveScene(write);
    await Promise.resolve();
    assert.deepEqual(writes, ["Hero"], "second write must wait for the first native write");
    finishFirst(true);
    await Promise.all([first, second]);
    assert.deepEqual(writes, ["Hero", "Latest"]);
    assert.equal(runner.isDirty, false);
});

test("a failed native write does not block the next queued save", async () => {
    runner.openScene(scene("Retry"), "retry.scene");
    let rejectFirst;
    const writes = [];
    const write = (path, content) => {
        writes.push(JSON.parse(content).entities[0].name);
        if (writes.length === 1) return new Promise((resolve, reject) => { rejectFirst = reject; });
        return Promise.resolve(true);
    };
    const first = runner.saveScene(write);
    runner.updateEntity("hero", "name", { value: "Recovered" });
    const retry = runner.saveScene(write);
    rejectFirst(new Error("disk temporarily unavailable"));
    await assert.rejects(first, /disk temporarily unavailable/);
    await retry;
    assert.deepEqual(writes, ["Hero", "Recovered"]);
    assert.equal(runner.isDirty, false);
});

test("save activity reports pending then ready only after the write resolves", async () => {
    runner.openScene(scene("Activity"), "activity.scene");
    activities.length = 0;
    let finish;
    const saving = runner.saveScene(() => new Promise(resolve => { finish = resolve; }));
    assert.deepEqual(activities.map(item => item.type), ["pending"]);
    assert.match(activities[0].message, /Saving scene/);
    finish(true);
    await saving;
    assert.deepEqual(activities.map(item => item.type), ["pending", "ready"]);
    assert.match(activities[1].message, /Scene saved/);
});

test("saving an older snapshot keeps newer edits explicitly unsaved in activity", async () => {
    runner.openScene(scene("Snapshot"), "snapshot.scene");
    activities.length = 0;
    let finish;
    const saving = runner.saveScene(() => new Promise(resolve => { finish = resolve; }));
    runner.updateEntity("hero", "name", { value: "Newer edit" });
    finish(true);
    await saving;
    assert.equal(runner.isDirty, true);
    assert.equal(activities.at(-1).type, "info");
    assert.match(activities.at(-1).message, /newer edits remain unsaved/);
});

test("failed save reports error and an old save completion cannot overwrite current activity", async () => {
    runner.openScene(scene("Failure"), "failure.scene");
    activities.length = 0;
    await assert.rejects(runner.saveScene(async () => { throw new Error("disk unavailable"); }), /disk unavailable/);
    assert.deepEqual(activities.map(item => item.type), ["pending", "error"]);

    runner.openScene(scene("Old"), "old.scene");
    activities.length = 0;
    let finish;
    const saving = runner.saveScene(() => new Promise(resolve => { finish = resolve; }));
    runner.openScene(scene("Current"), "current.scene");
    activities.push({ type: "info", message: "Current scene loaded" });
    finish(true);
    await saving;
    assert.deepEqual(activities.map(item => item.type), ["pending", "info"]);
});
