import { Component } from "../components/component.js";
import { Tileset } from "./tileset.js";
import { ResourceReferenceError } from "../core/scene.js";

/**
 * Tilemap component renders a grid of tiles from a tileset.
 * @class Tilemap
 * @extends Component
 */
export class Tilemap extends Component {
    /**
     * @param {Tileset} tileset - The tileset to use.
     * @param {number} width - Map width in tiles.
     * @param {number} height - Map height in tiles.
     */
    constructor(tileset, width = 10, height = 10) {
        super();
        if (!(tileset instanceof Tileset)) {
            throw new ResourceReferenceError("tileset", tileset, "tilemap.tileset", "reference is not a Tileset instance", "a compatible Tileset instance");
        }
        if (!Number.isInteger(width) || width < 0 || !Number.isInteger(height) || height < 0) {
            throw new ResourceReferenceError("tilemap", tileset.imagePath, "tilemap.dimensions", "width and height must be non-negative integers", "valid tilemap dimensions");
        }
        this.tileset = tileset;
        this.width = width;
        this.height = height;
        this.scale = 1;
        this.data = new Array(width * height).fill(-1); // -1 = empty
        this.metadata = new Map();
        this.layers = [];
        this.occupants = new Map();
        this.occupantCells = new Map();
    }

    /** Register another traversable map layer, ordered by render order then insertion. */
    addLayer(name, tilemap, renderOrder = 0) {
        if (typeof name !== "string" || name.length === 0) {
            throw new TypeError("Tilemap layer name must be a non-empty string");
        }
        if (!(tilemap instanceof Tilemap) || tilemap === this) {
            throw new TypeError("Tilemap layer must be a different Tilemap instance");
        }
        if (!Number.isFinite(renderOrder)) {
            throw new TypeError("Tilemap layer renderOrder must be finite");
        }
        if (this.layers.some(layer => layer.name === name)) {
            throw new Error(`Tilemap layer '${name}' already exists`);
        }
        this.layers.push({ name, tilemap, renderOrder });
        return tilemap;
    }

    getLayer(name) {
        return this.layers.find(layer => layer.name === name)?.tilemap;
    }

