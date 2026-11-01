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

test("modified shortcuts do not delete or rename the selected entity", () => {
    for (const modifier of ["ctrlKey", "metaKey", "altKey", "shiftKey"]) {
        for (const key of ["Delete", "F2"]) {
            const removed = [];
            const renamed = [];
            let prevented = false;
            handleHierarchyShortcut({ key, [modifier]: true, preventDefault: () => { prevented = true; } },
                { tagName: "DIV" }, ["hero"], id => removed.push(id), id => renamed.push(id));
            assert.deepEqual({ removed, renamed, prevented }, { removed: [], renamed: [], prevented: false }, `${modifier}+${key}`);
        }
    }
});
