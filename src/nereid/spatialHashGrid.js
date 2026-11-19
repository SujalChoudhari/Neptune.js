import { Component } from "../components/component.js";

/**
 * Validates finite number.
 * @param {number} value
 * @param {string} name
 * @returns {number}
 */
function finiteNumber(value, name) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`${name} must be a finite number`);
    }
    return value;
}

/**
 * 2D Spatial Hash Grid broadphase partitioning space into uniform buckets.
 * Supports efficient range queries, AABB queries, teleportation, dynamic updates,
 * and robust handling of negative coordinates and oversized colliders.
 */
export class SpatialHashGrid extends Component {
    /**
     * @param {Object} [config]
     * @param {number} [config.cellSize=64] Width and height of each spatial cell
     * @param {number} [config.maxCellSpan=32] Maximum cells an oversized object can span across one dimension
     */
    constructor({ cellSize = 64, maxCellSpan = 32 } = {}) {
        super();
        finiteNumber(cellSize, "cellSize");
        if (cellSize <= 0) throw new RangeError("cellSize must be a positive number");

        this.cellSize = cellSize;
        this.maxCellSpan = Math.max(2, maxCellSpan);
        this.cells = new Map(); // key `${cellX},${cellY}` -> Set of entries
        this.entryCells = new Map(); // entry -> Set of cell keys
        this.entryBounds = new Map(); // entry -> { left, right, top, bottom }
        this._nextId = 1;
        this._ids = new WeakMap();
    }

    _id(entry) {
        if (!this._ids.has(entry)) {
            this._ids.set(entry, this._nextId++);
        }
        return this._ids.get(entry);
    }

    /**
     * Convert world coordinate to cell coordinate index.
     * Uses Math.floor to correctly handle negative coordinates.
     * @param {number} coord
     * @returns {number}
     */
    worldToCell(coord) {
        return Math.floor(coord / this.cellSize);
    }

    /**
     * Compute set of cell keys covered by an AABB.
     * Handles negative cells and clamps huge colliders to maxCellSpan.
     * @param {Object} bounds { left, right, top, bottom }
     * @returns {Set<string>}
     */
    getCellKeysForBounds(bounds) {
        if (!bounds || !Number.isFinite(bounds.left) || !Number.isFinite(bounds.right) ||
            !Number.isFinite(bounds.top) || !Number.isFinite(bounds.bottom)) {
            throw new TypeError("Bounds must contain finite left, right, top, bottom");
        }

        const minCellX = this.worldToCell(Math.min(bounds.left, bounds.right));
        const maxCellX = this.worldToCell(Math.max(bounds.left, bounds.right));
        const minCellY = this.worldToCell(Math.min(bounds.top, bounds.bottom));
        const maxCellY = this.worldToCell(Math.max(bounds.top, bounds.bottom));

        const spanX = Math.min(maxCellX - minCellX, this.maxCellSpan);
        const spanY = Math.min(maxCellY - minCellY, this.maxCellSpan);

        const keys = new Set();
        for (let cx = minCellX; cx <= minCellX + spanX; cx++) {
            for (let cy = minCellY; cy <= minCellY + spanY; cy++) {
                keys.add(`${cx},${cy}`);
            }
        }
        return keys;
    }

    /**
     * Insert an entry into the spatial grid.
     * @param {Object} entry Object identifier (collider, entity, etc.)
     * @param {Object} bounds { left, right, top, bottom }
     */
    insert(entry, bounds) {
        if (!entry) throw new TypeError("entry cannot be null or undefined");
        if (this.entryCells.has(entry)) {
            this.remove(entry);
        }

        const keys = this.getCellKeysForBounds(bounds);
        this.entryCells.set(entry, keys);
        this.entryBounds.set(entry, { ...bounds });

        for (const key of keys) {
            let bucket = this.cells.get(key);
            if (!bucket) {
                bucket = new Set();
                this.cells.set(key, bucket);
            }
            bucket.add(entry);
        }
    }

    /**
     * Update an entry's position and bounding box.
     * If the cell coverage did not change, avoids bucket re-insertions.
     * @param {Object} entry
     * @param {Object} newBounds
     * @returns {boolean} Whether spatial bucket assignment changed
     */
    update(entry, newBounds) {
        if (!this.entryCells.has(entry)) {
            this.insert(entry, newBounds);
            return true;
        }

        const currentKeys = this.entryCells.get(entry);
        const newKeys = this.getCellKeysForBounds(newBounds);

        // Check if sets are equal
        let changed = currentKeys.size !== newKeys.size;
        if (!changed) {
            for (const key of currentKeys) {
                if (!newKeys.has(key)) {
                    changed = true;
                    break;
                }
            }
        }

        this.entryBounds.set(entry, { ...newBounds });

        if (!changed) return false;

        // Remove from old keys not in new keys
        for (const key of currentKeys) {
            if (!newKeys.has(key)) {
                const bucket = this.cells.get(key);
                if (bucket) {
                    bucket.delete(entry);
                    if (bucket.size === 0) this.cells.delete(key);
                }
            }
        }

        // Add to new keys not in old keys
        for (const key of newKeys) {
            if (!currentKeys.has(key)) {
                let bucket = this.cells.get(key);
                if (!bucket) {
                    bucket = new Set();
                    this.cells.set(key, bucket);
                }
                bucket.add(entry);
            }
        }

        this.entryCells.set(entry, newKeys);
        return true;
    }

