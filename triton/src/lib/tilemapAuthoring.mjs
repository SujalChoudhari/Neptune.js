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

export function setCellMetadata(map, x, y, updates) {
    if (!map || typeof map !== 'object' || Array.isArray(map) ||
        !Number.isInteger(map.width) || map.width <= 0 || !Number.isInteger(map.height) || map.height <= 0) {
        throw new TypeError('Tilemap dimensions must be positive integers');
    }
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= map.width || y < 0 || y >= map.height) {
        throw new RangeError('Tile coordinates are outside the map');
    }
    if (!updates || typeof updates !== 'object' || Array.isArray(updates) ||
        Object.keys(updates).some((key) => key !== 'collision') ||
        (updates.collision !== undefined && typeof updates.collision !== 'boolean')) {
        throw new TypeError('Cell metadata supports only a boolean collision override');
    }
    const cellMetadata = { ...(map.cellMetadata || {}) };
    const index = y * map.width + x;
    const current = { ...(cellMetadata[index] || {}) };
    if (updates.collision === undefined) delete current.collision;
    else current.collision = updates.collision;
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
