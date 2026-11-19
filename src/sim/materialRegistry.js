/**
 * Neptune Environmental Simulation - Material Registry & Interaction System
 * SIM-01 implementation.
 */

/**
 * Standard material interaction states.
 */
export const MaterialState = Object.freeze({
    DRY: "dry",
    WET: "wet",
    BURNING: "burning",
    CHARRED: "charred",
    EXTINGUISHED: "extinguished",
});

/**
 * Interaction types applicable to materials.
 */
export const InteractionType = Object.freeze({
    IGNITE: "IGNITE",
    DOUSE: "DOUSE",
    COOL: "COOL",
    DRY: "DRY",
    BURN: "BURN",
    BURNOUT: "BURNOUT",
    CHAR: "CHAR",
});

/**
 * Standard built-in material definitions.
 */
export const BUILTIN_MATERIALS = Object.freeze({
    wood: Object.freeze({
        id: "wood",
        flammability: 0.6,
        conductivity: 0.1,
        viscosity: 0.0,
        traversalCost: 1.0,
        isSolid: true,
        burnDuration: 10,
    }),
    stone: Object.freeze({
        id: "stone",
        flammability: 0.0,
        conductivity: 0.1,
        viscosity: 0.0,
        traversalCost: 1.0,
        isSolid: true,
        burnDuration: 0,
    }),
    water: Object.freeze({
        id: "water",
        flammability: 0.0,
        conductivity: 0.8,
        viscosity: 1.0,
        traversalCost: 2.0,
        isSolid: false,
        burnDuration: 0,
    }),
    grass: Object.freeze({
        id: "grass",
        flammability: 0.8,
        conductivity: 0.1,
        viscosity: 0.0,
        traversalCost: 1.0,
        isSolid: false,
        burnDuration: 4,
    }),
    iron: Object.freeze({
        id: "iron",
        flammability: 0.0,
        conductivity: 1.0,
        viscosity: 0.0,
        traversalCost: 1.0,
        isSolid: true,
        burnDuration: 0,
    }),
    cloth: Object.freeze({
        id: "cloth",
        flammability: 0.9,
        conductivity: 0.05,
        viscosity: 0.0,
        traversalCost: 1.0,
        isSolid: false,
        burnDuration: 5,
    }),
    dirt: Object.freeze({
        id: "dirt",
        flammability: 0.0,
        conductivity: 0.1,
        viscosity: 0.0,
        traversalCost: 1.0,
        isSolid: false,
        burnDuration: 0,
    }),
});

/**
 * Fallback material used when an unknown material is queried.
 */
export const FALLBACK_MATERIAL = Object.freeze({
    id: "dirt",
    flammability: 0.0,
    conductivity: 0.1,
    viscosity: 0.0,
    traversalCost: 1.0,
    isSolid: false,
    burnDuration: 0,
    isFallback: true,
});

/**
 * Validates a material definition object.
 * @param {string} id - The material ID.
 * @param {object} def - The material definition.
 * @returns {object} Normalized and frozen material definition.
 */
function validateMaterialDefinition(id, def) {
    if (typeof id !== "string" || !id.trim()) {
        throw new TypeError("Material ID must be a non-empty string");
    }
    if (!def || typeof def !== "object") {
        throw new TypeError(`Material definition for "${id}" must be an object`);
    }

    const flammability = Number(def.flammability ?? 0);
    if (!Number.isFinite(flammability) || flammability < 0 || flammability > 1) {
        throw new RangeError(`Material "${id}" flammability must be a number between 0 and 1, got ${def.flammability}`);
    }

    const conductivity = Number(def.conductivity ?? 0);
    if (!Number.isFinite(conductivity) || conductivity < 0 || conductivity > 1) {
        throw new RangeError(`Material "${id}" conductivity must be a number between 0 and 1, got ${def.conductivity}`);
    }

    const viscosity = Number(def.viscosity ?? 0);
    if (!Number.isFinite(viscosity) || viscosity < 0) {
        throw new RangeError(`Material "${id}" viscosity must be a non-negative number, got ${def.viscosity}`);
    }

    const traversalCost = Number(def.traversalCost ?? 1.0);
    if (!Number.isFinite(traversalCost) || traversalCost < 1) {
        throw new RangeError(`Material "${id}" traversalCost must be a number >= 1, got ${def.traversalCost}`);
    }

    const isSolid = Boolean(def.isSolid);

    const burnDuration = Number(def.burnDuration ?? 0);
    if (!Number.isFinite(burnDuration) || burnDuration < 0) {
        throw new RangeError(`Material "${id}" burnDuration must be a non-negative number, got ${def.burnDuration}`);
    }

    return Object.freeze({
        id,
        flammability,
        conductivity,
        viscosity,
        traversalCost,
        isSolid,
        burnDuration,
        ...(def.tags ? { tags: Object.freeze([...def.tags]) } : {}),
        ...(def.description ? { description: String(def.description) } : {}),
    });
}

