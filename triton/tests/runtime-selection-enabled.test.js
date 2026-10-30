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
    child.components[0].position.x = 3 / 64;
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
