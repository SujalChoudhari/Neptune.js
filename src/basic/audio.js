
export class Sound {

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

    play() {
        this.audio.play();
        this.playing = true;
    }


    stop() {
        this.audio.pause();
        this.playing = false;
    }

    pause() {
        this.audio.pause();
        this.playing = false;
    }

    setVolume(volume) {
        this.volume = volume;
        this.audio.volume = volume;
    }

    setLoop(loop) {
        this.loop = loop;
        this.audio.loop = loop;
    }

    isPlaying() {
        return this.playing;
    }
}