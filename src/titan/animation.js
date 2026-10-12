import { Pose } from "./pose.js";

/**
 * Animation represents a sequence of poses (keyframes) over time.
 * @class Animation
 */
export class Animation {
    /**
     * @param {string} name - Animation name (e.g., "walk", "idle", "attack").
     * @param {boolean} loop - Whether animation loops.
     */
    constructor(name = "animation", loop = true) {
        this.name = name;
        this.loop = loop;
        this.keyframes = []; // Array of { time: number, pose: Pose }
        this.duration = 0;
    }

    /**
     * Add a keyframe to the animation.
     * @param {number} time - Time in seconds for this keyframe.
     * @param {Pose} pose - The pose at this keyframe.
     * @returns {Animation} This animation (for chaining).
     */
    addKeyframe(time, pose) {
        this.keyframes.push({ time, pose });
        this.keyframes.sort((a, b) => a.time - b.time);
        this.duration = Math.max(this.duration, time);
        return this;
    }

    /**
     * Get the interpolated pose at a given time.
     * @param {number} time - Time in seconds.
     * @returns {Pose} Interpolated pose.
     */
    getPoseAtTime(time) {
        if (this.keyframes.length === 0) {
            return new Pose();
        }

        if (this.keyframes.length === 1) {
            return this.keyframes[0].pose;
        }

        // Handle looping
        if (this.loop && this.duration > 0) {
            time = time % this.duration;
        } else {
            time = Math.min(time, this.duration);
        }

        // Find the two keyframes to interpolate between
        let prevKeyframe = this.keyframes[0];
        let nextKeyframe = this.keyframes[this.keyframes.length - 1];

        for (let i = 0; i < this.keyframes.length - 1; i++) {
            if (time >= this.keyframes[i].time && time < this.keyframes[i + 1].time) {
                prevKeyframe = this.keyframes[i];
                nextKeyframe = this.keyframes[i + 1];
                break;
            }
        }

        // Calculate interpolation factor
        const timeDiff = nextKeyframe.time - prevKeyframe.time;
        const t = timeDiff > 0 ? (time - prevKeyframe.time) / timeDiff : 0;

        return Pose.Lerp(prevKeyframe.pose, nextKeyframe.pose, t);
    }

    /**
     * Create an Animation from JSON data.
     * @param {Object} data - JSON animation data.
     * @returns {Animation}
     * @example
     * Animation.fromJSON({
     *   name: "walk",
     *   loop: true,
     *   frames: [
     *     { time: 0, limbs: { "LegL": { rotation: -0.3 } } },
     *     { time: 0.25, limbs: { "LegL": { rotation: 0.3 } } }
     *   ]
     * });
     */
    static fromJSON(data) {
        const anim = new Animation(data.name, data.loop ?? true);

        if (data.frames) {
            for (const frame of data.frames) {
                const pose = new Pose(frame.limbs || {});
                anim.addKeyframe(frame.time, pose);
            }
        }

        return anim;
    }
}
