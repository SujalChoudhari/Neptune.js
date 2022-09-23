import{Component} from './component.js';
export class Sound extends Component {
    #audio;
    constructor(name,src,volume=1,loop=false) {
        this._properties.name = name;
        this._properties.src = src;
        this._properties.volume = volume;
        this._properties.loop = loop;
        this._properties.playing = false;
        
        this.#audio = new Audio(this.src);
        this.#audio.volume = this.volume;
        this.#audio.loop = this.loop;
        this.#audio.addEventListener('ended', () => {
            this.playing = false;
        });
    }

    get name() {
        return this._properties.name;
    }

    set name(name) {
        this._properties.name = name;
    }

    get src() {
        return this._properties.src;
    }

    set src(src) {
        this._properties.src = src;
    }

    get volume() {
        return this._properties.volume;
    }

    set volume(volume) {
        this._properties.volume = volume;
        this.#audio.volume = volume;
    }

    get loop() {
        return this._properties.loop;
    }

    set loop(loop) {
        this._properties.loop = loop;
        this.#audio.loop = loop;
    }

    get playing() {
        return this._properties.playing;
    }




    play() {
        this.#audio.play();
        this._properties.playing = true;
    }


    stop() {
        this.#audio.pause();
        this._properties.playing = false;
    }

    pause() {
        this.#audio.pause();
        this._properties.playing = false;
    }

    setVolume(volume) {
        this.volume = volume;
        this.#audio.volume = volume;
    }

    setLoop(loop) {
        this.loop = loop;
        this.#audio.loop = loop;
    }

    isPlaying() {
        return this.playing;
    }
}