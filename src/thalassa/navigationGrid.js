import { MaterialInteraction } from "../sim/materialRegistry.js";

/**
 * Priority queue (min-heap) for A* pathfinding.
 */
class MinHeap {
    constructor() {
        this._heap = [];
    }

    /**
     * @returns {number} Number of items in heap.
     */
    get size() {
        return this._heap.length;
    }

    /**
     * @returns {boolean} True if empty.
     */
    isEmpty() {
        return this._heap.length === 0;
    }

    /**
     * Push an item into the priority queue.
     * @param {Object} item - Heap item with f, h, and order properties.
     */
    push(item) {
        this._heap.push(item);
        this._bubbleUp(this._heap.length - 1);
    }

    /**
     * Remove and return the lowest-cost item.
     * @returns {Object|null} Lowest cost item, or null if empty.
     */
    pop() {
        if (this._heap.length === 0) return null;
        const top = this._heap[0];
        const last = this._heap.pop();
        if (this._heap.length > 0 && last !== undefined) {
            this._heap[0] = last;
            this._sinkDown(0);
        }
        return top;
    }

    /**
     * @private
     */
    _compare(a, b) {
        if (a.f !== b.f) return a.f - b.f;
        if (a.h !== b.h) return a.h - b.h;
        return a.order - b.order;
    }

    /**
     * @private
     */
    _bubbleUp(index) {
        const item = this._heap[index];
        while (index > 0) {
            const parentIndex = (index - 1) >> 1;
            const parent = this._heap[parentIndex];
            if (this._compare(item, parent) >= 0) break;
            this._heap[index] = parent;
            index = parentIndex;
        }
        this._heap[index] = item;
    }

    /**
     * @private
     */
    _sinkDown(index) {
        const item = this._heap[index];
        const length = this._heap.length;
        const halfLength = length >> 1;

        while (index < halfLength) {
            const leftChild = (index << 1) + 1;
            const rightChild = leftChild + 1;
            let bestChild = leftChild;

            if (rightChild < length && this._compare(this._heap[rightChild], this._heap[leftChild]) < 0) {
                bestChild = rightChild;
            }

            if (this._compare(item, this._heap[bestChild]) <= 0) break;

            this._heap[index] = this._heap[bestChild];
            index = bestChild;
        }
        this._heap[index] = item;
    }
}

/**
 * Result returned by NavigationGrid pathfinding.
 * Extends Array so it can be iterated directly, indexed by number, or inspected via properties.
 * @class NavigationPath
 * @extends Array
 */
export class NavigationPath extends Array {
    /**
     * Ensure built-in Array methods like map/filter/slice return standard Arrays.
     * @returns {Function}
     */
    static get [Symbol.species]() {
        return Array;
    }

    /**
     * @param {Object|Array|number} [options] - Result options, steps array, or length
     * @param {string} [options.status] - "success", "unreachable", "out_of_bounds", or "same_start_goal"
     * @param {boolean} [options.success] - Whether a valid path was found
     * @param {Array} [options.path] - List of { x, y } steps
     * @param {number} [options.cost] - Total traversal cost
     * @param {number} [options.visitedNodes] - Nodes expanded during search
     */
    constructor(options = {}) {
        let steps = [];
        let opts = {};

        if (Array.isArray(options)) {
            steps = options;
            opts = { success: true, status: "success" };
        } else if (typeof options === "number") {
            super(options);
            this.status = "unreachable";
            this.success = false;
            this.cost = Infinity;
            this.visitedNodes = 0;
            this.path = this;
            return;
        } else if (typeof options === "object" && options !== null) {
            steps = options.path || [];
            opts = options;
        }

        super(...steps);
        this.status = opts.status || (opts.success ? "success" : "unreachable");
        this.success = Boolean(opts.success);
        this.cost = Number.isFinite(opts.cost) ? opts.cost : (this.success ? 0 : Infinity);
        this.visitedNodes = opts.visitedNodes || 0;
        this.path = this;
    }

    /**
     * Whether pathfinding succeeded.
     * @returns {boolean}
     */
    isSuccess() {
        return this.success;
    }

    /**
     * Whether goal was unreachable.
     * @returns {boolean}
     */
    isUnreachable() {
        return this.status === "unreachable";
    }

    /**
     * Whether start or goal was out of bounds.
     * @returns {boolean}
     */
    isOutOfBounds() {
        return this.status === "out_of_bounds";
    }

    /**
     * Whether start and goal are the same point.
     * @returns {boolean}
     */
    isSameStartGoal() {
        return this.status === "same_start_goal";
    }
}

/**
 * 2D navigation grid supporting weighted traversal costs, walkability flags,
 * elevation rules, dynamic obstacles, chunk boundary links, and A* pathfinding.
 * @class NavigationGrid
 */
