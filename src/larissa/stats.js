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
        this.maxHealth = config.maxHealth ?? 100;
        this.health = this.maxHealth;
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

    /**
     * Take damage (reduced by defense).
     * @param {number} amount - Raw damage amount.
     * @returns {number} Actual damage taken.
     */
    takeDamage(amount) {
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
}
