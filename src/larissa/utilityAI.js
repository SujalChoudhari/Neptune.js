/**
 * Larissa RPG System - Utility AI Engine
 * AI-02: Utility scoring engine evaluating candidate actions (attack, flee, heal, patrol, rest)
 * using composite consideration curves (normalized 0..1), deterministic tie-breaking,
 * fallback / no-action handling, decision trace logging, and interrupted action cleanup.
 */

import { Component } from "../components/component.js";

/**
 * Clamps a number to the [0, 1] range.
 * @param {number} value - Numeric value to clamp.
 * @returns {number} Clamped value between 0 and 1.
 */
export function clamp01(value) {
    if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return 0;
    if (value >= 1) return 1;
    return value;
}

/**
 * Common normalized consideration curve functions mapping [0, 1] input to [0, 1] output.
 */
export const UtilityCurves = Object.freeze({
    /**
     * Linear identity response: f(x) = x.
     * @param {number} x - Normalized input.
     * @returns {number}
     */
    linear(x) {
        return clamp01(x);
    },

    /**
     * Inverse linear response: f(x) = 1 - x.
     * @param {number} x - Normalized input.
     * @returns {number}
     */
    inverseLinear(x) {
        return clamp01(1 - clamp01(x));
    },

    /**
     * Quadratic response (accelerating / ease-in): f(x) = x^2.
     * @param {number} x - Normalized input.
     * @returns {number}
     */
    quadratic(x) {
        const c = clamp01(x);
        return c * c;
    },

    /**
     * Inverse quadratic response: f(x) = (1 - x)^2.
     * @param {number} x - Normalized input.
     * @returns {number}
     */
    inverseQuadratic(x) {
        const c = clamp01(1 - clamp01(x));
        return c * c;
    },

    /**
     * Exponential response: f(x) = x^exponent.
     * @param {number} x - Normalized input.
     * @param {number} [exponent=2] - Power exponent.
     * @returns {number}
     */
    exponential(x, exponent = 2) {
        const exp = Number.isFinite(exponent) ? exponent : 2;
        return clamp01(Math.pow(clamp01(x), exp));
    },

    /**
     * Logistic (sigmoidal) S-curve response.
     * @param {number} x - Normalized input.
     * @param {number} [steepness=10] - Curve steepness factor.
     * @param {number} [midpoint=0.5] - Inflection midpoint.
     * @returns {number}
     */
    logistic(x, steepness = 10, midpoint = 0.5) {
        const c = clamp01(x);
        const k = Number.isFinite(steepness) ? steepness : 10;
        const m = Number.isFinite(midpoint) ? midpoint : 0.5;
        const raw = 1 / (1 + Math.exp(-k * (c - m)));
        const low = 1 / (1 + Math.exp(k * m));
        const high = 1 / (1 + Math.exp(-k * (1 - m)));
        const range = high - low;
        if (range <= 0) return c;
        const normalized = (raw - low) / range;
        return clamp01(normalized);
    },

    /**
     * Smoothstep curve (Hermite interpolation): f(x) = 3x^2 - 2x^3.
     * @param {number} x - Normalized input.
     * @returns {number}
     */
    smoothstep(x) {
        const c = clamp01(x);
        return c * c * (3 - 2 * c);
    },

    /**
     * Binary step threshold response: 1 if x >= threshold, else 0.
     * @param {number} x - Normalized input.
     * @param {number} [threshold=0.5] - Activation threshold.
     * @returns {number}
     */
    step(x, threshold = 0.5) {
        return clamp01(x) >= threshold ? 1 : 0;
    },

    /**
     * Inverse binary step threshold response: 1 if x < threshold, else 0.
     * @param {number} x - Normalized input.
     * @param {number} [threshold=0.5] - Cutoff threshold.
     * @returns {number}
     */
    inverseStep(x, threshold = 0.5) {
        return clamp01(x) < threshold ? 1 : 0;
    }
});

/**
 * Consideration evaluating a single dimension of context for an action.
 */
