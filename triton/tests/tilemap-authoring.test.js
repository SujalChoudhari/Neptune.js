import test from 'node:test';
import assert from 'node:assert/strict';
import { paintTileCell, setTileMetadata } from '../src/lib/tilemapAuthoring.mjs';

const sample = () => ({
    width: 3,
    height: 2,
    tileSize: 16,
    columns: 4,
    tileset: 'assets/tiles.png',
    data: [0, 0, 0, 1, 1, 0],
    metadata: { 1: { walkable: false } }
});

test('metadata editing supports navigation and terrain fields without mutating prior map data', () => {
    const source = sample();
    const updated = setTileMetadata(source, 1, { walkable: true, terrain: 'stone', collision: false });
    assert.deepEqual(updated.metadata['1'], { walkable: true, terrain: 'stone', collision: false });
    assert.deepEqual(source.metadata['1'], { walkable: false });
    assert.equal(updated.tileset, source.tileset);
    assert.deepEqual(setTileMetadata(updated, 1, { walkable: undefined }).metadata['1'], { terrain: 'stone', collision: false });
});

test('metadata editing validates supported fields and values', () => {
    assert.throws(() => setTileMetadata(sample(), -1, { walkable: true }), /non-negative integer/);
    assert.throws(() => setTileMetadata(sample(), 1, { walkable: 'yes' }), /Invalid tile metadata value/);
    assert.throws(() => setTileMetadata(sample(), 1, { terrain: 3 }), /Invalid tile metadata value/);
    assert.throws(() => setTileMetadata(sample(), 1, { collision: 'solid' }), /Invalid tile metadata value/);
    assert.throws(() => setTileMetadata(sample(), 1, { opacity: 0.5 }), /Unknown tile metadata field/);
});

test('painting addresses row-major cells and preserves other tilemap data immutably', () => {
    const source = sample();
    const painted = paintTileCell(source, 2, 1, 7);
    assert.deepEqual(painted.data, [0, 0, 0, 1, 1, 7]);
    assert.equal(painted.tileset, source.tileset);
    assert.deepEqual(painted.metadata, source.metadata);
    assert.deepEqual(source.data, [0, 0, 0, 1, 1, 0]);
});

test('painting supports clearing a cell with the runtime empty tile ID', () => {
    assert.equal(paintTileCell(sample(), 1, 1, 0).data[4], 0);
});

test('painting rejects out-of-bounds coordinates and invalid tile IDs', () => {
    assert.throws(() => paintTileCell(sample(), -1, 0, 2), /outside the map/);
    assert.throws(() => paintTileCell(sample(), 3, 0, 2), /outside the map/);
    assert.throws(() => paintTileCell(sample(), 0, 0, -1), /non-negative integer/);
    assert.throws(() => paintTileCell(sample(), 0, 0, 1.5), /non-negative integer/);
});

test('painting rejects malformed tilemap dimensions and data', () => {
    assert.throws(() => paintTileCell({ ...sample(), height: 0 }, 0, 0, 1), /positive integers/);
    assert.throws(() => paintTileCell({ ...sample(), data: [0] }, 0, 0, 1), /match its dimensions/);
});
