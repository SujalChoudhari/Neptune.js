import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "node:net";
import { test } from "node:test";
import { chromium } from "playwright";

const scene = {
    type: "scene", version: "1.0.0", schemaVersion: 1, id: "browser-smoke-scene", name: "Browser Smoke Scene",
    entities: [{ id: "player", name: "Player", active: true, transform: { pos: { x: 4, y: 8 }, rot: 0, scale: { x: 1, y: 1 } }, components: [] }]
};
const project = { type: "project", version: "1.0.0", schemaVersion: 1, name: "Inspector Smoke", mainScene: "scenes/main.scene", scenes: [] };

test("production Inspector edits and saves a selected project scene across reopen", async t => {
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
        window.__files = { "scenes/main.scene": structuredClone(initialScene), "project.npt": structuredClone(initialProject) };
        window.__nativeCalls = [];
        window.__TAURI_INTERNALS__ = { invoke: async (command, args = {}) => {
            window.__nativeCalls.push({ command, args });
            if (command === "open_existing_project") return true;
            if (command === "scan_project") return {
                root: { id: "root", parentId: null, name: "Inspector Smoke", type: "folder", children: ["scene-folder"] },
                "scene-folder": { id: "scene-folder", parentId: "root", name: "scenes", type: "folder", children: ["scene"] },
                scene: { id: "scene", parentId: "scene-folder", name: "main.scene", type: "scene", children: [] }
            };
            if (command === "read_project") return JSON.stringify(window.__files["project.npt"]);
            if (command === "read_scene") return JSON.stringify(window.__files[args.path]);
            if (command === "write_scene") { window.__files[args.path] = JSON.parse(args.content); return true; }
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
    await page.getByRole("treeitem", { name: "scenes, folder" }).click();
    await page.getByRole("gridcell", { name: "main.scene" }).dblclick();
    await page.getByText("Player", { exact: true }).click();
    await page.getByRole("button", { name: "Save scene" }).click();
    await page.waitForFunction(() => window.__nativeCalls.some(call => call.command === "write_scene"));
    const saved = await page.evaluate(() => window.__files["scenes/main.scene"]);
    assert.equal(saved.entities[0].id, "player");
    assert.equal(saved.entities[0].name, "Player");
    await page.reload();
    await page.getByText("Inspector Smoke", { exact: true }).click();
    await page.getByText("Edit", { exact: true }).click();
    await page.waitForFunction(() => window.__nativeCalls.some(call => call.command === "scan_project"));
    await page.getByRole("treeitem", { name: "scenes, folder" }).click();
    await page.getByRole("gridcell", { name: "main.scene" }).dblclick();
    assert.ok(await page.evaluate(() => window.__nativeCalls.filter(call => call.command === "read_scene").length >= 2));
    assert.equal(await page.evaluate(() => window.__files["scenes/main.scene"].entities[0].name), "Player");
    assert.ok(await page.evaluate(() => window.__nativeCalls.some(call => call.command === "read_scene" && call.args.path === "scenes/main.scene")));
    assert.ok(await page.evaluate(() => window.__nativeCalls.some(call => call.command === "write_scene")));
    assert.ok(errors.every(error => error.includes("transformCallback is not a function") || error.includes("currentWindow")), `unexpected browser errors: ${errors.join("; ")}`);
});