import assert from 'node:assert/strict';
import { writeFile, rm, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import { createServer } from '../node_modules/vite/dist/node/index.js';

test('frontend watcher observes frontend files and ignores native compiler artifacts', { timeout: 20_000 }, async t => {
    const root = fileURLToPath(new URL('../', import.meta.url));
    const frontend = fileURLToPath(new URL(`../public/watch-probe-${process.pid}.txt`, import.meta.url));
    const native = fileURLToPath(new URL(`../src-tauri/target/watch-probe-${process.pid}.dll`, import.meta.url));
    const server = await createServer({ root, configFile: `${root}/vite.config.ts` });
    t.after(async () => {
        await server.close();
        await Promise.all([rm(frontend, { force: true }), rm(native, { force: true })]);
    });
    const events = [];
    const errors = [];
    server.watcher.on('all', (_, path) => events.push(path.replaceAll('\\', '/')));
    server.watcher.on('error', error => errors.push(error));
    await mkdir(fileURLToPath(new URL('../src-tauri/target/', import.meta.url)), { recursive: true });
    await delay(500);
    await writeFile(native, 'native compiler output');
    await writeFile(frontend, 'frontend change');
    for (let attempt = 0; attempt < 50 && !events.includes(frontend.replaceAll('\\', '/')); attempt++) await delay(100);
    assert.ok(events.includes(frontend.replaceAll('\\', '/')), 'frontend files must remain watched');
    await delay(300);
    assert.equal(events.includes(native.replaceAll('\\', '/')), false, 'native output must not enter Vite watcher');
    assert.deepEqual(errors, []);
});