export class UtilityConsideration {
    /**
     * @param {Object} [config] - Consideration configuration.
     * @param {string} [config.id] - Consideration identifier.
     * @param {string} [config.name] - Alias for identifier.
     * @param {Function} [config.input] - Function extracting raw or normalized input from context.
     * @param {Function|string} [config.curve] - Curve function or curve name from UtilityCurves.
     * @param {Function} [config.evaluate] - Direct evaluation function returning a utility score (0..1).
     * @param {number} [config.weight=1.0] - Consideration weight multiplier.
     */
    constructor(config = {}) {
        this.id = config.id || config.name || "consideration";
        this.name = this.id;
        this.weight = Number.isFinite(config.weight) ? config.weight : 1.0;
        this.input = typeof config.input === "function" ? config.input : null;
        this.directEvaluate = typeof config.evaluate === "function" ? config.evaluate : null;

        if (typeof config.curve === "function") {
            this.curve = config.curve;
        } else if (typeof config.curve === "string" && UtilityCurves[config.curve]) {
            this.curve = UtilityCurves[config.curve];
        } else {
            this.curve = UtilityCurves.linear;
        }
    }

    /**
     * Evaluates this consideration against the given context.
     * @param {Object} context - Game context data.
     * @returns {Object} Result object containing id, rawInput, normalizedInput, and score.
     */
    evaluate(context) {
        if (this.directEvaluate) {
            const raw = this.directEvaluate(context);
            const num = Number.isFinite(raw) ? raw : 0;
            const score = clamp01(num * this.weight);
            return {
                id: this.id,
                rawInput: num,
                normalizedInput: clamp01(num),
                score
            };
        }

        const raw = this.input ? this.input(context) : 0;
        const normalizedInput = clamp01(Number.isFinite(raw) ? raw : 0);
        const curved = this.curve(normalizedInput);
        const weighted = clamp01(curved * this.weight);

        return {
            id: this.id,
            rawInput: Number.isFinite(raw) ? raw : 0,
            normalizedInput,
            score: weighted
        };
    }
}

/**
 * Candidate action evaluated and executed by UtilityAI.
 */
export class UtilityAction {
    /**
     * @param {Object} config - Action configuration.
     * @param {string} config.id - Action identifier.
     * @param {number} [config.priority=0] - Deterministic tie-breaking and interruption priority.
     * @param {number} [config.weight=1.0] - Action utility weight multiplier.
     * @param {number} [config.threshold] - Action-specific minimum utility threshold.
     * @param {Array} [config.considerations=[]] - Considerations list.
     * @param {string} [config.compositeMode="multiplicative"] - "multiplicative" or "average".
     * @param {Function} [config.execute] - Execution function called when action is chosen.
     * @param {Function} [config.cleanup] - Cleanup function called when action ends or is interrupted.
     * @param {Function} [config.onInterrupt] - Callback called when action is interrupted.
     * @param {Function} [config.onExit] - Callback called on exit.
     * @param {Function} [config.update] - Per-tick update function while active.
     */
    constructor(config = {}) {
        if (!config || typeof config.id !== "string" || config.id.trim() === "") {
            throw new TypeError("UtilityAction requires a non-empty string id");
        }
        this.id = config.id.trim();
        this.priority = Number.isFinite(config.priority) ? config.priority : 0;
        this.weight = Number.isFinite(config.weight) ? config.weight : 1.0;
        this.threshold = Number.isFinite(config.threshold) ? config.threshold : null;
        this.compositeMode = config.compositeMode === "average" ? "average" : "multiplicative";
        this.execute = typeof config.execute === "function" ? config.execute : null;
        this.cleanup = typeof config.cleanup === "function" ? config.cleanup : null;
        this.onInterrupt = typeof config.onInterrupt === "function" ? config.onInterrupt : null;
        this.onExit = typeof config.onExit === "function" ? config.onExit : null;
        this.update = typeof config.update === "function" ? config.update : null;
        this.isActive = false;

        this.considerations = [];
        if (Array.isArray(config.considerations)) {
            for (const item of config.considerations) {
                this.addConsideration(item);
            }
        }
    }

