import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ProjectBehaviour, validateProjectModulePath, projectApi } from '../src/scripts/projectBehaviour.js';
import { Entity } from '../src/core/entity.js';

test('CORE-04: validateProjectModulePath validates paths strictly and blocks directory traversal', () => {
    assert.equal(validateProjectModulePath('scripts/player.js'), 'scripts/player.js');
    assert.equal(validateProjectModulePath('combat/ai.js'), 'combat/ai.js');

    // Invalid extensions
    assert.throws(() => validateProjectModulePath('scripts/player.ts'), /must be a project-relative \.js path/);
    assert.throws(() => validateProjectModulePath('scripts/player'), /must be a project-relative \.js path/);

    // Traversal attacks
    assert.throws(() => validateProjectModulePath('../outside.js'), /must be a project-relative \.js path/);
    assert.throws(() => validateProjectModulePath('scripts/../../outside.js'), /must be a project-relative \.js path/);
    assert.throws(() => validateProjectModulePath('/absolute/path.js'), /must be a project-relative \.js path/);
    assert.throws(() => validateProjectModulePath('C:\\windows\\path.js'), /must be a project-relative \.js path/);
    assert.throws(() => validateProjectModulePath('scripts/foo\0.js'), /must be a project-relative \.js path/);
});

test('CORE-04: projectApi exposes frozen engine subsystems', () => {
    assert.ok(Object.isFrozen(projectApi));
    assert.ok(projectApi.Transform);
    assert.ok(projectApi.KeyboardInput);
    assert.ok(projectApi.InputActions);
    assert.ok(projectApi.FixedStepper);
    assert.ok(projectApi.SeededRandom);
    assert.ok(projectApi.SceneManager);
    assert.ok(projectApi.SaveManager);
    assert.ok(projectApi.Larissa);
    assert.ok(projectApi.Nereid);
});

test('CORE-04: ProjectBehaviour reload cancels stale pending loads and cleans up prior instances', async () => {
    const entity = new Entity('Player');
    const pb = new ProjectBehaviour();
    entity.AddComponent(pb);
    pb.properties.module = 'scripts/test.js';

    let destroyedOld = false;
    pb.instance = {
        destroy: () => { destroyedOld = true; },
        update: () => {}
    };

    // Calling reload should clean up prior instance
    const reloadPromise = pb.reload();
    assert.equal(destroyedOld, true);
    assert.equal(pb.instance, null);

    // Calling destroy should mark disposed and cancel any load
    pb.destroy();
    assert.equal(pb.disposed, true);
    await reloadPromise.catch(() => {});
});

test('CORE-04: ProjectBehaviour handles invalid module paths without throwing unhandled exceptions', async () => {
    const entity = new Entity('Enemy');
    const pb = new ProjectBehaviour();
    entity.AddComponent(pb);
    pb.properties.module = 'invalid\\path\\test.txt';

    await pb.loadModule();
    assert.ok(pb.error);
    assert.equal(pb.instance, null);
    pb.destroy();
});
