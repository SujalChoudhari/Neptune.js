import { Component } from "../components/component.js";

/**
 * Validates that a value is a finite number greater than or equal to a minimum.
 * @param {number} value
 * @param {string} name
 * @param {number} [min=0]
 * @returns {number}
 */
function finiteNumber(value, name, min = 0) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
        throw new TypeError(`${name} must be a finite number >= ${min}`);
    }
    return value;
}

/**
 * Validates that a value is a non-empty string.
 * @param {string} value
 * @param {string} name
 * @returns {string}
 */
function nonEmptyString(value, name) {
    if (typeof value !== "string" || !value.trim()) {
        throw new TypeError(`${name} must be a non-empty string`);
    }
    return value.trim();
}

/**
 * Manages experience curves, multi-level increments, and stat scaling per level.
 */
export class LevelProgression extends Component {
    /**
     * @param {Object} [config]
     * @param {number} [config.level=1]
     * @param {number} [config.experience=0]
     * @param {number} [config.baseExperience=100]
     * @param {number} [config.growthRate=1.5]
     * @param {number} [config.maxLevel=100]
     * @param {Object} [config.statGains] Stat increases per level
     * @param {Object} [config.baseStats] Initial stats at level 1
     */
    constructor({
        level = 1,
        experience = 0,
        baseExperience = 100,
        growthRate = 1.5,
        maxLevel = 100,
        statGains = {},
        baseStats = {}
    } = {}) {
        super();
        if (!Number.isInteger(level) || level < 1) throw new RangeError("Level must be a positive integer");
        finiteNumber(experience, "experience", 0);
        finiteNumber(baseExperience, "baseExperience", 1);
        finiteNumber(growthRate, "growthRate", 1);
        if (!Number.isInteger(maxLevel) || maxLevel < 1) throw new RangeError("maxLevel must be a positive integer");

        this.level = Math.min(level, maxLevel);
        this.experience = experience;
        this.baseExperience = baseExperience;
        this.growthRate = growthRate;
        this.maxLevel = maxLevel;
        this.statGains = { ...statGains };
        this.baseStats = { ...baseStats };
        this.statPoints = 0;
        this.unspentStatPoints = 0;
        this.statPointsPerLevel = 3;
        this.listeners = new Set();
    }

    /**
     * Calculate experience needed to advance from given level to next.
     * @param {number} [level=this.level]
     * @returns {number}
     */
    experienceToNextLevel(level = this.level) {
        if (level >= this.maxLevel) return Infinity;
        return Math.floor(this.baseExperience * (this.growthRate ** (level - 1)));
    }

