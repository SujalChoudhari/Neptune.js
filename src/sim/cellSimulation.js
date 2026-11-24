/**
 * Neptune Environmental Simulation - Cell Grid Simulation System
 * SIM-02 implementation.
 */

import {
    MaterialRegistry,
    MaterialInteraction,
    MaterialState,
    InteractionType,
} from "./materialRegistry.js";

/**
 * Normalizes cell coordinates and data.
 * @param {string|object} data - Material ID or partial cell data.
 * @param {object} defaults - Default configuration values.
 * @returns {object} Normalized cell state object.
 */
function normalizeCellData(data, defaults) {
    if (typeof data === "string") {
        const materialId = data;
        const isWater = materialId === "water";
        return {
            materialId,
            state: isWater ? MaterialState.WET : MaterialState.DRY,
            moisture: isWater ? 1.0 : 0.0,
            burnTicks: 0,
            temperature: defaults.ambientTemperature,
            isSource: isWater,
            flowDistance: 0,
            originalMaterialId: null,
        };
    }

    const obj = (data && typeof data === "object") ? data : {};
    const materialId = typeof obj.materialId === "string" ? obj.materialId : defaults.defaultMaterial;
    const isWater = materialId === "water";

    let state = obj.state;
    if (!state) {
        state = isWater ? MaterialState.WET : MaterialState.DRY;
    }

    const moisture = Number.isFinite(obj.moisture)
        ? Number(obj.moisture)
        : (isWater || state === MaterialState.WET ? 1.0 : 0.0);

    const burnTicks = Number.isFinite(obj.burnTicks) ? Math.max(0, Number(obj.burnTicks)) : 0;

    let temperature = defaults.ambientTemperature;
    if (Number.isFinite(obj.temperature)) {
        temperature = Number(obj.temperature);
    } else if (state === MaterialState.BURNING) {
        temperature = defaults.burningTemperature;
    }

    const isSource = obj.isSource !== undefined ? Boolean(obj.isSource) : isWater;
    const flowDistance = Number.isFinite(obj.flowDistance) ? Math.max(0, Number(obj.flowDistance)) : 0;
    const originalMaterialId = obj.originalMaterialId ?? null;

    return {
        materialId,
        state,
        moisture,
        burnTicks,
        temperature,
        isSource,
        flowDistance,
        originalMaterialId,
    };
}

/**
 * 2D Grid Cellular Simulation for environmental interactions, fire spread,
 * heat conduction, extinguishing, and update-budgeted stepping.
 */
export class CellGridSimulation {
    /**
     * Creates a new CellGridSimulation instance.
     * @param {number|object} [widthOrOptions=16] - Grid width or options object.
     * @param {number} [height=16] - Grid height if first argument was width.
     * @param {object} [options={}] - Configuration options.
     */
    constructor(widthOrOptions = 16, height = 16, options = {}) {
        let opts = {};
        let w = 16;
        let h = 16;

        if (typeof widthOrOptions === "object" && widthOrOptions !== null) {
            opts = widthOrOptions;
            w = Number(opts.width) || 16;
            h = Number(opts.height) || 16;
        } else {
            w = Number(widthOrOptions) || 16;
            h = Number(height) || 16;
            opts = options || {};
        }

        this.width = Math.max(1, Math.floor(w));
        this.height = Math.max(1, Math.floor(h));

        this.registry = opts.registry || MaterialRegistry.getDefault();
        this.eventBus = opts.eventBus || null;

        this.maxCellUpdatesPerTick = Number.isFinite(opts.maxCellUpdatesPerTick)
            ? Math.max(1, Number(opts.maxCellUpdatesPerTick))
            : 10000;

        this.ambientTemperature = Number.isFinite(opts.ambientTemperature)
            ? Number(opts.ambientTemperature)
            : 20;

        this.burningTemperature = Number.isFinite(opts.burningTemperature)
            ? Number(opts.burningTemperature)
            : 100;

        this.heatTransferRate = Number.isFinite(opts.heatTransferRate)
            ? Number(opts.heatTransferRate)
            : 25;

        this.coolingRate = Number.isFinite(opts.coolingRate)
            ? Number(opts.coolingRate)
            : 5;

        this.dryingRate = Number.isFinite(opts.dryingRate)
            ? Number(opts.dryingRate)
            : 0.2;

        this.defaultMaterial = typeof opts.defaultMaterial === "string"
            ? opts.defaultMaterial
            : "dirt";

        this.waterFlow = opts.waterFlow !== undefined ? Boolean(opts.waterFlow) : true;
        this.maxWaterFlowDistance = Number.isFinite(opts.maxWaterFlowDistance)
            ? Math.max(0, Number(opts.maxWaterFlowDistance))
            : 3;

        this._updateCursor = 0;
        this._cells = new Array(this.width * this.height);

        this._initCells();
    }

