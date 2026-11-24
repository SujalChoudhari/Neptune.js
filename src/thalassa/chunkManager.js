import { Entity } from "../core/entity.js";

/**
 * Manages streaming 2D tile/entity chunks.
 * Handles radius-based loading, prefetching, unloading, async cancellation,
 * and chunk state mutation persistence across unloads.
 */
export class ChunkManager {
    #chunkSize;
    #loadRadius;
    #prefetchRadius;
    #unloadRadius;
    #loader = null;
    #loadedChunks = new Map();     // key -> { cx, cy, entities: Entity[], data: any }
    #pendingLoads = new Map();     // key -> { abortController, promise }
    #prefetchedChunks = new Map(); // key -> Promise<any>
    #chunkChanges = new Map();     // key -> Map<changeId, changeData>
    #activeCenter = { cx: 0, cy: 0 };

    /**
     * @param {Object} [options]
     * @param {number} [options.chunkSize=16] - Size of a chunk in world units/tiles
     * @param {number} [options.loadRadius=1] - Radius of chunks to keep loaded and active
     * @param {number} [options.prefetchRadius=2] - Radius of chunks to fetch in advance
     * @param {number} [options.unloadRadius=3] - Radius beyond which chunks are unloaded
     */
    constructor({ chunkSize = 16, loadRadius = 1, prefetchRadius = 2, unloadRadius = 3 } = {}) {
        if (!Number.isInteger(chunkSize) || chunkSize <= 0) throw new TypeError("chunkSize must be a positive integer");
        this.#chunkSize = chunkSize;
        this.#loadRadius = loadRadius;
        this.#prefetchRadius = Math.max(loadRadius, prefetchRadius);
        this.#unloadRadius = Math.max(this.#prefetchRadius, unloadRadius);
    }

