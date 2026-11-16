import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { chromium } from 'playwright';

const shape = (width, height, color) => ({ type: 'Shape', props: { geometry: 1, param: { width, height, fill: true, outline: null, color } } });
const scene = {
    type: 'scene', schemaVersion: 1, version: '1.0.0', id: 'viewport-tools-scene', name: 'Viewport Tools',
    entities: [
        { id: 'floor', name: 'Ruins floor', transform: { pos: { x: 6, y: 4 }, rot: 0, scale: { x: 1, y: 1 }, z: -10 }, components: [shape(12, 8, { r: 35, g: 58, b: 65, a: 1 })] },
        { id: 'hero', name: 'Hero', transform: { pos: { x: 2, y: 4 }, rot: Math.PI / 6, scale: { x: 1, y: 1 }, z: 2 }, components: [shape(0.65, 0.65, { r: 124, g: 218, b: 194, a: 1 })] }
    ]
};
const project = { type: 'project', schemaVersion: 1, version: '1.0.0', name: 'Viewport Tools', mainScene: 'scenes/main.scene', scenes: [] };

test('Scene View picks visible shapes and keeps focused tools, drags and overlays in the rendered coordinate system', { timeout: 180_000 }, async t => {
    const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
    const port = probe.address().port;
    await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
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
    assert.ok(ready, 'Vite must serve the actual editor');
    const browser = await chromium.launch({ headless: true });
    t.after(() => browser.close());
    // 1600x900 physical display at Windows 125% scaling has a 1280x720
    // logical workspace. DPR alone does not reduce CSS layout dimensions.
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.25 });
    await context.addInitScript(({ initialScene, initialProject }) => {
        window.__files = { 'scenes/main.scene': structuredClone(initialScene), 'project.npt': structuredClone(initialProject) };
        window.__nativeCalls = [];
        window.__TAURI_INTERNALS__ = {
            metadata: { currentWindow: { label: 'main' } }, transformCallback: () => 1,
            invoke: async (command, args = {}) => {
                window.__nativeCalls.push({ command, args });
                if (command === 'open_existing_project' || command === 'sync_neptune_lib') return true;
                if (command === 'scan_project') return {
                    root: { id: 'root', parentId: null, name: 'Viewport Tools', type: 'folder', children: ['scene-folder'] },
                    'scene-folder': { id: 'scene-folder', parentId: 'root', name: 'scenes', type: 'folder', children: ['scene'] },
                    scene: { id: 'scene', parentId: 'scene-folder', name: 'main.scene', type: 'scene', children: [] }
                };
                if (command === 'read_project') return JSON.stringify(window.__files['project.npt']);
                if (command === 'read_scene') return JSON.stringify(window.__files[args.path]);
                if (command === 'write_scene') {
                    if (window.__holdWrites) await new Promise(resolve => { window.__releaseSave = resolve; });
                    if (window.__failWrites) throw new Error('Test disk is unavailable');
                    window.__files[args.path] = JSON.parse(args.content); return true;
                }
                if (command === 'write_project') { window.__files['project.npt'] = JSON.parse(args.content); return true; }
                if (command === 'read_file') return window.__files[args.path] ?? null;
                return null;
            }
        };
    }, { initialScene: scene, initialProject: project });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(120_000);
    page.setDefaultTimeout(20_000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}`);
    await page.evaluate(() => localStorage.setItem('triton_recent_projects', JSON.stringify([{ name: 'Viewport Tools', path: '/tmp/neptune-viewport-tools', lastOpened: Date.now() }])));
    await page.reload();
    await page.getByText('Viewport Tools', { exact: true }).click();
    await page.getByText('Edit', { exact: true }).click();
    await page.getByText('Scene View', { exact: true }).click();
    await page.waitForFunction(() => {
        const scene = document.querySelector('iframe[title="Scene View"]')?.contentWindow?.game?.scene;
        return scene?.activeCamera?.worldToScreen && scene.children?.some(entity => entity.id === 'hero');
    });

    const viewport = page.locator('[data-scene-viewport]');
    const tool = id => page.locator(`[data-scene-tool="${id}"]`);
    const handle = label => viewport.getByRole('button', { name: label, exact: true });
    const heroPosition = () => page.evaluate(() => ({ ...document.querySelector('iframe[title="Scene View"]').contentWindow.game.scene.children.find(entity => entity.id === 'hero').components.find(component => component.constructor.name === 'Transform').position }));
    const expectedOrigin = () => page.evaluate(() => {
        const game = document.querySelector('iframe[title="Scene View"]').contentWindow.game;
        const position = game.scene.children.find(entity => entity.id === 'hero').components.find(component => component.constructor.name === 'Transform').position;
        return game.scene.activeCamera.worldToScreen(position.x * 64, position.y * 64);
    });
    const assertOriginAligned = async () => {
        await page.waitForFunction(() => {
            const scene = document.querySelector('iframe[title="Scene View"]')?.contentWindow?.game?.scene;
            const origin = document.querySelector('[data-scene-viewport] [data-gizmo-origin]');
            const position = scene?.children?.find(entity => entity.id === 'hero')?.components.find(component => component.constructor.name === 'Transform')?.position;
            if (!scene?.activeCamera || !origin || !position) return false;
            const expected = scene.activeCamera.worldToScreen(position.x * 64, position.y * 64);
            return Math.abs(Number(origin.getAttribute('cx')) - expected.x) < 1 && Math.abs(Number(origin.getAttribute('cy')) - expected.y) < 1;
        });
        const expected = await expectedOrigin();
        const actual = await viewport.locator('[data-gizmo-origin]').evaluate(element => ({ x: Number(element.getAttribute('cx')), y: Number(element.getAttribute('cy')) }));
        assert.ok(Math.abs(actual.x - expected.x) < 1, `gizmo X ${actual.x} must match rendered X ${expected.x}`);
        assert.ok(Math.abs(actual.y - expected.y) < 1, `gizmo Y ${actual.y} must match rendered Y ${expected.y}`);
    };
    const shown = async locator => await locator.count() > 0 && await locator.isVisible();
    const drag = async (locator, dx, dy, cancel = false) => {
        const box = await locator.boundingBox(); assert.ok(box, 'active tool handle must have a hit target');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 8 });
        if (cancel) await page.keyboard.press('Escape');
        await page.mouse.up();
    };

    await tool('move').click(); await page.getByTitle('Reset View', { exact: true }).click();
    const origin = await expectedOrigin();
    assert.ok(Math.abs(origin.x - 128) < 1 && Math.abs(origin.y - 256) < 1);
    await viewport.click({ position: { x: origin.x, y: origin.y } });
    await viewport.locator('[data-selection-outline="hero"]').waitFor();
    assert.equal(await viewport.locator('[data-selection-outline="floor"]').count(), 0, 'foreground hero wins over its large background without a gameplay collider');
    await assertOriginAligned();

    const outline = viewport.locator('[data-selection-outline="hero"]');
    assert.ok(Math.abs(Number((await outline.getAttribute('transform')).match(/^rotate\((\S+)/)[1]) - 30) < 0.001);
    assert.ok(Math.abs(Number(await outline.getAttribute('width')) - 0.65 * 64) < 0.01, 'outline follows the rotated visual bounds, not its enlarged world AABB');
    assert.equal(await outline.getAttribute('fill'), 'none', 'selection does not tint the selected artwork');

    const before = await heroPosition();
    await page.keyboard.press('w');
    assert.equal(await tool('move').getAttribute('aria-pressed'), 'true');
    await drag(handle('Translate on X axis'), 64, 0);
    await page.waitForFunction(x => Math.abs(document.querySelector('iframe[title="Scene View"]').contentWindow.game.scene.children.find(entity => entity.id === 'hero').components.find(component => component.constructor.name === 'Transform').position.x - x) < 0.03, before.x + 1);
    await assertOriginAligned();
    assert.match(await page.locator('[data-editor-activity]').innerText(), /Hero: position = .*unsaved/, 'moving an entity reports its property and unsaved state');

    const saved = await heroPosition();
    const viewportBounds = await viewport.boundingBox();
    const axisBounds = await handle('Translate on X axis').boundingBox();
    assert.ok(viewportBounds && axisBounds);
    const outsideViewportDelta = viewportBounds.x + viewportBounds.width + 12 - (axisBounds.x + axisBounds.width / 2);
    await drag(handle('Translate on X axis'), outsideViewportDelta, 0, true);
    // Cancel edits travel through the same asynchronous postMessage bridge as
    // movement; assert the eventual restored runtime state, not queue timing.
    await page.waitForFunction(expected => {
        const scene = document.querySelector('iframe[title="Scene View"]')?.contentWindow?.game?.scene;
        const position = scene?.children.find(entity => entity.id === 'hero')?.components.find(component => component.constructor.name === 'Transform')?.position;
        return position && Math.abs(position.x - expected.x) < 0.001 && Math.abs(position.y - expected.y) < 0.001;
    }, saved);
    const restored = await heroPosition();
    assert.ok(Math.abs(restored.x - saved.x) < 0.001 && Math.abs(restored.y - saved.y) < 0.001, 'Escape restores the whole starting drag state');

    await page.keyboard.press('e');
    assert.equal(await tool('rotate').getAttribute('aria-pressed'), 'true');
    assert.equal(await shown(handle('Rotate selected entity')), true);
    assert.equal(await shown(handle('Translate on X axis')), false);
    await page.keyboard.press('r');
    assert.equal(await tool('scale').getAttribute('aria-pressed'), 'true');
    assert.equal(await shown(handle('Scale selected entity')), true);
    assert.equal(await shown(handle('Rotate selected entity')), false);
    await page.keyboard.press('t');
    assert.equal(await tool('rect').getAttribute('aria-pressed'), 'true');
    assert.equal(await shown(handle('Resize selected entity')), true);
    await page.keyboard.press('y');
    assert.equal(await tool('transform').getAttribute('aria-pressed'), 'true');
    assert.equal(await shown(handle('Translate on X axis')), true);
    assert.equal(await shown(handle('Rotate selected entity')), true);
    assert.equal(await shown(handle('Scale selected entity')), true);

    await page.keyboard.press('w');
    const increment = page.getByRole('spinbutton', { name: 'Snap increment in world units', exact: true });
    await increment.focus(); await page.keyboard.press('e');
    assert.equal(await tool('move').getAttribute('aria-pressed'), 'true', 'typing in a numeric field must not select Rotate');
    await increment.fill('0.25'); await increment.blur();

    const beforeCameraNavigation = await expectedOrigin();
    await tool('hand').click();
    const viewBox = await viewport.boundingBox(); assert.ok(viewBox);
    await page.mouse.move(viewBox.x + 360, viewBox.y + 200); await page.mouse.down();
    await page.mouse.move(viewBox.x + 400, viewBox.y + 220, { steps: 5 }); await page.mouse.up();
    await tool('move').click();
    await page.getByRole('button', { name: 'Zoom Out', exact: true }).click();
    await assertOriginAligned();
    const movedOrigin = await expectedOrigin();
    assert.ok(Math.abs(movedOrigin.x - beforeCameraNavigation.x) > 1, 'camera navigation actually changes the render transform');
    await viewport.click({ position: { x: movedOrigin.x, y: movedOrigin.y } });
    await viewport.locator('[data-selection-outline="hero"]').waitFor();
    await assertOriginAligned();
    const activity = page.locator('[data-editor-activity]');
    const save = page.getByRole('button', { name: 'Save scene', exact: true });
    await page.evaluate(() => { window.__holdWrites = true; });
    await save.click();
    await page.waitForFunction(() => document.querySelector('[data-editor-activity]')?.textContent.includes('Saving scene:'));
    assert.equal(await activity.getAttribute('aria-busy'), 'true', 'pending file writes are reported as saving');
    await page.evaluate(() => { window.__holdWrites = false; window.__releaseSave(); });
    await page.waitForFunction(() => document.querySelector('[data-editor-activity]')?.textContent.includes('Scene saved:'));
    assert.equal(await activity.getAttribute('aria-busy'), 'false');
    await page.evaluate(() => { window.__failWrites = true; });
    await save.click();
    await page.waitForFunction(() => document.querySelector('[data-editor-activity]')?.textContent.includes('Scene save failed:'));
    await page.evaluate(() => { window.__failWrites = false; });
    await save.click();
    await page.waitForFunction(() => document.querySelector('[data-editor-activity]')?.textContent.includes('Scene saved:'));
    for (const size of [{ width: 1024, height: 640 }, { width: 1280, height: 720 }, { width: 1536, height: 864 }]) {
        await page.setViewportSize(size);
        await page.getByTitle('Restore the default panel arrangement').click();
        await page.waitForFunction(() => {
            const label = document.querySelector('[title="Ruins floor"]');
            return label && label.clientWidth >= label.scrollWidth;
        });
        const dimensions = await page.evaluate(() => {
            const workspace = document.querySelector('[data-workspace-layout]').getBoundingClientRect();
            const label = document.querySelector('[title="Ruins floor"]');
            return { workspace: workspace.width, scroll: document.documentElement.scrollWidth, width: innerWidth,
                nameWidth: label.clientWidth, fullNameWidth: label.scrollWidth,
                status: document.querySelector('[data-editor-activity]').getBoundingClientRect().bottom,
                height: innerHeight };
        });
        assert.ok(dimensions.scroll <= dimensions.width, `no page overflow at ${size.width}`);
        assert.ok(dimensions.nameWidth >= dimensions.fullNameWidth, 'hierarchy name is readable without hover');
        assert.ok(dimensions.status <= dimensions.height, 'live activity stays inside the window');
        assert.ok(await viewport.evaluate(el => el.clientWidth >= 280), 'viewport retains working space');
        const fields = await page.getByRole('group', { name: 'Position', exact: true }).getByRole('spinbutton').evaluateAll(inputs => inputs.map(input => ({ width: input.clientWidth,
            right: input.getBoundingClientRect().right, parentRight: input.closest('[role="group"]').getBoundingClientRect().right })));
        assert.equal(fields.length, 2);
        assert.ok(fields.every(field => field.width >= 40 && field.right <= field.parentRight + 1), 'both position values stay readable and inside the Inspector');
    }
    // Reproduce old saved layouts with squeezed sidebars. Constraints are not
    // serialized by Dockview; they must be reapplied when loading its JSON.
    await page.waitForFunction(() => Object.keys(localStorage).some(key => key.startsWith('neptune.editor.layout.')));
    await page.evaluate(() => {
        const key = Object.keys(localStorage).find(key => key.startsWith('neptune.editor.layout.'));
        const record = JSON.parse(localStorage.getItem(key));
        const squeeze = node => {
            if (node.type === 'leaf') {
                if (node.data.views.includes('hierarchy')) node.size = 96;
                if (node.data.views.includes('inspector')) node.size = 120;
            } else node.data.forEach(squeeze);
        };
        squeeze(record.layout.grid.root);
        localStorage.setItem(key, JSON.stringify(record));
    });
    const recentName = await page.evaluate(() => JSON.parse(localStorage.getItem('triton_recent_projects')).find(item => item.path === '/tmp/neptune-viewport-tools').name);
    await page.reload();
    await page.getByText(recentName, { exact: true }).click();
    await page.getByText('Edit', { exact: true }).click();
    await page.getByText('Hero', { exact: true }).click();
    await page.waitForFunction(() => {
        const label = document.querySelector('[title="Ruins floor"]');
        return label && label.clientWidth >= label.scrollWidth;
    });
    const restoredFields = await page.getByRole('group', { name: 'Position', exact: true }).getByRole('spinbutton').evaluateAll(inputs => inputs.map(input => input.clientWidth));
    assert.ok(restoredFields.length === 2 && restoredFields.every(width => width >= 40), 'restored layouts reapply readable Inspector constraints');
    assert.deepEqual(errors, [], `unexpected editor page errors: ${errors.join('; ')}`);
});
