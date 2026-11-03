import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "node:net";
import { test } from "node:test";
import { chromium } from "playwright";

const scene = {
    type: "scene", version: "1.0.0", schemaVersion: 1, id: "browser-smoke-scene", name: "Browser Smoke Scene",
    entities: [
        { id: "player", name: "Player", active: true, transform: { pos: { x: 4, y: 8 }, rot: 0, scale: { x: 1, y: 1 } }, components: [
            { type: "Shape", props: { geometry: 1, param: { width: 1, height: 1, thickness: 0.02, fill: true, color: { r: 72, g: 168, b: 255, a: 1 } } } }
        ] },
        { id: "companion", name: "Companion", active: true, components: [] }
    ]
};
const project = { type: "project", version: "1.0.0", schemaVersion: 1, name: "Inspector Smoke", mainScene: "scenes/main.scene", scenes: [] };

test("editor scene edits persist and Game View playback and diagnostics use the live runtime", async t => {
    const probe = createServer();
    probe.listen(0, "127.0.0.1");
    await once(probe, "listening");
    const { port } = probe.address();
    await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
    const server = spawn("../triton/node_modules/.bin/vite", ["--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
        cwd: new URL("..", import.meta.url), stdio: "ignore"
    });
    t.after(() => server.kill());
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
        if (server.exitCode !== null) throw new Error(`Vite exited with ${server.exitCode}`);
        try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) { ready = true; break; } } catch { /* wait */ }
        await delay(100);
    }
    assert.ok(ready, "Vite should become ready");
    const browser = await chromium.launch({ headless: true });
    t.after(() => browser.close());
    const context = await browser.newContext();
    await context.addInitScript(({ initialScene, initialProject }) => {
        window.__files = JSON.parse(localStorage.getItem("inspector_smoke_files") || "null") ||
            { "scenes/main.scene": structuredClone(initialScene), "project.npt": structuredClone(initialProject) };
        window.__nativeCalls = [];
        window.__TAURI_INTERNALS__ = { metadata: { currentWindow: { label: "main" } }, transformCallback: () => 1, invoke: async (command, args = {}) => {
            window.__nativeCalls.push({ command, args });
            if (command === "open_existing_project") return true;
            if (command === "scan_project") return {
                root: { id: "root", parentId: null, name: "Inspector Smoke", type: "folder", children: ["scene-folder"] },
                "scene-folder": { id: "scene-folder", parentId: "root", name: "scenes", type: "folder", children: ["scene"] },
                scene: { id: "scene", parentId: "scene-folder", name: "main.scene", type: "scene", children: [] }
            };
            if (command === "read_project") return JSON.stringify(window.__files["project.npt"]);
            if (command === "read_scene") return JSON.stringify(window.__files[args.path]);
            if (command === "write_scene") {
                window.__files[args.path] = JSON.parse(args.content);
                localStorage.setItem("inspector_smoke_files", JSON.stringify(window.__files));
                return true;
            }
            if (command === "write_project" || command === "sync_neptune_lib") return true;
            if (command === "read_file") return window.__files[args.path] ?? null;
            if (command === "write_file") { window.__files[args.path] = args.content; return true; }
            return null;
        }};
    }, { initialScene: scene, initialProject: project });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}`);
    await page.evaluate(() => localStorage.setItem("triton_recent_projects", JSON.stringify([
        { name: "Inspector Smoke", path: "/tmp/neptune-inspector-smoke", lastOpened: Date.now() }
    ])));
    await page.reload();
    await page.getByText("Inspector Smoke", { exact: true }).click();
    await page.getByText("Edit", { exact: true }).click();
    await page.waitForFunction(() => window.__nativeCalls.some(call => call.command === "scan_project"));
    await page.getByText("Project", { exact: true }).click();
    await page.getByRole("treeitem", { name: "scenes, folder" }).click();
    await page.getByRole("gridcell", { name: "main.scene" }).dblclick();
    await page.getByText("Player", { exact: true }).click();
    await page.getByText("Companion", { exact: true }).click({ modifiers: ["Control"] });
    await page.getByText("2 Selected", { exact: true }).waitFor();
    await page.evaluate(() => {
        const frame = document.querySelector('iframe[title="Scene View"]');
        frame.contentWindow.dispatchEvent(new frame.contentWindow.CustomEvent('neptune:selection-changed', { detail: { ids: ['companion'] } }));
    });
    await page.getByText("1 Selected", { exact: true }).waitFor();
    const companionRow = page.getByText("Companion", { exact: true }).locator("xpath=ancestor::div[@draggable]");
    await companionRow.evaluate(element => { if (!element.classList.contains('bg-primary/20')) throw new Error('Scene View selection did not reach the hierarchy'); });
    await page.evaluate(() => window.postMessage({ type: 'game:selection-changed', payload: { ids: ['player'] } }, '*'));
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
    await companionRow.evaluate(element => { if (!element.classList.contains('bg-primary/20')) throw new Error('Foreign selection replaced the live selection'); });
    await page.getByText("Player", { exact: true }).click();
    await page.getByText("Position", { exact: true }).locator("xpath=..").locator('input[type="number"]').first().fill("27");
    await page.waitForFunction(() => {
        const frame = document.querySelector('iframe[title="Scene View"]');
        const player = frame?.contentWindow?.game?.scene?.children?.find(entity => entity.id === 'player');
        return player?.components?.find(component => component.constructor.name === 'Transform')?.position?.x === 27;
    });
    await page.getByTitle("Disable entity").click();
    await page.getByTitle("Enable entity").waitFor();
    await page.waitForFunction(() => {
        const frame = document.querySelector('iframe[title="Scene View"]');
        return frame?.contentWindow?.game?.scene?.children?.find(entity => entity.id === 'player')?.active === false;
    });
    await page.getByRole("button", { name: "Save scene" }).click();
    await page.waitForFunction(() => window.__files["scenes/main.scene"].entities[0].active === false);
    assert.equal(await page.evaluate(() => window.__files["scenes/main.scene"].entities[0].active), false);
    assert.equal(await page.evaluate(() => window.__files["scenes/main.scene"].entities[0].transform.pos.x), 27);
    await page.getByText("Player", { exact: true }).click();
    await page.keyboard.press("F2");
    await page.locator('[data-hierarchy-panel] input[type="text"]:not([placeholder])').fill("Hero");
    await page.keyboard.press("Enter");
    await page.getByText("Hero", { exact: true }).waitFor();
    await page.getByText("Hero", { exact: true }).click({ button: "right" });
    await page.getByRole("button", { name: "Duplicate", exact: true }).click();
    await page.getByText("Companion", { exact: true }).locator("xpath=ancestor::div[@draggable]").getByRole("button", { name: "Delete entity" }).click();
    await page.getByRole("button", { name: "Save scene" }).click();
    await page.waitForFunction(() => window.__nativeCalls.some(call => call.command === "write_scene"));
    const saved = await page.evaluate(() => window.__files["scenes/main.scene"]);
    assert.equal(saved.entities[0].id, "player");
    assert.equal(saved.entities[0].name, "Hero");
    assert.equal(saved.entities[0].active, false);
    assert.equal(saved.entities.length, 2);
    assert.notEqual(saved.entities[1].id, saved.entities[0].id);
    assert.equal(saved.entities[1].name, "Hero");
    await page.reload();
    await page.getByText("neptune-inspector-smoke", { exact: true }).click();
    await page.getByText("Edit", { exact: true }).click();
    await page.waitForFunction(() => window.__nativeCalls.some(call => call.command === "scan_project"));
    await page.getByText("Project", { exact: true }).click();
    await page.getByRole("treeitem", { name: "scenes, folder" }).click();
    await page.getByRole("gridcell", { name: "main.scene" }).dblclick();
    assert.ok(await page.evaluate(() => window.__nativeCalls.filter(call => call.command === "read_scene").length >= 2));
    assert.equal(await page.evaluate(() => window.__files["scenes/main.scene"].entities[0].name), "Hero");
    assert.equal(await page.locator('[data-hierarchy-panel]').getByText("Hero", { exact: true }).count(), 2);
    await page.locator('[data-hierarchy-panel]').getByText("Hero", { exact: true }).first().click();
    await page.getByTitle("Enable entity").waitFor();
    assert.ok(await page.evaluate(() => window.__nativeCalls.some(call => call.command === "read_scene" && call.args.path === "scenes/main.scene")));
    await page.getByTitle("Enable entity").click();
    const position = page.getByText("Position", { exact: true }).locator("xpath=..").locator('input[type="number"]');
    await position.first().fill("2");
    await position.nth(1).fill("2");
    // Exercise the actual Game View iframe and toolbar, not a mocked control bridge.
    await page.getByText("Game View", { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('iframe[title="Game View"]')?.contentWindow?.game?.scene?.children?.some(entity => entity.id === 'player'));
    await page.evaluate(() => {
        const frame = document.querySelector('iframe[title="Game View"]');
        const canvas = frame.contentWindow.document.getElementById('neptune-canvas');
        const rect = canvas.getBoundingClientRect();
        canvas.dispatchEvent(new frame.contentWindow.PointerEvent('pointerdown', {
            bubbles: true, button: 0, clientX: rect.left + 128 * rect.width / canvas.width,
            clientY: rect.top + 128 * rect.height / canvas.height
        }));
    });
    await page.waitForFunction(() => document.querySelector('iframe[title="Game View"]')?.contentWindow?.game?.editorSelection?.includes('player'));
    await page.locator('[data-hierarchy-panel]').getByText("Hero", { exact: true }).first().locator("xpath=ancestor::div[@draggable]")
        .evaluate(element => { if (!element.classList.contains('bg-primary/20')) throw new Error('Game View Shape pick did not reach hierarchy'); });
    await page.getByTitle("Play", { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('iframe[title="Game View"]')?.contentWindow?.game?.isRunning === true);
    await page.getByTitle("Pause", { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('iframe[title="Game View"]')?.contentWindow?.game?.isPaused === true);
    await page.getByTitle("Play", { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('iframe[title="Game View"]')?.contentWindow?.game?.isPaused === false);
    await page.getByTitle("Stop", { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('iframe[title="Game View"]')?.contentWindow?.game?.isRunning === false);
    await page.getByTitle("Play", { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('iframe[title="Game View"]')?.contentWindow?.game?.isRunning === true);
    await page.evaluate(() => document.querySelector('iframe[title="Game View"]').contentWindow.postMessage({
        type: 'editor:load-scene', payload: { path: 'scenes/broken.scene', data: { schemaVersion: 999, entities: [] } }
    }, '*'));
    await page.getByText("Console", { exact: true }).click();
    await page.getByText(/GAME_SCENE_LOAD_ERROR.*scenes\/broken.scene/).waitFor();
    await page.evaluate(() => document.querySelector('iframe[title="Game View"]').contentWindow.console.warn('playback smoke warning'));
    await page.getByText("playback smoke warning", { exact: true }).waitFor();
    await page.getByTitle("Stop", { exact: true }).click();
    assert.deepEqual(errors, [], `unexpected browser errors: ${errors.join("; ")}`);
});