/**
 * Budgeted asynchronous pathfinding scheduler for NavigationGrid.
 * Enforces per-frame request budgets, priority dispatch, and cancellation of stale requests.
 */
export class PathfindingScheduler {
    #queue = [];
    #nextId = 1;
    #maxRequestsPerTick;
    #maxDurationMs;
    #totalProcessed = 0;
    #totalDropped = 0;

    /**
     * @param {Object} [options]
     * @param {number} [options.maxRequestsPerTick=5] - Maximum path requests to process per frame
     * @param {number} [options.maxDurationMs=5] - Execution time ceiling per frame in milliseconds
     */
    constructor({ maxRequestsPerTick = 5, maxDurationMs = 5 } = {}) {
        this.#maxRequestsPerTick = maxRequestsPerTick;
        this.#maxDurationMs = maxDurationMs;
    }

    get pendingCount() {
        return this.#queue.length;
    }

    get totalProcessed() {
        return this.#totalProcessed;
    }

    get totalDropped() {
        return this.#totalDropped;
    }

    /**
     * Submit an asynchronous pathfinding request.
     * @param {object} grid - NavigationGrid instance
     * @param {object} start - { x, y }
     * @param {object} goal - { x, y }
     * @param {object} [options]
     * @param {number} [options.priority=0] - Higher priority requests run first
     * @param {object} [options.requester=null] - Owning Entity/Actor (cancelled if destroyed)
     * @param {object} [options.pathOptions={}] - Options passed to grid.findPath()
     * @returns {Promise<NavigationPath>}
     */
    requestPath(grid, start, goal, { priority = 0, requester = null, pathOptions = {} } = {}) {
        if (!grid || typeof grid.findPath !== "function") {
            return Promise.reject(new TypeError("Valid NavigationGrid is required"));
        }

        const id = this.#nextId++;
        return new Promise((resolve, reject) => {
            const item = {
                id,
                grid,
                start,
                goal,
                priority,
                requester,
                pathOptions,
                resolve,
                reject,
                canceled: false
            };
            this.#queue.push(item);
        });
    }

    /**
     * Cancel a request by ID.
     * @param {number} id
     * @returns {boolean}
     */
    cancel(id) {
        const item = this.#queue.find(req => req.id === id);
        if (item) {
            item.canceled = true;
            this.#totalDropped++;
            item.reject(new Error(`PATH_REQUEST_CANCELED: Request ${id} was explicitly canceled`));
            return true;
        }
        return false;
    }

    /**
     * Cancel all requests from a specific requester (e.g. destroyed NPC).
     * @param {object} requester
     * @returns {number} Count of canceled requests
     */
    cancelRequester(requester) {
        if (!requester) return 0;
        let count = 0;
        for (const item of this.#queue) {
            if (item.requester === requester && !item.canceled) {
                item.canceled = true;
                count++;
                this.#totalDropped++;
                item.reject(new Error(`PATH_REQUEST_CANCELED: Requester destroyed or reset`));
            }
        }
        return count;
    }

    /**
     * Process pending requests within the configured frame budget.
     * @param {number} [budgetMs] - Optional override of time budget
     * @param {number} [maxRequests] - Optional override of request count budget
     * @returns {number} Number of requests processed in this tick
     */
    update(budgetMs = this.#maxDurationMs, maxRequests = this.#maxRequestsPerTick) {
        if (this.#queue.length === 0) return 0;

        // Sort descending by priority
        this.#queue.sort((a, b) => b.priority - a.priority);

        const startTime = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
        let processed = 0;

        while (this.#queue.length > 0 && processed < maxRequests) {
            const elapsed = ((typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now()) - startTime;
            if (elapsed >= budgetMs && processed > 0) {
                break; // Frame time budget exceeded, defer remaining requests to next tick
            }

            const req = this.#queue.shift();
            if (req.canceled) continue;

            // Discard if requester was destroyed
            if (req.requester?._destroyed) {
                this.#totalDropped++;
                req.reject(new Error("PATH_REQUEST_CANCELED: Requester was destroyed"));
                continue;
            }

            try {
                const path = req.grid.findPath(req.start, req.goal, req.pathOptions);
                req.resolve(path);
                this.#totalProcessed++;
                processed++;
            } catch (err) {
                req.reject(err);
                processed++;
            }
        }

        return processed;
    }

    clear() {
        for (const item of this.#queue) {
            item.reject(new Error("PATH_REQUEST_CANCELED: Scheduler cleared"));
        }
        this.#queue = [];
    }
}
