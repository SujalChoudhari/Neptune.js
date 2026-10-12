import { Component } from "../components/component.js";

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
        this.phases.push({ threshold: healthThreshold, patterns });
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
        const newPhaseIndex = this.phases.findIndex(p => healthPercent <= p.threshold);
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
        if (pattern) {
            pattern(this, this.target);
            if (this.onAttack) this.onAttack(this.currentPattern);
        }

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
