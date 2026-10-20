import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { Application } from "../../src/core/application.js";
import { ComponentRegistry } from "../../src/core/componentRegistry.js";
import { Transform } from "../../src/components/transform.js";
import { SceneTransition } from "../../src/components/sceneTransition.js";
import { SpawnPoint } from "../../src/components/spawnPoint.js";
import { Dialogue } from "../../src/components/dialogue.js";
import { QuestDefinition } from "../../src/components/questDefinition.js";
import { EnemyConfig } from "../../src/components/enemyConfig.js";
import { Hitbox, Hurtbox, TriggerCollider } from "../../src/nereid/collider.js";

for (const [name, component] of Object.entries({ Transform, SceneTransition, SpawnPoint, Dialogue, QuestDefinition, EnemyConfig, TriggerCollider, Hitbox, Hurtbox })) {
    ComponentRegistry.register(name, component);
}

function createEditorRunner() {
    const sourcefile = path.resolve("triton/src/lib/editorGameRunner.ts");
    const bundle = buildSync({
        bundle: true,
        format: "cjs",
        platform: "node",
        write: false,
        stdin: { contents: fs.readFileSync(sourcefile, "utf8"), loader: "ts", sourcefile }
    }).outputFiles[0].text;
    const module = { exports: {} };
    vm.runInNewContext(bundle, {
        console,
        Promise,
        CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
        window: { dispatchEvent() {} },
        module,
        exports: module.exports,
        require: id => { throw new Error(`Unexpected editor runner import: ${id}`); }
    });
    return module.exports.EditorGameRunner;
}

test("saved editor-authored scene loads through the Application runtime", async () => {
    const elements = new Map();
    const makeElement = tagName => ({
        tagName,
        style: {},
        setAttribute(name, value) {
            this[name] = value;
            if (name === "id") this.id = value;
        },
        appendChild(child) {
            if (child.id) elements.set(child.id, child);
            return child;
        },
        focus() {},
        remove() {},
        getContext() { return {}; }
    });
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    globalThis.document = {
        getElementById: id => elements.get(id) || null,
        createElement: makeElement,
        body: makeElement("body"),
        head: makeElement("head")
    };
    globalThis.window = { innerWidth: 800, innerHeight: 600, outerWidth: 800, outerHeight: 600 };

    try {
        const editorRunner = createEditorRunner();
        editorRunner.openScene({
            type: "scene", version: "1.0.0", schemaVersion: 1, id: "scene-authored-runtime",
            name: "Authored Runtime Smoke", entities: []
        }, "scenes/authored-runtime.scene");
        assert.equal(editorRunner.createEntity("root", {
            id: "spawn-authored-1",
            name: "Player Spawn",
            type: "spawn-point",
            transform: { pos: { x: 8, y: 13 }, rot: 0.25, scale: { x: 1, y: 1 } },
            components: [
                { type: "SpawnPoint", props: { spawnId: "dungeon-entry", facing: "left" } },
                { type: "SceneTransition", props: { targetScene: "scenes/dungeon.scene", spawnPoint: "dungeon-entry", trigger: "interact" } },
                { type: "TriggerCollider", props: { width: 2, height: 3, offsetX: 0.5, offsetY: -1 } },
                { type: "Hitbox", props: { width: 4, height: 5, offsetX: 1, offsetY: 0 } },
                { type: "Hurtbox", props: { width: 6, height: 7, offsetX: -1, offsetY: 0 } },
                { type: "Dialogue", props: { dialogueId: "gatekeeper", startNode: "greeting" } },
                { type: "QuestDefinition", props: { questId: "find-key", title: "Find the Key", objectives: [{ id: "key", description: "Find the key" }] } },
                { type: "EnemyConfig", props: { enemyId: "guard", health: 40, damage: 7, behavior: "guard" } }
            ]
        }), true);
        let savedPath;
        let savedContent;
        await editorRunner.saveScene(async (filePath, content) => {
            savedPath = filePath;
            savedContent = content;
            return true;
        });
        assert.equal(savedPath, "scenes/authored-runtime.scene");

        const application = new Application();
        await application.loadScene(JSON.parse(savedContent));
        const runtimeScene = application.scene;
        assert.equal(runtimeScene.name, "Authored Runtime Smoke");
        const runtimeEntity = runtimeScene.children.find(entity => entity.id === "spawn-authored-1");
        assert.ok(runtimeEntity, "authored entity ID is preserved by the runtime loader");
        assert.deepEqual(
            { x: runtimeEntity.GetComponent(Transform).position.x, y: runtimeEntity.GetComponent(Transform).position.y },
            { x: 8, y: 13 }
        );
        assert.deepEqual(runtimeEntity.GetComponent(SpawnPoint).properties, { spawnId: "dungeon-entry", facing: "left" });
        assert.deepEqual(runtimeEntity.GetComponent(SceneTransition).properties, {
            targetScene: "scenes/dungeon.scene", spawnPoint: "dungeon-entry", trigger: "interact"
        });
        assert.equal(runtimeEntity.GetComponent(TriggerCollider).height, 3);
        assert.equal(runtimeEntity.GetComponent(Hitbox).width, 4);
        assert.equal(runtimeEntity.GetComponent(Hurtbox).height, 7);
        assert.equal(runtimeEntity.GetComponent(Dialogue).properties.dialogueId, "gatekeeper");
        assert.equal(runtimeEntity.GetComponent(QuestDefinition).properties.questId, "find-key");
        assert.equal(runtimeEntity.GetComponent(EnemyConfig).properties.enemyId, "guard");
    } finally {
        if (originalDocument === undefined) delete globalThis.document;
        else globalThis.document = originalDocument;
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
    }
});