    /**
     * Initializes all grid cells to default state.
     * @private
     */
    _initCells() {
        const defaults = {
            ambientTemperature: this.ambientTemperature,
            burningTemperature: this.burningTemperature,
            defaultMaterial: this.defaultMaterial,
        };

        for (let i = 0; i < this._cells.length; i++) {
            this._cells[i] = normalizeCellData(this.defaultMaterial, defaults);
        }
    }

    /**
     * Checks if coordinates are within the grid bounds.
     * Coordinates outside the grid boundary are safely identified.
     * @param {number} x - Column index.
     * @param {number} y - Row index.
     * @returns {boolean}
     */
    isInBounds(x, y) {
        return (
            typeof x === "number" &&
            typeof y === "number" &&
            Number.isInteger(x) &&
            Number.isInteger(y) &&
            x >= 0 &&
            x < this.width &&
            y >= 0 &&
            y < this.height
        );
    }

    /**
     * Gets 1D flat array index for (x, y) coordinates.
     * @param {number} x
     * @param {number} y
     * @returns {number} Index, or -1 if out of bounds.
     */
    getIndex(x, y) {
        if (!this.isInBounds(x, y)) return -1;
        return y * this.width + x;
    }

    /**
     * Converts a 1D flat array index to { x, y } coordinates.
     * @param {number} index
     * @returns {object} { x, y } coordinates.
     */
    getCoordinates(index) {
        return {
            x: index % this.width,
            y: Math.floor(index / this.width),
        };
    }

    /**
     * Queries a cell safely. Returns null if coordinates are out of bounds.
     * @param {number} x - Column index.
     * @param {number} y - Row index.
     * @returns {object|null} The cell object, or null if out of bounds.
     */
    getCell(x, y) {
        const idx = this.getIndex(x, y);
        if (idx === -1) return null;
        return this._cells[idx];
    }

    /**
     * Sets or updates cell data safely. Safely ignores out-of-bounds coordinates.
     * @param {number} x - Column index.
     * @param {number} y - Row index.
     * @param {string|object} data - Material ID or partial cell properties.
     * @returns {object|null} The updated cell object or null if out of bounds.
     */
    setCell(x, y, data) {
        const idx = this.getIndex(x, y);
        if (idx === -1) return null;

        const defaults = {
            ambientTemperature: this.ambientTemperature,
            burningTemperature: this.burningTemperature,
            defaultMaterial: this.defaultMaterial,
        };

        const existing = this._cells[idx];
        if (typeof data === "string") {
            this._cells[idx] = normalizeCellData(data, defaults);
        } else if (data && typeof data === "object") {
            const materialChanged = data.materialId !== undefined && data.materialId !== existing.materialId;
            const merged = { ...existing, ...data };
            if (materialChanged && data.moisture === undefined) {
                merged.moisture = data.materialId === "water" ? 1.0 : (data.state === MaterialState.WET ? 1.0 : 0.0);
            }
            if (materialChanged && data.isSource === undefined) {
                merged.isSource = data.materialId === "water";
            }
            if (data.state === MaterialState.DRY && data.moisture === undefined) {
                merged.moisture = 0.0;
            }
            this._cells[idx] = normalizeCellData(merged, defaults);
        }

        return this._cells[idx];
    }

    /**
     * Convenience helper to set material ID and optional state on a cell.
     * @param {number} x - Column index.
     * @param {number} y - Row index.
     * @param {string} materialId - Material ID.
     * @param {string} [state] - Material interaction state.
     * @returns {object|null}
     */
    setMaterial(x, y, materialId, state) {
        return this.setCell(x, y, { materialId, state });
    }