    /**
     * Adds a consideration to this action.
     * @param {UtilityConsideration|Object|Function} consideration - Consideration instance or config.
     * @returns {UtilityAction} Self for chaining.
     */
    addConsideration(consideration) {
        if (!consideration) return this;
        if (consideration instanceof UtilityConsideration) {
            this.considerations.push(consideration);
        } else if (typeof consideration === "function") {
            this.considerations.push(new UtilityConsideration({
                id: `consideration_${this.considerations.length}`,
                evaluate: consideration
            }));
        } else if (typeof consideration === "object") {
            this.considerations.push(new UtilityConsideration(consideration));
        }
        return this;
    }

    /**
     * Evaluates all composite considerations for this action against context.
     * @param {Object} context - Game context data.
     * @returns {Object} Evaluation summary including composite utility score.
     */
    evaluate(context) {
        if (this.considerations.length === 0) {
            const rawScore = clamp01(this.weight);
            return {
                id: this.id,
                score: rawScore,
                priority: this.priority,
                threshold: this.threshold,
                considerations: []
            };
        }

        const evaluatedConsiderations = [];
        let composite = 1.0;
        let sum = 0;

        for (const consideration of this.considerations) {
            const result = consideration.evaluate(context);
            evaluatedConsiderations.push(result);
            composite *= result.score;
            sum += result.score;
        }

        let finalScore = 0;
        if (this.compositeMode === "average") {
            finalScore = clamp01((sum / this.considerations.length) * this.weight);
        } else {
            // Multiplicative composite curves (standard Dave Mark utility architecture)
            finalScore = clamp01(composite * this.weight);
        }

        return {
            id: this.id,
            score: finalScore,
            priority: this.priority,
            threshold: this.threshold,
            considerations: evaluatedConsiderations
        };
    }
}

/**
 * Safely extracts normalized health fraction (0..1) from context.
 * @param {Object} context - Game context.
 * @returns {number} Health fraction between 0 and 1.
 */
export function extractHealthFraction(context) {
    if (!context || typeof context !== "object") return 1.0;
    if (Number.isFinite(context.healthFraction)) return clamp01(context.healthFraction);
    if (Number.isFinite(context.healthPercent)) {
        return clamp01(context.healthPercent <= 1 ? context.healthPercent : context.healthPercent / 100);
    }
    if (Number.isFinite(context.health) && Number.isFinite(context.maxHealth) && context.maxHealth > 0) {
        return clamp01(context.health / context.maxHealth);
    }
    if (context.stats && Number.isFinite(context.stats.health) && Number.isFinite(context.stats.maxHealth) && context.stats.maxHealth > 0) {
        return clamp01(context.stats.health / context.stats.maxHealth);
    }
    if (context.combatant && Number.isFinite(context.combatant.health) && Number.isFinite(context.combatant.maxHealth) && context.combatant.maxHealth > 0) {
        return clamp01(context.combatant.health / context.combatant.maxHealth);
    }
    if (Number.isFinite(context.health)) {
        return context.health <= 1 ? clamp01(context.health) : clamp01(context.health / 100);
    }
    return 1.0;
}

/**
 * Safely extracts danger/threat level (0..1) from context.
 * @param {Object} context - Game context.
 * @returns {number} Danger level between 0 and 1.
 */
export function extractDangerLevel(context) {
    if (!context || typeof context !== "object") return 0.0;
    if (Number.isFinite(context.dangerLevel)) return clamp01(context.dangerLevel);
    if (Number.isFinite(context.danger)) return clamp01(context.danger);
    if (context.inDanger === true) return 1.0;
    if (context.inDanger === false) return 0.0;
    if (Array.isArray(context.threats)) return context.threats.length > 0 ? 1.0 : 0.0;
    if (context.target) return 0.8;
    return 0.0;
}

/**
 * Safely extracts stamina/energy fraction (0..1) from context.
 * @param {Object} context - Game context.
 * @returns {number} Stamina fraction between 0 and 1.
 */
export function extractStaminaFraction(context) {
    if (!context || typeof context !== "object") return 1.0;
    if (Number.isFinite(context.staminaFraction)) return clamp01(context.staminaFraction);
    if (Number.isFinite(context.stamina) && Number.isFinite(context.maxStamina) && context.maxStamina > 0) {
        return clamp01(context.stamina / context.maxStamina);
    }
    if (Number.isFinite(context.stamina)) {
        return context.stamina <= 1 ? clamp01(context.stamina) : clamp01(context.stamina / 100);
    }
    if (Number.isFinite(context.energy)) {
        return context.energy <= 1 ? clamp01(context.energy) : clamp01(context.energy / 100);
    }
    return 1.0;
}

