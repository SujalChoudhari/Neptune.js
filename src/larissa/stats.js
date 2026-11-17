import { Component } from "../components/component.js";

/**
 * Stats component for RPG character statistics.
 * Includes health, stamina, and stat modifiers.
 * @class Stats
 * @extends Component
 */
export class Stats extends Component {
    constructor(config = {}) {
        super();

        // Base stats
        this._maxHealth = config.maxHealth ?? 100;
        this._health = config.health ?? this._maxHealth;
        this._combatant = null;
        this._unsubscribeCombatant = null;
        this.maxStamina = config.maxStamina ?? 100;
        this.stamina = this.maxStamina;

        // Combat stats
        this.attack = config.attack ?? 10;
        this.defense = config.defense ?? 5;
        this.speed = config.speed ?? 100;

        // Status effects
        this.effects = []; // { name, duration, modifier }

        // Events
        this.onDeath = null;
        this.onDamage = null;
        this.onHeal = null;
    }

    /** Maximum health mirrors Combatant while explicitly bound; standalone Stats retains legacy ownership. */
    get maxHealth() { return this._combatant?.maxHealth ?? this._maxHealth; }
    set maxHealth(value) {
        if (this._combatant) {
            if (!Number.isFinite(value) || value <= 0) throw new TypeError("maxHealth must be a positive finite number");
            this._combatant.maxHealth = value;
            this._combatant.setHealth(Math.min(this._combatant.health, value));
        } else this._maxHealth = value;
    }

    /** Health reads the authoritative Combatant after binding and writes through its validated health path. */
    get health() { return this._combatant?.health ?? this._health; }
    set health(value) {
        if (this._combatant) this._combatant.setHealth(value);
        else this._health = value;
    }

    /** Bind this legacy stat component to the authoritative Combatant health state. */
    bindCombatant(combatant) {
        if (!combatant || typeof combatant.setHealth !== "function" || typeof combatant.receiveDamage !== "function" || !Number.isFinite(combatant.health)) {
            throw new TypeError("Stats.bindCombatant requires a Combatant-compatible instance");
        }
        this.unbindCombatant();
        this._health = combatant.health;
        this._maxHealth = combatant.maxHealth;
        this._combatant = combatant;
        this._unsubscribeCombatant = combatant.onHealthChanged?.(({ type, amount, killed }) => {
            if (type === "destroy") { this.unbindCombatant(); return; }
            if (type === "damage" && amount > 0) this.onDamage?.(amount);
            if (type === "heal" && amount > 0) this.onHeal?.(amount);
            if (killed) this.onDeath?.();
        }) ?? null;
        return this;
    }

    /** Stop mirroring a Combatant, retaining the last authoritative health value. */
    unbindCombatant() {
        if (!this._combatant) return false;
        this._health = this._combatant.health;
        this._maxHealth = this._combatant.maxHealth;
        this._unsubscribeCombatant?.();
        this._unsubscribeCombatant = null;
        this._combatant = null;
        return true;
    }

    /**
     * Take damage (reduced by defense).
     * @param {number} amount - Raw damage amount.
     * @returns {number} Actual damage taken.
     */
    takeDamage(amount) {
        if (this._combatant) {
            const effectiveDefense = this.getModifiedStat('defense');
            const result = this._combatant.receiveDamage({ amount: Math.max(1, amount - effectiveDefense), type: "physical" });
            return result.damage;
        }
        const effectiveDefense = this.getModifiedStat('defense');
        const actualDamage = Math.max(1, amount - effectiveDefense);
        this.health = Math.max(0, this.health - actualDamage);

        if (this.onDamage) this.onDamage(actualDamage);
        if (this.health <= 0 && this.onDeath) this.onDeath();

        return actualDamage;
    }

    /**
     * Heal health.
     * @param {number} amount 
     */
    heal(amount) {
        if (this._combatant) return this._combatant.heal(amount);
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        if (this.onHeal) this.onHeal(this.health - oldHealth);
    }

    /**
     * Use stamina.
     * @param {number} amount 
     * @returns {boolean} True if had enough stamina.
     */
    useStamina(amount) {
        if (this.stamina >= amount) {
            this.stamina -= amount;
            return true;
        }
        return false;
    }

    /**
     * Regenerate stamina.
     * @param {number} amount 
     */
    regenStamina(amount) {
        this.stamina = Math.min(this.maxStamina, this.stamina + amount);
    }

    /**
     * Apply a status effect.
     * @param {string} name 
     * @param {number} duration - Duration in seconds.
     * @param {Object} modifier - { stat: multiplier }
     */
    applyEffect(name, duration, modifier) {
        this.effects.push({ name, duration, modifier });
    }

    /**
     * Update status effects.
     * @param {number} deltaTime 
     */
    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].duration -= deltaTime;
            if (this.effects[i].duration <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }

    /**
     * Get stat with modifiers applied.
     * @param {string} statName 
     * @returns {number}
     */
    getModifiedStat(statName) {
        let base = this[statName] ?? 0;
        let multiplier = 1;

        for (const effect of this.effects) {
            if (effect.modifier[statName]) {
                multiplier *= effect.modifier[statName];
            }
        }

        return base * multiplier;
    }

    /**
     * Check if alive.
     */
    get isAlive() {
        return this.health > 0;
    }

    destroy() {
        this.unbindCombatant();
        super.destroy();
    }
}
