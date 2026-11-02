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
    const row = { tagName: "DIV", closest: selector => selector === '[data-hierarchy-panel]' ? {} : null };
    assert.deepEqual(press("Delete", row).removed, ["hero"]);
    assert.deepEqual(press("F2", row).renamed, ["hero"]);
});

test("modified shortcuts do not delete or rename the selected entity", () => {
    for (const modifier of ["ctrlKey", "metaKey", "altKey", "shiftKey"]) {
        for (const key of ["Delete", "F2"]) {
            const removed = [];
            const renamed = [];
            let prevented = false;
            handleHierarchyShortcut({ key, [modifier]: true, preventDefault: () => { prevented = true; } },
                { tagName: "DIV", closest: selector => selector === '[data-hierarchy-panel]' ? {} : null }, ["hero"], id => removed.push(id), id => renamed.push(id));
            assert.deepEqual({ removed, renamed, prevented }, { removed: [], renamed: [], prevented: false }, `${modifier}+${key}`);
        }
    }
});

test("hierarchy shortcuts leave selections untouched when another panel has focus", () => {
    for (const key of ["Delete", "F2"]) {
        const result = press(key, { tagName: "DIV", closest: () => null });
        assert.deepEqual(result, { removed: [], renamed: [], prevented: false });
        assert.deepEqual(press(key, null), result);
    }
});

test("Delete removes selected descendants before ancestors so each canonical deletion can succeed", () => {
    const parents = { parent: "root", child: "parent", sibling: "root" };
    const remaining = new Set(Object.keys(parents));
    const deleted = [];
    const row = { tagName: "DIV", closest: selector => selector === '[data-hierarchy-panel]' ? {} : null };
    handleHierarchyShortcut({ key: "Delete", preventDefault() {} }, row, ["parent", "child", "sibling"], id => {
        if (!remaining.has(id)) throw new Error(`Canonical entity ${id} was already deleted`);
        deleted.push(id);
        remaining.delete(id);
        if (id === "parent") remaining.delete("child");
    }, () => {}, parents);
    assert.deepEqual(deleted, ["child", "parent", "sibling"]);
    assert.equal(remaining.size, 0);
});
