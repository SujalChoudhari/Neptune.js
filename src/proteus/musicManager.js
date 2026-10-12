/**
 * MusicManager handles background music with crossfading.
 * @class MusicManager
 */
export class MusicManager {
    constructor() {
        this.tracks = {}; // { name: HTMLAudioElement }
        this.currentTrack = null;
        this.volume = 0.5;
        this.fadeTime = 1.0;
        this._fading = false;
    }

    /**
     * Register a music track.
     * @param {string} name - Track name.
     * @param {string} path - Audio file path.
     * @param {boolean} loop - Whether to loop.
     */
    addTrack(name, path, loop = true) {
        const audio = new Audio(path);
        audio.loop = loop;
        audio.volume = 0;
        this.tracks[name] = audio;
    }

    /**
     * Play a track with optional crossfade.
     * @param {string} name - Track name.
     * @param {boolean} crossfade - Enable crossfade.
     */
    play(name, crossfade = true) {
        const newTrack = this.tracks[name];
        if (!newTrack) {
            console.warn(`Track "${name}" not found`);
            return;
        }

        if (this.currentTrack === newTrack) return;

        if (crossfade && this.currentTrack) {
            this._crossfade(newTrack);
        } else {
            if (this.currentTrack) {
                this.currentTrack.pause();
                this.currentTrack.currentTime = 0;
            }
            newTrack.volume = this.volume;
            newTrack.play().catch(() => { });
            this.currentTrack = newTrack;
        }
    }

    /**
     * Crossfade between tracks.
     * @private
     */
    _crossfade(newTrack) {
        const oldTrack = this.currentTrack;
        const fadeSteps = 20;
        const stepTime = (this.fadeTime * 1000) / fadeSteps;
        let step = 0;

        newTrack.volume = 0;
        newTrack.play().catch(() => { });
        this.currentTrack = newTrack;

        const fade = setInterval(() => {
            step++;
            const t = step / fadeSteps;
            oldTrack.volume = Math.max(0, this.volume * (1 - t));
            newTrack.volume = Math.min(this.volume, this.volume * t);

            if (step >= fadeSteps) {
                clearInterval(fade);
                oldTrack.pause();
                oldTrack.currentTime = 0;
            }
        }, stepTime);
    }

    /**
     * Stop current track.
     */
    stop() {
        if (this.currentTrack) {
            this.currentTrack.pause();
            this.currentTrack.currentTime = 0;
            this.currentTrack = null;
        }
    }

    /**
     * Set master volume.
     * @param {number} vol - Volume (0 to 1).
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.currentTrack) {
            this.currentTrack.volume = this.volume;
        }
    }
}
