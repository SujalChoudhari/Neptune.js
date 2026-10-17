import { Component } from "../components/component.js";
import { AttackDefinition, CombatSystem, Combatant } from "./combat.js";

/**
 * BossAI component for boss encounter behaviors.
 * Uses state machine for phase-based attacks.
 * @class BossAI
 * @extends Component
 */
export class BossAI extends Component {
    constructor() {
        super();

        this.phases = []; // { threshold: healthPercent, patterns: [PatternFunc] }
        this.currentPhase = 0;
        this.currentPattern = 0;
        this.patternTimer = 0;
        this.patternDuration = 2;

        this.target = null;
        this.state = 'idle'; // idle, attacking, stunned, transitioning
        this.stateTimer = 0;

        // Callbacks
        this.onPhaseChange = null;
        this.onAttack = null;
    }

    /**
     * Add a phase.
     * @param {number} healthThreshold - Health percent to trigger (1.0 = 100%).
     * @param {Function[]} patterns - Array of attack pattern functions.
     */
    addPhase(healthThreshold, patterns) {
        if (!Number.isFinite(healthThreshold) || healthThreshold < 0 || healthThreshold > 1) throw new TypeError("Boss phase threshold must be between zero and one");
        if (!Array.isArray(patterns) || patterns.some(pattern => typeof pattern !== "function")) throw new TypeError("Boss phase patterns must be an array of functions");
        this.phases.push({ threshold: healthThreshold, patterns });
        this.phases.sort((a, b) => b.threshold - a.threshold);
    }

    /** Add a phase that selects among data-driven attacks through a CombatSystem. */
    addAttackPhase(healthThreshold, attacks, combatSystem, combatant) {
        if (!Number.isFinite(healthThreshold) || healthThreshold < 0 || healthThreshold > 1) throw new TypeError("Boss phase threshold must be between zero and one");
        if (!Array.isArray(attacks) || attacks.some(attack => !(attack instanceof AttackDefinition))) throw new TypeError("Boss attacks must be an array of AttackDefinition instances");
        if (!(combatSystem instanceof CombatSystem) || !(combatant instanceof Combatant)) throw new TypeError("Boss attack phases require a CombatSystem and Combatant");
        this.phases.push({ threshold: healthThreshold, patterns: attacks, combatSystem, combatant });
        this.phases.sort((a, b) => b.threshold - a.threshold);
    }

    /**
     * Set the target to attack.
     * @param {Entity} target 
     */
    setTarget(target) {
        this.target = target;
    }

    /**
     * Update AI behavior.
     * @param {number} deltaTime 
     * @param {Stats} stats - Boss stats component.
     */
    update(deltaTime, stats) {
        if (!stats || !stats.isAlive) {
            this.state = 'idle';
            return;
        }

        const healthPercent = stats.health / stats.maxHealth;

        // Check for phase transition
        // Phases are sorted from highest to lowest threshold; select the deepest reached phase.
        const newPhaseIndex = this.phases.findLastIndex(p => healthPercent <= p.threshold);
        if (newPhaseIndex !== -1 && newPhaseIndex > this.currentPhase) {
            this.currentPhase = newPhaseIndex;
            this.currentPattern = 0;
            this.state = 'transitioning';
            this.stateTimer = 1.0; // Transition time
            if (this.onPhaseChange) this.onPhaseChange(this.currentPhase);
            return;
        }

        // Handle state
        switch (this.state) {
            case 'transitioning':
                this.stateTimer -= deltaTime;
                if (this.stateTimer <= 0) {
                    this.state = 'attacking';
                    this.patternTimer = 0;
                }
                break;

            case 'stunned':
                this.stateTimer -= deltaTime;
                if (this.stateTimer <= 0) {
                    this.state = 'attacking';
                }
                break;

            case 'attacking':
                this.patternTimer -= deltaTime;
                if (this.patternTimer <= 0) {
                    this._executePattern();
                    this.patternTimer = this.patternDuration;
                }
                break;

            case 'idle':
            default:
                if (this.target) {
                    this.state = 'attacking';
                }
                break;
        }
    }

    /**
     * Execute current attack pattern.
     * @private
     */
    _executePattern() {
        if (this.phases.length === 0) return;

        const phase = this.phases[this.currentPhase];
        if (!phase || phase.patterns.length === 0) return;

        const pattern = phase.patterns[this.currentPattern];
        let started = false;
        if (typeof pattern === "function") {
            pattern(this, this.target);
            started = true;
        } else if (pattern instanceof AttackDefinition && phase.combatSystem && phase.combatant) {
            const targetPosition = this.target instanceof Combatant ? this.target.position : null;
            const aim = targetPosition
                ? { x: targetPosition.x - phase.combatant.position.x, y: targetPosition.y - phase.combatant.position.y }
                : { x: 1, y: 0 };
            started = phase.combatSystem.startAttack(phase.combatant, pattern, aim);
        }
        if (started && this.onAttack) this.onAttack(this.currentPattern);

        this.currentPattern = (this.currentPattern + 1) % phase.patterns.length;
    }

    /**
     * Stun the boss temporarily.
     * @param {number} duration 
     */
    stun(duration) {
        this.state = 'stunned';
        this.stateTimer = duration;
    }
}
