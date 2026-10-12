/**
 * Cutscene represents a sequence of scripted events.
 * @class Cutscene
 */
export class Cutscene {
    /**
     * @param {string} name - Cutscene name.
     */
    constructor(name) {
        this.name = name;
        this.steps = []; // Array of step functions
        this.currentStep = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.stepTimer = 0;
        this.waitTime = 0;

        this.onComplete = null;
        this.onStepChange = null;
    }

    /**
     * Add a step to the cutscene.
     * @param {Function} stepFn - Function to execute (receives context, can return wait time).
     * @returns {Cutscene}
     */
    addStep(stepFn) {
        this.steps.push(stepFn);
        return this;
    }

    /**
     * Add a wait step.
     * @param {number} duration - Wait time in seconds.
     * @returns {Cutscene}
     */
    wait(duration) {
        this.steps.push(() => duration);
        return this;
    }

    /**
     * Start the cutscene.
     * @param {Object} context - Context object passed to step functions.
     */
    play(context = {}) {
        this.currentStep = 0;
        this.isPlaying = true;
        this.isPaused = false;
        this.context = context;
        this._executeStep();
    }

    /**
     * Pause the cutscene.
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume the cutscene.
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * Skip to end of cutscene.
     */
    skip() {
        this.isPlaying = false;
        this.currentStep = this.steps.length;
        if (this.onComplete) this.onComplete();
    }

    /**
     * Execute current step.
     * @private
     */
    _executeStep() {
        if (this.currentStep >= this.steps.length) {
            this.isPlaying = false;
            if (this.onComplete) this.onComplete();
            return;
        }

        const step = this.steps[this.currentStep];
        const result = step(this.context);

        if (this.onStepChange) this.onStepChange(this.currentStep);

        if (typeof result === 'number' && result > 0) {
            this.waitTime = result;
        } else {
            this.waitTime = 0;
        }
    }

    /**
     * Advance to next step manually.
     */
    nextStep() {
        if (!this.isPlaying) return;
        this.currentStep++;
        this.waitTime = 0;
        this._executeStep();
    }

    /**
     * Update the cutscene.
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        if (!this.isPlaying || this.isPaused) return;

        if (this.waitTime > 0) {
            this.waitTime -= deltaTime;
            if (this.waitTime <= 0) {
                this.currentStep++;
                this._executeStep();
            }
        }
    }
}