    /**
     * Teleport an entry instantly to new bounds.
     * @param {Object} entry
     * @param {Object} newBounds
     */
    teleport(entry, newBounds) {
        this.update(entry, newBounds);
    }

    /**
     * Remove an entry from all cells.
     * @param {Object} entry
     * @returns {boolean} Whether entry was present and removed
     */
    remove(entry) {
        const keys = this.entryCells.get(entry);
        if (!keys) return false;

        for (const key of keys) {
            const bucket = this.cells.get(key);
            if (bucket) {
                bucket.delete(entry);
                if (bucket.size === 0) {
                    this.cells.delete(key);
                }
            }
        }

        this.entryCells.delete(entry);
        this.entryBounds.delete(entry);
        return true;
    }

    /**
     * Query all unique entries whose bounding box overlaps the given AABB.
     * @param {Object} bounds { left, right, top, bottom }
     * @returns {Array<Object>}
     */
    queryAABB(bounds) {
        const keys = this.getCellKeysForBounds(bounds);
        const candidateEntries = new Set();

        for (const key of keys) {
            const bucket = this.cells.get(key);
            if (bucket) {
                for (const entry of bucket) {
                    candidateEntries.add(entry);
                }
            }
        }

        const results = [];
        for (const entry of candidateEntries) {
            const b = this.entryBounds.get(entry);
            if (!b) continue;
            // Precise AABB overlap test
            if (b.left < bounds.right && b.right > bounds.left &&
                b.top < bounds.bottom && b.bottom > bounds.top) {
                results.push(entry);
            }
        }

        return results;
    }

    /**
     * Query all unique entries within a circular radius of a point.
     * @param {number} x Center X
     * @param {number} y Center Y
     * @param {number} radius Search radius
     * @returns {Array<Object>}
     */
    queryRadius(x, y, radius) {
        finiteNumber(x, "x");
        finiteNumber(y, "y");
        finiteNumber(radius, "radius");
        if (radius < 0) throw new RangeError("radius must be non-negative");

        const aabb = {
            left: x - radius,
            right: x + radius,
            top: y - radius,
            bottom: y + radius
        };

        const candidates = this.queryAABB(aabb);
        const radiusSq = radius * radius;
        const results = [];

        for (const entry of candidates) {
            const b = this.entryBounds.get(entry);
            if (!b) continue;

            // Closest point on AABB to circle center
            const closestX = Math.max(b.left, Math.min(x, b.right));
            const closestY = Math.max(b.top, Math.min(y, b.bottom));

            const distSq = ((x - closestX) ** 2) + ((y - closestY) ** 2);
            if (distSq <= radiusSq) {
                results.push(entry);
            }
        }

        return results;
    }

    /**
     * Generate unique potential collision pairs across all cells.
     * Returns an array of [entryA, entryB] pairs with deterministic ordering.
     * @returns {Array<Array>}
     */
    getPotentialCollisionPairs() {
        const seenPairs = new Set();
        const pairs = [];

        for (const bucket of this.cells.values()) {
            if (bucket.size < 2) continue;
            const entries = [...bucket];
            for (let i = 0; i < entries.length; i++) {
                const a = entries[i];
                const idA = this._id(a);
                for (let j = i + 1; j < entries.length; j++) {
                    const b = entries[j];
                    const idB = this._id(b);
                    const pairKey = idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
                    if (!seenPairs.has(pairKey)) {
                        seenPairs.add(pairKey);
                        // Check precise bounding overlap
                        const boundsA = this.entryBounds.get(a);
                        const boundsB = this.entryBounds.get(b);
                        if (boundsA && boundsB &&
                            boundsA.left < boundsB.right && boundsA.right > boundsB.left &&
                            boundsA.top < boundsB.bottom && boundsA.bottom > boundsB.top) {
                            pairs.push(idA < idB ? [a, b] : [b, a]);
                        }
                    }
                }
            }
        }

        return pairs;
    }

    /**
     * Clear all cells and entries (e.g. on scene unload).
     */
    clear() {
        this.cells.clear();
        this.entryCells.clear();
        this.entryBounds.clear();
    }

    /**
     * Get the count of tracked entries.
     * @returns {number}
     */
    get size() {
        return this.entryCells.size;
    }
}
