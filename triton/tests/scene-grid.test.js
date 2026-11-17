import test from 'node:test';
import assert from 'node:assert/strict';
import { getSceneGridMetrics } from '../src/lib/sceneTools.mjs';

test('world grid keeps one world unit per major cell across pan and zoom', () => {
    const initial = getSceneGridMetrics({ x: 0, y: 0 }, 1);
    assert.equal(initial.majorSpacing, 64);
    assert.equal(initial.subdivisions, 1);
    assert.equal(initial.axisX, 0);
    const zoomed = getSceneGridMetrics({ x: -2.5, y: 3.25 }, 1.5);
    assert.equal(zoomed.majorSpacing, 96);
    assert.equal(zoomed.subdivisions, 2);
    assert.equal(zoomed.minorSpacing, 48);
    assert.equal(zoomed.axisX, 3.75);
    assert.equal(zoomed.axisY, -4.875);
    const close = getSceneGridMetrics({ x: 14, y: -9 }, 0.2);
    assert.equal(close.majorSpacing, 12.8);
    assert.equal(close.showMinor, false);
});

test('grid metrics reject invalid camera geometry', () => {
    assert.throws(() => getSceneGridMetrics({ x: 1, y: 1 }, 0), /positive/);
    assert.throws(() => getSceneGridMetrics({ x: NaN, y: 1 }, 1), /finite/);
});
