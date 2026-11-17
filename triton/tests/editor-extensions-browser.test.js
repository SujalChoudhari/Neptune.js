import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { chromium } from 'playwright';

test('opt-in extension Inspector, context action and shared authored UI work in the actual editor', { timeout: 180_000 }, async t => {
    const probe = createServer();
    probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    const server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
        cwd: new URL('../', import.meta.url), stdio: 'ignore', windowsHide: true
    });
    t.after(() => server.kill());
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
        if (server.exitCode !== null) throw new Error(`Vite exited with ${server.exitCode}`);
        try { if ((await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(1500) })).ok) { ready = true; break; } } catch { /* cold server */ }
        await delay(100);
    }
    assert.ok(ready);
    console.log('Extension integration: local editor ready');
    const browser = await chromium.launch({ headless: true });
    t.after(() => browser.close());
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.25 });
    const extension = await readFile(new URL('../../examples/editor-extensions/box-collider-area.mjs', import.meta.url), 'utf8');
    const scene = {
        type: 'scene', schemaVersion: 1, version: '1.0.0', name: 'Extension scene', id: 'extension-scene',
        ui: { version: 1, elements: [{ id: 'caption', type: 'text', anchor: { x: 'center', y: 'top' }, x: 0, y: 10, width: 180, height: 28, text: 'Authored caption', align: 'center' }] },
        entities: [{ id: 'wall', name: 'Test wall', transform: { pos: { x: 2, y: 2 }, rot: 0, scale: { x: 1, y: 1 } }, components: [
            { type: 'Shape', props: { geometry: 1, param: { width: 1, height: 1, fill: true, outline: null, color: { r: 124, g: 218, b: 194, a: 1 } } } },
            { type: 'BoxCollider', props: { size: { x: 1, y: 1 }, offset: { x: 0, y: 0 } } },
            { type: 'ProjectBehaviour', props: { module: 'scripts/game.js', settings: {} } }
        ] }]
    };
    const project = {
        type: 'project', schemaVersion: 1, version: '1.0.0', name: 'Extension browser', mainScene: 'scenes/main.scene', scenes: [],
        editorExtensions: { version: 1, entries: [{ id: 'neptune.box-collider-area', path: 'tools/area.mjs', enabled: true }] }
    };
    await context.addInitScript(({ scene, project, extension }) => {
        if (window !== window.top) return;
        if (!sessionStorage.getItem('extension-files')) sessionStorage.setItem('extension-files', JSON.stringify({ 'scenes/main.scene': scene, 'project.npt': project }));
        window.__files = JSON.parse(sessionStorage.getItem('extension-files'));
        window.__nativeCalls = [];
        window.__TAURI_INTERNALS__ = { metadata: { currentWindow: { label: 'main' } }, transformCallback: () => 1,
            invoke: async (command, args = {}) => {
                window.__nativeCalls.push({ command, args });
                if (command === 'open_existing_project' || command === 'sync_neptune_lib') return true;
                if (command === 'scan_project') return {
                    root: { id: 'root', parentId: null, name: 'Extension browser', type: 'folder', children: ['scenes', 'tools', 'scripts'] },
                    scenes: { id: 'scenes', parentId: 'root', name: 'scenes', type: 'folder', children: ['scenes/main.scene'] },
                    'scenes/main.scene': { id: 'scenes/main.scene', parentId: 'scenes', name: 'main.scene', type: 'scene', children: [] },
                    tools: { id: 'tools', parentId: 'root', name: 'tools', type: 'folder', children: ['tools/area.mjs'] },
                    'tools/area.mjs': { id: 'tools/area.mjs', parentId: 'tools', name: 'area.mjs', type: 'file', children: [] },
                    scripts: { id: 'scripts', parentId: 'root', name: 'scripts', type: 'folder', children: ['scripts/game.js'] },
                    'scripts/game.js': { id: 'scripts/game.js', parentId: 'scripts', name: 'game.js', type: 'script', children: [] }
                };
                if (command === 'read_project') return JSON.stringify(window.__files['project.npt']);
                if (command === 'read_scene') return JSON.stringify(window.__files[args.path]);
                if (command === 'write_scene') {
                    window.__files[args.path] = JSON.parse(args.content);
                    sessionStorage.setItem('extension-files', JSON.stringify(window.__files));
                    return true;
                }
                if (command === 'read_file' && args.path === 'tools/area.mjs') return extension;
                if (command === 'read_file' && args.path === 'scripts/game.js') return 'export function create() { return {start() {globalThis.__gameplayStarted=true;}, destroy() {delete globalThis.__gameplayStarted;}}; }';
                return null;
            }
        };
    }, { scene, project, extension });
    const page = await context.newPage();
    page.setDefaultTimeout(25_000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const open = async () => {
        await page.getByText('neptune-extension-browser', { exact: true }).click();
        await page.getByText('Edit', { exact: true }).click();
        await page.getByText('Scene View', { exact: true }).click();
        await page.waitForFunction(() => document.querySelector('iframe[title="Scene View"]')?.contentWindow?.game?.scene?.children?.some(entity => entity.id === 'wall'));
    };
    await page.goto(`http://127.0.0.1:${port}`);
    await page.evaluate(() => localStorage.setItem('triton_recent_projects', JSON.stringify([{ name: 'neptune-extension-browser', path: '/tmp/neptune-extension-browser', lastOpened: Date.now() }])));
    await page.reload();
    await open();
    console.log('Extension integration: project opened');
    const frame = page.frameLocator('iframe[title="Scene View"]');
    await frame.getByText('Authored caption', { exact: true }).waitFor();
    assert.equal(await frame.locator('body').evaluate(body => Boolean(body.ownerDocument.defaultView.__gameplayStarted)), false, 'edit preview does not start game behaviours');
    await page.getByText('Test wall', { exact: true }).click();
    const width = page.getByRole('spinbutton', { name: 'Area (world units) X', exact: true });
    await width.waitFor();
    console.log('Extension integration: opt-in Inspector loaded');
    await width.fill('2');
    await width.press('Tab');
    await page.locator('[data-scene-tool="move"]').click();
    await page.keyboard.press('Control+z');
    await page.waitForFunction(() => document.querySelector('input[aria-label="Area (world units) X"]')?.value === '1');
    await page.keyboard.press('Control+y');
    await page.waitForFunction(() => document.querySelector('input[aria-label="Area (world units) X"]')?.value === '2');
    const areaHandle = page.getByRole('button', { name: 'Resize BoxCollider extension area', exact: true });
    const corner = await areaHandle.boundingBox();
    assert.ok(corner, 'registered extension tool has a real viewport handle');
    await page.mouse.move(corner.x + corner.width / 2, corner.y + corner.height / 2);
    await page.mouse.down();
    await page.mouse.move(corner.x + corner.width / 2 + 32, corner.y + corner.height / 2, { steps: 5 });
    await page.mouse.up();
    await page.waitForFunction(() => Math.abs(Number(document.querySelector('input[aria-label="Area (world units) X"]')?.value) - 3) < 0.01);
    await page.keyboard.press('Control+z');
    await page.waitForFunction(() => document.querySelector('input[aria-label="Area (world units) X"]')?.value === '2');
    await page.keyboard.press('Control+y');
    await page.waitForFunction(() => Math.abs(Number(document.querySelector('input[aria-label="Area (world units) X"]')?.value) - 3) < 0.01);
    await page.getByRole('button', { name: 'Save scene', exact: true }).click();
    await page.waitForFunction(() => Math.abs(window.__files['scenes/main.scene'].entities[0].components.find(component => component.type === 'BoxCollider').props.size.x - 3) < 0.01);
    assert.equal(await page.evaluate(() => JSON.stringify(window.__files['scenes/main.scene']).includes('editor-only-object')), false);
    console.log('Extension integration: undo/redo and save passed');
    await page.getByText('Test wall', { exact: true }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Show Collider Area', exact: true }).click();
    assert.equal(await page.getByRole('menu').count(), 0);
    await page.reload();
    await open();
    console.log('Extension integration: project reopened');
    await page.getByText('Test wall', { exact: true }).click();
    await page.waitForFunction(() => Math.abs(Number(document.querySelector('input[aria-label="Area (world units) X"]')?.value) - 3) < 0.01);
    await page.getByTitle('Play', { exact: true }).click();
    const gameFrame = page.frameLocator('iframe[title="Game View"]');
    await gameFrame.getByText('Authored caption', { exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector('iframe[title="Game View"]')?.contentWindow?.__gameplayStarted === true);
    await page.getByTitle('Stop', { exact: true }).click();
    await page.waitForFunction(() => {
        const target = document.querySelector('iframe[title="Game View"]')?.contentWindow;
        return target?.game?.isRunning === false && !target.__gameplayStarted;
    });
    assert.deepEqual(errors, []);
});