export class NavigationGrid {
    /**
     * @param {number|Object} [widthOrOptions=10] - Width in tiles, or options object
     * @param {number} [height=10] - Height in tiles
     * @param {Object} [options={}] - Grid configuration options
     * @param {number} [options.defaultCost=1.0] - Default movement cost per cell
     * @param {boolean} [options.defaultWalkable=true] - Default walkability flag
     * @param {number} [options.defaultElevation=0] - Default elevation level
     * @param {number} [options.maxClimbHeight=1] - Maximum traversable height difference between adjacent cells
     * @param {boolean} [options.allowDiagonal=true] - Allow 8-way diagonal movement
     * @param {number} [options.diagonalCostMultiplier] - Multiplier for diagonal steps (default Math.SQRT2)
     */
    constructor(widthOrOptions = 10, height = 10, options = {}) {
        let width = 10;
        let h = 10;
        let opts = {};

        if (typeof widthOrOptions === "object" && widthOrOptions !== null) {
            opts = widthOrOptions;
            width = opts.width ?? 10;
            h = opts.height ?? 10;
        } else {
            width = widthOrOptions;
            h = height ?? 10;
            opts = options || {};
        }

        if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(h) || h <= 0) {
            throw new TypeError("NavigationGrid width and height must be positive integers");
        }

        this.width = width;
        this.height = h;
        this.defaultCost = Number.isFinite(opts.defaultCost) && opts.defaultCost >= 1 ? opts.defaultCost : 1.0;
        this.defaultWalkable = opts.defaultWalkable !== false;
        this.defaultElevation = Number.isFinite(opts.defaultElevation) ? opts.defaultElevation : 0;
        this.maxClimbHeight = Number.isFinite(opts.maxClimbHeight) && opts.maxClimbHeight >= 0 ? opts.maxClimbHeight : 1;
        this.allowDiagonal = opts.allowDiagonal !== false;
        this.diagonalCostMultiplier = Number.isFinite(opts.diagonalCostMultiplier) && opts.diagonalCostMultiplier > 0
            ? opts.diagonalCostMultiplier
            : Math.SQRT2;

        const size = width * h;
        this._walkable = new Uint8Array(size).fill(this.defaultWalkable ? 1 : 0);
        this._cost = new Float32Array(size).fill(this.defaultCost);
        this._elevation = new Float32Array(size).fill(this.defaultElevation);

        // Dynamic obstacles
        this._obstacles = new Map();
        this._obstacleCells = new Map();
        this._nextObstacleId = 0;

        // Chunk links / portals
        this._chunkLinks = new Map();
        this._chunkLinksById = new Map();
        this._nextLinkId = 0;

