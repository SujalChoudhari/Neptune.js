import '../tests/setup_mocks.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KeyboardInput } from '../src/input/keyboardinput.js';
import { ProjectBehaviour, validateProjectModulePath } from '../src/scripts/projectBehaviour.js';

test('quick key taps survive until frame clear, repeats do not retrigger, blur clears held keys', () => {
    KeyboardInput.init({});
    const code = KeyboardInput.KEY_CODE.O;
    window.dispatchEvent({ type: 'keydown', keyCode: code });
    window.dispatchEvent({ type: 'keyup', keyCode: code });
    assert.equal(KeyboardInput.IsKeyDown(code), false);
    assert.equal(KeyboardInput.IsKeyPressed(code), true);
    KeyboardInput.clear(); assert.equal(KeyboardInput.IsKeyPressed(code), false);
    window.dispatchEvent({ type: 'keydown', keyCode: code }); KeyboardInput.clear();
    window.dispatchEvent({ type: 'keydown', keyCode: code });
    assert.equal(KeyboardInput.IsKeyPressed(code), false);
    window.dispatchEvent({ type: 'blur' });
    assert.equal(KeyboardInput.IsKeyDown(code), false);
});

test('project modules reject escaping, absolute and encoded paths', () => {
    assert.equal(validateProjectModulePath('scripts/game.js'), 'scripts/game.js');
    for (const path of ['', '../game.js', '/game.js', 'C:/game.js', 'https://site/game.js', 'scripts/../game.js', 'scripts/%2e%2e/game.js', 'scripts/game.js?x', ' scripts/game.js', 'scripts\\game.js']) {
        assert.throws(() => validateProjectModulePath(path), /project-relative/);
    }
});

test('project behaviour destroys project resources and unregisters its lifecycle', () => {
    const component = new ProjectBehaviour();
    let destroyed = 0;
    component.instance = { destroy() { destroyed++; } };
    component.destroy();
    assert.equal(destroyed, 1); assert.equal(component.instance, null); assert.equal(component.entity, null);
    assert.equal(component.disposed, true);
});