/**
 * Safely extracts target range suitability score (0..1).
 * @param {Object} context - Game context.
 * @returns {number} Range score between 0 and 1.
 */
export function extractRangeScore(context) {
    if (!context || typeof context !== "object") return 0.0;
    if (context.inAttackRange !== undefined) return context.inAttackRange ? 1.0 : 0.0;
    if (context.inRange !== undefined) return context.inRange ? 1.0 : 0.0;
    if (!context.target) return 0.0;

    const range = Number.isFinite(context.attackRange) && context.attackRange > 0 ? context.attackRange : 50;

    if (Number.isFinite(context.targetDistance)) {
        if (context.targetDistance <= range) return 1.0;
        if (context.targetDistance >= range * 2) return 0.0;
        return clamp01(1 - (context.targetDistance - range) / range);
    }

    const selfPos = context.actor?.position ?? context.entity?.transform?.position ?? context.position;
    const targetPos = context.target?.position ?? context.target?.transform?.position ?? (Number.isFinite(context.target?.x) ? context.target : null);

    if (selfPos && targetPos && Number.isFinite(selfPos.x) && Number.isFinite(selfPos.y) && Number.isFinite(targetPos.x) && Number.isFinite(targetPos.y)) {
        const dx = targetPos.x - selfPos.x;
        const dy = targetPos.y - selfPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range) return 1.0;
        if (dist >= range * 2) return 0.0;
        return clamp01(1 - (dist - range) / range);
    }

    // Target exists without explicit distance: consider in range
    return 1.0;
}

/**
 * Checks whether healing resource is available.
 * @param {Object} context - Game context.
 * @returns {boolean} True if healing resource or ability is available.
 */
export function extractCanHeal(context) {
    if (!context || typeof context !== "object") return false;
    if (context.canHeal !== undefined) return Boolean(context.canHeal);
    if (Number.isFinite(context.potions)) return context.potions > 0;
    if (Number.isFinite(context.healCharges)) return context.healCharges > 0;
    if (Array.isArray(context.healingItems)) return context.healingItems.length > 0;
    return false;
}

/**
 * Creates built-in candidate action templates: attack, flee, heal, patrol, rest.
 * @param {Object} [options] - Optional overrides.
 * @returns {UtilityAction[]} Array of candidate actions.
 */
