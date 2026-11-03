import test from 'node:test';
import assert from 'node:assert/strict';
import { pickRuntimeEntityAt, runtimeSelectionBridgeScript } from '../src/lib/runtimeSelectionBridge.mjs';

class Transform {
    position = { x: 0, y: 0 };
    scale = { x: 1, y: 1 };
}

class Sprite {
    constructor(enabled = true) {
        this._properties = { width: 2, height: 2, enabled };
        this.renderOrder = 0;
    }
    get width() { return this._properties.width; }
    get height() { return this._properties.height; }
    get properties() { return this._properties; }
    draw() {}
}

function entity(id, sprite, children = []) {
    return { id, components: [new Transform(), sprite], children };
}

test('Game View picking skips disabled Sprites but retains enabled descendants and underlying Sprites', () => {
    const underneath = entity('underneath', new Sprite());
    const child = entity('child', new Sprite());
    child.components[0].position.x = 3;
    child.components[1].properties.width = 0.02;
    const disabled = entity('disabled', new Sprite(false), [child]);
    const scene = { children: [underneath, disabled] };

    assert.equal(pickRuntimeEntityAt(scene, 0, 0), 'underneath');
    assert.equal(pickRuntimeEntityAt(scene, 3 * 64, 0), 'child');
    disabled.components[1].properties.enabled = true;
    assert.equal(pickRuntimeEntityAt(scene, 0, 0), 'disabled');
    disabled.components[1].properties.enabled = false;
    assert.equal(pickRuntimeEntityAt({ children: [disabled] }, 0, 0), null);
    assert.match(runtimeSelectionBridgeScript, /component\?\.properties\?\.enabled !== false/);
});

test('Game View picks a child Sprite at its rendered position beneath a non-renderable parent', () => {
    const child = entity('child', new Sprite());
    child.components[0].position.x = 2;
    const layer = { id: 'layer', components: [new Transform()], children: [child] };
    layer.components[0].position.x = 5;
    assert.equal(pickRuntimeEntityAt({ children: [layer] }, 128, 0), 'child');
    assert.equal(pickRuntimeEntityAt({ children: [layer] }, 448, 0), null);
});

test('Game View picks visible Shape geometry and honors scene order and disabled state', () => {
    const circle = { constructor: { name: 'Shape' }, renderOrder: 0, geometry: 0,
        _properties: { param: { radius: 0.5, thickness: 0.02, fill: true }, enabled: true },
        get properties() { return this._properties; }, draw() {} };
    const rectangle = { constructor: { name: 'Shape' }, renderOrder: 1, geometry: 1,
        _properties: { param: { width: 1, height: 0.5, thickness: 0.02, fill: true }, enabled: true },
        get properties() { return this._properties; }, draw() {} };
    const scene = { children: [entity('circle', circle), entity('rectangle', rectangle)] };
    assert.equal(pickRuntimeEntityAt(scene, 0, 0), 'rectangle');
    assert.equal(pickRuntimeEntityAt(scene, 0, 20), 'circle');
    assert.equal(pickRuntimeEntityAt(scene, 40, 20), null);
    rectangle._properties.enabled = false;
    assert.equal(pickRuntimeEntityAt(scene, 0, 0), 'circle');
    circle._properties.param.fill = false;
    circle._properties.param.thickness = 0.05;
    assert.equal(pickRuntimeEntityAt(scene, 0, 0), null);
    assert.equal(pickRuntimeEntityAt(scene, 32, 0), 'circle');
});

test('Game View Shape picking follows rotated/scaled polygons, triangles and stroked lines', () => {
    const shape = (geometry, param) => ({ constructor: { name: 'Shape' }, renderOrder: 0,
        geometry, _properties: { param }, draw() {} });
    const triangle = entity('triangle', shape(3, { width: 2, height: 2, fill: true, thickness: 0.01 }));
    triangle.components[0].position = { x: 3, y: 2 };
    triangle.components[0].scale = { x: 2, y: 1 };
    assert.equal(pickRuntimeEntityAt({ children: [triangle] }, 192, 128), 'triangle');
    assert.equal(pickRuntimeEntityAt({ children: [triangle] }, 192, 195), null);
    const polygon = entity('polygon', shape(4, { points: [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }], fill: true, thickness: 0.01 }));
    polygon.components[0].rotation = Math.PI / 4;
    assert.equal(pickRuntimeEntityAt({ children: [polygon] }, 0, 0), 'polygon');
    assert.equal(pickRuntimeEntityAt({ children: [polygon] }, 96, 96), null);
    const line = entity('line', shape(2, { width: 2, height: 0, thickness: 0.1 }));
    assert.equal(pickRuntimeEntityAt({ children: [line] }, 64, 0), 'line');
    assert.equal(pickRuntimeEntityAt({ children: [line] }, 64, 16), null);
});