    /**
     * Queries the 4-cardinal in-bounds neighbors of a cell.
     * Out-of-bounds coordinates are filtered out safely.
     * @param {number} x
     * @param {number} y
     * @returns {Array<object>} Array of { x, y, index, cell }.
     */
    getNeighbors(x, y) {
        const cardinalOffsets = [
            { x: 0, y: -1 }, // North
            { x: 1, y: 0 },  // East
            { x: 0, y: 1 },  // South
            { x: -1, y: 0 }, // West
        ];

        const neighbors = [];
        for (let i = 0; i < cardinalOffsets.length; i++) {
            const nx = x + cardinalOffsets[i].x;
            const ny = y + cardinalOffsets[i].y;
            if (this.isInBounds(nx, ny)) {
                const idx = this.getIndex(nx, ny);
                neighbors.push({
                    x: nx,
                    y: ny,
                    index: idx,
                    cell: this._cells[idx],
                });
            }
        }
        return neighbors;
    }

    /**
     * Computes the effective ignition threshold temperature for a material.
     * Non-flammable materials (flammability === 0) return Infinity.
     * @param {string} materialId
     * @returns {number} Threshold temperature.
     */
    getIgnitionThreshold(materialId) {
        const mat = this.registry.get(materialId, { suppressWarning: true });
        if (!mat || mat.flammability <= 0) {
            return Infinity;
        }
        if (typeof mat.ignitionThreshold === "number") {
            return mat.ignitionThreshold;
        }
        // Base formula: higher flammability = lower threshold above ambient
        return this.ambientTemperature + (1.0 - mat.flammability) * 50;
    }

    /**
     * Manually ignites a cell at (x, y) if the material is flammable and not charred.
     * @param {number} x
     * @param {number} y
     * @returns {boolean} True if cell successfully ignited.
     */
    ignite(x, y) {
        const cell = this.getCell(x, y);
        if (!cell) return false;

        const mat = this.registry.get(cell.materialId);
        if (mat.flammability <= 0 || cell.state === MaterialState.CHARRED) {
            return false;
        }

        const prev = cell.state;
        cell.state = MaterialState.BURNING;
        cell.burnTicks = 0;
        cell.temperature = Math.max(cell.temperature, this.burningTemperature);
        cell.moisture = 0;

        this._emitEvent("sim:ignited", {
            x,
            y,
            materialId: cell.materialId,
            state: MaterialState.BURNING,
            previousState: prev,
            cell,
        });

        return true;
    }

    /**
     * Manually extinguishes a cell at (x, y).
     * @param {number} x
     * @param {number} y
     * @returns {boolean} True if cell was extinguished.
     */
    extinguish(x, y) {
        const cell = this.getCell(x, y);
        if (!cell) return false;

        const prev = cell.state;
        cell.state = MaterialState.EXTINGUISHED;
        cell.temperature = this.ambientTemperature;
        cell.moisture = Math.max(cell.moisture, 1.0);
        cell.burnTicks = 0;

        this._emitEvent("sim:extinguished", {
            x,
            y,
            materialId: cell.materialId,
            state: MaterialState.EXTINGUISHED,
            previousState: prev,
            cell,
        });

        return true;
    }

    /**
     * Emits a typed event to the TypedEventBus if one is attached.
     * Also emits an alias under `material:` namespace for compatibility.
     * @private
     * @param {string} eventName
     * @param {object} data
     */
    _emitEvent(eventName, data) {
        if (!this.eventBus || typeof this.eventBus.emit !== "function") return;

        this.eventBus.emit(eventName, data);

        if (eventName.startsWith("sim:")) {
            const alias = "material:" + eventName.slice(4);
            this.eventBus.emit(alias, data);
        }
    }

