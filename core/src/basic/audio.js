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
export default class Sound {
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