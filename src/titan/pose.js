import { Vector2 } from "../math/vec2.js";

/**
 * Pose represents a snapshot of limb transforms at a single moment.
 * Used for keyframe animation of character rigs.
 * @class Pose
 */
export class Pose {
    /**
     * @param {Object} limbData - Object mapping limb names to transform data.
     * @example
     * new Pose({
     *   "LegL": { rotation: -0.3, position: { x: 0, y: 0 } },
     *   "LegR": { rotation: 0.3 }
     * });
     */
    constructor(limbData = {}) {
        this.limbs = {};
        for (const [name, data] of Object.entries(limbData)) {
            this.limbs[name] = {
                rotation: data.rotation ?? 0,
                position: data.position ? new Vector2(data.position.x ?? 0, data.position.y ?? 0) : null,
                scale: data.scale ? new Vector2(data.scale.x ?? 1, data.scale.y ?? 1) : null
            };
        }
    }

    /**
     * Get the transform data for a specific limb.
     * @param {string} limbName - Name of the limb.
     * @returns {Object|null} Limb transform data or null if not found.
     */
    getLimb(limbName) {
        return this.limbs[limbName] || null;
    }

    /**
     * Check if this pose has data for a specific limb.
     * @param {string} limbName - Name of the limb.
     * @returns {boolean}
     */
    hasLimb(limbName) {
        return limbName in this.limbs;
    }

    /**
     * Get all limb names in this pose.
     * @returns {string[]}
     */
    getLimbNames() {
        return Object.keys(this.limbs);
    }

    /**
     * Interpolate between two poses.
     * @param {Pose} poseA - Start pose.
     * @param {Pose} poseB - End pose.
     * @param {number} t - Interpolation factor (0 to 1).
     * @returns {Pose} Interpolated pose.
     */
    static Lerp(poseA, poseB, t) {
        const result = new Pose();
        const allLimbs = new Set([...poseA.getLimbNames(), ...poseB.getLimbNames()]);

        for (const limbName of allLimbs) {
            const dataA = poseA.getLimb(limbName) || { rotation: 0, position: null, scale: null };
            const dataB = poseB.getLimb(limbName) || { rotation: 0, position: null, scale: null };

            result.limbs[limbName] = {
                rotation: dataA.rotation + (dataB.rotation - dataA.rotation) * t,
                position: null,
                scale: null
            };

            // Interpolate position if both have it
            if (dataA.position && dataB.position) {
                result.limbs[limbName].position = new Vector2(
                    dataA.position.x + (dataB.position.x - dataA.position.x) * t,
                    dataA.position.y + (dataB.position.y - dataA.position.y) * t
                );
            } else if (dataA.position || dataB.position) {
                result.limbs[limbName].position = dataA.position || dataB.position;
            }

            // Interpolate scale if both have it
            if (dataA.scale && dataB.scale) {
                result.limbs[limbName].scale = new Vector2(
                    dataA.scale.x + (dataB.scale.x - dataA.scale.x) * t,
                    dataA.scale.y + (dataB.scale.y - dataA.scale.y) * t
                );
            } else if (dataA.scale || dataB.scale) {
                result.limbs[limbName].scale = dataA.scale || dataB.scale;
            }
        }

        return result;
    }
}
