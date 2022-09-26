Sound component is usefull to play a sound.

## Creating a Sound Component

```js
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
```


Sound Component can also work with files inside the project folder. But it is not recomended as accessing them creates a issue with the [CORS policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).
Files hosted on the internet can be accessed without any issue, Especially if your game will be hosted on the internet.