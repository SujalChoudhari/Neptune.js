import * as npt from "../src/neptune.js";


class Game extends npt.Application {
    constructor() {
        super();
        npt.Input.init(this.canvas);
    }

    draw(ctx) {
        super.draw(ctx);
        
        npt.InputVisualizer.pointer(ctx);
        npt.InputVisualizer.keyboard(ctx);

        npt.Input.clear();
    }
}

new Game();