export function createDefaultActions(options = {}) {
    // 1. Flee: high utility when health is low and danger is present
    const flee = new UtilityAction({
        id: "flee",
        priority: 25,
        threshold: 0.15,
        execute: options.onFlee ?? ((ctx) => (typeof ctx.onFlee === "function" ? ctx.onFlee(ctx) : null)),
        cleanup: options.onFleeCleanup ?? ((ctx, detail) => (typeof ctx.onFleeCleanup === "function" ? ctx.onFleeCleanup(ctx, detail) : null)),
        considerations: [
            new UtilityConsideration({
                id: "low_health",
                input: (ctx) => extractHealthFraction(ctx),
                curve: UtilityCurves.inverseLinear
            }),
            new UtilityConsideration({
                id: "threat_presence",
                input: (ctx) => extractDangerLevel(ctx),
                curve: UtilityCurves.linear
            })
        ]
    });

    // 2. Heal: high utility when damaged and healing supplies exist
    const heal = new UtilityAction({
        id: "heal",
        priority: 20,
        threshold: 0.15,
        execute: options.onHeal ?? ((ctx) => (typeof ctx.onHeal === "function" ? ctx.onHeal(ctx) : null)),
        cleanup: options.onHealCleanup ?? ((ctx, detail) => (typeof ctx.onHealCleanup === "function" ? ctx.onHealCleanup(ctx, detail) : null)),
        considerations: [
            new UtilityConsideration({
                id: "missing_health",
                input: (ctx) => 1.0 - extractHealthFraction(ctx),
                curve: UtilityCurves.linear
            }),
            new UtilityConsideration({
                id: "can_heal",
                input: (ctx) => (extractCanHeal(ctx) ? 1.0 : 0.0),
                curve: UtilityCurves.linear
            })
        ]
    });

    // 3. Attack: high utility when healthy and hostile target is within range
    const attack = new UtilityAction({
        id: "attack",
        priority: 15,
        threshold: 0.1,
        execute: options.onAttack ?? ((ctx) => (typeof ctx.onAttack === "function" ? ctx.onAttack(ctx) : null)),
        cleanup: options.onAttackCleanup ?? ((ctx, detail) => (typeof ctx.onAttackCleanup === "function" ? ctx.onAttackCleanup(ctx, detail) : null)),
        considerations: [
            new UtilityConsideration({
                id: "has_target",
                input: (ctx) => (ctx.target ? 1.0 : 0.0),
                curve: UtilityCurves.linear
            }),
            new UtilityConsideration({
                id: "target_in_range",
                input: (ctx) => extractRangeScore(ctx),
                curve: UtilityCurves.linear
            }),
            new UtilityConsideration({
                id: "combat_readiness",
                input: (ctx) => extractHealthFraction(ctx),
                curve: UtilityCurves.linear
            })
        ]
    });

    // 4. Rest: high utility when stamina is low and environment is safe
    const rest = new UtilityAction({
        id: "rest",
        priority: 10,
        threshold: 0.15,
        execute: options.onRest ?? ((ctx) => (typeof ctx.onRest === "function" ? ctx.onRest(ctx) : null)),
        cleanup: options.onRestCleanup ?? ((ctx, detail) => (typeof ctx.onRestCleanup === "function" ? ctx.onRestCleanup(ctx, detail) : null)),
        considerations: [
            new UtilityConsideration({
                id: "fatigue",
                input: (ctx) => 1.0 - extractStaminaFraction(ctx),
                curve: UtilityCurves.linear
            }),
            new UtilityConsideration({
                id: "safety",
                input: (ctx) => 1.0 - extractDangerLevel(ctx),
                curve: UtilityCurves.linear
            })
        ]
    });

    // 5. Patrol: baseline behavior when calm and ready
    const patrol = new UtilityAction({
        id: "patrol",
        priority: 5,
        weight: 0.6,
        threshold: 0.1,
        execute: options.onPatrol ?? ((ctx) => (typeof ctx.onPatrol === "function" ? ctx.onPatrol(ctx) : null)),
        cleanup: options.onPatrolCleanup ?? ((ctx, detail) => (typeof ctx.onPatrolCleanup === "function" ? ctx.onPatrolCleanup(ctx, detail) : null)),
        considerations: [
            new UtilityConsideration({
                id: "calm_state",
                input: (ctx) => 1.0 - extractDangerLevel(ctx),
                curve: UtilityCurves.linear
            }),
            new UtilityConsideration({
                id: "stamina",
                input: (ctx) => extractStaminaFraction(ctx),
                curve: UtilityCurves.linear
            }),
            new UtilityConsideration({
                id: "health",
                input: (ctx) => extractHealthFraction(ctx),
                curve: UtilityCurves.linear
            })
        ]
    });

    return [flee, heal, attack, rest, patrol];
}

/**
 * UtilityAI component managing utility scoring, candidate action evaluation,
 * deterministic tie-breaking, decision tracing, and action lifecycle cleanup.
 * @class UtilityAI
 * @extends Component
 */