/**
 * Registry storing material definitions and providing fallback handling.
 */
export class MaterialRegistry {
    static _defaultInstance = null;

    /**
     * Get the default singleton instance of MaterialRegistry.
     * @returns {MaterialRegistry}
     */
    static getDefault() {
        if (!MaterialRegistry._defaultInstance) {
            MaterialRegistry._defaultInstance = new MaterialRegistry();
        }
        return MaterialRegistry._defaultInstance;
    }

    /**
     * Static helper to register a material definition on the default registry.
     */
    static register(id, def) {
        return MaterialRegistry.getDefault().register(id, def);
    }

    /**
     * Static helper to get a material definition from the default registry.
     */
    static get(id, options) {
        return MaterialRegistry.getDefault().get(id, options);
    }

    /**
     * Static helper to check if a material definition exists in the default registry.
     */
    static has(id) {
        return MaterialRegistry.getDefault().has(id);
    }

    /**
     * Static helper to reset the default registry to built-ins.
     */
    static reset() {
        return MaterialRegistry.getDefault().reset();
    }

    /**
     * Static access to the default registry's diagnostic log.
     */
    static get diagnostics() {
        return MaterialRegistry.getDefault().diagnostics;
    }

    constructor() {
        /** @type {Map<string, object>} */
        this._materials = new Map();
        /** @type {Array<object>} */
        this.diagnostics = [];
        /** @type {string} */
        this._fallbackId = "dirt";
        /** @type {object|null} */
        this._customFallback = null;
        /** @type {Function|null} */
        this.onDiagnostic = null;

        this._registerBuiltins();
    }

    _registerBuiltins() {
        for (const [id, def] of Object.entries(BUILTIN_MATERIALS)) {
            this._materials.set(id, def);
        }
    }

    /**
     * Register or update a material definition.
     * @param {string} id - Unique material identifier.
     * @param {object} def - Material properties.
     * @returns {object} The registered material definition.
     */
    register(id, def) {
        const validated = validateMaterialDefinition(id, def);
        this._materials.set(id, validated);
        return validated;
    }

    /**
     * Check if a material is registered.
     * @param {string} id - Material identifier.
     * @returns {boolean}
     */
    has(id) {
        if (typeof id !== "string") return false;
        return this._materials.has(id);
    }

    /**
     * Query a material definition by ID with fallback handling and diagnostic warning.
     * @param {string} id - Material identifier.
     * @param {object} [options]
     * @param {boolean} [options.suppressWarning=false] - Whether to suppress console warning.
     * @returns {object} The material definition or fallback.
     */
    get(id, { suppressWarning = false } = {}) {
        if (typeof id === "string" && this._materials.has(id)) {
            return this._materials.get(id);
        }

        // Handle missing material: log diagnostic warning and return fallback
        const fallbackDef = this._getFallbackDefinition();
        const message = `[MaterialRegistry] Material "${id}" not found. Falling back to default material "${fallbackDef.id}".`;

        const diagnosticEntry = {
            type: "MISSING_MATERIAL",
            materialId: id,
            fallbackId: fallbackDef.id,
            message,
            timestamp: Date.now(),
        };
        this.diagnostics.push(diagnosticEntry);

        if (typeof this.onDiagnostic === "function") {
            try {
                this.onDiagnostic(diagnosticEntry);
            } catch (err) {
                console.error("[MaterialRegistry] Error in diagnostic listener:", err);
            }
        }

        if (!suppressWarning) {
            console.warn(message);
        }

        return fallbackDef;
    }

    /**
     * Get fallback definition.
     * @private
     */
    _getFallbackDefinition() {
        if (this._customFallback) return this._customFallback;
        if (this._materials.has(this._fallbackId)) {
            return this._materials.get(this._fallbackId);
        }
        return FALLBACK_MATERIAL;
    }

    /**
     * Configure the fallback material.
     * @param {string|object} fallback - Material ID or definition.
     */
    setFallback(fallback) {
        if (typeof fallback === "string") {
            this._fallbackId = fallback;
            this._customFallback = null;
        } else if (fallback && typeof fallback === "object") {
            this._customFallback = validateMaterialDefinition(fallback.id || "custom_fallback", fallback);
        }
    }

