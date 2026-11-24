import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { InputActions } from '../src/input/actions.js';
import { InputCoordinates } from '../src/input/coordinates.js';
import { KeyboardInput } from '../src/input/keyboardinput.js';
import { Vector2 } from '../src/math/vec2.js';

test('INPUT-01: Context stack manages gameplay vs menu active capture', () => {
    const input = new InputActions({
        attack: ['SPACE'],
        moveUp: ['W']
    }, { context: 'gameplay' });

    input.bind('confirm', ['SPACE'], 'menu');
    input.bind('cancel', ['ESCAPE'], 'menu');

    assert.equal(input.context, 'gameplay');

    // Push menu context
    input.pushContext('menu');
    assert.equal(input.context, 'menu');

    // Pop back to gameplay
    input.popContext();
    assert.equal(input.context, 'gameplay');

    input.dispose();
});

test('INPUT-02: Remapping supports conflict policies (replace, reject, allow)', () => {
    const input = new InputActions({
        jump: ['SPACE'],
        dash: ['SHIFT']
    }, { context: 'gameplay' });

    // Conflict policy 'reject' should throw if key already bound
    assert.throws(() => {
        input.remap('dash', ['SPACE'], { context: 'gameplay', conflictPolicy: 'reject' });
    }, /Conflict: binding/);

    // Conflict policy 'replace' should reassign SPACE to dash and unbind it from jump
    input.remap('dash', ['SPACE'], { context: 'gameplay', conflictPolicy: 'replace' });
    const serialized = input.serializeBindings();
    assert.deepEqual(serialized.contexts.gameplay.dash.map(b => b.code), [32]);
    assert.equal(serialized.contexts.gameplay.jump, undefined);

    // Conflict policy 'allow' permits duplicates
    input.remap('jump', ['SPACE'], { context: 'gameplay', conflictPolicy: 'allow' });
    const allowed = input.serializeBindings();
    assert.deepEqual(allowed.contexts.gameplay.dash.map(b => b.code), [32]);
    assert.deepEqual(allowed.contexts.gameplay.jump.map(b => b.code), [32]);

    input.dispose();
});

test('INPUT-02: Serialization and restoration round-trip preserves binding schema', () => {
    const input = new InputActions({
        fire: ['F', 'MOUSE_LEFT'],
        interact: ['E']
    }, { context: 'gameplay' });

    const serialized = input.serializeBindings();
    assert.equal(serialized.version, 1);
    assert.ok(serialized.contexts.gameplay.fire);

    const freshInput = new InputActions({}, { context: 'gameplay' });
    freshInput.restoreBindings(serialized);

    const freshSerialized = freshInput.serializeBindings();
    assert.deepEqual(freshSerialized, serialized);

    freshInput.dispose();
    input.dispose();
});

test('INPUT-03: InputCoordinates screenToCanvas corrects for display scale and bounds', () => {
    const mockCanvas = {
        width: 1280,
        height: 720,
        getBoundingClientRect: () => ({
            left: 100,
            top: 50,
            width: 640,
            height: 360
        })
    };

    // Click at client (200, 150) -> relative to canvas rect is (100, 100)
    // Scale is 1280/640 = 2x, 720/360 = 2x -> canvas pixels (200, 200)
    const canvasPoint = InputCoordinates.screenToCanvas({ clientX: 200, clientY: 150 }, mockCanvas);
    assert.equal(canvasPoint.x, 200);
    assert.equal(canvasPoint.y, 200);
});

test('INPUT-03: InputCoordinates canvasToWorld and worldToCanvas round-trip', () => {
    const camera = {
        position: new Vector2(10, 20),
        zoom: 2.0
    };
    const canvasW = 1024;
    const canvasH = 768;
    const ppu = 64;

    // Center of canvas (512, 384) should map exactly to camera position (10, 20)
    const centerWorld = InputCoordinates.canvasToWorld({ x: 512, y: 384 }, camera, canvasW, canvasH, ppu);
    assert.equal(centerWorld.x, 10);
    assert.equal(centerWorld.y, 20);

    // Arbitrary world point
    const originalWorld = new Vector2(15.5, 25.25);
    const canvasPoint = InputCoordinates.worldToCanvas(originalWorld, camera, canvasW, canvasH, ppu);
    const convertedBack = InputCoordinates.canvasToWorld(canvasPoint, camera, canvasW, canvasH, ppu);

    assert.ok(Math.abs(convertedBack.x - originalWorld.x) < 1e-6);
    assert.ok(Math.abs(convertedBack.y - originalWorld.y) < 1e-6);
});
