import { Transform } from "../components/transform.js";

/**
 * Cutscene represents a sequence of scripted events.
 * Supports declarative move, dialogue, camera, animation, wait, and event steps,
 * with safe cancellation and ownership cleanup.
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
        this.context = {};

        this.onComplete = null;
        this.onCancel = null;
        this.onStepChange = null;
    }

    /**
     * Add a step to the cutscene.
     * @param {Function} stepFn - Function to execute (receives context, can return wait time or step runner).
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

    addWaitStep(duration) {
        return this.wait(duration);
    }

    /**
     * Add an actor movement step that moves an entity toward target coordinates.
     * If the actor is destroyed mid-move, the step safely completes immediately.
     */
    addMoveStep(actor, targetPosition, { speed = 4, tolerance = 0.05 } = {}) {
        let activeActor = actor;
        this.steps.push((ctx) => {
            const targetActor = activeActor || ctx.actor;
            if (!targetActor || targetActor._destroyed) return 0;
            const transform = targetActor.GetComponent?.(Transform);
            if (!transform) return 0;

            const dx = targetPosition.x - transform.position.x;
            const dy = targetPosition.y - transform.position.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= tolerance) return 0;

            return (dt) => {
                if (!targetActor || targetActor._destroyed) return true;
                const curTransform = targetActor.GetComponent?.(Transform);
                if (!curTransform) return true;

                const curDx = targetPosition.x - curTransform.position.x;
                const curDy = targetPosition.y - curTransform.position.y;
                const curDist = Math.hypot(curDx, curDy);
                if (curDist <= tolerance) {
                    curTransform.position.x = targetPosition.x;
                    curTransform.position.y = targetPosition.y;
                    return true; // Completed
                }

                const moveDist = Math.min(curDist, speed * dt);
                curTransform.position.x += (curDx / curDist) * moveDist;
                curTransform.position.y += (curDy / curDist) * moveDist;
                return Math.hypot(targetPosition.x - curTransform.position.x, targetPosition.y - curTransform.position.y) <= tolerance;
            };
        });
        return this;
    }

    /**
     * Add a camera pan step toward target coordinates.
     */
    addCameraStep(camera, targetPosition, { duration = 1.0 } = {}) {
        this.steps.push(() => {
            if (!camera) return 0;
            const startX = camera.position?.x ?? 0;
            const startY = camera.position?.y ?? 0;
            let elapsed = 0;

            return (dt) => {
                elapsed += dt;
                const t = Math.min(1.0, elapsed / duration);
                if (camera.position) {
                    camera.position.x = startX + (targetPosition.x - startX) * t;
                    camera.position.y = startY + (targetPosition.y - startY) * t;
                }
                return t >= 1.0;
            };
        });
        return this;
    }

    /**
     * Add an animation trigger step.
     */
    addAnimationStep(actor, clipName) {
        this.steps.push((ctx) => {
            const target = actor || ctx.actor;
            if (target && !target._destroyed) {
                target.animator?.play?.(clipName);
                ctx.lastAnimation = clipName;
            }
            return 0;
        });
        return this;
    }

    /**
     * Add an event emission step.
     */
    addEventStep(bus, eventName, payload = {}) {
        this.steps.push(() => {
            bus?.emit?.(eventName, payload);
            return 0;
        });
        return this;
    }

    /**
     * Add a dialogue display step.
     */
    addDialogueStep(dialogueData, { duration = 2.0 } = {}) {
        this.steps.push((ctx) => {
            ctx.currentDialogue = dialogueData;
            return duration;
        });
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
        this._activeStepRunner = null;
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
        this._activeStepRunner = null;
        if (this.onComplete) this.onComplete(this.context);
    }

    /**
     * Immediately cancel cutscene and trigger cancellation callbacks.
     */
    cancel() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this._activeStepRunner = null;
        if (this.onCancel) this.onCancel(this.context);
    }

    /**
     * Execute current step.
     * @private
     */
    _executeStep() {
        if (this.currentStep >= this.steps.length) {
            this.isPlaying = false;
            this._activeStepRunner = null;
            if (this.onComplete) this.onComplete(this.context);
            return;
        }

        const step = this.steps[this.currentStep];
        const result = step(this.context);

        if (this.onStepChange) this.onStepChange(this.currentStep);

        if (typeof result === "function") {
            this._activeStepRunner = result;
            this.waitTime = 0;
        } else if (typeof result === "number" && result > 0) {
            this.waitTime = result;
            this._activeStepRunner = null;
        } else {
            this.waitTime = 0;
            this._activeStepRunner = null;
        }
    }

    /**
     * Advance to next step or complete cutscene.
     * @private
     */
    _advance() {
        this.currentStep++;
        while (this.isPlaying && this.currentStep < this.steps.length) {
            this._executeStep();
            if (!this._activeStepRunner && this.waitTime <= 0) {
                this.currentStep++;
            } else {
                break;
            }
        }
        if (this.currentStep >= this.steps.length) {
            this.isPlaying = false;
            this._activeStepRunner = null;
            if (this.onComplete) this.onComplete(this.context);
        }
    }

    /**
     * Advance to next step manually.
     */
    nextStep() {
        if (!this.isPlaying) return;
        this.waitTime = 0;
        this._activeStepRunner = null;
        this._advance();
    }

    /**
     * Update the cutscene.
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        if (!this.isPlaying || this.isPaused) return;

        if (this._activeStepRunner) {
            const isFinished = this._activeStepRunner(deltaTime);
            if (isFinished) {
                this._activeStepRunner = null;
                this._advance();
            }
        } else if (this.waitTime > 0) {
            this.waitTime -= deltaTime;
            if (this.waitTime <= 0) {
                this.waitTime = 0;
                this._advance();
            }
        }
    }
}
