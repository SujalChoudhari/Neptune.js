/**
 * @file storyGraph.js
 * Galatea Story & Dialogue Graph System (STORY-01).
 * Provides StoryGraph (dialogue nodes with speaker, text, condition-checked choices,
 * fact-mutating consequences, transitions) and QuestGraph (stages/objectives,
 * fact-driven conditions, deduplicated one-time rewards, state machine,
 * diagnostics, and snapshot/restore).
 */

import { WorldFacts } from "../core/worldFacts.js";

/**
 * Evaluates a single condition against WorldFacts.
 * @param {Object|Function} condition
 * @param {WorldFacts} facts
 * @param {Object} [context]
 * @returns {boolean}
 */
function evaluateSingleCondition(condition, facts, context = null) {
    if (!condition) return true;
    if (typeof condition === "function") {
        return Boolean(condition(facts, context));
    }
    if (typeof condition !== "object") {
        return Boolean(condition);
    }

    if (condition.not) {
        return !evaluateSingleCondition(condition.not, facts, context);
    }
    if (Array.isArray(condition.allOf)) {
        return condition.allOf.every(c => evaluateSingleCondition(c, facts, context));
    }
    if (Array.isArray(condition.anyOf)) {
        return condition.anyOf.some(c => evaluateSingleCondition(c, facts, context));
    }

    // Explicit fact / key condition
    if ("fact" in condition || "key" in condition) {
        const factKey = condition.fact || condition.key;
        const actualValue = facts ? facts.get(factKey) : undefined;
        const op = condition.op || condition.operator || "==";
        const expectedValue = condition.value;

        // Numeric range check (min/max)
        if ("min" in condition || "max" in condition) {
            if (typeof actualValue !== "number") return false;
            if ("min" in condition && actualValue < condition.min) return false;
            if ("max" in condition && actualValue > condition.max) return false;
            return true;
        }

        switch (op) {
            case "==":
            case "===":
            case "eq":
            case "equals":
                return actualValue === expectedValue;
            case "!=":
            case "!==":
            case "neq":
            case "not_equals":
                return actualValue !== expectedValue;
            case ">":
            case "gt":
                return typeof actualValue === "number" && actualValue > expectedValue;
            case ">=":
            case "gte":
                return typeof actualValue === "number" && actualValue >= expectedValue;
            case "<":
            case "lt":
                return typeof actualValue === "number" && actualValue < expectedValue;
            case "<=":
            case "lte":
                return typeof actualValue === "number" && actualValue <= expectedValue;
            case "includes":
            case "contains":
                if (Array.isArray(actualValue)) return actualValue.includes(expectedValue);
                if (typeof actualValue === "string") return actualValue.includes(String(expectedValue));
                return false;
            case "in":
                if (Array.isArray(expectedValue)) return expectedValue.includes(actualValue);
                if (typeof expectedValue === "string") return expectedValue.includes(String(actualValue));
                return false;
            case "has":
            case "exists":
                return facts ? facts.has(factKey) : false;
            case "lacks":
            case "not_exists":
                return facts ? !facts.has(factKey) : true;
            default:
                return actualValue === expectedValue;
        }
    }

    // Object map format: { 'player.hasKey': true, 'player.level': 5 }
    if (facts) {
        for (const [k, v] of Object.entries(condition)) {
            if (k === "op" || k === "value" || k === "operator") continue;
            const actual = facts.get(k);
            if (typeof v === "object" && v !== null) {
                if ("min" in v && (typeof actual !== "number" || actual < v.min)) return false;
                if ("max" in v && (typeof actual !== "number" || actual > v.max)) return false;
                if ("op" in v) {
                    if (!evaluateSingleCondition({ fact: k, ...v }, facts, context)) return false;
                }
            } else if (actual !== v) {
                return false;
            }
        }
        return true;
    }

    return true;
}

/**
 * Evaluates conditions against WorldFacts. Supports single condition or array (AND).
 * @param {Object|Array|Function} conditions
 * @param {WorldFacts} facts
 * @param {Object} [context]
 * @returns {boolean}
 */
export function evaluateConditions(conditions, facts, context = null) {
    if (!conditions) return true;
    if (Array.isArray(conditions)) {
        if (conditions.length === 0) return true;
        return conditions.every(c => evaluateSingleCondition(c, facts, context));
    }
    return evaluateSingleCondition(conditions, facts, context);
}

/**
 * Applies consequences/effects to WorldFacts.
 * @param {Object|Array|Function} effects
 * @param {WorldFacts} facts
 */
export function applyEffects(effects, facts) {
    if (!effects || !facts) return;
    if (typeof effects === "function") {
        effects(facts);
        return;
    }

    const effectList = Array.isArray(effects) ? effects : [effects];
    for (const eff of effectList) {
        if (!eff) continue;
        if (typeof eff === "function") {
            eff(facts);
            continue;
        }

        if (eff.set && typeof eff.set === "object") {
            for (const [k, v] of Object.entries(eff.set)) {
                facts.set(k, v);
            }
            continue;
        }

        const key = eff.fact || eff.key;
        if (!key) continue;

        const op = eff.op || eff.operation || "set";
        if (op === "set") {
            facts.set(key, eff.value);
        } else if (op === "add" || op === "+" || op === "increment") {
            const current = facts.get(key, 0);
            const delta = typeof eff.value === "number" ? eff.value : (typeof eff.amount === "number" ? eff.amount : 1);
            facts.set(key, (typeof current === "number" ? current : 0) + delta);
        } else if (op === "subtract" || op === "-" || op === "decrement") {
            const current = facts.get(key, 0);
            const delta = typeof eff.value === "number" ? eff.value : (typeof eff.amount === "number" ? eff.amount : 1);
            facts.set(key, (typeof current === "number" ? current : 0) - delta);
        } else if (op === "toggle") {
            facts.set(key, !facts.get(key, false));
        } else if (op === "delete" || op === "remove") {
            facts.delete(key);
        } else {
            facts.set(key, eff.value);
        }
    }
}