    /**
     * Advances the simulation by one step (dt).
     * Handles:
     * - Local fire spread & heat transfer to 4-cardinal neighbors.
     * - Burning progression and burnout transition to charred.
     * - Water flow & extinguishing (extinguishing takes precedence).
     * - Out-of-bounds boundary safety.
     * - Update budget capping via maxCellUpdatesPerTick.
     * - Typed event dispatching.
     *
     * @param {number} [dt=1] - Time step delta.
     * @param {object} [options={}] - Override step options.
     * @returns {object} Step summary statistics.
     */
    step(dt = 1, options = {}) {
        const totalCells = this._cells.length;
        const maxUpdates = options.maxCellUpdatesPerTick !== undefined
            ? Math.max(0, Number(options.maxCellUpdatesPerTick))
            : this.maxCellUpdatesPerTick;

        const limit = Math.min(maxUpdates, totalCells);
        if (limit === 0) {
            return {
                updatesProcessed: 0,
                ignitedCount: 0,
                extinguishedCount: 0,
                charredCount: 0,
                activeFires: 0,
            };
        }

        const heatTransferRate = Number.isFinite(options.heatTransferRate)
            ? Number(options.heatTransferRate)
            : this.heatTransferRate;

        const coolingRate = Number.isFinite(options.coolingRate)
            ? Number(options.coolingRate)
            : this.coolingRate;

        const dryingRate = Number.isFinite(options.dryingRate)
            ? Number(options.dryingRate)
            : this.dryingRate;

        // Snapshot prior cell states for read-isolation (prevents iteration order bias)
        const prevCells = new Array(totalCells);
        for (let i = 0; i < totalCells; i++) {
            const c = this._cells[i];
            prevCells[i] = {
                materialId: c.materialId,
                state: c.state,
                moisture: c.moisture,
                burnTicks: c.burnTicks,
                temperature: c.temperature,
                isSource: c.isSource,
                flowDistance: c.flowDistance,
                originalMaterialId: c.originalMaterialId,
            };
        }

        let ignitedCount = 0;
        let extinguishedCount = 0;
        let charredCount = 0;
        let updatesProcessed = 0;

        // Process up to `limit` cells starting from `_updateCursor` for bounded computation
        for (let stepCount = 0; stepCount < limit; stepCount++) {
            const idx = (this._updateCursor + stepCount) % totalCells;
            updatesProcessed++;

            const { x, y } = this.getCoordinates(idx);
            const prev = prevCells[idx];
            const curr = this._cells[idx];
            const mat = this.registry.get(prev.materialId, { suppressWarning: true });

            // Inspect 4-cardinal neighbors from prevCells
            const neighbors = this.getNeighbors(x, y);
            const burningNeighbors = [];
            const waterNeighbors = [];

            for (let n = 0; n < neighbors.length; n++) {
                const nIdx = neighbors[n].index;
                const nPrev = prevCells[nIdx];
                const nMat = this.registry.get(nPrev.materialId, { suppressWarning: true });

                if (nPrev.state === MaterialState.BURNING) {
                    burningNeighbors.push(nPrev);
                }

                // A cell acts as water if it is water material
                if (nMat.id === "water" || nPrev.materialId === "water") {
                    waterNeighbors.push(nPrev);
                }
            }

            const hasWaterNeighbor = waterNeighbors.length > 0;
            const hasBurningNeighbor = burningNeighbors.length > 0;

            // =================================================================
            // 1. BURNING CELL PROCESSING
            // =================================================================
            if (prev.state === MaterialState.BURNING) {
                // Extinguishing takes precedence over burning
                if (hasWaterNeighbor) {
                    curr.state = MaterialState.EXTINGUISHED;
                    curr.temperature = this.ambientTemperature;
                    curr.moisture = 1.0;
                    curr.burnTicks = 0;
                    extinguishedCount++;

                    this._emitEvent("sim:extinguished", {
                        x,
                        y,
                        materialId: curr.materialId,
                        state: MaterialState.EXTINGUISHED,
                        previousState: MaterialState.BURNING,
                        cell: curr,
                    });
                } else {
                    // Cell continues burning for burnDuration ticks then chars
                    const newBurnTicks = prev.burnTicks + 1;
                    curr.burnTicks = newBurnTicks;
                    curr.temperature = Math.max(prev.temperature, this.burningTemperature);

                    if (newBurnTicks >= (mat.burnDuration || 0)) {
                        curr.state = MaterialState.CHARRED;
                        curr.temperature = Math.max(this.ambientTemperature, prev.temperature - coolingRate);
                        charredCount++;

                        this._emitEvent("sim:charred", {
                            x,
                            y,
                            materialId: curr.materialId,
                            state: MaterialState.CHARRED,
                            previousState: MaterialState.BURNING,
                            cell: curr,
                        });
                    }
                }
                continue;
            }

            // =================================================================
            // 2. CHARRED CELL PROCESSING (Cannot re-ignite)
            // =================================================================
            if (prev.state === MaterialState.CHARRED) {
                if (hasWaterNeighbor) {
                    curr.moisture = 1.0;
                    curr.temperature = this.ambientTemperature;
                } else if (curr.temperature > this.ambientTemperature) {
                    curr.temperature = Math.max(this.ambientTemperature, curr.temperature - coolingRate);
                }
                continue;
            }

            // =================================================================
            // 3. WATER MATERIAL PROCESSING
            // =================================================================
            if (prev.materialId === "water") {
                curr.state = MaterialState.WET;
                curr.moisture = 1.0;
                curr.temperature = this.ambientTemperature;
                curr.burnTicks = 0;

                // Handle removed source: non-source flowing water dissipates if no upstream source
                if (!prev.isSource) {
                    const hasUpstream = waterNeighbors.some(
                        (wn) => wn.materialId === "water" && wn.flowDistance < prev.flowDistance
                    );
                    if (!hasUpstream) {
                        curr.materialId = prev.originalMaterialId || this.defaultMaterial;
                        curr.state = MaterialState.WET;
                        curr.flowDistance = 0;
                    }
                }
                continue;
            }

            // =================================================================
            // 4. CONFLICTING INTERACTIONS (Extinguishing takes precedence)
            // =================================================================
            if (hasBurningNeighbor && hasWaterNeighbor) {
                // Extinguishing suppresses ignition completely
                curr.state = MaterialState.WET;
                curr.moisture = 1.0;
                curr.temperature = this.ambientTemperature;
                curr.burnTicks = 0;
                continue;
            }

            // =================================================================
            // 5. WATER FLOW & EXTINQUISHING (Adjacent water cell)
            // =================================================================
            if (hasWaterNeighbor) {
                // If cell was wet or dry, moisture is refreshed and fire cannot ignite
                if (curr.state === MaterialState.DRY) {
                    curr.state = MaterialState.WET;
                }
                curr.moisture = 1.0;
                curr.temperature = this.ambientTemperature;
                continue;
            }

            // =================================================================
            // 6. LOCAL FIRE SPREAD & HEAT CONDUCTION (Adjacent burning cells)
            // =================================================================
            if (hasBurningNeighbor) {
                const heatReceived = burningNeighbors.length * heatTransferRate;
                const newTemp = prev.temperature + heatReceived;
                curr.temperature = newTemp;

                const threshold = this.getIgnitionThreshold(curr.materialId);

                // Flammable cell ignites when threshold is met
                if (mat.flammability > 0 && newTemp >= threshold) {
                    const interactionIntensity = (newTemp - this.ambientTemperature) / 25;
                    const result = MaterialInteraction.applyInteraction({
                        state: prev.state,
                        interaction: InteractionType.IGNITE,
                        materialId: curr.materialId,
                        intensity: interactionIntensity,
                        moistureThreshold: prev.moisture || 1.0,
                        registry: this.registry,
                    });

                    if (result.state === MaterialState.BURNING) {
                        curr.state = MaterialState.BURNING;
                        curr.temperature = Math.max(newTemp, this.burningTemperature);
                        curr.burnTicks = 0;
                        curr.moisture = 0;
                        ignitedCount++;

                        this._emitEvent("sim:ignited", {
                            x,
                            y,
                            materialId: curr.materialId,
                            state: MaterialState.BURNING,
                            previousState: prev.state,
                            cell: curr,
                        });
                    }
                }
                continue;
            }

            // =================================================================
            // 7. AMBIENT COOLING & DRYING (No fire or water neighbors)
            // =================================================================
            if (curr.temperature > this.ambientTemperature) {
                curr.temperature = Math.max(this.ambientTemperature, curr.temperature - coolingRate);
            }

            // Wet or extinguished ground gradually dries if water source is absent
            if (curr.state === MaterialState.WET || curr.state === MaterialState.EXTINGUISHED) {
                const newMoisture = Math.max(0, prev.moisture - dryingRate);
                curr.moisture = newMoisture;
                if (newMoisture <= 0) {
                    curr.state = MaterialState.DRY;
                }
            }
        }

        // Advance update cursor for bounded round-robin execution
        this._updateCursor = (this._updateCursor + limit) % totalCells;

        let activeFires = 0;
        for (let i = 0; i < totalCells; i++) {
            if (this._cells[i].state === MaterialState.BURNING) {
                activeFires++;
            }
        }

        return {
            updatesProcessed,
            ignitedCount,
            extinguishedCount,
            charredCount,
            activeFires,
        };
    }

