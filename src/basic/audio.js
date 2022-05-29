/**
 * @class Sound
 * @classdesc The Sound class is used to play audio files.
 * 
 * @property {String} src - The path to the audio file.
 * @property {String} name - The name of the audio file.
 * @property {Number} volume - The volume of the audio file.
 * @property {Boolean} loop - Whether the audio file should loop or not.
 * @property {Boolean} playing - Whether the audio file is currently playing or not.
 * @property {Audio} audio - The js-audio element.
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Sound {

    /**
     * @method
     * @description Creates a new Sound object.
     * @param {Object} kwargs - The keyword arguments.
     * @param {String} kwargs.src - The path to the audio file.
     * @param {String} kwargs.name - The name of the audio file.
     * @param {Number} [kwargs.volume=1] - The volume of the audio file.
     * @param {Boolean} [kwargs.loop=false] - Whether the audio file should loop or not.
     * 
     * @example
     * // Create a new Sound object.
     * let sound = new Sound({
     *          src: "assets/sounds/sound.mp3",
     *          name: "sound",
     *          volume: 0.5,
     *          loop: true 
     *      });
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
     * @method
     * @description Plays the audio file.
     * 
     * @example
     * // Play the audio file.
     * sound.play();    
     * 
     */
    play() {
        this.audio.play();
        this.playing = true;
    }

    /**
     * @method
     * @description Stops the audio file.
     * 
     * @example
     * // Stop the audio file.
     * sound.stop();
     */
    stop() {
        this.audio.pause();
        this.playing = false;
    }

    /**
     * @method
     * @description Pauses the audio file.
     * 
     * @example 
     * // Pause the audio file.
     * sound.pause();
     */
    pause() {
        this.audio.pause();
        this.playing = false;
    }

    /**
     * @method
     * @description Sets the volume of the audio file.
     * @param {Number} volume - The volume of the audio file.
     * 
     * @example
     * // Set the volume of the audio file to 0.5.
     * sound.setVolume(0.5);
     * 
     */
    setVolume(volume) {
        this.volume = volume;
        this.audio.volume = volume;
    }

    /**
     * @method
     * @description Sets the looping of the audio file.
     * @param {Boolean} loop - Whether the audio file should loop or not.
     * 
     * @example
     * // Set the audio file to loop.
     * sound.setLoop(true);
     * 
     */
    setLoop(loop) {
        this.loop = loop;
        this.audio.loop = loop;
    }

    /**
     * @description Checks if the audio file is currently playing.
     * @returns {Boolean} Whether the audio file is currently playing or not.
     * 
     * @example
     * // Check if the audio file is playing.
     * if (sound.isPlaying()) {
     *     // Do something.
     * }
     */
    isPlaying() {
        return this.playing;
    }
}