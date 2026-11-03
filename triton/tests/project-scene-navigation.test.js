import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { transformSync } from 'esbuild';
import { SceneLoader } from '../../src/core/sceneLoader.js';
import { ComponentRegistry } from '../../src/core/componentRegistry.js';
import { Shape } from '../../src/rendering/shape.js';
import { isSceneAsset } from '../src/lib/sceneAsset.mjs';

const panel = fs.readFileSync('triton/src/components/panels/ProjectPanel.tsx', 'utf8');
const context = fs.readFileSync('triton/src/context/GameContext.tsx', 'utf8');

test('separate native smoke fixture is version-1 project and runtime-loadable scene', async () => {
    ComponentRegistry.register('Shape', Shape);
    const source = fs.readFileSync('triton/src/lib/editorGameRunner.ts', 'utf8');
    const compiled = transformSync(source, { loader: 'ts', format: 'esm' }).code;
    const { EditorGameRunner } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
    const project = JSON.parse(fs.readFileSync('triton/tests/fixtures/native-smoke/project.npt', 'utf8'));
    const scene = JSON.parse(fs.readFileSync('triton/tests/fixtures/native-smoke/scenes/main.scene', 'utf8'));
    assert.equal(EditorGameRunner.normalizeProject(project).schemaVersion, 1);
    assert.equal(project.mainScene, 'scenes/main.scene');
    assert.equal(EditorGameRunner.validateScene(scene).schemaVersion, 1);
    const runtime = SceneLoader.parse(scene);
    assert.equal(runtime.children[0].children[0].id, 'smoke-hero');
});

test('project marker is never opened as a scene, while supported scene extensions are navigable', () => {
    assert.equal(isSceneAsset('project.npt'), false);
    assert.equal(isSceneAsset('scenes/main.scn'), true);
    assert.equal(isSceneAsset('scenes/main.scene'), true);
    assert.match(panel, /isSceneAsset\(node\.name\)/);
    assert.doesNotMatch(panel, /node\.name\.endsWith\('\.npt'\)/);
});

test('scene read errors reach diagnostics and the project panel without changing the save target', () => {
    assert.match(context, /EditorGameRunner\.report\(e\)/);
    assert.match(context, /if \(sequence !== sceneLoadSequence\.current\) return;[\s\S]*?EditorGameRunner\.report\(e\);[\s\S]*?throw e;/);
    assert.match(panel, /loadScene\(id\)\.catch/);
    assert.match(panel, /role="alert"/);
});
