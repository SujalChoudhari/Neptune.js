import test from 'node:test';
import assert from 'node:assert/strict';
import { paintTileCell, setCellMetadata, setTileMetadata, getTilesetPaletteIds } from '../src/lib/tilemapAuthoring.mjs';

const sample = () => ({
    width: 3,
    height: 2,
    tileSize: 16,
    columns: 4,
    tileset: 'assets/tiles.png',
    data: [0, 0, 0, 1, 1, 0],
    metadata: { 1: { walkable: false } }
});

test('tileset palette enumerates row-major tile IDs and rejects invalid dimensions', () => {
    assert.deepEqual(getTilesetPaletteIds(3, 5), [0, 1, 2, 3, 4]);
    assert.throws(() => getTilesetPaletteIds(0, 5), /positive columns/);
    assert.throws(() => getTilesetPaletteIds(3, 4097), /up to 4096/);
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

test('cell collision and navigation overrides are immutable, row-major, and removable', () => {
    const source = sample();
    const updated = setCellMetadata(source, 2, 1, { collision: false, walkable: true, terrain: 'stone' });
    assert.deepEqual(updated.cellMetadata, { 5: { collision: false, walkable: true, terrain: 'stone' } });
    assert.equal(source.cellMetadata, undefined);
    assert.deepEqual(setCellMetadata(updated, 2, 1, { walkable: false }).cellMetadata,
        { 5: { collision: false, walkable: false, terrain: 'stone' } });
    assert.equal(setCellMetadata(updated, 2, 1, {
        collision: undefined, walkable: undefined, terrain: undefined
    }).cellMetadata, undefined);
    assert.throws(() => setCellMetadata(sample(), 3, 0, { collision: false }), /outside the map/);
    assert.throws(() => setCellMetadata(sample(), 0, 0, { collision: 'no' }), /Invalid cell metadata value for collision/);
    assert.throws(() => setCellMetadata(sample(), 0, 0, { walkable: 'yes' }), /Invalid cell metadata value for walkable/);
    assert.throws(() => setCellMetadata(sample(), 0, 0, { elevation: 2 }), /Unknown cell metadata field/);
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
