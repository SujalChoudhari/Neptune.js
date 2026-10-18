import { Component } from "../components/component.js";
import { Rig } from "./rig.js";

/**
 * Animator component plays animations on a Rig.
 * Handles animation playback, transitions, and timing.
 * @class Animator
 * @extends Component
 */
export class Animator extends Component {
    constructor() {
        super();
        this.animations = {}; // { name: Animation }
        this.currentAnimation = null;
        this.currentTime = 0;
        this.speed = 1.0;
        this.playing = false;
        this._rig = null;
        this._gameplayEventUnsubscribers = [];
    }

    /**
     * Bind gameplay events to animation names. The event source must expose
     * on(eventName, listener), returning an unsubscribe function (or provide
     * off(eventName, listener)). Mapping values may be animation names or
     * functions that return an animation name for the event payload.
     * Existing bindings are replaced when this method is called again.
     * @param {Object} eventSource - Event emitter with on(event, listener).
     * @param {Object<string, string|Function>} eventMap - Event-to-animation mapping.
     * @returns {Animator} This animator (for chaining).
     */
    bindGameplayEvents(eventSource, eventMap) {
        if (!eventSource || typeof eventSource.on !== "function") {
            throw new TypeError("Animator.bindGameplayEvents requires an event source with on(event, listener)");
        }
        if (!eventMap || typeof eventMap !== "object" || Array.isArray(eventMap)) {
            throw new TypeError("Animator.bindGameplayEvents requires an event mapping object");
        }
        this.unbindGameplayEvents();
        for (const [eventName, resolveAnimation] of Object.entries(eventMap)) {
            if (typeof resolveAnimation !== "string" && typeof resolveAnimation !== "function") {
                throw new TypeError(`Animation mapping for event \\"${eventName}\\" must be a name or function`);
            }
            const listener = (event) => {
                const animationName = typeof resolveAnimation === "function"
                    ? resolveAnimation(event)
                    : resolveAnimation;
                if (typeof animationName === "string" && animationName) this.play(animationName);
            };
            const unsubscribe = eventSource.on(eventName, listener);
            this._gameplayEventUnsubscribers.push(typeof unsubscribe === "function"
                ? unsubscribe
                : () => eventSource.off?.(eventName, listener));
        }
        return this;
    }

    /** Remove all gameplay event bindings. */
    unbindGameplayEvents() {
        for (const unsubscribe of this._gameplayEventUnsubscribers) unsubscribe();
        this._gameplayEventUnsubscribers = [];
        return this;
    }

    /**
     * Add an animation to the animator.
     * @param {Animation} animation - The animation to add.
     * @returns {Animator} This animator (for chaining).
     */
    addAnimation(animation) {
        this.animations[animation.name] = animation;
        return this;
    }

    /**
     * Get an animation by name.
     * @param {string} name - Animation name.
     * @returns {Animation|null}
     */
    getAnimation(name) {
        return this.animations[name] || null;
    }

    /**
     * Play an animation by name.
     * @param {string} name - Animation name.
     * @param {boolean} restart - Whether to restart if already playing this animation.
     */
    play(name, restart = false) {
        const anim = this.getAnimation(name);
        if (!anim) {
            console.warn(`Animation "${name}" not found`);
            return;
        }

        if (this.currentAnimation === anim && !restart) {
            this.playing = true;
            return;
        }

        this.currentAnimation = anim;
        this.currentTime = 0;
        this.playing = true;
    }

    /**
     * Stop the current animation.
     */
    stop() {
        this.playing = false;
    }

    /**
     * Pause the current animation.
     */
    pause() {
        this.playing = false;
    }

    /**
     * Resume a paused animation.
     */
    resume() {
        this.playing = true;
    }

    /**
     * Update the animator. Should be called each frame.
     * @param {number} deltaTime - Time since last frame in seconds.
     */
    update(deltaTime) {
        if (!this.playing || !this.currentAnimation) return;

        // Get rig if not cached
        if (!this._rig && this.entity) {
            this._rig = this.entity.GetComponent(Rig);
        }

        if (!this._rig) return;

        // Advance time
        this.currentTime += deltaTime * this.speed;

        // Get pose at current time
        const pose = this.currentAnimation.getPoseAtTime(this.currentTime);

        // Apply pose to rig
        this._rig.applyPose(pose);

        // Check if animation ended (non-looping)
        if (!this.currentAnimation.loop && this.currentTime >= this.currentAnimation.duration) {
            this.playing = false;
        }
    }

    /**
     * Check if currently playing a specific animation.
     * @param {string} name - Animation name.
     * @returns {boolean}
     */
    isPlaying(name) {
        return this.playing && this.currentAnimation && this.currentAnimation.name === name;
    }
}
