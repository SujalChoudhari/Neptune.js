import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import vm from "node:vm";

const sourcefile = "triton/src/lib/hierarchyShortcuts.ts";
const bundle = buildSync({ entryPoints: [sourcefile], bundle: true, format: "cjs", platform: "node", write: false }).outputFiles[0].text;
const module = { exports: {} };
vm.runInNewContext(bundle, { module, exports: module.exports });
const { handleHierarchyShortcut } = module.exports;

function press(key, element) {
    const removed = [];
    const renamed = [];
    let prevented = false;
    handleHierarchyShortcut({ key, preventDefault: () => { prevented = true; } }, element, ["hero"], id => removed.push(id), id => renamed.push(id));
    return { removed, renamed, prevented };
}

test("Delete and F2 do not mutate hierarchy while editing text", () => {
    for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) {
        assert.deepEqual(press("Delete", { tagName }).removed, []);
        assert.deepEqual(press("F2", { tagName }).renamed, []);
    }
    assert.deepEqual(press("Delete", { tagName: "DIV", isContentEditable: true }).removed, []);
    assert.deepEqual(press("F2", { tagName: "SPAN", closest: () => ({}) }).renamed, []);
    assert.deepEqual(press("Delete", { tagName: "DIV" }).removed, ["hero"]);
    assert.deepEqual(press("F2", { tagName: "DIV" }).renamed, ["hero"]);
});
