import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { Application } from "../../src/core/application.js";
import { Transform } from "../../src/components/transform.js";
import { SceneTransition } from "../../src/components/sceneTransition.js";
import { SpawnPoint } from "../../src/components/spawnPoint.js";
import { Dialogue } from "../../src/components/dialogue.js";
import { QuestDefinition } from "../../src/components/questDefinition.js";
import { EnemyConfig } from "../../src/components/enemyConfig.js";
import { BoxCollider } from "../../src/components/boxCollider.js";
import { Hitbox, Hurtbox, TriggerCollider } from "../../src/nereid/collider.js";
import { Sprite } from "../../src/rendering/sprite.js";
import { createEmptyTilemap, paintTileCell, setCellMetadata, setTileMetadata } from "../src/lib/tilemapAuthoring.mjs";

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
    const originalImage = globalThis.Image;
    const originalFetch = globalThis.fetch;
    globalThis.document = {
        getElementById: id => elements.get(id) || null,
        createElement: makeElement,
        body: makeElement("body"),
        head: makeElement("head")
    };
    globalThis.window = { innerWidth: 800, innerHeight: 600, outerWidth: 800, outerHeight: 600 };
    const runtimeEntry = await import("../../src/neptune.js");
    for (const name of ["BoxCollider", "SceneTransition", "SpawnPoint", "Dialogue", "QuestDefinition", "EnemyConfig", "TriggerCollider", "Hitbox", "Hurtbox"]) {
        assert.equal(runtimeEntry.ComponentRegistry.has(name), true, `${name} is registered by the production runtime entry`);
    }
    globalThis.Image = class Image {
        set src(value) { this.source = value; }
    };
    const authoredMap = setCellMetadata(
        setCellMetadata(
            setTileMetadata(
                paintTileCell(createEmptyTilemap({
                    name: "dungeon.map",
                    width: 2,
                    height: 1,
                    columns: 8,
                    tileSize: 16,
                    tileset: "assets/dungeon.png"
                }), 0, 0, 1),
                1,
                { collision: true, walkable: false, terrain: "lava" }
            ),
            0,
            0,
            { collision: false, walkable: true }
        ),
        1,
        0,
        { collision: true, walkable: false, terrain: "wall" }
    );
    globalThis.fetch = async path => {
        assert.equal(path, "maps/dungeon.map");
        return {
            ok: true,
            async json() { return JSON.parse(JSON.stringify(authoredMap)); }
        };
    };

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
                { type: "BoxCollider", props: { width: 7, height: 9, offset: { x: 0, y: 0 }, offsetX: 1.5, offsetY: -2.5 } },
                { type: "Hitbox", props: { width: 4, height: 5, offsetX: 1, offsetY: 0 } },
                { type: "Hurtbox", props: { width: 6, height: 7, offsetX: -1, offsetY: 0 } },
                { type: "Dialogue", props: { dialogueId: "gatekeeper", startNode: "greeting" } },
                { type: "QuestDefinition", props: { questId: "find-key", title: "Find the Key", objectives: [{ id: "key", description: "Find the key" }] } },
                { type: "EnemyConfig", props: { enemyId: "guard", health: 40, damage: 7, behavior: "guard" } }
            ]
        }), true);
        const tilemapLayer = editorRunner.createTilemapLayer("maps/dungeon.map");
        assert.equal(tilemapLayer.src, "maps/dungeon.map");
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
        assert.deepEqual(
            {
                width: runtimeEntity.GetComponent(BoxCollider).size.x,
                height: runtimeEntity.GetComponent(BoxCollider).size.y,
                offsetX: runtimeEntity.GetComponent(BoxCollider).offset.x,
                offsetY: runtimeEntity.GetComponent(BoxCollider).offset.y
            },
            { width: 7, height: 9, offsetX: 1.5, offsetY: -2.5 }
        );
        assert.equal(runtimeEntity.GetComponent(Hitbox).width, 4);
        assert.equal(runtimeEntity.GetComponent(Hurtbox).height, 7);
        assert.equal(runtimeEntity.GetComponent(Dialogue).properties.dialogueId, "gatekeeper");
        assert.equal(runtimeEntity.GetComponent(QuestDefinition).properties.questId, "find-key");
        assert.equal(runtimeEntity.GetComponent(EnemyConfig).properties.enemyId, "guard");
        const paintedTile = runtimeScene.children.find(entity => entity.tileId === 1);
        const blockedEmptyCell = runtimeScene.children.find(entity => entity.tileId === 0);
        assert.deepEqual(paintedTile.tileMetadata, { collision: false, walkable: true, terrain: "lava" });
        assert.equal(paintedTile.GetComponent(BoxCollider), undefined);
        assert.deepEqual(blockedEmptyCell.tileMetadata, { collision: true, walkable: false, terrain: "wall" });
        assert.ok(blockedEmptyCell.GetComponent(BoxCollider), "authored blocked empty cell becomes a runtime collider");
    } finally {
        if (originalDocument === undefined) delete globalThis.document;
        else globalThis.document = originalDocument;
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
        if (originalImage === undefined) delete globalThis.Image;
        else globalThis.Image = originalImage;
        if (originalFetch === undefined) delete globalThis.fetch;
        else globalThis.fetch = originalFetch;
    }
});
