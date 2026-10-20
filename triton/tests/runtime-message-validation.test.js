import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Transform } from "../../src/components/transform.js";
import { Sprite } from "../../src/rendering/sprite.js";
import { isRuntimeViewMessageSource, pickRuntimeEntityAt, readRuntimeMessage } from "../src/lib/runtimeSelectionBridge.mjs";
import { readRuntimeConsoleMessage } from "../src/lib/runtimeConsoleBridge.mjs";
import { collapseConsoleLogs, isConsoleNearBottom } from "../src/lib/consoleLogAggregation.mjs";
import { projectInspectorComponent } from "../src/lib/sceneHierarchy.mjs";

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), "utf8");

function createOverlappingSprite(id, renderOrder) {
    const transform = new Transform();
    const sprite = Object.create(Sprite.prototype);
    sprite._properties = { width: 2, height: 2, renderOrder };
    return { id, components: [transform, sprite], children: [] };
}

test("runtime Sprite picking selects the topmost overlapping renderOrder and inherits ancestor transforms", () => {
    const scene = {
        children: [createOverlappingSprite("high-order", 10), createOverlappingSprite("low-order", 0)],
        activeCamera: { screenToWorld: (x, y) => ({ x, y }) }
    };
    assert.equal(pickRuntimeEntityAt(scene, 64, 64), "high-order");

    const parent = createOverlappingSprite("parent", 10);
    const child = createOverlappingSprite("child", -10);
    parent.components[0].position.x = 3;
    parent.components[0].scale.x = 1 / 64;
    parent.components[0].scale.y = 1 / 64;
    child.components[0].position.x = 1;
    parent.children.push(child);
    assert.equal(pickRuntimeEntityAt({
        children: [parent],
        activeCamera: { screenToWorld: (x, y) => ({ x, y }) }
    }, 256, 64), "child");
});

test("editor accepts runtime state messages only from Game View and Scene View frames", () => {
    const gameViewWindow = {};
    const sceneViewWindow = {};
    const otherWindow = {};
    const frames = [{ contentWindow: gameViewWindow }, { contentWindow: sceneViewWindow }];
    const gameContext = source("../src/context/GameContext.tsx");

    assert.equal(isRuntimeViewMessageSource(gameViewWindow, frames), true);
    assert.equal(isRuntimeViewMessageSource(sceneViewWindow, frames), true);
    assert.equal(isRuntimeViewMessageSource(otherWindow, frames), false);
    assert.equal(isRuntimeViewMessageSource(null, frames), false);
    assert.equal(isRuntimeViewMessageSource(otherWindow, null), false);
    assert.match(gameContext, /isRuntimeViewMessageSource\(event\.source,\s*document\.querySelectorAll/);
});

test("Console accepts logs and diagnostics only from runtime views", () => {
    const gameViewWindow = {};
    const sceneViewWindow = {};
    const otherWindow = {};
    const frames = [{ contentWindow: gameViewWindow }, { contentWindow: sceneViewWindow }];
    const gameLog = { type: "editor:log", detail: { type: "error", message: "runtime failed" } };
    const diagnostic = { type: "editor:diagnostic", payload: { code: "GAME_BOOT_ERROR", message: "boot failed" } };

    assert.deepEqual(readRuntimeConsoleMessage({ source: gameViewWindow, data: gameLog }, frames), {
        kind: "log", type: "error", message: "runtime failed"
    });
    assert.deepEqual(readRuntimeConsoleMessage({ source: sceneViewWindow, data: diagnostic }, frames), {
        kind: "diagnostic", diagnostic: diagnostic.payload
    });
    assert.equal(readRuntimeConsoleMessage({ source: otherWindow, data: gameLog }, frames), null);
    assert.equal(readRuntimeConsoleMessage({ source: gameViewWindow, data: { type: "editor:log", detail: { type: "trace", message: "ignored" } } }, frames), null);
    assert.equal(readRuntimeConsoleMessage({ source: gameViewWindow, data: { type: "editor:log", detail: { type: "error", message: 1 } } }, frames), null);
    assert.equal(readRuntimeConsoleMessage({ source: gameViewWindow, data: { type: "editor:diagnostic", payload: null } }, frames), null);
    assert.match(source("../src/components/panels/ConsolePanel.tsx"), /readRuntimeConsoleMessage\(\s*event,\s*document\.querySelectorAll/);
});

test("runtime message parsing rejects malformed and non-runtime envelopes", () => {
    assert.equal(readRuntimeMessage(null), null);
    assert.equal(readRuntimeMessage([]), null);
    assert.equal(readRuntimeMessage({ type: 4, payload: {} }), null);
    assert.equal(readRuntimeMessage({ type: "editor:play", payload: {} }), null);
    assert.deepEqual(readRuntimeMessage({ type: "game:selection-changed", payload: { ids: ["hero"] } }), {
        type: "game:selection-changed",
        payload: { ids: ["hero"] }
    });
});

test("Console collapse groups adjacent duplicate entries without losing raw logs", () => {
    const rawLogs = [
        { id: "first", type: "info", message: "loaded", timestamp: "10:00:00", count: 1 },
        { id: "second", type: "info", message: "loaded", timestamp: "10:00:01", count: 1 },
        { id: "warning", type: "warn", message: "missing asset", timestamp: "10:00:02", count: 1 },
        { id: "third", type: "info", message: "loaded", timestamp: "10:00:03", count: 1 }
    ];

    const collapsed = collapseConsoleLogs(rawLogs);
    assert.deepEqual(collapsed.map(log => [log.id, log.type, log.message, log.count]), [
        ["first", "info", "loaded", 2],
        ["warning", "warn", "missing asset", 1],
        ["third", "info", "loaded", 1]
    ]);
    assert.deepEqual(rawLogs.map(log => log.count), [1, 1, 1, 1]);
    assert.match(source("../src/components/panels/ConsolePanel.tsx"), /collapse \? collapseConsoleLogs\(filteredLogs\) : filteredLogs/);
});

test("Console follows new logs only while the reader is near the bottom", () => {
    assert.equal(isConsoleNearBottom(500, 275, 200), true);
    assert.equal(isConsoleNearBottom(500, 150, 200), false);
    assert.equal(isConsoleNearBottom(500, 260, 200, 40), true);

    const panel = source("../src/components/panels/ConsolePanel.tsx");
    assert.match(panel, /followsLatestLog\.current = isConsoleNearBottom\(/);
    assert.match(panel, /if \(logList && followsLatestLog\.current\)/);
});

test("scene hydration preserves zero-valued Inspector component properties", () => {
    assert.deepEqual(projectInspectorComponent({ type: "Sprite", props: { width: 0, height: 0 } }), {
        sprite: { path: "", width: 0, height: 0, blendMode: "normal", color: "#ffffff" }
    });
    assert.deepEqual(projectInspectorComponent({ type: "BoxCollider", props: { width: 0, height: 0, isTrigger: false } }), {
        collider: { width: 0, height: 0, offsetX: 0, offsetY: 0, isTrigger: false }
    });
    assert.deepEqual(projectInspectorComponent({ type: "PlayerController", props: { gravity: 0, maxFallSpeed: 0 } }), {
        body: { velocityX: 0, velocityY: 0, gravity: 0, maxFallSpeed: 0, grounded: false, friction: 0, drag: 0 }
    });
    assert.match(source("../src/context/GameContext.tsx"), /Object\.assign\(fullData, projectInspectorComponent\(comp\)\)/);
});
