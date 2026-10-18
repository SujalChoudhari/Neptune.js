import { MusicManager } from "./musicManager.js";
import { SoundPool } from "./soundPool.js";

/**
 * AudioMixer provides centralized audio control.
 * Manages separate channels for music, SFX, and UI sounds.
 * @class AudioMixer
 */
export class AudioMixer {
    constructor() {
        this.masterVolume = 1.0;
        this.channels = {
            music: { volume: 0.5, muted: false },
            sfx: { volume: 0.8, muted: false },
            ui: { volume: 0.7, muted: false }
        };

        this.music = new MusicManager();
        this.sounds = {}; // { name: SoundPool }
        this._gameplayEventUnsubscribers = [];
    }

    /**
     * Route gameplay events to registered sound effects or music tracks.
     * Mapping values are { type: "sound"|"music", name, channel? } or a
     * function that returns one of those records for the event payload.
     * @param {Object} eventSource - Emitter exposing on(event, listener).
     * @param {Object} eventMap - Event-name to audio action mapping.
     * @returns {AudioMixer} This mixer (for chaining).
     */
    bindGameplayEvents(eventSource, eventMap) {
        if (!eventSource || typeof eventSource.on !== "function") {
            throw new TypeError("AudioMixer.bindGameplayEvents requires an event source with on(event, listener)");
        }
        if (!eventMap || typeof eventMap !== "object" || Array.isArray(eventMap)) {
            throw new TypeError("AudioMixer.bindGameplayEvents requires an event mapping object");
        }
        for (const [eventName, action] of Object.entries(eventMap)) {
            if (typeof action !== "function" && (!action || typeof action !== "object" || Array.isArray(action))) {
                throw new TypeError(`Audio mapping for event \\"${eventName}\\" must be an action or resolver`);
            }
        }
        this.unbindGameplayEvents();
        for (const [eventName, actionOrResolver] of Object.entries(eventMap)) {
            const listener = (event) => {
                const action = typeof actionOrResolver === "function" ? actionOrResolver(event) : actionOrResolver;
                if (!action || typeof action !== "object") return;
                if (action.type === "sound" && typeof action.name === "string") this.playSound(action.name, action.channel ?? "sfx");
                else if (action.type === "music" && typeof action.name === "string") this.playMusic(action.name);
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
     * Register a music track.
     * @param {string} name 
     * @param {string} path 
     */
    addMusic(name, path) {
        this.music.addTrack(name, path, true);
    }

    /**
     * Register a sound effect.
     * @param {string} name 
     * @param {string} path 
     * @param {number} poolSize 
     */
    addSound(name, path, poolSize = 5) {
        this.sounds[name] = new SoundPool(path, poolSize);
    }

    /**
     * Play a music track.
     * @param {string} name 
     */
    playMusic(name) {
        this.music.setVolume(this._getEffectiveVolume('music'));
        this.music.play(name);
    }

    /**
     * Stop music.
     */
    stopMusic() {
        this.music.stop();
    }

    /**
     * Play a sound effect.
     * @param {string} name 
     * @param {string} channel - Channel name ('sfx' or 'ui').
     */
    playSound(name, channel = 'sfx') {
        const sound = this.sounds[name];
        if (sound) {
            sound.setVolume(this._getEffectiveVolume(channel));
            sound.play();
        }
    }

    /**
     * Set channel volume.
     * @param {string} channel 
     * @param {number} volume 
     */
    setChannelVolume(channel, volume) {
        if (this.channels[channel]) {
            this.channels[channel].volume = Math.max(0, Math.min(1, volume));
            this._updateMusicVolume();
        }
    }

    /**
     * Mute/unmute a channel.
     * @param {string} channel 
     * @param {boolean} muted 
     */
    setChannelMuted(channel, muted) {
        if (this.channels[channel]) {
            this.channels[channel].muted = muted;
            this._updateMusicVolume();
        }
    }

    /**
     * Set master volume.
     * @param {number} volume 
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this._updateMusicVolume();
    }

    /**
     * Get effective volume for a channel.
     * @private
     */
    _getEffectiveVolume(channel) {
        const ch = this.channels[channel];
        if (!ch || ch.muted) return 0;
        return this.masterVolume * ch.volume;
    }

    /**
     * Update music volume.
     * @private
     */
    _updateMusicVolume() {
        this.music.setVolume(this._getEffectiveVolume('music'));
    }
}