    /**
     * Resets all cells to default material and temperature.
     */
    clear() {
        this._updateCursor = 0;
        this._initCells();
    }

    /**
     * Serializes the cell grid state for save games.
     * @returns {object} Serializable snapshot object.
     */
    snapshot() {
        const cells = new Array(this._cells.length);
        for (let i = 0; i < this._cells.length; i++) {
            const c = this._cells[i];
            cells[i] = {
                materialId: c.materialId,
                state: c.state,
                moisture: c.moisture,
                burnTicks: c.burnTicks,
                temperature: c.temperature,
                isSource: c.isSource,
                flowDistance: c.flowDistance,
                originalMaterialId: c.originalMaterialId,
            };
        }

        return {
            version: 1,
            timestamp: Date.now(),
            width: this.width,
            height: this.height,
            updateCursor: this._updateCursor,
            ambientTemperature: this.ambientTemperature,
            burningTemperature: this.burningTemperature,
            defaultMaterial: this.defaultMaterial,
            cells,
        };
    }

    /**
     * Restores cell grid state from a snapshot.
     * @param {object} snapshot - Saved snapshot object.
     * @returns {CellGridSimulation} this instance.
     */
    restore(snapshot) {
        if (!snapshot || typeof snapshot !== "object") {
            throw new TypeError("Snapshot must be an object");
        }

        if (Number.isFinite(snapshot.width) && Number.isFinite(snapshot.height)) {
            this.width = Math.max(1, Math.floor(snapshot.width));
            this.height = Math.max(1, Math.floor(snapshot.height));
        }

        if (!Array.isArray(snapshot.cells)) {
            throw new TypeError("Snapshot must contain a cells array");
        }

        if (Number.isFinite(snapshot.updateCursor)) {
            this._updateCursor = snapshot.updateCursor % (this.width * this.height);
        } else {
            this._updateCursor = 0;
        }

        if (Number.isFinite(snapshot.ambientTemperature)) {
            this.ambientTemperature = snapshot.ambientTemperature;
        }
        if (Number.isFinite(snapshot.burningTemperature)) {
            this.burningTemperature = snapshot.burningTemperature;
        }
        if (typeof snapshot.defaultMaterial === "string") {
            this.defaultMaterial = snapshot.defaultMaterial;
        }

        const defaults = {
            ambientTemperature: this.ambientTemperature,
            burningTemperature: this.burningTemperature,
            defaultMaterial: this.defaultMaterial,
        };

        const total = this.width * this.height;
        this._cells = new Array(total);

        for (let i = 0; i < total; i++) {
            const raw = snapshot.cells[i] || {};
            this._cells[i] = normalizeCellData(raw, defaults);
        }

        return this;
    }