    /**
     * Unregister a material definition.
     * @param {string} id
     * @returns {boolean}
     */
    unregister(id) {
        return this._materials.delete(id);
    }

    /**
     * Reset registry to default built-in materials and clear diagnostics.
     */
    reset() {
        this._materials.clear();
        this.diagnostics.length = 0;
        this._fallbackId = "dirt";
        this._customFallback = null;
        this._registerBuiltins();
    }

    /**
     * Get all registered material definitions as an array.
     * @returns {Array<object>}
     */
    getAll() {
        return Array.from(this._materials.values());
    }

    /**
     * Get all registered material IDs.
     * @returns {Array<string>}
     */
    getIds() {
        return Array.from(this._materials.keys());
    }
}

/**
 * Result object returned by MaterialInteraction.applyInteraction.
 */
export class InteractionResult {
    constructor({ state, previousState, materialId, material, intensity, interactions, applied }) {
        this.state = state;
        this.previousState = previousState;
        this.materialId = materialId;
        this.material = material;
        this.intensity = intensity;
        this.interactions = Object.freeze([...interactions]);
        this.applied = applied;

        const traversal = MaterialInteraction.getEffectiveTraversalCost({ materialId, state, material });
        this.traversalCost = traversal;

        const hazard = MaterialInteraction.getHazardStatus({ materialId, state, material });
        this.hazard = hazard;
        this.isHazard = hazard.isHazard;
    }

    toString() {
        return this.state;
    }

    valueOf() {
        return this.state;
    }

    [Symbol.toPrimitive](hint) {
        if (hint === "number") return NaN;
        return this.state;
    }
}

/**
 * Material interaction and state transition engine.
 */
export class MaterialInteraction {
    /**
     * Query effective traversal cost based on material attributes and current state.
     * Supports both getEffectiveTraversalCost(materialId, state) and getEffectiveTraversalCost({ materialId, state }).
     *
     * @param {string|object} arg1 - materialId or options object.
     * @param {string} [arg2] - state if arg1 is materialId.
     * @returns {number} Effective traversal cost (>= 1.0).
     */
    static getEffectiveTraversalCost(arg1, arg2) {
        let materialId;
        let state;
        let material = null;
        let registry = MaterialRegistry.getDefault();

        if (typeof arg1 === "object" && arg1 !== null) {
            materialId = arg1.materialId;
            state = arg1.state;
            material = arg1.material ?? null;
            if (arg1.registry) registry = arg1.registry;
        } else {
            materialId = arg1;
            state = arg2;
        }

        const normalizedState = (state || MaterialState.DRY).toLowerCase();
        const mat = material || (typeof materialId === "object" && materialId !== null ? materialId : registry.get(materialId));
        const baseCost = mat.traversalCost ?? 1.0;

        switch (normalizedState) {
            case MaterialState.BURNING:
                // Burning terrain is hazardous and heavily impedes traversal
                return Math.max(1.0, baseCost + 2.0);

            case MaterialState.WET:
                // Water has inherent traversal cost; wet ground becomes muddy / slippery
                if (mat.id === "water") {
                    return Math.max(1.0, baseCost);
                }
                return Math.max(1.0, baseCost * 1.5);

            case MaterialState.CHARRED:
                // Ash/charred rubble slightly increases traversal effort
                return Math.max(1.0, baseCost * 1.2);

            case MaterialState.EXTINGUISHED:
                // Soggy extinguished remains
                return Math.max(1.0, baseCost * 1.3);

            case MaterialState.DRY:
            default:
                return Math.max(1.0, baseCost);
        }
    }

    /**
     * Query hazard status based on material attributes and current state.
     * Supports both getHazardStatus(materialId, state) and getHazardStatus({ materialId, state }).
     *
     * @param {string|object} arg1 - materialId or options object.
     * @param {string} [arg2] - state if arg1 is materialId.
     * @returns {{ isHazard: boolean, type: string|null, severity: number, description: string }}
     */
    static getHazardStatus(arg1, arg2) {
        let materialId;
        let state;
        let material = null;
        let registry = MaterialRegistry.getDefault();

        if (typeof arg1 === "object" && arg1 !== null) {
            materialId = arg1.materialId;
            state = arg1.state;
            material = arg1.material ?? null;
            if (arg1.registry) registry = arg1.registry;
        } else {
            materialId = arg1;
            state = arg2;
        }

        const normalizedState = (state || MaterialState.DRY).toLowerCase();
        const mat = material || (typeof materialId === "object" && materialId !== null ? materialId : registry.get(materialId));

        if (normalizedState === MaterialState.BURNING) {
            return Object.freeze({
                isHazard: true,
                type: "fire",
                severity: 2,
                description: `Burning ${mat.id || "material"} deals fire damage to occupants`,
            });
        }

        return Object.freeze({
            isHazard: false,
            type: null,
            severity: 0,
            description: "Safe",
        });
    }

