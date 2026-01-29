/**
 * Triton Editor - Animation Editor
 * Manages animation creation, timeline, keyframes, and playback
 */

/**
 * Keyframe interpolation types
 */
const INTERPOLATION = {
    LINEAR: 'linear',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    STEP: 'step'
};

/**
 * AnimationEditor - Manages animation editing operations
 */
export class AnimationEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentAnimation = null;
        this.currentRig = null;
        this.currentTime = 0;
        this.isPlaying = false;
        this.playbackSpeed = 1;
        this.lastFrameTime = 0;
    }

    /**
     * Initialize the animation editor
     */
    init() {
        // Subscribe to rig changes
        this.editor.events.on('rig:loaded', ({ rig }) => {
            this.currentRig = rig;
            this.loadFirstAnimation();
        });

        // Subscribe to animation events
        this.editor.state.subscribe('currentAnimation', (anim) => {
            this.currentAnimation = anim;
            this.currentTime = 0;
        });

        // Playback loop
        this.startPlaybackLoop();
    }

    /**
     * Start the animation playback loop
     */
    startPlaybackLoop() {
        const loop = (timestamp) => {
            if (this.isPlaying && this.currentAnimation) {
                const deltaTime = (timestamp - this.lastFrameTime) / 1000;
                this.lastFrameTime = timestamp;

                this.currentTime += deltaTime * this.playbackSpeed;

                // Loop animation
                if (this.currentTime >= this.currentAnimation.duration) {
                    if (this.currentAnimation.loop) {
                        this.currentTime %= this.currentAnimation.duration;
                    } else {
                        this.currentTime = this.currentAnimation.duration;
                        this.pause();
                    }
                }

                this.updatePreview();
                this.editor.events.emit('animation:timeupdate', { time: this.currentTime });
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    /**
     * Load first animation from current rig
     */
    loadFirstAnimation() {
        if (!this.currentRig) return;

        // Look for animator component on selected entity
        const entities = this.editor.state.get('selectedEntities');
        if (!entities || entities.length !== 1) return;

        const entity = entities[0];
        const animator = entity.components?.find(c => c.type === 'Animator');

        if (animator && animator.animations && animator.animations.length > 0) {
            this.loadAnimation(animator.animations[0]);
        }
    }

    /**
     * Load an animation for editing
     */
    loadAnimation(animation) {
        this.currentAnimation = animation;
        this.currentTime = 0;
        this.isPlaying = false;
        this.editor.state.set('currentAnimation', animation);
        this.editor.events.emit('animation:loaded', { animation });
    }

    /**
     * Create a new animation
     */
    createAnimation(name, duration = 1) {
        if (!this.currentRig) {
            this.editor.console.log('error', 'Select a rigged entity first');
            return null;
        }

        const animation = {
            name,
            duration,
            loop: true,
            tracks: {}
        };

        // Create a track for each slot
        for (const slot of this.currentRig.slots) {
            animation.tracks[slot.id] = {
                keyframes: []
            };
        }

        this.loadAnimation(animation);
        this.editor.console.log('info', `Created animation: ${name}`);
        return animation;
    }

    /**
     * Add keyframe at current time
     */
    addKeyframe(slotId, transform = null) {
        if (!this.currentAnimation) return null;

        const track = this.currentAnimation.tracks[slotId];
        if (!track) return null;

        // Get current pose data from rig
        const pose = this.currentRig?.poses?.default;
        const defaultTransform = pose?.[slotId] || {
            offset: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        };

        const keyframe = {
            time: this.currentTime,
            value: transform || { ...defaultTransform },
            interpolation: INTERPOLATION.LINEAR
        };

        // Remove existing keyframe at this time
        const existingIndex = track.keyframes.findIndex(k => k.time === this.currentTime);
        if (existingIndex !== -1) {
            track.keyframes.splice(existingIndex, 1);
        }

        // Insert keyframe in sorted order
        const insertIndex = track.keyframes.findIndex(k => k.time > this.currentTime);
        if (insertIndex === -1) {
            track.keyframes.push(keyframe);
        } else {
            track.keyframes.splice(insertIndex, 0, keyframe);
        }

        this.editor.events.emit('animation:keyframe-added', { slotId, keyframe });
        return keyframe;
    }

    /**
     * Remove keyframe
     */
    removeKeyframe(slotId, time) {
        if (!this.currentAnimation) return;

        const track = this.currentAnimation.tracks[slotId];
        if (!track) return;

        const index = track.keyframes.findIndex(k => k.time === time);
        if (index !== -1) {
            const removed = track.keyframes.splice(index, 1)[0];
            this.editor.events.emit('animation:keyframe-removed', { slotId, keyframe: removed });
        }
    }

    /**
     * Update keyframe value
     */
    updateKeyframe(slotId, time, newValue) {
        if (!this.currentAnimation) return;

        const track = this.currentAnimation.tracks[slotId];
        if (!track) return;

        const keyframe = track.keyframes.find(k => k.time === time);
        if (keyframe) {
            keyframe.value = { ...keyframe.value, ...newValue };
            this.editor.events.emit('animation:keyframe-updated', { slotId, keyframe });
        }
    }

    /**
     * Set keyframe interpolation
     */
    setKeyframeInterpolation(slotId, time, interpolation) {
        if (!this.currentAnimation) return;

        const track = this.currentAnimation.tracks[slotId];
        if (!track) return;

        const keyframe = track.keyframes.find(k => k.time === time);
        if (keyframe) {
            keyframe.interpolation = interpolation;
            this.editor.events.emit('animation:keyframe-updated', { slotId, keyframe });
        }
    }

    /**
     * Get interpolated transform at current time
     */
    getSlotTransformAtTime(slotId, time = this.currentTime) {
        if (!this.currentAnimation) return null;

        const track = this.currentAnimation.tracks[slotId];
        if (!track || track.keyframes.length === 0) return null;

        // Find surrounding keyframes
        let prevKeyframe = null;
        let nextKeyframe = null;

        for (const kf of track.keyframes) {
            if (kf.time <= time) {
                prevKeyframe = kf;
            }
            if (kf.time > time && !nextKeyframe) {
                nextKeyframe = kf;
            }
        }

        // Only previous keyframe exists (or exact match)
        if (!nextKeyframe) {
            return prevKeyframe ? { ...prevKeyframe.value } : null;
        }

        // Only next keyframe exists
        if (!prevKeyframe) {
            return { ...nextKeyframe.value };
        }

        // Interpolate between keyframes
        const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
        return this.interpolateTransform(prevKeyframe.value, nextKeyframe.value, t, prevKeyframe.interpolation);
    }

    /**
     * Interpolate between two transforms
     */
    interpolateTransform(from, to, t, interpolation = INTERPOLATION.LINEAR) {
        // Apply easing
        let easedT = t;
        switch (interpolation) {
            case INTERPOLATION.EASE_IN:
                easedT = t * t;
                break;
            case INTERPOLATION.EASE_OUT:
                easedT = 1 - (1 - t) * (1 - t);
                break;
            case INTERPOLATION.EASE_IN_OUT:
                easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                break;
            case INTERPOLATION.STEP:
                easedT = 0;
                break;
        }

        const lerp = (a, b, t) => a + (b - a) * t;

        return {
            offset: {
                x: lerp(from.offset?.x || 0, to.offset?.x || 0, easedT),
                y: lerp(from.offset?.y || 0, to.offset?.y || 0, easedT)
            },
            rotation: lerp(from.rotation || 0, to.rotation || 0, easedT),
            scale: {
                x: lerp(from.scale?.x || 1, to.scale?.x || 1, easedT),
                y: lerp(from.scale?.y || 1, to.scale?.y || 1, easedT)
            }
        };
    }

    /**
     * Update preview with current animation state
     */
    updatePreview() {
        if (!this.currentAnimation || !this.currentRig) return;

        const previewPose = {};
        for (const slot of this.currentRig.slots) {
            const transform = this.getSlotTransformAtTime(slot.id);
            if (transform) {
                previewPose[slot.id] = transform;
            }
        }

        this.editor.events.emit('animation:preview', { pose: previewPose });
    }

    /**
     * Play animation
     */
    play() {
        if (!this.currentAnimation) return;
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.editor.events.emit('animation:play');
    }

    /**
     * Pause animation
     */
    pause() {
        this.isPlaying = false;
        this.editor.events.emit('animation:pause');
    }

    /**
     * Stop animation (pause and reset to start)
     */
    stop() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.updatePreview();
        this.editor.events.emit('animation:stop');
    }

    /**
     * Seek to specific time
     */
    seek(time) {
        this.currentTime = Math.max(0, Math.min(time, this.currentAnimation?.duration || 0));
        this.updatePreview();
        this.editor.events.emit('animation:timeupdate', { time: this.currentTime });
    }

    /**
     * Set playback speed
     */
    setPlaybackSpeed(speed) {
        this.playbackSpeed = speed;
    }

    /**
     * Set animation duration
     */
    setDuration(duration) {
        if (!this.currentAnimation) return;
        this.currentAnimation.duration = Math.max(0.1, duration);
        this.editor.events.emit('animation:duration-changed', { duration });
    }

    /**
     * Set animation loop
     */
    setLoop(loop) {
        if (!this.currentAnimation) return;
        this.currentAnimation.loop = loop;
    }
}

export { INTERPOLATION };
