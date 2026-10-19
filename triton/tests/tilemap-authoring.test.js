import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paintTileCell, paintTileCells, setCellMetadata, setTileMetadata, getTilesetPaletteIds, getTilesetTileOffset, createEmptyTilemap, getTilemapAttachError } from '../src/lib/tilemapAuthoring.mjs';

const sample = () => ({
    width: 3,
    height: 2,
    tileSize: 16,
    columns: 4,
    tileset: 'assets/tiles.png',
    data: [0, 0, 0, 1, 1, 0],
    metadata: { 1: { walkable: false } }
});

test('tileset thumbnails are wired through the selected-project scoped image command', () => {
    const panel = readFileSync(new URL('../src/components/panels/TilemapPanel.tsx', import.meta.url), 'utf8');
    const native = readFileSync(new URL('../src-tauri/src/lib.rs', import.meta.url), 'utf8');
    assert.match(panel, /invoke<string>\('read_image_asset', \{ path: tilemap\.tileset \}\)/);
    assert.match(panel, /backgroundImage: `url/);
    assert.match(native, /async fn read_image_asset[\s\S]*?read_image_asset_impl\(&path, state\.inner\(\)\)/);
    assert.match(native, /fn read_image_asset_impl[\s\S]*?resolve_existing_path\(state, raw_path\)/);
    assert.match(native, /read_image_asset,/);
});

test('tileset thumbnail crops use row-major atlas offsets and validate inputs', () => {
    assert.deepEqual(getTilesetTileOffset(7, 4, 16), { x: 48, y: 16 });
    assert.deepEqual(getTilesetTileOffset(0, 4, 16), { x: 0, y: 0 });
    assert.throws(() => getTilesetTileOffset(-1, 4, 16), /non-negative ID/);
    assert.throws(() => getTilesetTileOffset(1, 0, 16), /positive columns/);
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

test('brush painting applies one tile across multiple cells immutably and rejects invalid strokes', () => {
    const source = sample();
    const painted = paintTileCells(source, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 1 }], 4);
    assert.deepEqual(painted.data, [4, 4, 0, 1, 1, 4]);
    assert.deepEqual(source.data, [0, 0, 0, 1, 1, 0]);
    assert.throws(() => paintTileCells(sample(), [{ x: 0, y: 0 }, { x: 3, y: 0 }], 2), /outside the map/);
    assert.throws(() => paintTileCells(sample(), null, 2), /array/);
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

test('new tilemap assets have valid dimensions, a tileset, and paintable empty cells', () => {
    const map = createEmptyTilemap({
        name: 'level-one.map',
        width: 2,
        height: 3,
        columns: 4,
        tileSize: 16,
        tileset: 'assets/tiles.png'
    });
    assert.deepEqual(map, {
        width: 2,
        height: 3,
        columns: 4,
        tileSize: 16,
        tileCount: 16,
        tileset: 'assets/tiles.png',
        data: [0, 0, 0, 0, 0, 0]
    });
    assert.deepEqual(paintTileCell(map, 1, 2, 7).data, [0, 0, 0, 0, 0, 7]);
});

test('new tilemap assets reject unsafe filenames and unsupported dimensions', () => {
    assert.throws(() => createEmptyTilemap({ name: '../escape.map', width: 2, height: 2 }), /project-root filename/);
    assert.throws(() => createEmptyTilemap({ name: 'folder/level.map', width: 2, height: 2 }), /project-root filename/);
    assert.throws(() => createEmptyTilemap({ name: 'level.map', width: 0, height: 2 }), /dimensions/);
    assert.throws(() => createEmptyTilemap({ name: 'level.map', width: 257, height: 2 }), /dimensions/);
});

test('tilemap scene attachment requires a selected tileset, saved map, and open scene', () => {
    const map = createEmptyTilemap({ name: 'draft.map', width: 2, height: 2 });
    assert.match(getTilemapAttachError({ tilemap: map, mapPath: 'draft.map', currentScenePath: 'main.scene' }), /Choose a tileset/);
    assert.match(getTilemapAttachError({ tilemap: { ...map, tileset: 'tiles.png' }, mapPath: 'draft.map' }), /Open a scene/);
    assert.match(getTilemapAttachError({ tilemap: { ...map, tileset: 'tiles.png' }, mapPath: 'draft.map', currentScenePath: 'main.scene', isDirty: true }), /Save the tilemap/);
    assert.equal(getTilemapAttachError({ tilemap: { ...map, tileset: 'tiles.png' }, mapPath: 'draft.map', currentScenePath: 'main.scene' }), null);
});

test('TilemapPanel creates and rescans a new asset before editing it', () => {
    const panel = readFileSync(new URL('../src/components/panels/TilemapPanel.tsx', import.meta.url), 'utf8');
    assert.match(panel, /createEmptyTilemap\(/);
    assert.match(panel, /await writeFile\(filename, JSON\.stringify\(createdMap, null, 2\)\)/);
    assert.match(panel, /await refresh\(\)/);
    assert.match(panel, /setMapPath\(filename\)/);
    assert.match(panel, /aria-label="Create new tilemap"/);
    assert.match(panel, /columns: newMapColumns/);
    assert.match(panel, /tileSize: newMapTileSize/);
    assert.match(panel, /aria-label="New tilemap atlas columns"/);
    assert.match(panel, /aria-label="New tilemap tile size"/);
});

test('TilemapPanel prevents attaching maps that the runtime cannot render yet', () => {
    const panel = readFileSync(new URL('../src/components/panels/TilemapPanel.tsx', import.meta.url), 'utf8');
    assert.match(panel, /getTilemapAttachError\(\{ tilemap, mapPath, currentScenePath, isDirty \}\)/);
    assert.ok(panel.includes('!tilemap.tileset?.trim()'));
});