    /**
     * Check if the material and state combination constitutes a hazard.
     * @param {string|object} arg1 - materialId or options object.
     * @param {string} [arg2] - state.
     * @returns {boolean}
     */
    static isHazard(arg1, arg2) {
        return MaterialInteraction.getHazardStatus(arg1, arg2).isHazard;
    }

    /**
     * Query traversal cost and hazard status together.
     * @param {object} query - Query parameters { materialId, state }.
     * @returns {object}
     */
    static query({ materialId, state, registry = MaterialRegistry.getDefault() }) {
        const mat = registry.get(materialId);
        return {
            materialId: mat.id,
            state: (state || MaterialState.DRY).toLowerCase(),
            traversalCost: MaterialInteraction.getEffectiveTraversalCost({ materialId: mat.id, state, material: mat, registry }),
            hazard: MaterialInteraction.getHazardStatus({ materialId: mat.id, state, material: mat, registry }),
            isHazard: MaterialInteraction.isHazard({ materialId: mat.id, state, material: mat, registry }),
        };
    }

    /**
     * Compute next state and apply interaction rules.
     *
     * @param {object} params
     * @param {string} params.state - Current state: 'dry', 'wet', 'burning', 'charred', 'extinguished'.
     * @param {string|Array<string>} [params.interaction] - Single interaction or list of interactions.
     * @param {Array<string>} [params.interactions] - Alternative array of interactions.
     * @param {string|object} params.materialId - Material identifier or definition object.
     * @param {number} [params.intensity=1] - Intensity of interaction (>= 0).
     * @param {number} [params.moistureThreshold=1.0] - Threshold that intensity must exceed to ignite wet material.
     * @param {MaterialRegistry} [params.registry] - Optional custom MaterialRegistry.
     * @param {number} [params.elapsedTicks] - Optional elapsed burn duration ticks.
     * @param {boolean} [params.returnStateOnly=false] - If true, returns only the state string.
     * @returns {InteractionResult|string}
     */
    static applyInteraction({
        state = MaterialState.DRY,
        interaction,
        interactions,
        materialId,
        intensity = 1,
        moistureThreshold = 1.0,
        registry = MaterialRegistry.getDefault(),
        elapsedTicks,
        returnStateOnly = false,
    } = {}) {
        const normalizedCurrentState = (state || MaterialState.DRY).toLowerCase();
        const mat = typeof materialId === "object" && materialId !== null
            ? materialId
            : registry.get(materialId);

        // Normalize requested interactions into an array of uppercase strings
        const requestedList = [];
        if (Array.isArray(interaction)) {
            requestedList.push(...interaction);
        } else if (typeof interaction === "string") {
            // Support combined strings like "IGNITE_AND_DOUSE" or "IGNITE, DOUSE"
            const tokens = interaction.split(/[,_+&|\s]+/).map(t => t.trim().toUpperCase()).filter(Boolean);
            requestedList.push(...tokens);
        }
        if (Array.isArray(interactions)) {
            requestedList.push(...interactions);
        }

        const normalizedInteractions = requestedList.map(i => String(i).toUpperCase());

        const hasIgnite = normalizedInteractions.includes(InteractionType.IGNITE);
        const hasDouse = normalizedInteractions.includes(InteractionType.DOUSE) || normalizedInteractions.includes("EXTINGUISH");
        const hasCool = normalizedInteractions.includes(InteractionType.COOL);
        const hasDry = normalizedInteractions.includes(InteractionType.DRY);
        const hasBurnOut = normalizedInteractions.includes(InteractionType.BURN) ||
            normalizedInteractions.includes(InteractionType.BURNOUT) ||
            normalizedInteractions.includes(InteractionType.CHAR);

        let nextState = normalizedCurrentState;
        const effectiveInteractions = [...normalizedInteractions];

        // RULE: Conflicting simultaneous ignite & douse: extinguishing takes precedence.
        if (hasIgnite && (hasDouse || hasCool)) {
            // Extinguishing suppresses ignition
            const igniteIndex = effectiveInteractions.indexOf(InteractionType.IGNITE);
            if (igniteIndex !== -1) {
                effectiveInteractions.splice(igniteIndex, 1);
            }
        }

        // Apply extinguishing / dousing (precedence over ignition)
        if (hasDouse) {
            if (normalizedCurrentState === MaterialState.BURNING) {
                // RULE: Dousing burning material transitions to extinguished (or wet), quenching fire.
                nextState = MaterialState.EXTINGUISHED;
            } else if (normalizedCurrentState === MaterialState.DRY) {
                nextState = MaterialState.WET;
            } else if (normalizedCurrentState === MaterialState.WET) {
                nextState = MaterialState.WET;
            } else if (normalizedCurrentState === MaterialState.EXTINGUISHED) {
                nextState = MaterialState.EXTINGUISHED;
            } else if (normalizedCurrentState === MaterialState.CHARRED) {
                nextState = MaterialState.CHARRED;
            }
        } else if (hasCool) {
            if (normalizedCurrentState === MaterialState.BURNING) {
                nextState = MaterialState.EXTINGUISHED;
            }
        } else if (hasIgnite) {
            // RULE: Non-flammable materials (flammability === 0) cannot ignite.
            if ((mat.flammability ?? 0) === 0) {
                nextState = normalizedCurrentState;
            }
            // RULE: Charred materials cannot re-ignite.
            else if (normalizedCurrentState === MaterialState.CHARRED) {
                nextState = MaterialState.CHARRED;
            }
            // RULE: Wet materials resist ignition unless intensity exceeds moisture threshold.
            else if (normalizedCurrentState === MaterialState.WET) {
                if (intensity > moistureThreshold) {
                    nextState = MaterialState.BURNING;
                } else {
                    // Resists ignition
                    nextState = MaterialState.WET;
                }
            }
            // Extinguished materials are also damp from dousing
            else if (normalizedCurrentState === MaterialState.EXTINGUISHED) {
                if (intensity > moistureThreshold) {
                    nextState = MaterialState.BURNING;
                } else {
                    nextState = MaterialState.EXTINGUISHED;
                }
            }
            else if (normalizedCurrentState === MaterialState.DRY) {
                nextState = MaterialState.BURNING;
            }
            else if (normalizedCurrentState === MaterialState.BURNING) {
                nextState = MaterialState.BURNING;
            }
        } else if (hasDry) {
            if (normalizedCurrentState === MaterialState.WET || normalizedCurrentState === MaterialState.EXTINGUISHED) {
                nextState = MaterialState.DRY;
            }
        } else if (hasBurnOut) {
            if (normalizedCurrentState === MaterialState.BURNING) {
                nextState = MaterialState.CHARRED;
            }
        }

        // Check burn duration elapsed ticks
        if (nextState === MaterialState.BURNING && Number.isFinite(elapsedTicks)) {
            if (elapsedTicks >= (mat.burnDuration ?? 0)) {
                nextState = MaterialState.CHARRED;
            }
        }

        if (returnStateOnly) {
            return nextState;
        }

        return new InteractionResult({
            state: nextState,
            previousState: normalizedCurrentState,
            materialId: mat.id,
            material: mat,
            intensity,
            interactions: effectiveInteractions,
            applied: nextState !== normalizedCurrentState,
        });
    }

