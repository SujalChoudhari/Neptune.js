import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { Application } from "../../src/core/application.js";
import { Scene } from "../../src/core/scene.js";
import { SceneManager } from "../../src/core/sceneManager.js";
import { Transform } from "../../src/components/transform.js";
import { SceneTransition } from "../../src/components/sceneTransition.js";
import { SpawnPoint } from "../../src/components/spawnPoint.js";
import { Dialogue } from "../../src/components/dialogue.js";
import { QuestDefinition } from "../../src/components/questDefinition.js";
import { EnemyConfig } from "../../src/components/enemyConfig.js";
import { BoxCollider } from "../../src/components/boxCollider.js";
import { Hitbox, Hurtbox, TriggerCollider } from "../../src/nereid/collider.js";
import { CollisionSystem } from "../../src/nereid/collisionSystem.js";
import { Sprite } from "../../src/rendering/sprite.js";
import { createEmptyTilemap, paintTileCell, setCellMetadata, setTileMetadata } from "../src/lib/tilemapAuthoring.mjs";
import { createRuntimeEntity, runtimeEntityBridgeScript } from "../src/lib/runtimeEntityBridge.mjs";

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
        if (path === "scenes/dungeon.scene") {
            return {
                ok: true,
                async json() {
                    return {
                        type: "scene", version: "1.0.0", schemaVersion: 1, id: "scene-runtime-dungeon",
                        name: "Runtime Dungeon",
                        entities: [{
                            id: "arrival-container",
                            name: "Arrival Container",
                            children: [{
                                id: "dungeon-arrival",
                                name: "Dungeon Arrival",
                                transform: { pos: { x: 18, y: -6 }, rot: 0, scale: { x: 1, y: 1 } },
                                components: [{ type: "SpawnPoint", props: { spawnId: "dungeon-arrival", facing: "left" } }]
                            }]
                        }],
                        layers: []
                    };
                }
            };
        }
        assert.equal(path, "maps/dungeon.map");
        return {
            ok: true,
            async json() { return JSON.parse(JSON.stringify(authoredMap)); }
        };
    };

    try {
        SceneManager.removeAllScenes();
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
        assert.equal(editorRunner.createEntity("root", {
            id: "door-authored-1",
            name: "Dungeon Door",
            type: "empty",
            transform: { pos: { x: 2, y: 3 }, rot: 0, scale: { x: 1, y: 1 } },
            components: [
                { type: "TriggerCollider", props: { width: 32, height: 32 } },
                { type: "SceneTransition", props: { targetScene: "scenes/dungeon.scene", spawnPoint: "dungeon-arrival", trigger: "enter" } }
            ]
        }), true);
        assert.equal(editorRunner.createEntity("root", {
            id: "transition-actor-1",
            name: "Transition Actor",
            type: "empty",
            transform: { pos: { x: 1, y: 2 }, rot: 0.5, scale: { x: 1, y: 1 } },
            components: []
        }), true);
        assert.equal(editorRunner.moveEntities(["transition-actor-1"], "spawn-authored-1"), true);
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
        const nestedActor = runtimeEntity.children.find(entity => entity.id === "transition-actor-1");
        assert.ok(nestedActor, "editor reparenting survives save and Application.loadScene as a nested runtime entity");
        assert.equal(nestedActor.parent, runtimeEntity);
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

        const navigationMap = runtimeScene.getNavigationTilemap("maps/dungeon.map");
        assert.ok(navigationMap, "Application.loadScene exposes the loaded map as a runtime navigation grid");
        assert.deepEqual(navigationMap.data, [0, -1], "editor tile IDs become zero-based runtime IDs and empty cells stay empty");
        assert.deepEqual(navigationMap.getTileMetadata(0), { collision: true, walkable: false, terrain: "lava" });
        assert.deepEqual(navigationMap.getResolvedMetadata(0, 0), { collision: false, walkable: true, terrain: "lava" });
        assert.equal(navigationMap.isWalkable(0, 0), true, "cell metadata overrides the tile's blocked default");
        assert.equal(navigationMap.isSolid(0, 0), false, "cell metadata overrides the tile's collision default");
        assert.equal(navigationMap.isWalkable(1, 0), false, "authored blocked empty cells remain unavailable to pathfinding");
        assert.equal(navigationMap.isSolid(1, 0), true, "authored collision on an empty cell remains solid");
        assert.equal(navigationMap.findPath(0, 0, 1, 0), null, "a blocked authored empty cell prevents a route");
        navigationMap.setCellMetadata(1, 0, { collision: false, walkable: true, terrain: "safe-path" });
        assert.deepEqual(navigationMap.findPath(0, 0, 1, 0), [{ x: 1, y: 0 }], "opening the cell enables the runtime route");

        const liveHitbox = createRuntimeEntity(application, runtimeEntry, {
            id: "live-hitbox-child",
            parentId: "spawn-authored-1",
            name: "Live Hitbox",
            active: true,
            transform: { pos: { x: 3, y: 4 }, rot: 0.5, scale: { x: 1, y: 1 } },
            components: [{ type: "Hitbox", props: { width: 3, height: 5, offsetX: 1, offsetY: -2 } }]
        });
        assert.ok(liveHitbox, "the live runtime bridge creates an authored child entity");
        assert.equal(liveHitbox.GetComponent(Hitbox).width, 3);
        assert.equal(runtimeEntity.children.some(entity => entity.id === "live-hitbox-child"), true);

        const bridgeListeners = [];
        const bridgeWindow = {
            game: application,
            __neptuneEngineModule: runtimeEntry,
            addEventListener(type, listener) {
                if (type === "message") bridgeListeners.push(listener);
            }
        };
        vm.runInNewContext(runtimeEntityBridgeScript, { window: bridgeWindow });
        bridgeListeners[0]({
            data: {
                type: "editor:create-entity",
                payload: {
                    id: "message-authored-spawn",
                    parentId: "root",
                    name: "Message Spawn",
                    active: true,
                    transform: { pos: { x: 11, y: 12 }, rot: 0, scale: { x: 1, y: 1 } },
                    components: [{ type: "SpawnPoint", props: { spawnId: "message-entry", facing: "left" } }]
                }
            }
        });
        const messageSpawn = runtimeScene.children.find(entity => entity.id === "message-authored-spawn");
        assert.ok(messageSpawn, "the iframe message bridge inserts the entity into the live scene");
        assert.deepEqual(messageSpawn.GetComponent(SpawnPoint).properties, { spawnId: "message-entry", facing: "left" });

        let activeSceneUnloads = 0;
        runtimeScene.OnSceneUnload = () => { activeSceneUnloads += 1; };
        const unrelatedScene = new Scene("Unrelated Runtime Scene");
        assert.equal(editorRunner.createEntity("root", {
            id: "same-id-reload-entity",
            name: "Reloaded Editor Entity",
            type: "empty"
        }), true);
        let updatedSavedContent;
        await editorRunner.saveScene(async (filePath, content) => {
            assert.equal(filePath, "scenes/authored-runtime.scene");
            updatedSavedContent = content;
            return true;
        });
        await application.loadScene(JSON.parse(updatedSavedContent));

        const reloadedScene = application.scene;
        assert.notEqual(reloadedScene, runtimeScene, "same-ID reload replaces the stale active Scene object");
        assert.ok(
            reloadedScene.children.some(entity => entity.id === "same-id-reload-entity"),
            "Application.loadScene exposes the newly saved editor-authored entity"
        );
        assert.equal(activeSceneUnloads, 1, "the replaced active scene unload callback runs exactly once");
        assert.equal(SceneManager.GetScene(reloadedScene.id), reloadedScene);
        assert.equal(SceneManager.GetSceneByName(unrelatedScene.name), unrelatedScene, "unrelated runtime scenes remain registered");
        assert.equal(
            SceneManager.GetScenes().filter(scene => scene.id === reloadedScene.id).length,
            1,
            "only one runtime scene remains registered for the persisted scene ID"
        );

        const authoredDoor = reloadedScene.children.find(entity => entity.id === "door-authored-1");
        const authoredTransition = authoredDoor?.GetComponent(SceneTransition);
        const doorTrigger = authoredDoor?.GetComponent(TriggerCollider);
        const reloadedParent = reloadedScene.children.find(entity => entity.id === "spawn-authored-1");
        const actor = reloadedParent?.children.find(entity => entity.id === "transition-actor-1");
        assert.ok(authoredTransition, "saved editor SceneTransition is restored by SceneLoader");
        assert.ok(doorTrigger, "saved editor TriggerCollider is restored by SceneLoader");
        assert.ok(actor, "saved editor actor is restored before runtime trigger activation");
        actor.runtimeHealth = 73;
        const actorTrigger = new TriggerCollider(16, 16);
        actor.AddComponent(actorTrigger);
        const collisionSystem = new CollisionSystem();
        collisionSystem.step([
            { collider: doorTrigger, x: 0, y: 0, entity: authoredDoor },
            { collider: actorTrigger, x: 0, y: 0, entity: actor }
        ]);
        assert.ok(authoredTransition.lastActivation instanceof Promise, "loaded trigger binding activates SceneTransition on overlap-enter");
        assert.equal(await authoredTransition.lastActivation, true);

        const destinationScene = SceneManager.GetActiveScene();
        assert.equal(destinationScene.name, "Runtime Dungeon");
        assert.notEqual(destinationScene, reloadedScene);
        assert.equal(reloadedScene.children.includes(actor), false, "actor leaves the authored source scene");
        assert.equal(reloadedParent.children.includes(actor), false, "actor is detached from its authored nested parent");
        assert.equal(destinationScene.children.includes(actor), true, "actor is transferred into the loaded destination scene");
        assert.equal(actor.parent, destinationScene);
        assert.equal(actor.runtimeHealth, 73, "runtime-only actor state survives the authored transition");
        assert.deepEqual(
            { x: actor.GetComponent(Transform).position.x, y: actor.GetComponent(Transform).position.y },
            { x: 18, y: -6 },
            "actor is placed at the destination's saved SpawnPoint"
        );
        assert.equal(actor.GetComponent(Transform).rotation, Math.PI, "left-facing SpawnPoint sets actor orientation");
        assert.equal(SceneManager.GetScene(destinationScene.id), destinationScene);
        assert.equal(SceneManager.GetScenes().filter(scene => scene.id === destinationScene.id).length, 1);
    } finally {
        SceneManager.removeAllScenes();
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