        // Route monitoring & invalidation
        this.routeVersion = 0;
        this._registeredRoutes = new Map();
        this._invalidationListeners = new Set();
    }

    /**
     * Map (x, y) to a flat array index.
     * @private
     * @param {number} x
     * @param {number} y
     * @returns {number} Array index, or -1 if out of bounds.
     */
    _index(x, y) {
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return -1;
        }
        return y * this.width + x;
    }

    /**
     * Check whether (x, y) is inside the grid bounds.
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    inBounds(x, y) {
        return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /**
     * Get cell properties at (x, y).
     * @param {number} x
     * @param {number} y
     * @returns {Object|null} Cell state or null if out of bounds.
     */
    getCell(x, y) {
        const idx = this._index(x, y);
        if (idx === -1) return null;
        return {
            x,
            y,
            walkable: this._walkable[idx] === 1,
            cost: this._cost[idx],
            elevation: this._elevation[idx],
            isBlockedByObstacle: this.isCellBlockedByObstacle(x, y),
            effectiveWalkable: this.isWalkable(x, y)
        };
    }

    /**
     * Set multiple cell properties at once.
     * @param {number} x
     * @param {number} y
     * @param {Object} [props={}]
     * @param {boolean} [props.walkable]
     * @param {number} [props.cost]
     * @param {number} [props.elevation]
     * @returns {boolean} True if in bounds.
     */
    setCell(x, y, props = {}) {
        const idx = this._index(x, y);
        if (idx === -1) return false;
        if (props.walkable !== undefined) {
            this._walkable[idx] = props.walkable ? 1 : 0;
        }
        if (Number.isFinite(props.cost) && props.cost >= 1) {
            this._cost[idx] = props.cost;
        }
        if (Number.isFinite(props.elevation)) {
            this._elevation[idx] = props.elevation;
        }
        this.routeVersion++;
        return true;
    }

    /**
     * Check if a cell is walkable and not blocked by dynamic obstacles.
     * @param {number} x
     * @param {number} y
     * @param {boolean} [checkObstacles=true] - Whether dynamic obstacles block walkability
     * @returns {boolean}
     */
    isWalkable(x, y, checkObstacles = true) {
        const idx = this._index(x, y);
        if (idx === -1) return false;
        if (this._walkable[idx] === 0) return false;
        if (checkObstacles && this._obstacleCells.has(idx) && this._obstacleCells.get(idx).size > 0) {
            return false;
        }
        return true;
    }

    /**
     * Set walkability flag for a cell.
     * @param {number} x
     * @param {number} y
     * @param {boolean} walkable
     * @returns {boolean} True if updated.
     */
    setWalkable(x, y, walkable) {
        const idx = this._index(x, y);
        if (idx === -1) return false;
        this._walkable[idx] = walkable ? 1 : 0;
        this.routeVersion++;
        return true;
    }

    /**
     * Get traversal cost for a cell.
     * @param {number} x
     * @param {number} y
     * @returns {number} Cost value (>= 1.0) or Infinity if out of bounds / unwalkable.
     */
    getCost(x, y) {
        const idx = this._index(x, y);
        if (idx === -1 || !this.isWalkable(x, y)) return Infinity;
        return this._cost[idx];
    }

    /**
     * Set traversal cost for a cell.
     * @param {number} x
     * @param {number} y
     * @param {number} cost - Movement cost (must be >= 1.0)
     * @returns {boolean} True if updated.
     */
    setCost(x, y, cost) {
        const idx = this._index(x, y);
        if (idx === -1) return false;
        const num = Number(cost);
        if (!Number.isFinite(num) || num < 1) {
            throw new RangeError(`Traversal cost must be a finite number >= 1.0, got ${cost}`);
        }
        this._cost[idx] = num;
        this.routeVersion++;
        return true;
    }

    /**
     * Get elevation level for a cell.
     * @param {number} x
     * @param {number} y
     * @returns {number|null} Elevation level or null if out of bounds.
     */
    getElevation(x, y) {
        const idx = this._index(x, y);
        if (idx === -1) return null;
        return this._elevation[idx];
    }

    /**
     * Set elevation level for a cell.
     * @param {number} x
     * @param {number} y
     * @param {number} elevation
     * @returns {boolean} True if updated.
     */
    setElevation(x, y, elevation) {
        const idx = this._index(x, y);
        if (idx === -1) return false;
        const num = Number(elevation);
        if (!Number.isFinite(num)) {
            throw new TypeError(`Elevation must be a finite number, got ${elevation}`);
        }
        this._elevation[idx] = num;
        this.routeVersion++;
        return true;
    }

    /**
     * Set cell properties based on material definitions from SIM-01.
     * @param {number} x
     * @param {number} y
     * @param {string} materialId - Material ID (e.g., 'water', 'grass', 'wood')
     * @param {string} [state='dry'] - Material state (e.g., 'dry', 'wet', 'frozen')
     * @param {Object} [registry] - Optional MaterialRegistry instance
     * @returns {boolean} True if set.
     */
    setCellMaterial(x, y, materialId, state = "dry", registry = null) {
        const idx = this._index(x, y);
        if (idx === -1) return false;
        let cost = 1.0;
        try {
            cost = MaterialInteraction.getEffectiveTraversalCost({ materialId, state, registry });
        } catch (_) {
            try {
                cost = MaterialInteraction.getEffectiveTraversalCost(materialId, state);
            } catch (_) {
                cost = 1.0;
            }
        }
        this._cost[idx] = Math.max(1.0, cost);
        this.routeVersion++;
        return true;
    }

    /**
     * Set maximum climb height difference between adjacent cells.
     * @param {number} height
     */
    setMaxClimbHeight(height) {
        const num = Number(height);
        if (!Number.isFinite(num) || num < 0) {
            throw new RangeError(`maxClimbHeight must be a finite number >= 0, got ${height}`);
        }
        this.maxClimbHeight = num;
        this.routeVersion++;
    }

    /**
     * Get maximum climb height difference.
     * @returns {number}
     */
    getMaxClimbHeight() {
        return this.maxClimbHeight;
    }

    // =========================================================================
    // Dynamic Obstacles
    // =========================================================================

    /**
     * Add a dynamic obstacle blocking one or more cells.
     * Supports both addObstacle(id, x, y, width, height) and addObstacle({ id, x, y, width, height, cells }).
     * @param {string|Object} idOrConfig
     * @param {number} [x=0]
     * @param {number} [y=0]
     * @param {number} [width=1]
     * @param {number} [height=1]
     * @returns {Object} The registered obstacle record.
     */
    addObstacle(idOrConfig, x = 0, y = 0, width = 1, height = 1) {
        let id;
        let obstacle;

        if (typeof idOrConfig === "object" && idOrConfig !== null) {
            obstacle = { ...idOrConfig };
            id = obstacle.id ? String(obstacle.id) : `obstacle_${++this._nextObstacleId}`;
        } else {
            id = String(idOrConfig || `obstacle_${++this._nextObstacleId}`);
            obstacle = { id, x, y, width, height };
        }

        if (this._obstacles.has(id)) {
            this.removeObstacle(id);
        }

        const blockedIndices = new Set();
        if (Array.isArray(obstacle.cells)) {
            for (const cell of obstacle.cells) {
                const cx = Array.isArray(cell) ? cell[0] : cell.x;
                const cy = Array.isArray(cell) ? cell[1] : cell.y;
                const idx = this._index(cx, cy);
                if (idx !== -1) blockedIndices.add(idx);
            }
        } else {
            const ox = obstacle.x ?? 0;
            const oy = obstacle.y ?? 0;
            const ow = obstacle.width ?? 1;
            const oh = obstacle.height ?? 1;
            for (let row = 0; row < oh; row++) {
                for (let col = 0; col < ow; col++) {
                    const idx = this._index(ox + col, oy + row);
                    if (idx !== -1) blockedIndices.add(idx);
                }
            }
        }

        for (const idx of blockedIndices) {
            if (!this._obstacleCells.has(idx)) {
                this._obstacleCells.set(idx, new Set());
            }
            this._obstacleCells.get(idx).add(id);
        }

        const record = {
            id,
            ...obstacle,
            blockedIndices: Array.from(blockedIndices)
        };
        this._obstacles.set(id, record);

        this.routeVersion++;
        this._notifyInvalidation({ type: "obstacle_added", obstacle: record });
        return record;
    }

    /**
     * Remove a dynamic obstacle by ID.
     * @param {string} id
     * @returns {boolean} True if removed.
     */
    removeObstacle(id) {
        const key = String(id);
        const record = this._obstacles.get(key);
        if (!record) return false;

        for (const idx of record.blockedIndices) {
            const set = this._obstacleCells.get(idx);
            if (set) {
                set.delete(key);
                if (set.size === 0) {
                    this._obstacleCells.delete(idx);
                }
            }
        }

        this._obstacles.delete(key);
        this.routeVersion++;
        this._notifyInvalidation({ type: "obstacle_removed", obstacle: record });
        return true;
    }

    /**
     * Check if obstacle exists by ID.
     * @param {string} id
     * @returns {boolean}
     */
    hasObstacle(id) {
        return this._obstacles.has(String(id));
    }

    /**
     * Get obstacle by ID.
     * @param {string} id
     * @returns {Object|null}
     */
    getObstacle(id) {
        return this._obstacles.get(String(id)) || null;
    }

    /**
     * Get all active obstacles.
     * @returns {Object[]}
     */
    getObstacles() {
        return Array.from(this._obstacles.values());
    }

    /**
     * Remove all dynamic obstacles.
     */
    clearObstacles() {
        this._obstacles.clear();
        this._obstacleCells.clear();
        this.routeVersion++;
        this._notifyInvalidation({ type: "obstacles_cleared" });
    }

    /**
     * Check if a specific cell is blocked by dynamic obstacles.
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isCellBlockedByObstacle(x, y) {
        const idx = this._index(x, y);
        if (idx === -1) return false;
        return this._obstacleCells.has(idx) && this._obstacleCells.get(idx).size > 0;
    }

    // =========================================================================
    // Chunk Links / Portals
    // =========================================================================

    /**
     * Add a chunk link or portal connecting two coordinates.
     * Supports both addChunkLink(fromX, fromY, toX, toY, options) and addChunkLink({ from, to, cost, bidirectional, id }).
     * @param {number|Object} linkOrFromX
     * @param {number} [fromY]
     * @param {number} [toX]
     * @param {number} [toY]
     * @param {Object} [options={}]
     * @returns {Object} The created chunk link.
     */
    addChunkLink(linkOrFromX, fromY, toX, toY, options = {}) {
        let link;
        if (typeof linkOrFromX === "object" && linkOrFromX !== null) {
            link = { ...linkOrFromX };
        } else {
            link = {
                from: { x: linkOrFromX, y: fromY },
                to: { x: toX, y: toY },
                ...options
            };
        }

        if (!link.id) {
            link.id = `link_${++this._nextLinkId}`;
        }
        link.cost = Number.isFinite(link.cost) && link.cost >= 0 ? link.cost : 1.0;
        link.bidirectional = link.bidirectional !== false;
        link.enabled = link.enabled !== false;

        link.from = { x: Math.floor(link.from.x), y: Math.floor(link.from.y) };
        link.to = { x: Math.floor(link.to.x), y: Math.floor(link.to.y) };

        const fromIdx = this._index(link.from.x, link.from.y);
        if (fromIdx !== -1) {
            if (!this._chunkLinks.has(fromIdx)) {
                this._chunkLinks.set(fromIdx, []);
            }
            this._chunkLinks.get(fromIdx).push(link);
        }

        if (link.bidirectional) {
            const toIdx = this._index(link.to.x, link.to.y);
            if (toIdx !== -1) {
                const reverseLink = {
                    id: `${link.id}_reverse`,
                    from: { x: link.to.x, y: link.to.y },
                    to: { x: link.from.x, y: link.from.y },
                    cost: link.cost,
                    bidirectional: false,
                    enabled: link.enabled,
                    isReverse: true,
                    parentLinkId: link.id
                };
                if (!this._chunkLinks.has(toIdx)) {
                    this._chunkLinks.set(toIdx, []);
                }
                this._chunkLinks.get(toIdx).push(reverseLink);
            }
        }

        this._chunkLinksById.set(link.id, link);
        this.routeVersion++;
        this._notifyInvalidation({ type: "chunk_link_added", link });
        return link;
    }

    /**
     * Alias for addChunkLink.
     * @param {number|Object} linkOrFromX
     * @param {number} [fromY]
     * @param {number} [toX]
     * @param {number} [toY]
     * @param {Object} [options={}]
     * @returns {Object}
     */
    addPortal(linkOrFromX, fromY, toX, toY, options = {}) {
        return this.addChunkLink(linkOrFromX, fromY, toX, toY, options);
    }

    /**
     * Remove a chunk link by ID.
     * @param {string} id
     * @returns {boolean} True if removed.
     */
    removeChunkLink(id) {
        const link = this._chunkLinksById.get(id);
        if (!link) return false;

        const fromIdx = this._index(link.from.x, link.from.y);
        if (fromIdx !== -1 && this._chunkLinks.has(fromIdx)) {
            const list = this._chunkLinks.get(fromIdx).filter((l) => l.id !== id);
            if (list.length === 0) this._chunkLinks.delete(fromIdx);
            else this._chunkLinks.set(fromIdx, list);
        }

        if (link.bidirectional) {
            const revId = `${id}_reverse`;
            const toIdx = this._index(link.to.x, link.to.y);
            if (toIdx !== -1 && this._chunkLinks.has(toIdx)) {
                const list = this._chunkLinks.get(toIdx).filter((l) => l.id !== revId);
                if (list.length === 0) this._chunkLinks.delete(toIdx);
                else this._chunkLinks.set(toIdx, list);
            }
        }

        this._chunkLinksById.delete(id);
        this.routeVersion++;
        this._notifyInvalidation({ type: "chunk_link_removed", linkId: id });
        return true;
    }

    /**
     * Get outgoing chunk links from coordinate (x, y).
     * @param {number} x
     * @param {number} y
     * @returns {Object[]}
     */
    getChunkLinks(x, y) {
        const idx = this._index(x, y);
        if (idx === -1 || !this._chunkLinks.has(idx)) return [];
        return this._chunkLinks.get(idx).filter((l) => l.enabled !== false);
    }

    /**
     * Clear all chunk links.
     */
    clearChunkLinks() {
        this._chunkLinks.clear();
        this._chunkLinksById.clear();
        this.routeVersion++;
        this._notifyInvalidation({ type: "chunk_links_cleared" });
    }

    // =========================================================================
    // Route Validation and Invalidation
    // =========================================================================

    /**
     * Validate whether an existing path remains walkable and unbroken.
     * @param {Array} path - Sequence of { x, y } step objects
     * @param {Object} [options={}] - Validation options
     * @returns {Object} Validation report { valid, blockedIndex, blockedCell, reason }
     */
    validateRoute(path, options = {}) {
        if (!Array.isArray(path) || path.length === 0) {
            return { valid: true, blockedIndex: -1, blockedCell: null, reason: null };
        }
        const maxClimb = Number.isFinite(options.maxClimbHeight) ? options.maxClimbHeight : this.maxClimbHeight;
        const preventCornerCutting = options.preventCornerCutting !== false;

        for (let i = 0; i < path.length; i++) {
            const step = path[i];
            if (!this.inBounds(step.x, step.y)) {
                return { valid: false, blockedIndex: i, blockedCell: step, reason: "out_of_bounds" };
            }
            if (!this.isWalkable(step.x, step.y)) {
                return {
                    valid: false,
                    blockedIndex: i,
                    blockedCell: step,
                    reason: this.isCellBlockedByObstacle(step.x, step.y) ? "obstacle_blocked" : "cell_unwalkable"
                };
            }

            if (i > 0) {
                const prev = path[i - 1];
                if (step.isChunkLink) {
                    continue;
                }

                const dx = step.x - prev.x;
                const dy = step.y - prev.y;

                const elevDiff = Math.abs(this.getElevation(step.x, step.y) - this.getElevation(prev.x, prev.y));
                if (elevDiff > maxClimb) {
                    return { valid: false, blockedIndex: i, blockedCell: step, reason: "climb_limit_exceeded" };
                }

                if (dx !== 0 && dy !== 0 && preventCornerCutting) {
                    if (!this.isWalkable(prev.x + dx, prev.y) || !this.isWalkable(prev.x, prev.y + dy)) {
                        return { valid: false, blockedIndex: i, blockedCell: step, reason: "corner_cutting_blocked" };
                    }
                }
            }
        }
        return { valid: true, blockedIndex: -1, blockedCell: null, reason: null };
    }

    /**
     * Check if an existing path remains valid.
     * @param {Array} path - Array of { x, y }
     * @param {Object} [options={}]
     * @returns {boolean}
     */
    isRouteValid(path, options = {}) {
        return this.validateRoute(path, options).valid;
    }

    /**
     * Register a route to monitor for invalidation when obstacles change.
     * @param {string} id - Identifier for the route
     * @param {Array} path - Array of { x, y } steps
     */
    registerRoute(id, path) {
        this._registeredRoutes.set(String(id), {
            id: String(id),
            path: Array.from(path),
            registeredVersion: this.routeVersion
        });
    }

    /**
     * Unregister a monitored route.
     * @param {string} id
     * @returns {boolean} True if removed.
     */
    unregisterRoute(id) {
        return this._registeredRoutes.delete(String(id));
    }

    /**
     * Get a registered route by ID.
     * @param {string} id
     * @returns {Array|null}
     */
    getRegisteredRoute(id) {
        const entry = this._registeredRoutes.get(String(id));
        return entry ? entry.path : null;
    }

    /**
     * Query which registered routes are currently invalid.
     * @returns {string[]} List of invalidated route IDs.
     */
    getInvalidatedRoutes() {
        const invalidated = [];
        for (const [id, entry] of this._registeredRoutes) {
            if (!this.isRouteValid(entry.path)) {
                invalidated.push(id);
            }
        }
        return invalidated;
    }

    /**
     * Explicitly invalidate routes and increment version.
     * @returns {string[]} IDs of registered routes that are invalid.
     */
    invalidateRoutes() {
        this.routeVersion++;
        const invalidated = this.getInvalidatedRoutes();
        this._notifyInvalidation({ type: "routes_invalidated", invalidatedRoutes: invalidated });
        return invalidated;
    }

    /**
     * Subscribe to route invalidation events.
     * @param {Function} callback - Event listener
     * @returns {Function} Unsubscribe function
     */
    onRouteInvalidated(callback) {
        if (typeof callback === "function") {
            this._invalidationListeners.add(callback);
        }
        return () => this.offRouteInvalidated(callback);
    }

    /**
     * Remove an invalidation listener.
     * @param {Function} callback
     */
    offRouteInvalidated(callback) {
        this._invalidationListeners.delete(callback);
    }

    /**
     * @private
     */
    _notifyInvalidation(event) {
        if (this._invalidationListeners.size === 0) return;
        for (const listener of this._invalidationListeners) {
            try {
                listener({ ...event, version: this.routeVersion });
            } catch (_) {
                // Ignore listener exceptions
            }
        }
    }

    // =========================================================================
    // A* Pathfinding
    // =========================================================================

    /**
     * Compute the lowest-cost path from start to goal using A*.
     * Supports both findPath(start, goal, options) and findPath(startX, startY, goalX, goalY, options).
     * @param {Object|Array|number} startArg - Starting point { x, y }, [x, y], or startX number
     * @param {Object|Array|number} goalArg - Goal point { x, y }, [x, y], or startY number
     * @param {Object|number} [optionsOrGoalX] - Options object, or goalX number
     * @param {number} [goalY] - goalY number if coordinates were passed numerically
     * @param {Object} [options] - Options object if coordinates were passed numerically
     * @param {boolean} [options.allowDiagonal] - Allow diagonal steps (default this.allowDiagonal)
     * @param {boolean} [options.preventCornerCutting=true] - Strict corner-cutting prevention past solid walls
     * @param {number} [options.maxClimbHeight] - Max traversable height diff (default this.maxClimbHeight)
     * @param {number} [options.diagonalCostMultiplier] - Multiplier for diagonal steps
     * @param {boolean} [options.includeStart=false] - Whether to include the starting tile in the path
     * @param {boolean} [options.useChunkLinks=true] - Whether to traverse chunk links/portals
     * @param {number} [options.maxCost] - Search cost cutoff limit
     * @param {Function} [options.isWalkable] - Custom walkability predicate (x, y) => boolean
     * @returns {NavigationPath} Path result containing status, success, cost, and steps.
     */
    findPath(startArg, goalArg, optionsOrGoalX, goalY, options) {
        let start = null;
        let goal = null;
        let opts = {};

        if (
            typeof startArg === "number" &&
            typeof goalArg === "number" &&
            typeof optionsOrGoalX === "number" &&
            typeof goalY === "number"
        ) {
            start = { x: Math.floor(startArg), y: Math.floor(goalArg) };
            goal = { x: Math.floor(optionsOrGoalX), y: Math.floor(goalY) };
            opts = options || {};
        } else {
            const normalize = (pt) => {
                if (!pt) return null;
                if (Array.isArray(pt)) return { x: Math.floor(pt[0]), y: Math.floor(pt[1]) };
                if (typeof pt === "object" && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
                    return { x: Math.floor(pt.x), y: Math.floor(pt.y) };
                }
                return null;
            };
            start = normalize(startArg);
            goal = normalize(goalArg);
            opts = (typeof optionsOrGoalX === "object" && optionsOrGoalX !== null) ? optionsOrGoalX : (options || {});
        }

        // Edge case: out of bounds start or goal returns safely without throwing
        if (!start || !goal || !this.inBounds(start.x, start.y) || !this.inBounds(goal.x, goal.y)) {
            return new NavigationPath({
                status: "out_of_bounds",
                success: false,
                path: [],
                cost: Infinity,
                visitedNodes: 0
            });
        }

        // Edge case: same start and goal returns immediately
        if (start.x === goal.x && start.y === goal.y) {
            const path = opts.includeStart ? [{ x: start.x, y: start.y, cost: 0 }] : [];
            return new NavigationPath({
                status: "same_start_goal",
                success: true,
                path,
                cost: 0,
                visitedNodes: 0
            });
        }

        const customWalkable = typeof opts.isWalkable === "function" ? opts.isWalkable : null;
        const isTileWalkable = (tx, ty) => {
            if (customWalkable) return customWalkable(tx, ty);
            return this.isWalkable(tx, ty);
        };

        // Edge case: start or goal cell is not walkable
        if (!isTileWalkable(start.x, start.y) || !isTileWalkable(goal.x, goal.y)) {
            return new NavigationPath({
                status: "unreachable",
                success: false,
                path: [],
                cost: Infinity,
                visitedNodes: 0
            });
        }

        const allowDiagonal = opts.allowDiagonal !== undefined ? Boolean(opts.allowDiagonal) : this.allowDiagonal;
        const preventCornerCutting = opts.preventCornerCutting !== false;
        const maxClimb = Number.isFinite(opts.maxClimbHeight) ? opts.maxClimbHeight : this.maxClimbHeight;
        const diagMultiplier = Number.isFinite(opts.diagonalCostMultiplier)
            ? opts.diagonalCostMultiplier
            : this.diagonalCostMultiplier;
        const useChunkLinks = opts.useChunkLinks !== false;
        const maxCost = Number.isFinite(opts.maxCost) ? opts.maxCost : Infinity;

        const baseDistance = (x1, y1, x2, y2) => {
            const dx = Math.abs(x1 - x2);
            const dy = Math.abs(y1 - y2);
            if (allowDiagonal) {
                const minD = Math.min(dx, dy);
                const maxD = Math.max(dx, dy);
                return minD * diagMultiplier + (maxD - minD);
            }
            return dx + dy;
        };

        const activePortals = [];
        if (useChunkLinks && this._chunkLinks.size > 0) {
            for (const linkList of this._chunkLinks.values()) {
                for (let i = 0; i < linkList.length; i++) {
                    const l = linkList[i];
                    if (l.enabled !== false && this.inBounds(l.to.x, l.to.y) && isTileWalkable(l.to.x, l.to.y)) {
                        activePortals.push({
                            from: l.from,
                            to: l.to,
                            cost: l.cost,
                            toGoal: baseDistance(l.to.x, l.to.y, goal.x, goal.y) + l.cost
                        });
                    }
                }
            }
        }

        // Admissible heuristic function (portal-aware)
        const heuristic = (x, y) => {
            let minH = baseDistance(x, y, goal.x, goal.y);
            for (let p = 0; p < activePortals.length; p++) {
                const port = activePortals[p];
                const via = baseDistance(x, y, port.from.x, port.from.y) + port.toGoal;
                if (via < minH) minH = via;
            }
            return minH;
        };

        const startIdx = this._index(start.x, start.y);
        const goalIdx = this._index(goal.x, goal.y);

        const queue = new MinHeap();
        const gScores = new Map();
        const cameFrom = new Map();
        const closedSet = new Set();
        let insertionOrder = 0;
        let visitedNodesCount = 0;

        gScores.set(startIdx, 0);
        const startH = heuristic(start.x, start.y);
        queue.push({
            index: startIdx,
            x: start.x,
            y: start.y,
            g: 0,
            h: startH,
            f: startH,
            order: insertionOrder++
        });

        // 8-way and 4-way direction vectors
        const directions = allowDiagonal
            ? [
                [0, -1], [1, 0], [0, 1], [-1, 0],
                [-1, -1], [1, -1], [1, 1], [-1, 1]
            ]
            : [
                [0, -1], [1, 0], [0, 1], [-1, 0]
            ];

        while (!queue.isEmpty()) {
            const current = queue.pop();
            if (!current) break;

            if (closedSet.has(current.index)) continue;
            if (current.g > (gScores.get(current.index) ?? Infinity)) continue;

            closedSet.add(current.index);
            visitedNodesCount++;

            // Reached goal!
            if (current.index === goalIdx) {
                const steps = [];
                let stepIdx = current.index;

                while (stepIdx !== startIdx) {
                    const edge = cameFrom.get(stepIdx);
                    if (!edge) break;
                    const stepObj = {
                        x: edge.toX,
                        y: edge.toY,
                        cost: edge.stepCost
                    };
                    if (edge.isChunkLink) {
                        stepObj.isChunkLink = true;
                        if (edge.linkId) stepObj.linkId = edge.linkId;
                    }
                    steps.push(stepObj);
                    stepIdx = edge.fromIdx;
                }

                if (opts.includeStart) {
                    steps.push({ x: start.x, y: start.y, cost: 0 });
                }

                steps.reverse();

                return new NavigationPath({
                    status: "success",
                    success: true,
                    path: steps,
                    cost: current.g,
                    visitedNodes: visitedNodesCount
                });
            }

            // 1. Chunk links / portals originating from current cell
            if (useChunkLinks) {
                const links = this.getChunkLinks(current.x, current.y);
                for (let i = 0; i < links.length; i++) {
                    const link = links[i];
                    const tx = link.to.x;
                    const ty = link.to.y;

                    if (!this.inBounds(tx, ty) || !isTileWalkable(tx, ty)) continue;
                    const tIdx = this._index(tx, ty);
                    if (closedSet.has(tIdx)) continue;

                    const stepCost = link.cost;
                    const tentG = current.g + stepCost;
                    if (tentG > maxCost) continue;

                    if (tentG < (gScores.get(tIdx) ?? Infinity)) {
                        gScores.set(tIdx, tentG);
                        cameFrom.set(tIdx, {
                            fromIdx: current.index,
                            toX: tx,
                            toY: ty,
                            stepCost,
                            isChunkLink: true,
                            linkId: link.id
                        });
                        const h = heuristic(tx, ty);
                        queue.push({
                            index: tIdx,
                            x: tx,
                            y: ty,
                            g: tentG,
                            h,
                            f: tentG + h,
                            order: insertionOrder++
                        });
                    }
                }
            }

            // 2. Adjacent grid neighbors
            for (let d = 0; d < directions.length; d++) {
                const [dx, dy] = directions[d];
                const nx = current.x + dx;
                const ny = current.y + dy;

                if (!this.inBounds(nx, ny)) continue;
                if (!isTileWalkable(nx, ny)) continue;

                const nIdx = this._index(nx, ny);
                if (closedSet.has(nIdx)) continue;

                // Elevation rule: traversal between adjacent cells blocked if difference exceeds maxClimbHeight
                const elevDiff = Math.abs(this._elevation[nIdx] - this._elevation[current.index]);
                if (elevDiff > maxClimb) continue;

                // Diagonal movement: strict corner-cutting prevention past solid walls
                const isDiagonal = (dx !== 0 && dy !== 0);
                if (isDiagonal && preventCornerCutting) {
                    const ortho1 = isTileWalkable(current.x + dx, current.y);
                    const ortho2 = isTileWalkable(current.x, current.y + dy);
                    if (!ortho1 || !ortho2) {
                        continue;
                    }
                }

                // Movement cost affects path weighting
                const distance = isDiagonal ? diagMultiplier : 1.0;
                const cellCost = this._cost[nIdx];
                const stepCost = distance * cellCost;

                const tentG = current.g + stepCost;
                if (tentG > maxCost) continue;

                if (tentG < (gScores.get(nIdx) ?? Infinity)) {
                    gScores.set(nIdx, tentG);
                    cameFrom.set(nIdx, {
                        fromIdx: current.index,
                        toX: nx,
                        toY: ny,
                        stepCost,
                        isChunkLink: false
                    });
                    const h = heuristic(nx, ny);
                    queue.push({
                        index: nIdx,
                        x: nx,
                        y: ny,
                        g: tentG,
                        h,
                        f: tentG + h,
                        order: insertionOrder++
                    });
                }
            }
        }

        // Unreachable goal returns unreachable status
        return new NavigationPath({
            status: "unreachable",
            success: false,
            path: [],
            cost: Infinity,
            visitedNodes: visitedNodesCount
        });
    }

    /**
     * Create a clone of this NavigationGrid.
     * @returns {NavigationGrid}
     */
    clone() {
        const copy = new NavigationGrid(this.width, this.height, {
            defaultCost: this.defaultCost,
            defaultWalkable: this.defaultWalkable,
            defaultElevation: this.defaultElevation,
            maxClimbHeight: this.maxClimbHeight,
            allowDiagonal: this.allowDiagonal,
            diagonalCostMultiplier: this.diagonalCostMultiplier
        });
        copy._walkable.set(this._walkable);
        copy._cost.set(this._cost);
        copy._elevation.set(this._elevation);

        for (const [id, obs] of this._obstacles) {
            copy.addObstacle({ ...obs });
        }
        for (const [id, link] of this._chunkLinksById) {
            copy.addChunkLink({ ...link });
        }
        return copy;
    }

    /**
     * Construct a NavigationGrid from a Thalassa Tilemap.
     * @param {Object} tilemap - Tilemap instance
     * @param {Object} [options={}] - Grid options
     * @returns {NavigationGrid}
     */
    static fromTilemap(tilemap, options = {}) {
        if (!tilemap || typeof tilemap.width !== "number" || typeof tilemap.height !== "number") {
            throw new TypeError("fromTilemap requires a Tilemap instance with width and height");
        }
        const grid = new NavigationGrid(tilemap.width, tilemap.height, options);
        for (let y = 0; y < tilemap.height; y++) {
            for (let x = 0; x < tilemap.width; x++) {
                const meta = typeof tilemap.getResolvedMetadata === "function"
                    ? tilemap.getResolvedMetadata(x, y)
                    : null;
                if (meta) {
                    if (meta.walkable !== undefined) {
                        grid.setWalkable(x, y, meta.walkable);
                    }
                    if (Number.isFinite(meta.movementCost) && meta.movementCost >= 1) {
                        grid.setCost(x, y, meta.movementCost);
                    }
                    if (Number.isFinite(meta.elevation)) {
                        grid.setElevation(x, y, meta.elevation);
                    }
                }
            }
        }
        return grid;
    }

    /**
     * Construct a NavigationGrid from an ASCII layout.
     * Legend maps characters to properties like { walkable, cost, elevation }.
     * @param {string} ascii - Multiline text representation of the grid
     * @param {Object} [legend={}] - Mapping from character to cell properties
     * @param {Object} [options={}] - Grid options
     * @returns {NavigationGrid}
     */
    static fromAscii(ascii, legend = {}, options = {}) {
        if (typeof ascii !== "string") {
            throw new TypeError("fromAscii expects an ASCII string");
        }
        const rawLines = ascii
            .split("\n")
            .filter((line) => line.trim().length > 0);

        if (rawLines.length === 0) {
            throw new Error("fromAscii received empty grid string");
        }

        let minIndent = Infinity;
        for (let i = 0; i < rawLines.length; i++) {
            const match = rawLines[i].match(/^(\s*)/);
            if (match) {
                minIndent = Math.min(minIndent, match[1].length);
            }
        }
        if (!Number.isFinite(minIndent)) minIndent = 0;

        const lines = rawLines.map((line) => line.slice(minIndent).trimEnd());
        const height = lines.length;
        const width = Math.max(...lines.map((l) => l.length));

        const grid = new NavigationGrid(width, height, options);
        for (let y = 0; y < height; y++) {
            const line = lines[y];
            for (let x = 0; x < width; x++) {
                const ch = line[x] || " ";
                const def = legend[ch];
                if (def) {
                    if (def.walkable !== undefined) grid.setWalkable(x, y, def.walkable);
                    if (def.cost !== undefined) grid.setCost(x, y, def.cost);
                    if (def.elevation !== undefined) grid.setElevation(x, y, def.elevation);
                } else if (ch === "#") {
                    grid.setWalkable(x, y, false);
                }
            }
        }
        return grid;
    }
}