    get chunkSize() { return this.#chunkSize; }
    get loadRadius() { return this.#loadRadius; }
    get prefetchRadius() { return this.#prefetchRadius; }
    get unloadRadius() { return this.#unloadRadius; }
    get loadedChunkCount() { return this.#loadedChunks.size; }

    static getChunkKey(cx, cy) {
        return `${cx},${cy}`;
    }

    worldToChunkCoords(worldX, worldY) {
        return {
            cx: Math.floor(worldX / this.#chunkSize),
            cy: Math.floor(worldY / this.#chunkSize)
        };
    }

    setLoader(loaderFn) {
        if (typeof loaderFn !== "function") throw new TypeError("Chunk loader must be a function");
        this.#loader = loaderFn;
    }

    isChunkLoaded(cx, cy) {
        return this.#loadedChunks.has(ChunkManager.getChunkKey(cx, cy));
    }

    getLoadedChunk(cx, cy) {
        return this.#loadedChunks.get(ChunkManager.getChunkKey(cx, cy));
    }

    /**
     * Record a persistent change to a chunk (e.g. chest opened, wall destroyed).
     * Changes survive chunk unload and reload.
     */
    recordChange(cx, cy, changeId, changeData) {
        const key = ChunkManager.getChunkKey(cx, cy);
        if (!this.#chunkChanges.has(key)) {
            this.#chunkChanges.set(key, new Map());
        }
        this.#chunkChanges.get(key).set(changeId, changeData);
    }

    getChanges(cx, cy) {
        const key = ChunkManager.getChunkKey(cx, cy);
        const map = this.#chunkChanges.get(key);
        return map ? Object.fromEntries(map.entries()) : {};
    }

    /**
     * Update center position (e.g. player location) and stream chunks.
     * @param {number} worldX
     * @param {number} worldY
     * @param {object} [scene] - Parent scene to attach loaded chunk entities
     * @returns {Promise<{ loaded: string[], unloaded: string[] }>}
     */
    async updatePosition(worldX, worldY, scene = null) {
        const { cx, cy } = this.worldToChunkCoords(worldX, worldY);
        this.#activeCenter = { cx, cy };

        const requiredKeys = new Set();
        const prefetchKeys = new Set();

        for (let dx = -this.#unloadRadius; dx <= this.#unloadRadius; dx++) {
            for (let dy = -this.#unloadRadius; dy <= this.#unloadRadius; dy++) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy)); // Chebyshev distance
                const chunkX = cx + dx;
                const chunkY = cy + dy;
                const key = ChunkManager.getChunkKey(chunkX, chunkY);

                if (dist <= this.#loadRadius) {
                    requiredKeys.add(key);
                } else if (dist <= this.#prefetchRadius) {
                    prefetchKeys.add(key);
                }
            }
        }

        const unloaded = [];
        // Unload chunks outside unload radius
        for (const [key, chunk] of this.#loadedChunks.entries()) {
            const dist = Math.max(Math.abs(chunk.cx - cx), Math.abs(chunk.cy - cy));
            if (dist > this.#unloadRadius) {
                this.unloadChunk(chunk.cx, chunk.cy);
                unloaded.push(key);
            }
        }

        // Cancel pending loads that are now outside prefetch radius
        for (const [key, pending] of this.#pendingLoads.entries()) {
            const [pcx, pcy] = key.split(",").map(Number);
            const dist = Math.max(Math.abs(pcx - cx), Math.abs(pcy - cy));
            if (dist > this.#prefetchRadius) {
                pending.abortController.abort();
                this.#pendingLoads.delete(key);
            }
        }

        // Trigger loads for required chunks
        const loaded = [];
        const loadPromises = [];
        for (const key of requiredKeys) {
            if (!this.#loadedChunks.has(key)) {
                const [targetCx, targetCy] = key.split(",").map(Number);
                loadPromises.push(
                    this.loadChunk(targetCx, targetCy, scene).then(res => {
                        if (res) loaded.push(key);
                    })
                );
            }
        }

        await Promise.all(loadPromises);
        return { loaded, unloaded };
    }

    async loadChunk(cx, cy, scene = null) {
        const key = ChunkManager.getChunkKey(cx, cy);
        if (this.#loadedChunks.has(key)) return this.#loadedChunks.get(key);
        if (!this.#loader) return null;

        const abortController = new AbortController();
        const loadPromise = this.#loader(cx, cy, { signal: abortController.signal, changes: this.getChanges(cx, cy) });
        this.#pendingLoads.set(key, { abortController, promise: loadPromise });

        try {
            const chunkData = await loadPromise;
            if (abortController.signal.aborted) return null;

            const entities = Array.isArray(chunkData?.entities) ? chunkData.entities : [];
            if (scene) {
                for (const ent of entities) {
                    if (ent instanceof Entity && !ent.parent) {
                        scene.AddChild(ent);
                    }
                }
            }

            const record = { cx, cy, entities, data: chunkData };
            this.#loadedChunks.set(key, record);
            return record;
        } catch (err) {
            if (abortController.signal.aborted) return null;
            console.error(`Failed to load chunk ${key}:`, err);
            return null;
        } finally {
            this.#pendingLoads.delete(key);
        }
    }

    unloadChunk(cx, cy) {
        const key = ChunkManager.getChunkKey(cx, cy);
        const chunk = this.#loadedChunks.get(key);
        if (!chunk) return false;

        for (const entity of chunk.entities) {
            if (entity && typeof entity.destroy === "function" && !entity._destroyed) {
                entity.destroy();
            }
        }

        this.#loadedChunks.delete(key);
        return true;
    }

    serialize() {
        const changesObj = {};
        for (const [key, map] of this.#chunkChanges.entries()) {
            changesObj[key] = Object.fromEntries(map.entries());
        }
        return {
            version: 1,
            chunkSize: this.#chunkSize,
            changes: changesObj
        };
    }

    deserialize(data) {
        if (!data || typeof data !== "object" || data.version !== 1) {
            throw new TypeError("Invalid ChunkManager persistence payload");
        }
        this.#chunkChanges.clear();
        if (data.changes) {
            for (const [key, changes] of Object.entries(data.changes)) {
                this.#chunkChanges.set(key, new Map(Object.entries(changes)));
            }
        }
    }

    dispose() {
        for (const pending of this.#pendingLoads.values()) {
            pending.abortController.abort();
        }
        this.#pendingLoads.clear();

        for (const chunk of this.#loadedChunks.values()) {
            for (const ent of chunk.entities) {
                if (ent && typeof ent.destroy === "function" && !ent._destroyed) {
                    ent.destroy();
                }
            }
        }
        this.#loadedChunks.clear();
        this.#chunkChanges.clear();
    }
}