    /**
     * Add a listener for progression events (level-up, exp-gained).
     * @param {Function} listener
     * @returns {Function} Unsubscribe function
     */
    onProgression(listener) {
        if (typeof listener !== "function") throw new TypeError("Listener must be a function");
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    _emit(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    /**
     * Grant experience, potentially climbing multiple levels in one call.
     * @param {number} amount
     * @returns {Array} Array of level numbers reached
     */
    grantExperience(amount) {
        finiteNumber(amount, "amount", 0);
        if (amount === 0 || this.level >= this.maxLevel) return [];

        this.experience += amount;
        this._emit({ type: "experience-gained", amount, totalExperience: this.experience });

        const levelsGained = [];
        while (this.level < this.maxLevel && this.experience >= this.experienceToNextLevel()) {
            this.experience -= this.experienceToNextLevel();
            this.level += 1;
            this.statPoints += this.statPointsPerLevel;
            this.unspentStatPoints += this.statPointsPerLevel;
            levelsGained.push(this.level);

            this._emit({
                type: "level-up",
                level: this.level,
                remainingExperience: this.experience,
                statPointsAwarded: this.statPointsPerLevel,
                stats: this.getCalculatedStats()
            });
        }

        if (this.level >= this.maxLevel) {
            this.experience = 0;
        }

        return levelsGained;
    }

    /**
     * Get computed total stats for the current level.
     * @returns {Object}
     */
    getCalculatedStats() {
        const result = { ...this.baseStats };
        const levelOffset = this.level - 1;
        for (const [stat, gain] of Object.entries(this.statGains)) {
            const current = result[stat] ?? 0;
            result[stat] = current + (gain * levelOffset);
        }
        return result;
    }

    /**
     * Apply calculated stats to a Combatant or Stats component.
     * @param {Object} target
     */
    applyToTarget(target) {
        if (!target || typeof target !== "object") return;
        const stats = this.getCalculatedStats();
        if (typeof target.maxHealth === "number" && stats.maxHealth) {
            target.maxHealth = stats.maxHealth;
            if (target.health > target.maxHealth) target.health = target.maxHealth;
        }
        if (target.stats && typeof target.stats === "object") {
            Object.assign(target.stats, stats);
        }
    }

    /**
     * Create snapshot for serialization.
     * @returns {Object}
     */
    toJSON() {
        return {
            level: this.level,
            experience: this.experience,
            baseExperience: this.baseExperience,
            growthRate: this.growthRate,
            maxLevel: this.maxLevel,
            statGains: { ...this.statGains },
            baseStats: { ...this.baseStats },
            statPoints: this.statPoints,
            unspentStatPoints: this.unspentStatPoints,
            statPointsPerLevel: this.statPointsPerLevel
        };
    }

    /**
     * Restore from serialized state.
     * @param {Object} data
     * @returns {LevelProgression}
     */
    static fromJSON(data) {
        if (!data || typeof data !== "object") throw new TypeError("data must be an object");
        const progression = new LevelProgression(data);
        if (Number.isInteger(data.statPoints)) progression.statPoints = data.statPoints;
        if (Number.isInteger(data.unspentStatPoints)) progression.unspentStatPoints = data.unspentStatPoints;
        if (Number.isInteger(data.statPointsPerLevel)) progression.statPointsPerLevel = data.statPointsPerLevel;
        return progression;
    }
}

/**
 * Manages timed and periodic status effects with stacking rules (replace, duration_stack, intensity_stack, independent).
 */
export class StatusEffectManager extends Component {
    /**
     * @param {Object} [config]
     * @param {Object} [config.target] Target combatant or entity
     */
    constructor({ target = null } = {}) {
        super();
        this.target = target;
        this.effects = [];
        this.listeners = new Set();
        this._isPaused = false;
    }

    /**
     * Set paused state. When paused, effect durations and tick intervals do not advance.
     * @param {boolean} paused
     */
    setPaused(paused) {
        this._isPaused = Boolean(paused);
    }

    get isPaused() {
        return this._isPaused;
    }

    /**
     * Listen for status events: applied, refreshed, ticked, expired, cleansed.
     * @param {Function} listener
     * @returns {Function} Unsubscribe
     */
    onStatusEvent(listener) {
        if (typeof listener !== "function") throw new TypeError("Listener must be a function");
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    _emit(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    /**
     * Apply or stack a status effect.
     * @param {Object} effectConfig
     * @param {string} effectConfig.name Unique effect identifier
     * @param {number} effectConfig.duration Duration in seconds
     * @param {string} [effectConfig.stackMode="replace"] 'replace'|'duration_stack'|'intensity_stack'|'independent'
     * @param {number} [effectConfig.maxStacks=5] Max stacks allowed for intensity_stack
     * @param {number} [effectConfig.maxDuration=60] Max duration for duration_stack
     * @param {number} [effectConfig.intensity=1] Initial intensity/multiplier
     * @param {Object} [effectConfig.modifiers={}] Stat multipliers or deltas
     * @param {number} [effectConfig.tickInterval=0] Periodic interval in seconds (0 = no periodic tick)
     * @param {Function} [effectConfig.onTick] Callback on periodic tick: (effect, target) => void
     * @param {string} [effectConfig.category="neutral"] 'buff'|'debuff'|'neutral'
     * @param {Array<string>} [effectConfig.tags=[]] Categorical tags (e.g. ['poison', 'curse'])
     * @returns {Object} The active effect record
     */
    applyEffect(effectConfig) {
        if (!effectConfig || typeof effectConfig !== "object") throw new TypeError("effectConfig must be an object");
        const name = nonEmptyString(effectConfig.name, "effectConfig.name");
        const duration = finiteNumber(effectConfig.duration, "effectConfig.duration", 0.001);
        const stackMode = effectConfig.stackMode ?? "replace";
        const maxStacks = effectConfig.maxStacks ?? 5;
        const maxDuration = effectConfig.maxDuration ?? 60;
        const intensity = effectConfig.intensity ?? 1;
        const modifiers = { ...(effectConfig.modifiers ?? {}) };
        const tickInterval = effectConfig.tickInterval ?? 0;
        const onTick = typeof effectConfig.onTick === "function" ? effectConfig.onTick : null;
        const category = effectConfig.category ?? "neutral";
        const tags = Array.isArray(effectConfig.tags) ? [...effectConfig.tags] : [];

        let record;
        const existing = this.effects.find(e => e.name === name);

        if (existing && stackMode !== "independent") {
            if (stackMode === "replace") {
                existing.duration = duration;
                existing.maxDuration = Math.max(existing.maxDuration, duration);
                existing.intensity = intensity;
                existing.modifiers = modifiers;
                existing.tickTimer = 0;
                record = existing;
                this._emit({ type: "refreshed", effect: record, stackMode });
            } else if (stackMode === "duration_stack") {
                existing.duration = Math.min(maxDuration, existing.duration + duration);
                existing.modifiers = modifiers;
                record = existing;
                this._emit({ type: "refreshed", effect: record, stackMode });
            } else if (stackMode === "intensity_stack") {
                existing.stacks = Math.min(maxStacks, (existing.stacks ?? 1) + 1);
                existing.duration = duration; // Refresh duration on new stack
                existing.modifiers = modifiers;
                record = existing;
                this._emit({ type: "stacked", effect: record, stacks: existing.stacks });
            }
        } else {
            record = {
                id: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name,
                duration,
                maxDuration: Math.max(duration, maxDuration),
                stackMode,
                stacks: 1,
                maxStacks,
                intensity,
                modifiers,
                tickInterval,
                tickTimer: 0,
                onTick,
                category,
                tags
            };
            this.effects.push(record);
            this._emit({ type: "applied", effect: record });
        }

        return record;
    }

    /**
     * Advance elapsed time for active effects.
     * When paused, timers do not decrement and no periodic ticks fire.
     * @param {number} deltaTime
     * @param {Object} [options]
     * @param {boolean} [options.paused=false]
     */
    update(deltaTime, { paused = false } = {}) {
        finiteNumber(deltaTime, "deltaTime", 0);
        if (this._isPaused || paused || deltaTime === 0) return;

        const remaining = [];
        for (const effect of this.effects) {
            effect.duration -= deltaTime;

            // Handle periodic ticks
            if (effect.tickInterval > 0) {
                effect.tickTimer += deltaTime;
                while (effect.tickTimer >= effect.tickInterval) {
                    effect.tickTimer -= effect.tickInterval;
                    if (effect.onTick) {
                        effect.onTick(effect, this.target);
                    }
                    this._emit({ type: "ticked", effect, target: this.target });
                }
            }

            if (effect.duration > 0) {
                remaining.push(effect);
            } else {
                this._emit({ type: "expired", effect });
            }
        }

        this.effects = remaining;
    }

    /**
     * Remove all effects matching a tag or category.
     * @param {string} tagOrCategory E.g. 'poison', 'debuff', 'buff'
     * @returns {number} Count of removed effects
     */
    cleanse(tagOrCategory) {
        nonEmptyString(tagOrCategory, "tagOrCategory");
        const before = this.effects.length;
        const retained = [];
        for (const effect of this.effects) {
            const matches = effect.category === tagOrCategory || effect.tags.includes(tagOrCategory) || effect.name === tagOrCategory;
            if (matches) {
                this._emit({ type: "cleansed", effect });
            } else {
                retained.push(effect);
            }
        }
        this.effects = retained;
        return before - retained.length;
    }

    /**
     * Clear all active status effects unconditionally.
     */
    clearAll() {
        for (const effect of this.effects) {
            this._emit({ type: "cleansed", effect });
        }
        this.effects = [];
    }

    /**
     * Calculate compound stat multiplier across all active status effects.
     * For intensity_stack effects, multiplier applies per stack: 1 + (mod - 1) * stacks.
     * @param {string} stat Name of stat
     * @param {number} [baseValue=1]
     * @returns {number}
     */
    getModifiedStat(stat, baseValue = 1) {
        let value = baseValue;
        for (const effect of this.effects) {
            if (Object.hasOwn(effect.modifiers, stat)) {
                const multiplier = effect.modifiers[stat];
                if (effect.stackMode === "intensity_stack" && effect.stacks > 1) {
                    const delta = multiplier - 1;
                    value *= (1 + (delta * effect.stacks));
                } else {
                    value *= multiplier;
                }
            }
        }
        return value;
    }

    /**
     * Check if a status effect is active by name.
     * @param {string} name
     * @returns {boolean}
     */
    hasEffect(name) {
        return this.effects.some(e => e.name === name);
    }

    /**
     * Get effect record by name.
     * @param {string} name
     * @returns {Object|null}
     */
    getEffect(name) {
        return this.effects.find(e => e.name === name) ?? null;
    }

    toJSON() {
        return {
            effects: this.effects.map(e => ({
                name: e.name,
                duration: e.duration,
                maxDuration: e.maxDuration,
                stackMode: e.stackMode,
                stacks: e.stacks,
                maxStacks: e.maxStacks,
                intensity: e.intensity,
                modifiers: { ...e.modifiers },
                tickInterval: e.tickInterval,
                category: e.category,
                tags: [...e.tags]
            })),
            isPaused: this._isPaused
        };
    }

    static fromJSON(data) {
        const manager = new StatusEffectManager();
        if (data && Array.isArray(data.effects)) {
            for (const item of data.effects) {
                manager.applyEffect(item);
            }
        }
        if (data && typeof data.isPaused === "boolean") {
            manager.setPaused(data.isPaused);
        }
        return manager;
    }
}

/**
 * Handles death, retry cycles, checkpoint restoration, and progression penalties.
 */
export class DeathRetryManager extends Component {
    /**
     * @param {Object} [config]
     * @param {Object} [config.target] Player combatant/entity
     * @param {LevelProgression} [config.progression] Progression system
     * @param {StatusEffectManager} [config.statusManager] Status effect manager
     * @param {number} [config.experienceLossRatio=0.1] Ratio of unspent experience lost on death (0.0 to 1.0)
     */
    constructor({
        target = null,
        progression = null,
        statusManager = null,
        experienceLossRatio = 0.1
    } = {}) {
        super();
        this.target = target;
        this.progression = progression;
        this.statusManager = statusManager;
        this.experienceLossRatio = Math.max(0, Math.min(1, experienceLossRatio));
        this.checkpoint = null;
        this.deathCount = 0;
        this.retryCount = 0;
        this.isDead = false;
        this.listeners = new Set();
    }

    onDeathRetryEvent(listener) {
        if (typeof listener !== "function") throw new TypeError("Listener must be a function");
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    _emit(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    /**
     * Save current game state as the active checkpoint.
     * @param {Object} [metadata={}] Optional scene, position, or flag data
     * @returns {Object} Checkpoint snapshot
     */
    recordCheckpoint(metadata = {}) {
        this.checkpoint = {
            timestamp: Date.now(),
            progression: this.progression ? this.progression.toJSON() : null,
            targetHealth: this.target?.health ?? null,
            targetMaxHealth: this.target?.maxHealth ?? null,
            metadata: { ...metadata }
        };
        this._emit({ type: "checkpoint-saved", checkpoint: this.checkpoint });
        return this.checkpoint;
    }

    /**
     * Process actor death: cleanses temporary buffs/debuffs, applies experience penalty.
     * @returns {Object} Death summary
     */
    handleDeath() {
        this.isDead = true;
        this.deathCount += 1;

        let expLost = 0;
        if (this.progression && this.experienceLossRatio > 0) {
            expLost = Math.floor(this.progression.experience * this.experienceLossRatio);
            this.progression.experience = Math.max(0, this.progression.experience - expLost);
        }

        // Cleanse temporary effects on death so dead actor doesn't keep ticking buffs
        if (this.statusManager) {
            this.statusManager.clearAll();
        }

        const summary = {
            deathCount: this.deathCount,
            experienceLost: expLost,
            remainingExperience: this.progression?.experience ?? 0,
            hasCheckpoint: this.checkpoint !== null
        };

        this._emit({ type: "death", ...summary });
        return summary;
    }

    /**
     * Retry from last checkpoint. Restores health, resets dead status, and applies checkpoint progression.
     * Can be invoked repeatedly across multiple death cycles without state corruption.
     * @returns {Object} Retry result
     */
    retry() {
        if (!this.checkpoint) {
            // Fallback retry without checkpoint: restore target health to max
            this.isDead = false;
            this.retryCount += 1;
            if (this.target) {
                if (typeof this.target.maxHealth === "number") {
                    this.target.health = this.target.maxHealth;
                }
                if (typeof this.target.isAlive === "boolean") {
                    this.target.isAlive = true;
                }
            }
            if (this.statusManager) {
                this.statusManager.clearAll();
            }
            const fallbackResult = {
                retryCount: this.retryCount,
                restoredFromCheckpoint: false,
                currentHealth: this.target?.health ?? 0
            };
            this._emit({ type: "retry", ...fallbackResult });
            return fallbackResult;
        }

        this.isDead = false;
        this.retryCount += 1;

        // Restore target health
        if (this.target) {
            const maxHp = this.checkpoint.targetMaxHealth ?? this.target.maxHealth ?? 100;
            this.target.maxHealth = maxHp;
            this.target.health = maxHp;
            if (typeof this.target.isAlive === "boolean") {
                this.target.isAlive = true;
            }
        }

        // Clear any leftover status effects
        if (this.statusManager) {
            this.statusManager.clearAll();
        }

        const result = {
            retryCount: this.retryCount,
            restoredFromCheckpoint: true,
            checkpoint: this.checkpoint,
            currentHealth: this.target?.health ?? 0
        };

        this._emit({ type: "retry", ...result });
        return result;
    }

    toJSON() {
        return {
            deathCount: this.deathCount,
            retryCount: this.retryCount,
            isDead: this.isDead,
            experienceLossRatio: this.experienceLossRatio,
            checkpoint: this.checkpoint ? structuredClone(this.checkpoint) : null
        };
    }

    static fromJSON(data, { target = null, progression = null, statusManager = null } = {}) {
        const manager = new DeathRetryManager({
            target,
            progression,
            statusManager,
            experienceLossRatio: data.experienceLossRatio ?? 0.1
        });
        manager.deathCount = data.deathCount ?? 0;
        manager.retryCount = data.retryCount ?? 0;
        manager.isDead = Boolean(data.isDead);
        manager.checkpoint = data.checkpoint ? structuredClone(data.checkpoint) : null;
        return manager;
    }
}
