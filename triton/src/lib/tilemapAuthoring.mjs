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