export class UtilityAI extends Component {
    /**
     * @param {Object} [config] - Configuration options.
     * @param {Entity} [config.entity] - Entity attachment.
     * @param {Array} [config.actions] - Array of candidate actions.
     * @param {number} [config.defaultThreshold=0.1] - Default minimum utility threshold to execute an action.
     * @param {number} [config.maxTraces=100] - Maximum decision traces retained.
     * @param {boolean} [config.useDefaultActions=true] - Populate default actions (attack, flee, heal, patrol, rest) if none provided.
     * @param {Object} [config.context] - Default context object.
     * @param {Function} [config.contextProvider] - Context provider function (ai) => context.
     * @param {Function} [config.onActionChange] - Callback when active action changes.
     * @param {Function} [config.onActionInterrupted] - Callback when active action is interrupted.
     */
    constructor(config = {}) {
        super(config.entity ?? null);

        this.defaultThreshold = Number.isFinite(config.defaultThreshold) ? config.defaultThreshold : 0.1;
        this.maxTraces = Number.isFinite(config.maxTraces) ? Math.max(1, config.maxTraces) : 100;

        /** @type {UtilityAction|null} */
        this.currentAction = null;
        /** @type {Object|null} */
        this.lastInterruptedAction = null;
        /** @type {Map<string, UtilityAction>} */
        this.actions = new Map();

        this._decisionTraces = [];
        this.context = config.context ?? null;
        this.contextProvider = typeof config.contextProvider === "function" ? config.contextProvider : null;
        this.onActionChange = typeof config.onActionChange === "function" ? config.onActionChange : null;
        this.onActionInterrupted = typeof config.onActionInterrupted === "function" ? config.onActionInterrupted : null;

        if (Array.isArray(config.actions)) {
            for (const act of config.actions) {
                this.registerAction(act);
            }
        } else if (config.useDefaultActions !== false) {
            const defaults = createDefaultActions();
            for (const act of defaults) {
                this.registerAction(act);
            }
        }
    }

    /**
     * Current minimum score threshold to trigger an action.
     * @returns {number}
     */
    get threshold() {
        return this.defaultThreshold;
    }

    /**
     * @param {number} value
     */
    set threshold(value) {
        if (Number.isFinite(value)) {
            this.defaultThreshold = value;
        }
    }

    /**
     * Registers a candidate action.
     * @param {UtilityAction|Object} action - Action instance or configuration.
     * @returns {UtilityAction} Registered action instance.
     */
    registerAction(action) {
        if (!action) {
            throw new TypeError("Cannot register empty action");
        }
        const inst = action instanceof UtilityAction ? action : new UtilityAction(action);
        this.actions.set(inst.id, inst);
        return inst;
    }

    /**
     * Removes an action by identifier. Cleans up if currently active.
     * @param {string} actionId - Identifier of action to remove.
     * @param {Object} [context] - Context for cleanup.
     * @returns {boolean} True if removed.
     */
    removeAction(actionId, context = {}) {
        if (!this.actions.has(actionId)) return false;
        if (this.currentAction && this.currentAction.id === actionId) {
            this._cleanupActiveAction(context, {
                reason: "action_removed",
                details: `Action '${actionId}' was removed from UtilityAI`
            });
            this.currentAction = null;
        }
        return this.actions.delete(actionId);
    }

    /**
     * Retrieves an action by ID.
     * @param {string} actionId
     * @returns {UtilityAction|null}
     */
    getAction(actionId) {
        return this.actions.get(actionId) ?? null;
    }

    /**
     * Returns an array of all registered candidate actions.
     * @returns {UtilityAction[]}
     */
    getActions() {
        return Array.from(this.actions.values());
    }