    /**
     * Helper to compute only the next state string.
     * @param {object} params - Same parameters as applyInteraction.
     * @returns {string} The next state string.
     */
    static transition(params) {
        return MaterialInteraction.applyInteraction({ ...params, returnStateOnly: true });
    }

    /**
     * Advance burning progression. Transitions to CHARRED when duration met.
     * @param {object} params
     * @param {string} params.state - Current state.
     * @param {string|object} params.materialId - Material identifier or definition.
     * @param {number} [params.elapsedTicks=1] - Ticks to advance or total elapsed ticks.
     * @param {number} [params.currentBurnTicks=0] - Ticks already burned.
     * @param {MaterialRegistry} [params.registry]
     * @returns {InteractionResult}
     */
    static advanceBurn({
        state = MaterialState.BURNING,
        materialId,
        elapsedTicks = 1,
        currentBurnTicks = 0,
        registry = MaterialRegistry.getDefault(),
    } = {}) {
        const mat = typeof materialId === "object" && materialId !== null
            ? materialId
            : registry.get(materialId);

        const totalTicks = currentBurnTicks + elapsedTicks;
        const shouldChar = state === MaterialState.BURNING && totalTicks >= (mat.burnDuration ?? 0);

        return MaterialInteraction.applyInteraction({
            state,
            interaction: shouldChar ? InteractionType.BURNOUT : undefined,
            materialId: mat.id,
            elapsedTicks: totalTicks,
            registry,
        });
    }
}

/**
 * Default export providing the complete Sim Material API.
 */
export default {
    MaterialRegistry,
    MaterialInteraction,
    MaterialState,
    InteractionType,
    BUILTIN_MATERIALS,
    FALLBACK_MATERIAL,
};
