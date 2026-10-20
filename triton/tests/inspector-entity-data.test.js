import assert from "node:assert/strict"
import { buildSync } from "esbuild"
import { runInNewContext } from "node:vm"
import { test } from "node:test"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const source = readFileSync(path.join(root, "src/lib/inspectorEntityData.ts"), "utf8")
const { outputFiles } = buildSync({
    stdin: { contents: source, resolveDir: root, sourcefile: "inspectorEntityData.ts", loader: "ts" },
    bundle: true,
    format: "cjs",
    platform: "node",
    write: false
})
const module = { exports: {} }
runInNewContext(outputFiles[0].text, { module, exports: module.exports })
const { applyInspectorFieldUpdate } = module.exports

const entity = {
    id: "hero",
    name: "Hero",
    active: true,
    transform: { position: { x: 1, y: 2 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
    components: { Sprite: { path: "hero.png", width: 16, height: 16 } },
    sprite: { path: "hero.png", width: 16, height: 16, blendMode: "normal", color: "#fff" }
}

test("inspector field updates preserve the selected entity and transform data", () => {
    const updated = applyInspectorFieldUpdate(entity, "transform", "position", { x: 9, y: 12 })
    assert.deepEqual(updated.transform.position, { x: 9, y: 12 })
    assert.deepEqual(updated.transform.scale, { x: 1, y: 1 })
    assert.deepEqual(entity.transform.position, { x: 1, y: 2 })
})

test("inspector component edits update canonical and legacy component data immutably", () => {
    const updated = applyInspectorFieldUpdate(entity, "sprite", "width", 32)
    assert.equal(updated.components.Sprite.width, 32)
    assert.equal(updated.sprite.width, 32)
    assert.equal(updated.components.Sprite.height, 16)
    assert.equal(entity.components.Sprite.width, 16)
})

test("unknown inspector components leave entity data unchanged", () => {
    assert.equal(applyInspectorFieldUpdate(entity, "missing", "value", true), entity)
})