    /**
     * Evaluates all candidate actions against context and returns winning decision.
     * Applies deterministic tie-breaking (priority then ID) and records a decision trace.
     * @param {Object} [context={}] - Context data.
     * @returns {Object} Evaluation result containing chosenAction, score, reason, trace, and candidateScores.
     */
    evaluate(context = {}) {
        const candidates = [];

        for (const action of this.actions.values()) {
            const result = action.evaluate(context);
            const actThreshold = action.threshold !== null && action.threshold !== undefined
                ? action.threshold
                : this.defaultThreshold;

            candidates.push({
                action,
                id: action.id,
                score: result.score,
                priority: action.priority ?? 0,
                threshold: actThreshold,
                passedThreshold: result.score >= actThreshold && result.score > 0,
                considerations: result.considerations
            });
        }

        // Deterministic sorting:
        // 1. Highest utility score descending
        // 2. Highest priority descending on equal scores
        // 3. Alphabetical action ID ascending on equal priority
        candidates.sort((a, b) => {
            const scoreDiff = b.score - a.score;
            if (Math.abs(scoreDiff) > 1e-6) {
                return scoreDiff;
            }
            const prioDiff = (b.priority ?? 0) - (a.priority ?? 0);
            if (prioDiff !== 0) {
                return prioDiff;
            }
            return String(a.id).localeCompare(String(b.id));
        });

        const best = candidates.length > 0 ? candidates[0] : null;
        const effectiveThreshold = best ? best.threshold : this.defaultThreshold;

        let chosenAction = null;
        let chosenScore = 0;
        let reason = "";

        if (!best) {
            reason = "No candidate actions registered.";
        } else if (best.score < effectiveThreshold || best.score <= 0) {
            reason = `All candidates scored below threshold (${effectiveThreshold.toFixed(4)}). Highest was '${best.id}' with score ${best.score.toFixed(4)}.`;
        } else {
            chosenAction = best.action;
            chosenScore = best.score;

            const second = candidates[1];
            if (second && Math.abs(best.score - second.score) <= 1e-6) {
                if ((best.priority ?? 0) !== (second.priority ?? 0)) {
                    reason = `Action '${best.id}' selected with score ${best.score.toFixed(4)}; broke tie with '${second.id}' by priority (${best.priority} > ${second.priority})`;
                } else {
                    reason = `Action '${best.id}' selected with score ${best.score.toFixed(4)}; broke tie with '${second.id}' by ID`;
                }
            } else {
                reason = `Action '${best.id}' selected with highest utility score ${best.score.toFixed(4)} (threshold: ${effectiveThreshold.toFixed(4)})`;
            }
        }

        const trace = {
            timestamp: this._getNow(),
            chosenAction: chosenAction ? chosenAction.id : null,
            chosenScore,
            reason,
            threshold: effectiveThreshold,
            interruptedAction: null,
            candidates: candidates.map((c) => ({
                id: c.id,
                score: c.score,
                priority: c.priority,
                threshold: c.threshold,
                passedThreshold: c.passedThreshold,
                considerations: c.considerations
            }))
        };

        this._recordTrace(trace);

        return {
            chosenAction,
            score: chosenScore,
            reason,
            trace,
            candidateScores: trace.candidates
        };
    }

    /**
     * Evaluates candidates and executes the highest-scoring action.
     * Cleans up superseded or active action states if interrupted or changed.
     * @param {Object} [context={}] - Context data.
     * @returns {Object} Result object with chosenAction, score, executed, result, and evaluation.
     */
    evaluateAndExecute(context = {}) {
        const evaluation = this.evaluate(context);
        const { chosenAction } = evaluation;

        if (!chosenAction) {
            if (this.currentAction) {
                this._cleanupActiveAction(context, {
                    reason: "threshold_not_met",
                    details: "All candidate actions scored below threshold"
                });
                this.currentAction = null;
            }
            return {
                chosenAction: null,
                score: 0,
                executed: false,
                result: null,
                evaluation
            };
        }

        const previousAction = this.currentAction;

        if (this.currentAction && this.currentAction.id !== chosenAction.id) {
            this._cleanupActiveAction(context, {
                reason: "interrupted",
                supersededBy: chosenAction.id,
                details: `Interrupted by higher-scoring action '${chosenAction.id}'`
            });
        }

        this.currentAction = chosenAction;
        chosenAction.isActive = true;

        let result = null;
        if (typeof chosenAction.execute === "function") {
            try {
                result = chosenAction.execute(context);
            } catch (err) {
                console.error(`Error executing action '${chosenAction.id}':`, err);
            }
        }

        if (this.onActionChange && (!previousAction || previousAction.id !== chosenAction.id)) {
            try {
                this.onActionChange(chosenAction, previousAction, context);
            } catch (err) {
                console.error("Error in onActionChange callback:", err);
            }
        }

        return {
            chosenAction,
            score: evaluation.score,
            executed: true,
            result,
            evaluation
        };
    }

    /**
     * Explicitly interrupts the currently active action with cleanup.
     * @param {string|Object} [reason="interrupted"] - Reason for interruption.
     * @param {Object} [context={}] - Context data.
     * @returns {boolean} True if an active action was interrupted.
     */
    interrupt(reason = "interrupted", context = {}) {
        if (!this.currentAction) return false;

        const interrupted = this.currentAction;
        const reasonStr = typeof reason === "string" ? reason : "interrupted";

        this._cleanupActiveAction(context, {
            reason: reasonStr,
            details: reason
        });
        this.currentAction = null;

        if (typeof this.onActionInterrupted === "function") {
            try {
                this.onActionInterrupted(interrupted, reason, context);
            } catch (err) {
                console.error("Error in onActionInterrupted callback:", err);
            }
        }

        this._recordTrace({
            timestamp: this._getNow(),
            chosenAction: null,
            chosenScore: 0,
            reason: `Active action '${interrupted.id}' interrupted: ${reasonStr}`,
            threshold: this.defaultThreshold,
            interruptedAction: interrupted.id,
            candidates: []
        });

        return true;
    }

