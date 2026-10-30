import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { buildSync } from "esbuild";

const sourcefile = path.resolve("triton/src/lib/editorGameRunner.ts");
const bundle = buildSync({
    bundle: true, format: "cjs", platform: "node", write: false,
    stdin: { contents: fs.readFileSync(sourcefile, "utf8"), loader: "ts", sourcefile }
}).outputFiles[0].text;
const module = { exports: {} };
vm.runInNewContext(bundle, { module, exports: module.exports, require: id => { throw new Error(`Unexpected import: ${id}`); } });
const { resolveHierarchyDropIndex } = module.exports.EditorGameRunner;

test("same-parent drops account for removed siblings before the drop target", () => {
    const children = ["a", "b", "c", "d"];
    assert.equal(resolveHierarchyDropIndex(children, ["a"], "after", "c"), 2);
    assert.equal(resolveHierarchyDropIndex(children, ["a"], "before", "c"), 1);
    assert.equal(resolveHierarchyDropIndex(children, ["d"], "before", "b"), 1);
    assert.equal(resolveHierarchyDropIndex(children, ["a", "b"], "after", "d"), 2);
    assert.equal(resolveHierarchyDropIndex(children, ["b"], "after", "b"), null);
});

test("adjusted drop index persists the intended sibling order", () => {
    const runner = module.exports.EditorGameRunner;
    runner.currentScene = {
        entities: ["a", "b", "c", "d"].map(id => ({ id, name: id, children: [] }))
    };
    const siblings = runner.currentScene.entities;
    const index = resolveHierarchyDropIndex(siblings.map(entity => entity.id), ["a"], "after", "c");
    assert.equal(runner.moveEntities(["a"], "root", index), true);
    assert.deepEqual(siblings.map(entity => entity.id), ["b", "c", "a", "d"]);
});
