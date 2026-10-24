import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "node:net";
import { test } from "node:test";
import { chromium } from "playwright";

test("WelcomeScreen opens a selected project and reopens it from Recent Projects", async t => {
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
    assert.ok(ready);
    const browser = await chromium.launch({ headless: true });
    t.after(() => browser.close());
    const context = await browser.newContext();
    await context.addInitScript(() => {
        window.__nativeCalls = [];
        window.__TAURI_INTERNALS__ = { invoke: async (command, args) => {
            window.__nativeCalls.push({ command, args });
            if (command === "open_existing_project") { window.__nativeProjectRoot = args.path; return true; }
            if (command === "scan_project") return { root: { id: "root", parentId: null, name: "Browser Smoke Project", type: "folder", children: [] } };
            if (command === "read_project") return JSON.stringify({ type: "project", version: "1.0.0", schemaVersion: 1, name: "Browser Smoke Project", scenes: [] });
            if (command === "write_project" || command === "sync_neptune_lib") return true;
            return null;
        }};
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${port}`);
    await page.evaluate(() => localStorage.setItem("triton_recent_projects", JSON.stringify([
        { name: "Browser Smoke Project", path: "/tmp/neptune-browser-smoke", lastOpened: Date.now() }
    ])));
    await page.reload();
    await page.getByText("Browser Smoke Project", { exact: true }).click();
    await page.getByText("Edit", { exact: true }).click();
    assert.equal(await page.evaluate(() => window.__nativeProjectRoot), "/tmp/neptune-browser-smoke");
    assert.ok(await page.evaluate(() => document.querySelector("[data-testid='editor-root']") !== null || document.body.innerText.includes("Neptune Engine v")));
    assert.ok(await page.evaluate(() => window.__nativeCalls.some(c => c.command === "scan_project" && c.args.path === ".")));
    assert.ok(await page.evaluate(() => localStorage.getItem("triton_recent_projects").includes("neptune-browser-smoke")));
    assert.ok(errors.every(error => error.includes("transformCallback is not a function") || error.includes("currentWindow")), `unexpected browser errors: ${errors.join("; ")}`);
});