/**
 * Detects logical contradictions in a set of conditions.
 * @param {Array|Object} conditions
 * @returns {Array<{ fact: string, message: string }>}
 */
export function detectContradictions(conditions) {
    const list = Array.isArray(conditions)
        ? conditions
        : (conditions && typeof conditions === "object" ? [conditions] : []);
    const contradictions = [];

    // Flatten any allOf if present
    const flattened = [];
    for (const item of list) {
        if (!item || typeof item !== "object") continue;
        if (item.contradictory === true || item.contradiction === true) {
            contradictions.push({
                fact: item.fact || item.key || "unknown",
                message: "Explicit contradictory condition flag"
            });
            continue;
        }
        if (Array.isArray(item.allOf)) {
            flattened.push(...item.allOf);
        } else if ("fact" in item || "key" in item) {
            flattened.push(item);
        } else {
            // Check direct map { key: val }
            for (const [k, v] of Object.entries(item)) {
                if (k === "op" || k === "value") continue;
                if (typeof v === "object" && v !== null) {
                    flattened.push({ fact: k, ...v });
                } else {
                    flattened.push({ fact: k, op: "==", value: v });
                }
            }
        }
    }

    // Check individual condition self-contradictions (e.g. min > max)
    for (const item of flattened) {
        if (typeof item.min === "number" && typeof item.max === "number" && item.min > item.max) {
            contradictions.push({
                fact: item.fact || item.key || "unknown",
                message: `Condition specifies min (${item.min}) greater than max (${item.max})`
            });
        }
    }

    // Group by fact key
    const byFact = new Map();
    for (const item of flattened) {
        const fact = item.fact || item.key;
        if (!fact) continue;
        if (!byFact.has(fact)) byFact.set(fact, []);
        byFact.get(fact).push(item);
    }

    for (const [fact, conds] of byFact.entries()) {
        let exactValue = undefined;
        let hasExact = false;
        let notValues = new Set();
        let lowerBound = -Infinity;
        let lowerStrict = false;
        let upperBound = Infinity;
        let upperStrict = false;

        for (const c of conds) {
            const op = c.op || c.operator || "==";
            const val = c.value;

            if (op === "==" || op === "===" || op === "eq" || op === "equals") {
                if (hasExact && exactValue !== val) {
                    contradictions.push({
                        fact,
                        message: `Fact '${fact}' cannot simultaneously equal '${exactValue}' and '${val}'`
                    });
                }
                exactValue = val;
                hasExact = true;
            } else if (op === "!=" || op === "!==" || op === "neq" || op === "not_equals") {
                notValues.add(val);
            } else if (op === ">" || op === "gt") {
                if (typeof val === "number") {
                    if (val > lowerBound || (val === lowerBound && !lowerStrict)) {
                        lowerBound = val;
                        lowerStrict = true;
                    }
                }
            } else if (op === ">=" || op === "gte" || "min" in c) {
                const bound = typeof val === "number" ? val : c.min;
                if (typeof bound === "number" && bound > lowerBound) {
                    lowerBound = bound;
                    lowerStrict = false;
                }
            } else if (op === "<" || op === "lt") {
                if (typeof val === "number") {
                    if (val < upperBound || (val === upperBound && !upperStrict)) {
                        upperBound = val;
                        upperStrict = true;
                    }
                }
            } else if (op === "<=" || op === "lte" || "max" in c) {
                const bound = typeof val === "number" ? val : c.max;
                if (typeof bound === "number" && bound < upperBound) {
                    upperBound = bound;
                    upperStrict = false;
                }
            }
        }

        // Check if exactValue conflicts with notValues
        if (hasExact && notValues.has(exactValue)) {
            contradictions.push({
                fact,
                message: `Fact '${fact}' required to equal '${exactValue}' but also required not to equal '${exactValue}'`
            });
        }

        // Check numeric range contradiction: lowerBound vs upperBound
        if (lowerBound > upperBound) {
            contradictions.push({
                fact,
                message: `Fact '${fact}' has lower bound (${lowerBound}) exceeding upper bound (${upperBound})`
            });
        } else if (lowerBound === upperBound && (lowerStrict || upperStrict)) {
            contradictions.push({
                fact,
                message: `Fact '${fact}' requires value strictly between ${lowerBound} and ${upperBound}`
            });
        }

        // Check exactValue against bounds
        if (hasExact && typeof exactValue === "number") {
            if (lowerStrict ? exactValue <= lowerBound : exactValue < lowerBound) {
                contradictions.push({
                    fact,
                    message: `Fact '${fact}' exact value (${exactValue}) violates lower bound (${lowerBound})`
                });
            }
            if (upperStrict ? exactValue >= upperBound : exactValue > upperBound) {
                contradictions.push({
                    fact,
                    message: `Fact '${fact}' exact value (${exactValue}) violates upper bound (${upperBound})`
                });
            }
        }
    }

    return contradictions;
}

/**
 * StoryGraph represents an interactive dialogue flow with branching choices,
 * condition checks against WorldFacts, fact consequences, and diagnostics.
 */
export class StoryGraph {
    #nodes = new Map();
    #visitedNodes = new Set();
    #history = [];
    #currentNodeId = null;
    #state = "unstarted";

