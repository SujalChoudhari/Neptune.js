const finitePositive = (value, name) => {
    if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${name} must be a positive finite number`);
};

/** Bounded fixed-step accumulator for stable simulation updates across render rates. */
export class FixedStepper {
    constructor({ step = 1 / 60, maxSteps = 5, maxFrameDelta = 0.25, timeScale = 1, paused = false } = {}) {
        finitePositive(step, "step");
        finitePositive(maxFrameDelta, "maxFrameDelta");
        if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new TypeError("maxSteps must be a positive integer");
        if (!Number.isFinite(timeScale) || timeScale < 0) throw new TypeError("timeScale must be a non-negative finite number");
        this.step = step;
        this.maxSteps = maxSteps;
        this.maxFrameDelta = maxFrameDelta;
        this.timeScale = timeScale;
        this.paused = Boolean(paused);
        this.accumulator = 0;
        this.droppedTime = 0;
    }

    get interpolationAlpha() { return this.accumulator / this.step; }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
    }

    setTimeScale(scale) {
        if (!Number.isFinite(scale) || scale < 0) throw new TypeError("timeScale must be a non-negative finite number");
        this.timeScale = scale;
    }

    advance(frameDelta, update) {
        if (!Number.isFinite(frameDelta) || frameDelta < 0) throw new TypeError("frameDelta must be finite and non-negative");
        if (typeof update !== "function") throw new TypeError("advance requires an update callback");
        if (this.paused || this.timeScale === 0) return 0;

        const scaledDelta = frameDelta * this.timeScale;
        const accepted = Math.min(scaledDelta, this.maxFrameDelta);
        this.droppedTime += scaledDelta - accepted;
        this.accumulator += accepted;
        let steps = 0;
        while (this.accumulator + Number.EPSILON >= this.step && steps < this.maxSteps) {
            this.accumulator = Math.max(0, this.accumulator - this.step);
            update(this.step);
            steps++;
        }
        if (this.accumulator >= this.step) {
            const keptRemainder = this.accumulator % this.step;
            this.droppedTime += this.accumulator - keptRemainder;
            this.accumulator = keptRemainder;
        }
        return steps;
    }

    reset() { this.accumulator = 0; }
}
