import * as npt from "../src/neptune.js"; 


class MyNewGame extends npt.Application {
    constructor() {
        super();

        this.audio = new npt.Entity("Audio");
        this.audio.addComponent(new npt.Sound("piece", "https://sampleswap.org/mp3/artist/36239/LEE423_Violent-Vortex-160.mp3"));

    }

    Init(){
        this.audio.getComponent(npt.Sound).play()
    }

}

new MyNewGame();