    /**
     * @param {Object} [definition]
     */
    constructor(definition = {}) {
        this.id = definition.id || `story_graph_${Math.random().toString(36).slice(2, 9)}`;
        this.name = definition.name || this.id;
        this.initialNodeId = definition.initialNodeId || definition.startNodeId || definition.entryNodeId || null;
        this.facts = definition.facts instanceof WorldFacts ? definition.facts : null;

        if (Array.isArray(definition.nodes)) {
            for (const node of definition.nodes) {
                this.addNode(node);
            }
        } else if (definition.nodes && typeof definition.nodes === "object") {
            for (const [id, node] of Object.entries(definition.nodes)) {
                this.addNode({ id, ...node });
            }
        }
    }

    /**
     * Current dialogue node ID.
     * @returns {string|null}
     */
    get currentNodeId() {
        return this.#currentNodeId;
    }

    /**
     * Current story state ('unstarted', 'active', 'completed').
     * @returns {string}
     */
    get state() {
        return this.#state;
    }

    /**
     * Sequence of visited node IDs in order.
     * @returns {string[]}
     */
    get history() {
        return [...this.#history];
    }

    /**
     * Set of unique visited node IDs.
     * @returns {Set}
     */
    get visitedNodes() {
        return new Set(this.#visitedNodes);
    }

    /**
     * Adds a dialogue node to the graph.
     * @param {Object} node
     * @returns {this}
     */
    addNode(node) {
        if (!node || typeof node !== "object") {
            throw new TypeError("Story node must be an object");
        }
        if (!node.id || typeof node.id !== "string") {
            throw new TypeError("Story node must have a non-empty string 'id'");
        }

        const normalizedNode = {
            id: node.id,
            speaker: node.speaker !== undefined ? node.speaker : "",
            text: node.text || "",
            choices: Array.isArray(node.choices) ? node.choices.map((c, i) => ({
                id: c.id || `choice_${i}`,
                text: c.text || "",
                targetNodeId: c.targetNodeId || c.next || c.target || null,
                condition: c.condition || c.conditions || c.when || null,
                consequence: c.consequence || c.effects || c.action || null,
                metadata: c.metadata || {}
            })) : [],
            next: node.next || node.targetNodeId || null,
            conditions: node.conditions || node.condition || null,
            effects: node.effects || node.consequence || node.onEnter || null,
            metadata: node.metadata || {}
        };

        this.#nodes.set(normalizedNode.id, normalizedNode);
        if (!this.initialNodeId) {
            this.initialNodeId = normalizedNode.id;
        }
        return this;
    }

    /**
     * Gets a node by ID.
     * @param {string} nodeId
     * @returns {Object|null}
     */
    getNode(nodeId) {
        const node = this.#nodes.get(nodeId);
        return node ? { ...node, choices: node.choices.map(c => ({ ...c })) } : null;
    }

    /**
     * Checks if a node ID exists in the graph.
     * @param {string} nodeId
     * @returns {boolean}
     */
    hasNode(nodeId) {
        return this.#nodes.has(nodeId);
    }

    /**
     * Binds or updates the authoritative WorldFacts instance.
     * @param {WorldFacts} facts
     * @returns {this}
     */
    setFacts(facts) {
        this.facts = facts instanceof WorldFacts ? facts : null;
        return this;
    }

    /**
     * Starts the dialogue sequence at the given node or initialNodeId.
     * @param {string} [nodeId]
     * @param {WorldFacts} [facts]
     * @returns {Object} Current node
     */
    start(nodeId = null, facts = null) {
        if (facts instanceof WorldFacts) {
            this.setFacts(facts);
        }

        const targetId = nodeId || this.initialNodeId;
        if (!targetId || !this.#nodes.has(targetId)) {
            throw new Error(`Cannot start story graph: node '${targetId}' not found`);
        }

        this.#state = "active";
        this.#currentNodeId = targetId;
        this.#history = [targetId];
        this.#visitedNodes = new Set([targetId]);

        const node = this.#nodes.get(targetId);
        if (node.effects && this.facts) {
            applyEffects(node.effects, this.facts);
        }

        return this.getCurrentNode();
    }

    /**
     * Returns the current node enriched with available choices.
     * @returns {Object|null}
     */
    getCurrentNode() {
        if (!this.#currentNodeId || this.#state !== "active") return null;
        const node = this.getNode(this.#currentNodeId);
        if (!node) return null;
        return {
            ...node,
            availableChoices: this.getAvailableChoices(this.#currentNodeId)
        };
    }

    /**
     * Returns all choices for a node with their availability evaluated against facts.
     * @param {string} [nodeId]
     * @returns {Array<Object>}
     */
    getChoices(nodeId = null) {
        const id = nodeId || this.#currentNodeId;
        if (!id || !this.#nodes.has(id)) return [];
        const node = this.#nodes.get(id);

        return node.choices.map(choice => {
            const isAvailable = choice.condition
                ? evaluateConditions(choice.condition, this.facts)
                : true;
            return {
                ...choice,
                available: isAvailable
            };
        });
    }

    /**
     * Returns only the choices currently available according to WorldFacts.
     * @param {string} [nodeId]
     * @returns {Array<Object>}
     */
    getAvailableChoices(nodeId = null) {
        return this.getChoices(nodeId).filter(c => c.available);
    }

    /**
     * Selects a dialogue choice by index or ID, applies consequences, and transitions.
     * @param {number|string} choiceIndexOrId
     * @returns {Object|null} The new current node, or null if dialogue ended
     */
    choose(choiceIndexOrId) {
        if (this.#state !== "active" || !this.#currentNodeId) {
            throw new Error("Cannot choose: dialogue is not active");
        }

        const choices = this.getChoices(this.#currentNodeId);
        let selectedChoice = null;

        if (typeof choiceIndexOrId === "number") {
            selectedChoice = choices[choiceIndexOrId];
        } else if (typeof choiceIndexOrId === "string") {
            selectedChoice = choices.find(c => c.id === choiceIndexOrId);
        }

        if (!selectedChoice) {
            throw new Error(`Choice '${choiceIndexOrId}' not found on current node '${this.#currentNodeId}'`);
        }

        if (!selectedChoice.available) {
            throw new Error(`Choice '${selectedChoice.text || selectedChoice.id}' is locked: condition not satisfied`);
        }

        // Apply consequence effects
        if (selectedChoice.consequence && this.facts) {
            applyEffects(selectedChoice.consequence, this.facts);
        }

        const nextId = selectedChoice.targetNodeId;
        if (!nextId || nextId === "end" || nextId === "exit") {
            this.#state = "completed";
            this.#currentNodeId = null;
            return null;
        }

        if (!this.#nodes.has(nextId)) {
            throw new Error(`Choice target node '${nextId}' does not exist in story graph`);
        }

        this.#currentNodeId = nextId;
        this.#history.push(nextId);
        this.#visitedNodes.add(nextId);

        const nextNode = this.#nodes.get(nextId);
        if (nextNode.effects && this.facts) {
            applyEffects(nextNode.effects, this.facts);
        }

        return this.getCurrentNode();
    }

    /**
     * Advances linear dialogue to the next node (when node has no choices but defines 'next').
     * @returns {Object|null}
     */
    advance() {
        if (this.#state !== "active" || !this.#currentNodeId) {
            throw new Error("Cannot advance: dialogue is not active");
        }

        const node = this.#nodes.get(this.#currentNodeId);
        const nextId = node.next;

        if (!nextId || nextId === "end" || nextId === "exit") {
            this.#state = "completed";
            this.#currentNodeId = null;
            return null;
        }

        if (!this.#nodes.has(nextId)) {
            throw new Error(`Next node '${nextId}' does not exist in story graph`);
        }

        this.#currentNodeId = nextId;
        this.#history.push(nextId);
        this.#visitedNodes.add(nextId);

        const nextNode = this.#nodes.get(nextId);
        if (nextNode.effects && this.facts) {
            applyEffects(nextNode.effects, this.facts);
        }

        return this.getCurrentNode();
    }

    /**
     * Checks if dialogue sequence is active.
     * @returns {boolean}
     */
    isActive() {
        return this.#state === "active";
    }

    /**
     * Checks if dialogue sequence has completed.
     * @returns {boolean}
     */
    isCompleted() {
        return this.#state === "completed";
    }

    /**
     * Resets dialogue to unstarted state.
     */
    reset() {
        this.#state = "unstarted";
        this.#currentNodeId = null;
        this.#history = [];
        this.#visitedNodes.clear();
    }

    /**
     * Serializes runtime dialogue state for save games.
     * @returns {Object}
     */
    snapshot() {
        return {
            id: this.id,
            state: this.#state,
            currentNodeId: this.#currentNodeId,
            history: [...this.#history],
            visitedNodes: Array.from(this.#visitedNodes)
        };
    }

    /**
     * Restores dialogue state from snapshot.
     * @param {Object} snapshot
     * @returns {this}
     */
    restore(snapshot) {
        if (!snapshot || typeof snapshot !== "object") {
            throw new TypeError("StoryGraph snapshot must be an object");
        }

        this.#state = snapshot.state || "unstarted";
        this.#currentNodeId = snapshot.currentNodeId || null;
        this.#history = Array.isArray(snapshot.history) ? [...snapshot.history] : [];
        this.#visitedNodes = new Set(Array.isArray(snapshot.visitedNodes) ? snapshot.visitedNodes : []);
        return this;
    }

    /**
     * Runs comprehensive diagnostics on the story graph:
     * detects missing node references, absent speakers, and contradictory conditions.
     * @returns {{ valid: boolean, errors: Array<Object>, warnings: Array<Object> }}
     */
    diagnostics() {
        return StoryGraph.validate({
            initialNodeId: this.initialNodeId,
            nodes: Array.from(this.#nodes.values())
        });
    }

    /**
     * Validates a story graph definition structure.
     * @param {Object} storyDef
     * @returns {{ valid: boolean, errors: Array<Object>, warnings: Array<Object> }}
     */
    static validate(storyDef) {
        const errors = [];
        const warnings = [];

        if (!storyDef || typeof storyDef !== "object") {
            errors.push({
                code: "INVALID_DEFINITION",
                message: "Story definition must be a non-null object"
            });
            return { valid: false, errors, warnings };
        }

        const nodes = Array.isArray(storyDef.nodes)
            ? storyDef.nodes
            : (storyDef.nodes && typeof storyDef.nodes === "object"
                ? Object.entries(storyDef.nodes).map(([id, n]) => ({ id, ...n }))
                : []);

        const nodeIds = new Set(nodes.map(n => n.id).filter(Boolean));

        // 1. Initial node existence check
        const initialId = storyDef.initialNodeId || storyDef.startNodeId || storyDef.entryNodeId;
        if (initialId && !nodeIds.has(initialId)) {
            errors.push({
                code: "MISSING_NODE_REFERENCE",
                message: `Initial node '${initialId}' does not exist in graph`,
                nodeId: initialId
            });
        }

        // 2. Validate each node
        for (const node of nodes) {
            const nodeId = node.id || "unnamed";

            // Check absent speaker
            if (node.speaker === undefined || node.speaker === null || (typeof node.speaker === "string" && !node.speaker.trim())) {
                errors.push({
                    code: "ABSENT_SPEAKER",
                    message: `Dialogue node '${nodeId}' has missing or empty speaker`,
                    nodeId
                });
            }

            // Check linear 'next' transition reference
            if (node.next && typeof node.next === "string" && node.next !== "end" && node.next !== "exit") {
                if (!nodeIds.has(node.next)) {
                    errors.push({
                        code: "MISSING_NODE_REFERENCE",
                        message: `Node '${nodeId}' references non-existent node '${node.next}' in 'next'`,
                        nodeId,
                        targetNodeId: node.next
                    });
                }
            }

            // Check node-level condition contradictions
            if (node.conditions || node.condition) {
                const conds = node.conditions || node.condition;
                const nodeContradictions = detectContradictions(conds);
                for (const c of nodeContradictions) {
                    errors.push({
                        code: "CONTRADICTORY_CONDITIONS",
                        message: `Node '${nodeId}' condition contradiction: ${c.message}`,
                        nodeId,
                        fact: c.fact
                    });
                }
            }

            // Check choices
            if (Array.isArray(node.choices)) {
                for (let i = 0; i < node.choices.length; i++) {
                    const choice = node.choices[i];
                    const targetId = choice.targetNodeId || choice.next || choice.target;

                    // Missing choice target reference
                    if (targetId && typeof targetId === "string" && targetId !== "end" && targetId !== "exit") {
                        if (!nodeIds.has(targetId)) {
                            errors.push({
                                code: "MISSING_NODE_REFERENCE",
                                message: `Choice [${i}] in node '${nodeId}' references non-existent node '${targetId}'`,
                                nodeId,
                                targetNodeId: targetId
                            });
                        }
                    }

                    // Contradictory conditions on choice
                    if (choice.condition || choice.conditions) {
                        const conds = choice.condition || choice.conditions;
                        const choiceContradictions = detectContradictions(conds);
                        for (const c of choiceContradictions) {
                            errors.push({
                                code: "CONTRADICTORY_CONDITIONS",
                                message: `Choice [${i}] in node '${nodeId}' has contradictory conditions: ${c.message}`,
                                nodeId,
                                choiceIndex: i,
                                fact: c.fact
                            });
                        }
                    }
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}

/**
 * QuestGraph represents a state machine of quest stages, objectives,
 * conditions checked against WorldFacts, one-time rewards with deduplication guards,
 * cycle diagnostics, and snapshot/restore for persistence.
 */
export class QuestGraph {
    #stages = new Map();
    #claimedRewards = new Set();
    #history = [];
    #currentStageId = null;
    #state = "unstarted";

    /**
     * @param {Object} [definition]
     */
    constructor(definition = {}) {
        this.id = definition.id || `quest_${Math.random().toString(36).slice(2, 9)}`;
        this.title = definition.title || definition.name || this.id;
        this.description = definition.description || "";
        this.initialStageId = definition.initialStageId || definition.startStageId || null;
        this.rewards = Array.isArray(definition.rewards) ? definition.rewards.map(r => ({ ...r })) : [];
        this.facts = definition.facts instanceof WorldFacts ? definition.facts : null;
        this.bus = definition.bus || null;

        const stageList = Array.isArray(definition.stages)
            ? definition.stages
            : (Array.isArray(definition.objectives)
                ? definition.objectives
                : (definition.stages && typeof definition.stages === "object"
                    ? Object.entries(definition.stages).map(([id, s]) => ({ id, ...s }))
                    : []));

        for (const stage of stageList) {
            this.addStage(stage);
        }
    }

    /**
     * Current quest state ('unstarted', 'active', 'completed', 'failed').
     * @returns {string}
     */
    get state() {
        return this.#state;
    }

    /**
     * Currently active stage ID.
     * @returns {string|null}
     */
    get currentStageId() {
        return this.#currentStageId;
    }

    /**
     * History of quest state transitions.
     * @returns {Array<Object>}
     */
    get history() {
        return [...this.#history];
    }

    /**
     * Adds a stage or objective to the quest graph.
     * @param {Object} stage
     * @returns {this}
     */
    addStage(stage) {
        if (!stage || typeof stage !== "object") {
            throw new TypeError("Quest stage must be an object");
        }
        if (!stage.id || typeof stage.id !== "string") {
            throw new TypeError("Quest stage must have a non-empty string 'id'");
        }

        const normalizedStage = {
            id: stage.id,
            title: stage.title || stage.name || stage.id,
            description: stage.description || "",
            state: stage.state || "unstarted",
            conditions: stage.conditions || stage.condition || null,
            failureConditions: stage.failureConditions || null,
            event: stage.event || stage.events || null,
            next: stage.next || stage.nextStageId || null,
            rewards: Array.isArray(stage.rewards) ? stage.rewards.map((r, i) => ({
                id: r.id || `${this.id}_${stage.id}_reward_${i}`,
                ...r
            })) : [],
            speaker: stage.speaker !== undefined ? stage.speaker : null,
            metadata: stage.metadata || {}
        };

        this.#stages.set(normalizedStage.id, normalizedStage);
        if (!this.initialStageId) {
            this.initialStageId = normalizedStage.id;
        }
        return this;
    }

    /**
     * Gets a stage by ID.
     * @param {string} stageId
     * @returns {Object|null}
     */
    getStage(stageId) {
        const stage = this.#stages.get(stageId);
        return stage ? { ...stage, rewards: stage.rewards.map(r => ({ ...r })) } : null;
    }

    /**
     * Gets the currently active stage object.
     * @returns {Object|null}
     */
    getActiveStage() {
        if (!this.#currentStageId) return null;
        return this.getStage(this.#currentStageId);
    }

    /**
     * Checks if a stage exists.
     * @param {string} stageId
     * @returns {boolean}
     */
    hasStage(stageId) {
        return this.#stages.has(stageId);
    }

    /**
     * Sets or updates the authoritative WorldFacts instance.
     * @param {WorldFacts} facts
     * @returns {this}
     */
    setFacts(facts) {
        this.facts = facts instanceof WorldFacts ? facts : null;
        return this;
    }

    /**
     * Starts the quest, activating the initial stage.
     * @returns {this}
     */
    start() {
        if (this.#state === "active") return this;

        const startId = this.initialStageId;
        if (!startId || !this.#stages.has(startId)) {
            throw new Error(`Cannot start quest '${this.id}': initial stage '${startId}' not found`);
        }

        this.#state = "active";
        this.#currentStageId = startId;
        const initialStage = this.#stages.get(startId);
        initialStage.state = "active";

        this.#history.push({
            type: "quest_started",
            questId: this.id,
            stageId: startId,
            timestamp: Date.now()
        });

        if (this.bus && typeof this.bus.emit === "function") {
            this.bus.emit("quest:started", { questId: this.id, stageId: startId });
        }

        if (this.facts) {
            this.evaluate(this.facts);
        }

        return this;
    }

    /**
     * Marks the quest as completed, awarding one-time quest rewards with deduplication.
     * @returns {this}
     */
    complete() {
        if (this.#state === "completed") return this;

        this.#state = "completed";
        if (this.#currentStageId && this.#stages.has(this.#currentStageId)) {
            this.#stages.get(this.#currentStageId).state = "completed";
        }
        this.#currentStageId = null;

        this.#history.push({
            type: "quest_completed",
            questId: this.id,
            timestamp: Date.now()
        });

        // Award one-time quest completion rewards
        for (let i = 0; i < this.rewards.length; i++) {
            const reward = this.rewards[i];
            const rewardObj = typeof reward === "object" && reward !== null
                ? { id: reward.id || `${this.id}_completion_reward_${i}`, ...reward }
                : { id: `${this.id}_completion_reward_${i}`, value: reward };
            this.claimReward(rewardObj, this.facts);
        }

        if (this.bus && typeof this.bus.emit === "function") {
            this.bus.emit("quest:completed", { questId: this.id });
        }

        return this;
    }

    /**
     * Marks the quest as failed.
     * @param {string} [reason]
     * @returns {this}
     */
    fail(reason = "") {
        if (this.#state === "failed") return this;

        this.#state = "failed";
        if (this.#currentStageId && this.#stages.has(this.#currentStageId)) {
            this.#stages.get(this.#currentStageId).state = "failed";
        }

        this.#history.push({
            type: "quest_failed",
            questId: this.id,
            reason,
            timestamp: Date.now()
        });

        if (this.bus && typeof this.bus.emit === "function") {
            this.bus.emit("quest:failed", { questId: this.id, reason });
        }

        return this;
    }

    /**
     * Completes a specific stage, granting its deduplicated one-time rewards,
     * and advances to the next stage or completes the quest.
     * @param {string} stageId
     * @returns {this}
     */
    completeStage(stageId) {
        if (!this.#stages.has(stageId)) return this;
        const stage = this.#stages.get(stageId);
        stage.state = "completed";

        this.#history.push({
            type: "stage_completed",
            questId: this.id,
            stageId,
            timestamp: Date.now()
        });

        // Grant stage rewards with deduplication
        if (Array.isArray(stage.rewards)) {
            for (const reward of stage.rewards) {
                this.claimReward(reward, this.facts);
            }
        }

        if (this.bus && typeof this.bus.emit === "function") {
            this.bus.emit("quest:stage_completed", { questId: this.id, stageId });
        }

        const nextId = stage.next;
        if (nextId && this.#stages.has(nextId)) {
            this.#currentStageId = nextId;
            const nextStage = this.#stages.get(nextId);
            nextStage.state = "active";
            this.#history.push({
                type: "stage_started",
                questId: this.id,
                stageId: nextId,
                timestamp: Date.now()
            });
        } else {
            // Final stage completed: complete the quest
            this.complete();
        }

        return this;
    }

    /**
     * Claims a one-time reward with deduplication guard.
     * Prevents rewards from ever being awarded twice.
     * @param {Object|string} reward
     * @param {WorldFacts} [facts]
     * @returns {Object} Result object with awarded flag and rewardId
     */
    claimReward(reward, facts = null) {
        const factStore = facts || this.facts;
        let rewardId = null;

        if (typeof reward === "string") {
            rewardId = reward;
        } else if (reward && typeof reward === "object") {
            rewardId = reward.id || `${this.id}_reward_${Math.random().toString(36).slice(2, 9)}`;
        }

        if (!rewardId) {
            return { awarded: false, rewardId: "", reason: "INVALID_REWARD" };
        }

        // Deduplication guard
        if (this.#claimedRewards.has(rewardId)) {
            return { awarded: false, rewardId, reason: "ALREADY_CLAIMED" };
        }

        this.#claimedRewards.add(rewardId);

        // Apply reward effects to WorldFacts if present
        if (factStore && typeof reward === "object" && reward !== null) {
            if (reward.fact || reward.key) {
                const key = reward.fact || reward.key;
                const op = reward.op || (reward.type === "gold" || reward.type === "xp" ? "add" : "set");
                if (op === "add" || op === "+" || op === "increment") {
                    const cur = factStore.get(key, 0);
                    const amount = typeof reward.value === "number" ? reward.value : (typeof reward.amount === "number" ? reward.amount : 0);
                    factStore.set(key, (typeof cur === "number" ? cur : 0) + amount);
                } else {
                    factStore.set(key, reward.value !== undefined ? reward.value : (reward.amount !== undefined ? reward.amount : true));
                }
            } else if (reward.effects) {
                applyEffects(reward.effects, factStore);
            }
        }

        if (this.bus && typeof this.bus.emit === "function") {
            this.bus.emit("reward:granted", { questId: this.id, rewardId, reward });
        }

        return { awarded: true, rewardId };
    }

    /**
     * Checks if a reward ID has already been claimed.
     * @param {string} rewardId
     * @returns {boolean}
     */
    hasClaimedReward(rewardId) {
        return this.#claimedRewards.has(rewardId);
    }

    /**
     * Returns an array of all claimed reward IDs.
     * @returns {string[]}
     */
    getClaimedRewards() {
        return Array.from(this.#claimedRewards);
    }

    /**
     * Evaluates current active stage conditions against WorldFacts and optional event.
     * If conditions are met, advances stage or completes quest.
     * @param {WorldFacts} [facts]
     * @param {Object|string} [event]
     * @returns {boolean} True if stage transitioned
     */
    evaluate(facts = null, event = null) {
        if (facts instanceof WorldFacts) {
            this.setFacts(facts);
        }
        const factStore = this.facts;

        if (this.#state !== "active" || !this.#currentStageId) {
            return false;
        }

        const stage = this.#stages.get(this.#currentStageId);
        if (!stage || stage.state !== "active") {
            return false;
        }

        // 1. Check failure conditions
        if (stage.failureConditions && evaluateConditions(stage.failureConditions, factStore, event)) {
            this.fail("Stage failure condition met");
            return true;
        }

        // 2. Check event match if stage specifies event requirement
        let eventMatched = true;
        if (stage.event) {
            if (!event) {
                eventMatched = false;
            } else {
                const eventName = typeof event === "string" ? event : (event.type || event.name);
                const reqEvents = Array.isArray(stage.event) ? stage.event : [stage.event];
                eventMatched = reqEvents.includes(eventName);
            }
        }

        // 3. Check fact conditions
        let conditionsMet = false;
        if (stage.conditions) {
            conditionsMet = evaluateConditions(stage.conditions, factStore, event);
        } else if (!stage.event) {
            // Unconditional stage
            conditionsMet = true;
        }

        if (eventMatched && (conditionsMet || (!stage.conditions && stage.event))) {
            this.completeStage(stage.id);

            // Re-evaluate if chained stage conditions are already fulfilled
            if (this.#state === "active" && this.#currentStageId) {
                this.evaluate(factStore, event);
            }
            return true;
        }

        return false;
    }

    /**
     * Binds WorldFacts and optional TypedEventBus to trigger fact/event-driven evaluation automatically.
     * @param {WorldFacts} facts
     * @param {Object} [bus]
     * @returns {Function} Unbind callback
     */
    bind(facts, bus = null) {
        if (facts instanceof WorldFacts) {
            this.setFacts(facts);
        }
        if (bus) {
            this.bus = bus;
        }

        const unbinders = [];

        // Bind facts onChange
        if (this.facts && typeof this.facts.onChange === "function") {
            const unbindFacts = this.facts.onChange("*", () => {
                if (this.#state === "active") {
                    this.evaluate(this.facts);
                }
            });
            unbinders.push(unbindFacts);
        }

        // Bind bus events for stages requiring events
        if (this.bus && typeof this.bus.on === "function") {
            const registeredEvents = new Set();
            for (const stage of this.#stages.values()) {
                if (stage.event) {
                    const evts = Array.isArray(stage.event) ? stage.event : [stage.event];
                    for (const e of evts) registeredEvents.add(e);
                }
            }

            for (const evtName of registeredEvents) {
                const unbindEvt = this.bus.on(evtName, (eventData) => {
                    if (this.#state === "active") {
                        this.evaluate(this.facts, { type: evtName, data: eventData });
                    }
                });
                unbinders.push(unbindEvt);
            }
        }

        return () => {
            for (const u of unbinders) {
                if (typeof u === "function") u();
            }
        };
    }

    /**
     * Checks if quest is currently active.
     * @returns {boolean}
     */
    isActive() {
        return this.#state === "active";
    }

    /**
     * Checks if quest has completed.
     * @returns {boolean}
     */
    isCompleted() {
        return this.#state === "completed";
    }

    /**
     * Checks if quest has failed.
     * @returns {boolean}
     */
    isFailed() {
        return this.#state === "failed";
    }

    /**
     * Resets quest to unstarted state and clears active stage.
     */
    reset() {
        this.#state = "unstarted";
        this.#currentStageId = null;
        for (const stage of this.#stages.values()) {
            stage.state = "unstarted";
        }
        this.#history = [];
        this.#claimedRewards.clear();
    }

    /**
     * Serializes quest state, active stage, and claimed rewards for save games.
     * @returns {Object}
     */
    snapshot() {
        return {
            id: this.id,
            state: this.#state,
            currentStageId: this.#currentStageId,
            stages: Array.from(this.#stages.entries()).map(([id, stage]) => ({
                id,
                state: stage.state
            })),
            claimedRewards: Array.from(this.#claimedRewards),
            history: [...this.#history]
        };
    }

    /** Serialization alias for save games */
    serialize() {
        return this.snapshot();
    }

    /** Deserialization alias for save games */
    deserialize(data) {
        return this.restore(data);
    }

    /**
     * Restores quest state, active stage, and claimed reward deduplication guards from snapshot.
     * @param {Object} snapshot
     * @returns {this}
     */
    restore(snapshot) {
        if (!snapshot || typeof snapshot !== "object") {
            throw new TypeError("QuestGraph snapshot must be an object");
        }

        this.#state = snapshot.state || "unstarted";
        this.#currentStageId = snapshot.currentStageId || null;

        if (Array.isArray(snapshot.stages)) {
            for (const s of snapshot.stages) {
                if (s && s.id && this.#stages.has(s.id)) {
                    this.#stages.get(s.id).state = s.state || "unstarted";
                }
            }
        }

        this.#claimedRewards = new Set(Array.isArray(snapshot.claimedRewards) ? snapshot.claimedRewards : []);
        this.#history = Array.isArray(snapshot.history) ? [...snapshot.history] : [];
        return this;
    }

    /**
     * Runs diagnostics on the quest graph:
     * detects missing node references, absent speakers (if dialogue is attached),
     * contradictory conditions, and unsupported cycles.
     * @returns {{ valid: boolean, errors: Array<Object>, warnings: Array<Object> }}
     */
    diagnostics() {
        return QuestGraph.validate({
            initialStageId: this.initialStageId,
            stages: Array.from(this.#stages.values())
        });
    }

    /**
     * Validates a quest graph definition.
     * @param {Object} questDef
     * @returns {{ valid: boolean, errors: Array<Object>, warnings: Array<Object> }}
     */
    static validate(questDef) {
        const errors = [];
        const warnings = [];

        if (!questDef || typeof questDef !== "object") {
            errors.push({
                code: "INVALID_DEFINITION",
                message: "Quest definition must be a non-null object"
            });
            return { valid: false, errors, warnings };
        }

        const stages = Array.isArray(questDef.stages)
            ? questDef.stages
            : (Array.isArray(questDef.objectives)
                ? questDef.objectives
                : (questDef.stages && typeof questDef.stages === "object"
                    ? Object.entries(questDef.stages).map(([id, s]) => ({ id, ...s }))
                    : []));

        const stageMap = new Map();
        for (const s of stages) {
            if (s && s.id) stageMap.set(s.id, s);
        }

        // 1. Initial stage check
        const initialId = questDef.initialStageId || questDef.startStageId;
        if (initialId && !stageMap.has(initialId)) {
            errors.push({
                code: "MISSING_STAGE_REFERENCE",
                message: `Initial stage '${initialId}' does not exist in quest graph`,
                stageId: initialId
            });
        }

        // 2. Validate stage references, conditions, and absent speakers
        for (const stage of stages) {
            const stageId = stage.id || "unnamed";

            // Check next stage reference
            if (stage.next && typeof stage.next === "string" && stage.next !== "end" && stage.next !== "complete") {
                if (!stageMap.has(stage.next)) {
                    errors.push({
                        code: "MISSING_STAGE_REFERENCE",
                        message: `Stage '${stageId}' references non-existent stage '${stage.next}' in 'next'`,
                        stageId,
                        targetStageId: stage.next
                    });
                }
            } else if (Array.isArray(stage.next)) {
                for (const nextId of stage.next) {
                    if (nextId && typeof nextId === "string" && nextId !== "end" && nextId !== "complete") {
                        if (!stageMap.has(nextId)) {
                            errors.push({
                                code: "MISSING_STAGE_REFERENCE",
                                message: `Stage '${stageId}' references non-existent stage '${nextId}' in 'next'`,
                                stageId,
                                targetStageId: nextId
                            });
                        }
                    }
                }
            }

            // Check contradictory conditions on stage
            if (stage.conditions || stage.condition) {
                const conds = stage.conditions || stage.condition;
                const contradictions = detectContradictions(conds);
                for (const c of contradictions) {
                    errors.push({
                        code: "CONTRADICTORY_CONDITIONS",
                        message: `Stage '${stageId}' has contradictory conditions: ${c.message}`,
                        stageId,
                        fact: c.fact
                    });
                }
            }

            // Check absent speaker if speaker property is explicitly provided but empty/blank
            if (stage.speaker !== undefined && stage.speaker !== null) {
                if (typeof stage.speaker !== "string" || !stage.speaker.trim()) {
                    errors.push({
                        code: "ABSENT_SPEAKER",
                        message: `Quest stage '${stageId}' has empty or invalid speaker string`,
                        stageId
                    });
                }
            }
        }

        // 3. Detect unsupported cycles in quest graphs using 3-color DFS
        const visited = new Set();
        const visiting = new Map();
        const currentPath = [];
        const detectedCycles = new Set();

        function dfs(currentId) {
            visiting.set(currentId, currentPath.length);
            currentPath.push(currentId);

            const stage = stageMap.get(currentId);
            const outgoing = [];
            if (stage && stage.next) {
                if (Array.isArray(stage.next)) {
                    outgoing.push(...stage.next);
                } else if (typeof stage.next === "string") {
                    outgoing.push(stage.next);
                }
            }

            for (const nextId of outgoing) {
                if (!nextId || nextId === "end" || nextId === "complete") continue;
                if (!stageMap.has(nextId)) continue;

                if (visiting.has(nextId)) {
                    // Cycle detected
                    const startIdx = visiting.get(nextId);
                    const cycleNodes = currentPath.slice(startIdx).concat(nextId);
                    const cycleKey = cycleNodes.join(" -> ");

                    if (!detectedCycles.has(cycleKey)) {
                        detectedCycles.add(cycleKey);
                        errors.push({
                            code: "UNSUPPORTED_CYCLE",
                            message: `Unsupported cycle detected in quest graph: ${cycleKey}`,
                            stageId: currentId,
                            cycle: cycleNodes
                        });
                    }
                } else if (!visited.has(nextId)) {
                    dfs(nextId);
                }
            }

            visiting.delete(currentId);
            currentPath.pop();
            visited.add(currentId);
        }

        if (initialId && stageMap.has(initialId)) {
            dfs(initialId);
        }

        for (const id of stageMap.keys()) {
            if (!visited.has(id)) {
                dfs(id);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}
