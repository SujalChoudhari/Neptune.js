/**
 * Deterministic pseudorandom number generator using the Mulberry32 algorithm.
 * Provides seeded repeatable random sequences for gameplay, procedural generation, and replay verification.
 */
export class SeededRandom {
    #state;
    #initialSeed;

    /**
     * @param {number} [seed=1] - Starting integer or float seed.
     */
    constructor(seed = 1) {
        this.setSeed(seed);
    }

    /**
     * Re-seed the generator with a new seed value.
     * @param {number} seed 
     */
    setSeed(seed) {
        if (!Number.isFinite(seed)) throw new TypeError("Seed must be a finite number");
        this.#initialSeed = seed;
        // Map any finite number into an unsigned 32-bit integer state
        this.#state = (Math.floor(seed) ^ 0x6d2b79f5) >>> 0;
        if (this.#state === 0) this.#state = 1;
    }

    /**
     * The original seed this instance was initialized or re-seeded with.
     * @type {number}
     */
    get initialSeed() {
        return this.#initialSeed;
    }

    /**
     * Advance the generator and return a uniform float in [0, 1).
     * @returns {number}
     */
    next() {
        let t = (this.#state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Return a uniform float in the range [min, max).
     * @param {number} [min=0]
     * @param {number} [max=1]
     * @returns {number}
     */
    nextFloat(min = 0, max = 1) {
        if (!Number.isFinite(min) || !Number.isFinite(max)) throw new TypeError("min and max must be finite numbers");
        if (min >= max) throw new RangeError("min must be strictly less than max");
        return min + this.next() * (max - min);
    }

    /**
     * Return a uniform integer in the inclusive range [min, max].
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    nextInt(min, max) {
        if (!Number.isInteger(min) || !Number.isInteger(max)) throw new TypeError("min and max must be integers");
        if (min > max) throw new RangeError("min must be less than or equal to max");
        if (min === max) return min;
        return Math.floor(min + this.next() * (max - min + 1));
    }

    /**
     * Return true with probability `chance` (defaults to 0.5 for a 50/50 flip).
     * @param {number} [chance=0.5]
     * @returns {boolean}
     */
    nextBool(chance = 0.5) {
        if (!Number.isFinite(chance) || chance < 0 || chance > 1) {
            throw new RangeError("chance must be between 0 and 1 inclusive");
        }
        return this.next() < chance;
    }

    /**
     * Select a random item from an array without modifying the array.
     * @template T
     * @param {T[]} array 
     * @returns {T|undefined}
     */
    choice(array) {
        if (!Array.isArray(array)) throw new TypeError("choice requires an array");
        if (array.length === 0) return undefined;
        return array[this.nextInt(0, array.length - 1)];
    }

    /**
     * In-place deterministic Fisher-Yates shuffle.
     * @template T
     * @param {T[]} array 
     * @returns {T[]}
     */
    shuffle(array) {
        if (!Array.isArray(array)) throw new TypeError("shuffle requires an array");
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    /**
     * Snapshot current internal state for serialization / checkpoints.
     * @returns {{ seed: number, state: number }}
     */
    getState() {
        return {
            seed: this.#initialSeed,
            state: this.#state
        };
    }

    /**
     * Restore internal state from a previously saved snapshot.
     * @param {Object} snapshot - State snapshot object containing numeric state.
     * @param {number} [snapshot.seed]
     * @param {number} snapshot.state
     */
    setState(snapshot) {
        if (!snapshot || typeof snapshot !== "object" || !Number.isFinite(snapshot.state)) {
            throw new TypeError("setState requires a snapshot object with numeric state");
        }
        this.#initialSeed = snapshot.seed ?? this.#initialSeed;
        this.#state = snapshot.state >>> 0;
    }
}