    /** Set validated gameplay metadata for a tile ID. */
    setTileMetadata(tileId, metadata) {
        if (!Number.isInteger(tileId) || tileId < 0) {
            throw new TypeError("Tile metadata requires a non-negative integer tileId");
        }
        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
            throw new TypeError("Tile metadata must be an object");
        }
        const allowed = new Set(["walkable", "terrain", "collision", "damage", "slowdown", "interaction", "transition"]);
        for (const key of Object.keys(metadata)) {
            if (!allowed.has(key)) throw new TypeError(`Unknown tile metadata field: ${key}`);
        }
        if (metadata.walkable !== undefined && typeof metadata.walkable !== "boolean") {
            throw new TypeError("Tile metadata walkable must be a boolean");
        }
        if (metadata.terrain !== undefined && typeof metadata.terrain !== "string") {
            throw new TypeError("Tile metadata terrain must be a string");
        }
        if (metadata.collision !== undefined && typeof metadata.collision !== "boolean") {
            throw new TypeError("Tile metadata collision must be a boolean");
        }
        for (const field of ["damage", "slowdown"]) {
            if (metadata[field] !== undefined && (!Number.isFinite(metadata[field]) || metadata[field] < 0)) {
                throw new TypeError(`Tile metadata ${field} must be a finite non-negative number`);
            }
        }
        for (const field of ["interaction", "transition"]) {
            if (metadata[field] !== undefined && metadata[field] !== null &&
                (typeof metadata[field] !== "object" || Array.isArray(metadata[field]))) {
                throw new TypeError(`Tile metadata ${field} must be an object or null`);
            }
        }
        this.metadata.set(tileId, structuredClone(metadata));
        return this.getTileMetadata(tileId);
    }

    /** Return a defensive copy of metadata for a tile ID, or null when unset. */
    getTileMetadata(tileId) {
        const metadata = this.metadata.get(tileId);
        return metadata ? structuredClone(metadata) : null;
    }

    /** Convert tile coordinates to a stable row-major grid index, or null out of bounds. */
    gridIndex(x, y) {
        return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.width && y >= 0 && y < this.height
            ? y * this.width + x : null;
    }

    /** Place or move an occupant; each occupant may occupy only one cell. */
    occupy(x, y, occupant) {
        const index = this.gridIndex(x, y);
        if (index === null) throw new RangeError("Occupancy coordinates are outside the tilemap");
        if (occupant === undefined || occupant === null) throw new TypeError("Occupant must be a non-null value");
        if (!this.isWalkable(x, y, occupant)) return false;
        const previousCell = this.occupantCells.get(occupant);
        if (previousCell !== undefined) this.occupants.delete(previousCell);
        this.occupants.set(index, occupant);
        this.occupantCells.set(occupant, index);
        return true;
    }

    /** Move an occupied actor by one cardinal tile, leaving state unchanged on failure. */
    moveOccupant(occupant, x, y) {
        if (occupant === undefined || occupant === null) throw new TypeError("Occupant must be a non-null value");
        const currentIndex = this.occupantCells.get(occupant);
        if (currentIndex === undefined) return false;
        const fromX = currentIndex % this.width;
        const fromY = Math.floor(currentIndex / this.width);
        if (Math.abs(x - fromX) + Math.abs(y - fromY) !== 1) return false;
        if (!this.isWalkable(x, y, occupant)) return false;
        const nextIndex = this.gridIndex(x, y);
        this.occupants.delete(currentIndex);
        this.occupants.set(nextIndex, occupant);
        this.occupantCells.set(occupant, nextIndex);
        return true;
    }

    /** Follow a shortest path by one step toward a destination; returns the new cell or null. */
    moveOccupantToward(occupant, goalX, goalY) {
        const currentIndex = this.occupantCells.get(occupant);
        if (currentIndex === undefined) return null;
        const x = currentIndex % this.width;
        const y = Math.floor(currentIndex / this.width);
        const path = this.findPath(x, y, goalX, goalY, occupant);
        if (!path?.length) return path ? { x, y } : null;
        const step = path[0];
        return this.moveOccupant(occupant, step.x, step.y) ? step : null;
    }

    vacate(occupant) {
        const index = this.occupantCells.get(occupant);
        if (index === undefined) return null;
        this.occupantCells.delete(occupant);
        this.occupants.delete(index);
        return { x: index % this.width, y: Math.floor(index / this.width) };
    }

    getOccupant(x, y) {
        const index = this.gridIndex(x, y);
        return index === null ? null : (this.occupants.get(index) ?? null);
    }

    isWalkable(x, y, mover = null) {
        const index = this.gridIndex(x, y);
        if (index === null) return false;
        const tileId = this.getTile(x, y);
        const metadata = this.getTileMetadata(tileId);
        if (metadata?.walkable === false || (tileId >= 0 && metadata?.walkable !== true)) return false;
        const occupant = this.occupants.get(index);
        return occupant === undefined || occupant === mover;
    }

    /** Deterministic four-way shortest path; returns coordinates excluding start, or null. */
    findPath(startX, startY, goalX, goalY, mover = null) {
        if (this.gridIndex(startX, startY) === null || this.gridIndex(goalX, goalY) === null ||
            !this.isWalkable(startX, startY, mover) || !this.isWalkable(goalX, goalY, mover)) return null;
        if (startX === goalX && startY === goalY) return [];
        const key = (x, y) => y * this.width + x;
        const queue = [[startX, startY]];
        const previous = new Map([[key(startX, startY), null]]);
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (let cursor = 0; cursor < queue.length; cursor++) {
            const [x, y] = queue[cursor];
            for (const [dx, dy] of directions) {
                const nx = x + dx, ny = y + dy, next = key(nx, ny);
                if (this.gridIndex(nx, ny) === null || previous.has(next) || !this.isWalkable(nx, ny, mover)) continue;
                previous.set(next, key(x, y));
                queue.push([nx, ny]);
                if (nx === goalX && ny === goalY) {
                    const path = [];
                    let step = next;
                    while (step !== key(startX, startY)) {
                        path.push({ x: step % this.width, y: Math.floor(step / this.width) });
                        step = previous.get(step);
                    }
                    return path.reverse();
                }
            }
        }
        return null;
    }

    /**
     * Set a tile at position.
     * @param {number} x - X position in tiles.
     * @param {number} y - Y position in tiles.
     * @param {number} tileId - Tile ID from tileset (-1 for empty).
     */
    setTile(x, y, tileId) {
        if (!Number.isInteger(tileId) || tileId < -1) {
            throw new ResourceReferenceError("tileset", this.tileset.imagePath, `tilemap.data[${x},${y}]`, "tile id must be -1 or a non-negative integer", "a valid tile id");
        }
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.data[y * this.width + x] = tileId;
        }
    }

    /**
     * Get a tile at position.
     * @param {number} x - X position in tiles.
     * @param {number} y - Y position in tiles.
     * @returns {number} Tile ID or -1 if empty/out of bounds.
     */
    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.data[y * this.width + x];
        }
        return -1;
    }

    /**
     * Load tilemap from 2D array.
     * @param {number[][]} data - 2D array of tile IDs.
     */
    loadFromArray(data) {
        if (!Array.isArray(data) || (data.length > 0 && !Array.isArray(data[0]))) {
            throw new ResourceReferenceError("tilemap", this.tileset.imagePath, "tilemap.data", "data must be a two-dimensional array", "a two-dimensional tile data array");
        }
        this.height = data.length;
        this.width = data[0]?.length || 0;
        this.data = new Array(this.width * this.height);

        for (let y = 0; y < this.height; y++) {
            if (!Array.isArray(data[y]) || data[y].length !== this.width) {
                throw new ResourceReferenceError("tilemap", this.tileset.imagePath, `tilemap.data[${y}]`, "rows must have the same width", "a rectangular two-dimensional tile data array");
            }
            for (let x = 0; x < this.width; x++) {
                const tileId = data[y][x];
                if (tileId === undefined || tileId === null) {
                    this.data[y * this.width + x] = -1;
                } else if (!Number.isInteger(tileId) || tileId < -1) {
                    throw new ResourceReferenceError("tileset", this.tileset.imagePath, `tilemap.data[${y}][${x}]`, "tile id must be -1 or a non-negative integer", "a valid tile id");
                } else {
                    this.data[y * this.width + x] = tileId;
                }
            }
        }
    }

    /**
     * Get pixel width of the tilemap.
     */
    get pixelWidth() {
        return this.width * this.tileset.tileWidth * this.scale;
    }

    /**
     * Get pixel height of the tilemap.
     */
    get pixelHeight() {
        return this.height * this.tileset.tileHeight * this.scale;
    }

    /**
     * Convert world position to tile position.
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {{ x: number, y: number }}
     */
    worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / (this.tileset.tileWidth * this.scale)),
            y: Math.floor(worldY / (this.tileset.tileHeight * this.scale))
        };
    }

    /**
     * Check if a tile is solid (non-empty).
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isSolid(x, y) {
        const tileId = this.getTile(x, y);
        return tileId >= 0 && this.getTileMetadata(tileId)?.collision !== false;
    }

    /**
     * Draw the tilemap.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} offsetX - Camera offset X.
     * @param {number} offsetY - Camera offset Y.
     */
    draw(ctx, offsetX = 0, offsetY = 0) {
        this.#drawTiles(ctx, offsetX, offsetY);
        const visited = new Set([this]);
        const layers = [...this.layers].sort((a, b) => a.renderOrder - b.renderOrder);
        const drawLayer = (tilemap) => {
            if (visited.has(tilemap)) return;
            visited.add(tilemap);
            tilemap.#drawTiles(ctx, offsetX, offsetY);
            for (const layer of [...tilemap.layers].sort((a, b) => a.renderOrder - b.renderOrder)) {
                drawLayer(layer.tilemap);
            }
        };
        for (const layer of layers) drawLayer(layer.tilemap);
    }

    #drawTiles(ctx, offsetX, offsetY) {
        const tw = this.tileset.tileWidth * this.scale;
        const th = this.tileset.tileHeight * this.scale;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileId = this.data[y * this.width + x];
                if (tileId >= 0) {
                    this.tileset.drawTile(
                        ctx,
                        tileId,
                        x * tw - offsetX,
                        y * th - offsetY,
                        this.scale
                    );
                }
            }
        }
    }
}
