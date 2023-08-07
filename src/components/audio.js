import { Component } from './component.js';

/**
 * A Sound Component is responsible for playing sounds.
 * @class Sound
 * @extends Component
 * 
 * @property {string} name  - Name of the sound.
 * @property {string} src  - Path to the sound file.
 * @property {number} volume=1  - Volume of the sound.
 * @property {boolean} loop=false -  If the sound should loop.
 * 
 * @example
 * // Create a sound component
 * let sound = new Sound("Jump", "assets/sounds/jump.wav");
 * 
 * // Add the sound component to an entity
 * entity.AddComponent(sound);
 * 
 * // Play the sound
 * sound.Play();
 * 
 */
export class Sound extends Component {
    #audio;
    constructor(name, src, volume = 1, loop = false) {
        super();
        this._properties.name = name;
        this._properties.src = src;
        this._properties.volume = volume;
        this._properties.loop = loop;
        this._properties.playing = false;

        this.#audio = new Audio(this.src);
        this.#audio.volume = this.volume;
        this.#audio.loop = this.loop;
        this.#audio.addEventListener('ended', () => {
            this._properties.playing = false;
        });
    }

    /** 
     * Name of the sound. Names are not processed by the engine.
     * Can be used for referencing the sound.
     * @type {string}
     * @protected
    */
    get name() {
        return this._properties.name;
    }

    set name(name) {
        this._properties.name = name;
    }

    /**
     * Source path of the sound. This is the path to the sound file. 
     * Note: While hosting on a server, the path should be relative to the root directory.
     * @type {string}
     * @protected
     */
    get src() {
        return this._properties.src;
    }

    set src(src) {
        this._properties.src = src;
    }

    /**
     * Volume of the sound. The volume should be between 0 and 1.
     * @type {number}
     * @protected
     * 
     */
    get volume() {
        return this._properties.volume;
    }

    set volume(volume) {
        this._properties.volume = volume;
        this.#audio.volume = volume;
    }

    /**
     * Loop the sound. 
     * @type {boolean}
     * @protected
     */
    get loop() {
        return this._properties.loop;
    }

    set loop(loop) {
        this._properties.loop = loop;
        this.#audio.loop = loop;
    }

    /**
     * Check if the sound is playing.
     * @type {boolean}
     * @protected
     * @readonly
     * 
     */
    get playing() {
        return this._properties.playing;
    }



    /**
     * Play the sound. If the sound is already playing, it will be stopped and played again.
     * @method
     * 
     */
    Play() {
        this.#audio.play();
        this._properties.playing = true;
    }

    /**
     * Stop the sound. If the sound is not playing, this will do nothing.
     * @method
     * 
     */
    Stop() {
        this.#audio.pause();
        this.#audio.currentTime = 0;
        this._properties.playing = false;
    }

    /**
     * Pause a playing sound. If the sound is not playing, this will do nothing.
     * @method
     */
    Pause() {
        this.#audio.pause();
        this._properties.playing = false;
    }
}