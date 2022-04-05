/**
 * Sound class.
 * ===========
 * @class Sound
 * @classdesc Sound class is resoinse to play audio files.
 * Sounds/Music can be created with the help of this Class and can be played with the help of the play() method.
 *
 * 
 * Properties:
 * -----------
 * @property name - The name of the sound.
 * @property audio - The audio element.
 * @property volume - The volume of the sound.
 * @property loop - If the sound should loop.
 * @property playing - If the sound is playing.
 * 
 * 
 * Methods:
 * --------
 * @method play() - Plays the sound.
 * @method stop() - Stops the sound.
 * @method pause() - Pauses the sound.
 * @method setVolume(volume) - Sets the volume of the sound.
 * @method setLoop(loop) - Sets the loop of the sound.
 * @method isPlaying() - Returns true if the sound is playing.
 */
export class Sound {
    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * @param {string} kwargs.name - The name of the sound.
     * @param {string} kwargs.src - The source of the sound.
     * @param {Number} kwargs.volume - The volume of the sound.
     * @param {bool} kwargs.loop - If the sound should loop.
     * 
     */
    constructor(kwargs) {
        this.name = kwargs["name"];
        this.src = kwargs["src"];
        this.volume = kwargs["volume"] || 1;
        this.loop = kwargs["loop"] || false;
        this.playing = false;
        this.audio = new Audio(this.src);
        this.audio.volume = this.volume;
        this.audio.loop = this.loop;
        this.audio.addEventListener('ended', () => {
            this.playing = false;
        });
    }

    /**
     * Plays the sound.
     */
    play() {
        this.audio.play();
        this.playing = true;
    }

    /**
     * Stops the sound.
     */
    stop() {
        this.audio.pause();
        this.playing = false;
    }

    /**
     * Pauses the sound.
     */
    pause() {
        this.audio.pause();
        this.playing = false;
    }

    /**
     * Sets the volume of the sound.
     * @param {Number} volume - The volume of the sound.
     */
    setVolume(volume) {
        this.volume = volume;
        this.audio.volume = volume;
    }

    /**
     * Sets the loop of the sound.
     * @param {bool} loop   - If the sound should loop.
     */
    setLoop(loop) {
        this.loop = loop;
        this.audio.loop = loop;
    }


    /**
     * Returns true if the sound is playing.
     * @returns {bool} - Returns true if the sound is playing.
     */
    isPlaying() {
        return this.playing;
    }
}



/**
 * SoundManager class.
 * ------------
 * @class
 * A class that manages the sounds. Play or manipulate sounds with the help of the name of the sound.
 * 
 * Properties:
 * @property sounds - An array of sounds.
 * 
 * Methods:
 * @method play(name) - Plays the sound with the name.
 * @method stop(name) - Stops the sound with the name.
 * @method pause(name) - Pauses the sound with the name.
 * @method setVolume(name, volume) - Sets the volume of the sound with the name.
 * @method setLoop(name, loop) - Sets the loop of the sound with the name.
 * @method isPlaying(name) - Returns true if the sound is playing.
 * @method addSound(sound) - Adds a sound to the sound manager.
 * @method removeSound(name) - Removes a sound from the sound manager.
 * @method getSound(name) - Returns the sound with the name.
 */
export default class SoundManager {
    /**
     * @constructor
     * @param {Object} kwargs - The kwargs for the sound.
     * @param {String} kwargs.name - The name of the sound.
     * @param {String} kwargs.src - The src of the sound.
     * @param {Number} kwargs.volume - The volume of the sound.
     * @param {bool} kwargs.loop - If the sound should loop.
     *  *Suggested to use addSound to create more than one sound.
     * 
     */
    constructor(kwargs) {
        this.sounds = {};
        this.sounds["click"] = new Sound({
            name: kwargs["name"] || "Sound0",
            src: kwargs["src"] || "PATH_NOT_PROVIDED",
            volume: kwargs["volume"] || 1,
            loop: kwargs["loop"] || false
        });
    }

    /**
     * Add a sound to the sound manager.
     * @param {String} sound - The name of the sound.
     */
    addSound(sound) {
        this.sounds[sound.name] = sound;
    }

    /**
     * Removes a sound from the sound manager.
     * @param {Srting} sound - The name of the sound.
     */
    removeSound(sound) {
        delete this.sounds[sound.name];
    }

    /**
     * Get the sound instance with the name.
     * @param {String} name - The name of the sound.
     * @returns {Sound} - Returns the sound with the name.
     */
    getSound(name) {
        return this.sounds[name];
    }


    /**
     * Plays the sound with the name.
     * @param {String} sound - The name of the sound.
     */
    play(sound) {
        this.sounds[sound].play();
    }


    /**
     * Stops the sound with the name.
     * @param {String} sound - The name of the sound.
     */
    stop(sound) {
        this.sounds[sound].stop();
    }

    /**
     * Pauses the sound with the name.
     * @param {String} sound - The name of the sound.
     */
    pause(sound) {
        this.sounds[sound].pause();
    }

    /**
     * Sets the volume of the sound with the name.  
     * @param {String} sound - The name of the sound.
     * @param {Number} volume - The volume of the sound.
     */
    setVolume(sound, volume) {
        this.sounds[sound].setVolume(volume);
    }

    /**
     * Set if the sound will loop.  
     * @param {String} sound - The name of the sound.
     * @param {Number} loop - If the sound should loop.
     */
    setLoop(sound, loop) {
        this.sounds[sound].setLoop(loop);
    }

    /**
     * 
     * @param {String} sound - The name of the sound.
     * @returns {bool} - Returns true if the sound is playing.
     */
    isPlaying(sound) {
        return this.sounds[sound].isPlaying();
    }
}