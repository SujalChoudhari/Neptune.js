const TILE_METADATA_VALIDATORS = {
    walkable: (value) => typeof value === 'boolean',
    terrain: (value) => typeof value === 'string',
    collision: (value) => typeof value === 'boolean',
    damage: (value) => Number.isFinite(value) && value >= 0,
    slowdown: (value) => Number.isFinite(value) && value >= 0,
    interaction: (value) => value === null || (typeof value === 'object' && !Array.isArray(value)),
    transition: (value) => value === null || (typeof value === 'object' && !Array.isArray(value))
};

export function setTileMetadata(map, tileId, updates) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) throw new TypeError('Tilemap must be an object');
    if (!Number.isInteger(tileId) || tileId < 0) throw new TypeError('Tile metadata requires a non-negative integer tile ID');
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) throw new TypeError('Tile metadata updates must be an object');

    const metadata = { ...(map.metadata || {}) };
    const current = { ...(metadata[tileId] || {}) };
    for (const [field, value] of Object.entries(updates)) {
        const validate = TILE_METADATA_VALIDATORS[field];
        if (!validate) throw new TypeError(`Unknown tile metadata field: ${field}`);
        if (value === undefined) {
            delete current[field];
        } else if (!validate(value)) {
            throw new TypeError(`Invalid tile metadata value for ${field}`);
        } else {
            current[field] = structuredClone(value);
        }
    }
    if (Object.keys(current).length) metadata[tileId] = current;
    else delete metadata[tileId];
    return { ...map, metadata };
}

export function getTilesetPaletteIds(columns, tileCount) {
    if (!Number.isInteger(columns) || columns <= 0 || !Number.isInteger(tileCount) || tileCount <= 0 || tileCount > 4096) {
        throw new TypeError('Tileset palette requires positive columns and a tile count up to 4096');
    }
    return Array.from({ length: tileCount }, (_, index) => index);
}

export function getTilesetTileOffset(tileId, columns, tileSize) {
    if (!Number.isInteger(tileId) || tileId < 0 || !Number.isInteger(columns) || columns <= 0 ||
        !Number.isFinite(tileSize) || tileSize <= 0) {
        throw new TypeError('Tileset tile offsets require a non-negative ID and positive columns and tile size');
    }
    return { x: (tileId % columns) * tileSize, y: Math.floor(tileId / columns) * tileSize };
}

export function getTilesetGridSize(width, height, tileSize) {
    if (![width, height, tileSize].every(Number.isFinite) ||
        !Number.isInteger(width) || !Number.isInteger(height) ||
        width <= 0 || height <= 0 || tileSize <= 0) {
        throw new TypeError('Tileset dimensions and tile size must be positive numbers');
    }
    const columns = Math.floor(width / tileSize);
    const rows = Math.floor(height / tileSize);
    if (columns < 1 || rows < 1) throw new RangeError('Tileset image must contain at least one complete tile');
    return { columns, rows, tileCount: Math.min(columns * rows, 4096) };
}

export function setCellMetadata(map, x, y, updates) {
    if (!map || typeof map !== 'object' || Array.isArray(map) ||
        !Number.isInteger(map.width) || map.width <= 0 || !Number.isInteger(map.height) || map.height <= 0) {
        throw new TypeError('Tilemap dimensions must be positive integers');
    }
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= map.width || y < 0 || y >= map.height) {
        throw new RangeError('Tile coordinates are outside the map');
    }
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        throw new TypeError('Cell metadata updates must be an object');
    }
    for (const [field, value] of Object.entries(updates)) {
        if (!['collision', 'walkable', 'terrain', 'slowdown'].includes(field)) throw new TypeError(`Unknown cell metadata field: ${field}`);
        if (value !== undefined && !TILE_METADATA_VALIDATORS[field](value)) {
            throw new TypeError(`Invalid cell metadata value for ${field}`);
        }
    }
    const cellMetadata = { ...(map.cellMetadata || {}) };
    const index = y * map.width + x;
    const current = { ...(cellMetadata[index] || {}) };
    for (const [field, value] of Object.entries(updates)) {
        if (value === undefined) delete current[field];
        else current[field] = value;
    }
    if (Object.keys(current).length) cellMetadata[index] = current;
    else delete cellMetadata[index];
    const result = { ...map };
    if (Object.keys(cellMetadata).length) result.cellMetadata = cellMetadata;
    else delete result.cellMetadata;
    return result;
}

export function paintTileCell(map, x, y, tileId) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) {
        throw new TypeError('Tilemap must be an object');
    }
    if (!Number.isInteger(map.width) || map.width <= 0 || !Number.isInteger(map.height) || map.height <= 0) {
        throw new TypeError('Tilemap width and height must be positive integers');
    }
    if (!Array.isArray(map.data) || map.data.length !== map.width * map.height) {
        throw new TypeError('Tilemap data length must match its dimensions');
    }
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= map.width || y < 0 || y >= map.height) {
        throw new RangeError('Tile coordinates are outside the map');
    }
    if (!Number.isInteger(tileId) || tileId < 0) {
        throw new TypeError('Tile ID must be a non-negative integer');
    }

    const data = [...map.data];
    data[y * map.width + x] = tileId;
    return { ...map, data };
}

export function paintTileCells(map, cells, tileId) {
    if (!Array.isArray(cells)) throw new TypeError('Tile brush cells must be an array');
    return cells.reduce((updated, cell) => paintTileCell(updated, cell?.x, cell?.y, tileId), map);
}

export function createEmptyTilemap({ name, width, height, columns = 8, tileSize = 32, tileset } = {}) {
    const filename = typeof name === 'string' ? name.trim() : '';
    if (!/^[a-z0-9][a-z0-9._ -]*\.map$/i.test(filename) || filename.includes('..')) {
        throw new TypeError('Map name must be a project-root filename ending in .map');
    }
    if (!Number.isInteger(width) || width < 1 || width > 256 ||
        !Number.isInteger(height) || height < 1 || height > 256 || width * height > 65536) {
        throw new TypeError('New tilemap dimensions must be integers from 1 to 256');
    }
    if (!Number.isInteger(columns) || columns < 1 || columns > 64 ||
        !Number.isInteger(tileSize) || tileSize < 1 || tileSize > 256) {
        throw new TypeError('Tileset columns and tile size must be positive supported integers');
    }
    if (tileset !== undefined && typeof tileset !== 'string') {
        throw new TypeError('Tileset reference must be a project-relative path');
    }

    const tilemap = {
        width,
        height,
        tileSize,
        columns,
        tileCount: Math.min(columns * columns, 4096),
        data: new Array(width * height).fill(0)
    };
    if (tileset) tilemap.tileset = tileset;
    return tilemap;
}

export function getTilemapAttachError({ tilemap, mapPath, currentScenePath, isDirty } = {}) {
    if (!tilemap || !mapPath) return 'Choose a tilemap before adding it to a scene.';
    if (!currentScenePath) return 'Open a scene before adding a tilemap.';
    if (isDirty) return 'Save the tilemap before adding it to the scene.';
    if (typeof tilemap.tileset !== 'string' || tilemap.tileset.trim() === '') {
        return 'Choose a tileset before adding the tilemap to the scene.';
    }
    return null;
}
