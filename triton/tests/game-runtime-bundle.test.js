import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// The production Game View iframe must import a real bundled module URL.
// Vite's ?url on neptune.js inlines the unbundled source as a data: URL;
// its relative ./core/* imports cannot resolve from that URL.
test('production Game View boots a bundled engine URL', () => {
    const options = { cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'pipe' };
    execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url)), '-b'], options);
    execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'build'], options);
    const assets = join('triton', 'dist', 'assets');
    const index = readFileSync(join(assets, readdirSync(assets).find(name => /^index-.*\.js$/.test(name))), 'utf8');
    assert.match(index, /GAME_BOOT_ERROR/, 'Game View must be included in the production build');
    assert.equal(/data:text\/javascript;base64,[A-Za-z0-9+/]{200}/.test(index), false,
        'engine entry must not be an inline unbundled module with relative imports');
    assert.ok(readdirSync(assets).some(name => /^neptune-runtime-.*\.js$/.test(name)),
        'engine module must be bundled as a separate importable asset');
});