    /**
     * Counts the number of cells matching a predicate function.
     * @param {Function} predicate - (cell, x, y) => boolean.
     * @returns {number}
     */
    countCells(predicate) {
        if (typeof predicate !== "function") return 0;
        let count = 0;
        for (let i = 0; i < this._cells.length; i++) {
            const { x, y } = this.getCoordinates(i);
            if (predicate(this._cells[i], x, y)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Finds coordinates of all cells matching a predicate function.
     * @param {Function} predicate - (cell, x, y) => boolean.
     * @returns {Array<object>} Array of { x, y, cell }.
     */
    findCells(predicate) {
        if (typeof predicate !== "function") return [];
        const matches = [];
        for (let i = 0; i < this._cells.length; i++) {
            const { x, y } = this.getCoordinates(i);
            if (predicate(this._cells[i], x, y)) {
                matches.push({ x, y, cell: this._cells[i] });
            }
        }
        return matches;
    }

    /**
     * Advances simulation for distant chunks at a reduced fidelity and with a catch-up budget ceiling.
     * Prevents long absences from triggering unbounded iteration freezes while advancing persistent state.
     * @param {number} ticks - Requested elapsed simulation ticks
     * @param {object} [options]
     * @param {number} [options.catchUpBudget=50] - Maximum ticks allowed in catch-up step
     * @param {number} [options.updateStride=2] - Stride multiplier for coarse updates
     * @returns {number} Ticks actually executed
     */
    stepDistant(ticks, { catchUpBudget = 50, updateStride = 2 } = {}) {
        if (!Number.isFinite(ticks) || ticks <= 0) return 0;
        const boundedTicks = Math.min(Math.floor(ticks), catchUpBudget);
        let executed = 0;
        for (let i = 0; i < boundedTicks; i += updateStride) {
            this.step();
            executed++;
        }
        return executed;
    }

    /** Serialization alias for save games */
    serialize() {
        return this.snapshot();
    }

    /** Deserialization alias for save games */
    deserialize(data) {
        return this.restore(data);
    }
}

export default CellGridSimulation;
