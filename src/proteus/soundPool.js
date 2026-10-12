/**
 * SoundPool manages pooled sound effects for efficient playback.
 * Creates multiple instances of the same sound for overlapping play.
 * @class SoundPool
 */
export class SoundPool {
    /**
     * @param {string} path - Audio file path.
     * @param {number} poolSize - Number of audio instances to pool.
     */
    constructor(path, poolSize = 5) {
        this.path = path;
        this.pool = [];
        this.currentIndex = 0;
        this.volume = 1.0;

        for (let i = 0; i < poolSize; i++) {
            const audio = new Audio(path);
            audio.volume = this.volume;
            this.pool.push(audio);
        }
    }

    /**
     * Play the sound effect.
     * @param {number} volumeMultiplier - Volume multiplier (0 to 1).
     */
    play(volumeMultiplier = 1.0) {
        const audio = this.pool[this.currentIndex];
        audio.currentTime = 0;
        audio.volume = this.volume * volumeMultiplier;
        audio.play().catch(() => { });

        this.currentIndex = (this.currentIndex + 1) % this.pool.length;
    }

    /**
     * Set base volume for all sounds in pool.
     * @param {number} vol 
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    /**
     * Stop all instances.
     */
    stopAll() {
        for (const audio of this.pool) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
}