    /**
     * Cleans up the active action.
     * @private
     * @param {Object} context - Game context.
     * @param {Object} detail - Detail payload for cleanup.
     */
    _cleanupActiveAction(context, detail) {
        const action = this.currentAction;
        if (!action) return;

        action.isActive = false;
        this.lastInterruptedAction = {
            actionId: action.id,
            detail,
            timestamp: this._getNow()
        };

        if (typeof action.cleanup === "function") {
            try {
                action.cleanup(context, detail);
            } catch (err) {
                console.error(`Error in cleanup for action '${action.id}':`, err);
            }
        }
        if (typeof action.onInterrupt === "function") {
            try {
                action.onInterrupt(context, detail);
            } catch (err) {
                console.error(`Error in onInterrupt for action '${action.id}':`, err);
            }
        }
        if (typeof action.onExit === "function") {
            try {
                action.onExit(context, detail);
            } catch (err) {
                console.error(`Error in onExit for action '${action.id}':`, err);
            }
        }
    }

    /**
     * Returns a copy of recorded decision traces.
     * @returns {Object[]} Array of decision traces.
     */
    getDecisionTraces() {
        return this._decisionTraces.map((t) => ({
            ...t,
            candidates: Array.isArray(t.candidates) ? t.candidates.map((c) => ({ ...c })) : []
        }));
    }

    /**
     * Clears all recorded decision traces.
     */
    clearTraces() {
        this._decisionTraces = [];
    }

    /**
     * Returns the most recent decision trace, or null if empty.
     * @returns {Object|null}
     */
    getLastDecisionTrace() {
        if (this._decisionTraces.length === 0) return null;
        return this._decisionTraces[this._decisionTraces.length - 1];
    }

    /**
     * Resolves the current context for evaluation.
     * @returns {Object}
     */
    getContext() {
        let ctx = {};
        if (typeof this.contextProvider === "function") {
            ctx = this.contextProvider(this) ?? {};
        } else if (this.context && typeof this.context === "object") {
            ctx = { ...this.context };
        }
        if (this.entity && !ctx.entity) {
            ctx.entity = this.entity;
        }
        return ctx;
    }

    /**
     * Updates the UtilityAI component for a game loop tick.
     * @param {number} [deltaTime=0] - Delta time in seconds.
     * @param {Object} [overrideContext] - Optional context override.
     * @returns {Object} Result of evaluateAndExecute.
     */
    update(deltaTime = 0, overrideContext = null) {
        const context = overrideContext ?? this.getContext();
        context.deltaTime = deltaTime;

        if (this.currentAction && typeof this.currentAction.update === "function") {
            try {
                this.currentAction.update(context, deltaTime);
            } catch (err) {
                console.error(`Error in update for action '${this.currentAction.id}':`, err);
            }
        }

        return this.evaluateAndExecute(context);
    }

    /**
     * Records a decision trace into the bounded history.
     * @private
     * @param {Object} trace
     * @returns {Object}
     */
    _recordTrace(trace) {
        this._decisionTraces.push(trace);
        if (this._decisionTraces.length > this.maxTraces) {
            this._decisionTraces.shift();
        }
        return trace;
    }

    /**
     * Gets current high-resolution timestamp.
     * @private
     * @returns {number}
     */
    _getNow() {
        return typeof performance !== "undefined" && typeof performance.now === "function"
            ? performance.now()
            : Date.now();
    }
}

UtilityAI.Curves = UtilityCurves;
UtilityAI.Action = UtilityAction;
UtilityAI.Consideration = UtilityConsideration;
UtilityAI.createDefaultActions = createDefaultActions;
UtilityAI.clamp01 = clamp01;
