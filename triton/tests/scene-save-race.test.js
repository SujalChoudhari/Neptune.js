import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { buildSync } from "esbuild";

const sourcefile = path.resolve("triton/src/lib/editorGameRunner.ts");
const bundle = buildSync({ bundle: true, format: "cjs", platform: "node", write: false,
    stdin: { contents: fs.readFileSync(sourcefile, "utf8"), loader: "ts", sourcefile }
}).outputFiles[0].text;
const module = { exports: {} };
vm.runInNewContext(bundle, { module, exports: module.exports, require: id => { throw new Error(`Unexpected import: ${id}`); } });
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
