import { Color } from "./color.js";
import { Maths } from "../maths/math.js";
import { MouseInput } from "../events/mouseinput.js";
import { KeyboardInput } from "../events/keyboardinput.js";
import { TouchInput } from "../events/touchinput.js";
import { SceneManager } from "./sceneManager.js";
import { ScriptManager } from "../components/scripts/scriptManager.js";
import { DestroyQueue } from "./destroyQueue.js";

/**
 * @class Application
 * @description The main class of the engine. Inherit from this class to create your own game.
 * 
 * @property {number} width - The width of the canvas.
 * @property {number} height - The height of the canvas.
 * @property {number} fps - The fps of the game.
 * @property {Color} clearColor - The color to clear the canvas with.
 * @property {number} deltaTime - The time passed since the last frame.
 * 
 * @note The Application class is a singleton class. Hence use `application` to access the instance of the class.
 */

export class Application {
    #playBtn;
    #canvas;
    #ctx;
    #currentTimeStamp;
    #width;
    #height;
    #clearColor;
    #fps;
    #initialCanvasSize = { width: 0, height: 0 };

    /**
     *  @private
     */
    constructor() {
        // Setup the GamePage
        this.#pageSetup();
        document.getElementById("neptune-loading")?.remove();

        // Initialize the application
        this.#width = window.innerWidth;
        this.#height = window.innerHeight;
        this.#initialCanvasSize = { width: window.outerWidth, height: window.outerHeight };
        this.#fps = 60;
        this.#clearColor = Color.FromHex(0x334455);

        // Setup the canvas
        this.#canvas = document.getElementById("neptune-canvas");
        this.#canvas.setAttribute("height", window.innerHeight);
        this.#canvas.setAttribute("width", window.innerWidth);
        this.#canvas.style.display = "none";
        this.#canvas.focus();
        this.#ctx = this.#canvas.getContext("2d");

        // Setup the play button
        this.#playBtn = document.getElementById("neptune-play");
        this.#playBtn.style.display = "block";
        this.#playBtn.onclick = () => {
            this.#playBtn.remove();
            document.getElementById("neptune-gamepage")?.remove();

            this.#canvas.setAttribute("tabindex", "1");
            this.#canvas.style.display = "block";
            this.#canvas.focus();

            this.#width = window.innerWidth;
            this.#height = window.innerHeight;
            this.#initialCanvasSize = { width: window.outerWidth, height: window.outerHeight };
            Maths.generateMeterToPixelConversionFactor(this.#initialCanvasSize.width, this.#initialCanvasSize.height, this.#width, this.#height);

            this.#init();
            this.#gameloop(0);
        }

        this.#currentTimeStamp = performance.now();
        this._deltaTime = 0;
    }

    get width() {
        return this.#width;
    }

    get height() {
        return this.#height;
    }

    get fps() {
        return this.#fps;
    }

    set fps(value) {
        this.#fps = value;
    }

    get clearColor() {
        return this.#clearColor;
    }


    set clearColor(value) {
        this.#clearColor = value;
    }

    get deltaTime() {
        return this._deltaTime;
    }



    #init() {
        // Resize the canvas
        this.#canvas.setAttribute("height", window.innerHeight);
        this.#canvas.setAttribute("width", window.innerWidth);


        // Keep the canvas size constant
        window.onresize = () => {
            this.#width = window.innerWidth;
            this.#height = window.innerHeight;
            this.#canvas.width = this.#width;
            this.#canvas.height = this.#height;

            Maths.generateMeterToPixelConversionFactor(this.#initialCanvasSize.width, this.#initialCanvasSize.height, this.#width, this.#height);

        }
        this.#canvas.focus();

        // Initialize the input
        MouseInput.init(this.#canvas);
        KeyboardInput.init(this.#canvas);
        TouchInput.init(this.#canvas);

        // Initialize the managers
        SceneManager.init();
        ScriptManager.behaviourInit();

    }


    #draw(ctx) {
        SceneManager.draw(ctx);
    }

    #update(timeStamp) {
        ScriptManager.behaviourUpdate(timeStamp);
    }

    #gameloop(timeStamp) {
        // Calculate the time passed since the last frame
        this._deltaTime = (timeStamp - this.#currentTimeStamp) * this.#fps / 1000;  //in seconds
        this._deltaTime = Maths.Clamp(this._deltaTime, 0, 1);
        this.#currentTimeStamp = timeStamp;

        // Clear the canvas
        this.#ctx.clearRect(0, 0, this.#width, this.#ctx.height);
        this.#ctx.fillStyle = this.#clearColor.toString() || Color.darkgray;
        this.#ctx.fillRect(0, 0, this.#width, this.#height);

        // Update and draw the entities
        this.#update(this._deltaTime);
        this.#draw(this.#ctx);

        // Clear the input
        MouseInput.clear();
        KeyboardInput.clear();
        TouchInput.clear();

        // Destroy the entities
        DestroyQueue.destroy();

        // Call the next frame
        requestAnimationFrame(this.#gameloop.bind(this));
    }

    #pageSetup() {
        const playBtn = document.createElement("button");
        playBtn.setAttribute("type", "button");
        playBtn.setAttribute("id", "neptune-play");
        playBtn.textContent = "Play Game";
        document.body.appendChild(playBtn);

        const canvas = document.createElement("canvas");
        canvas.setAttribute("id", "neptune-canvas");
        document.body.appendChild(canvas);


        let style = document.createElement("style");
        style.innerHTML = `
body {
    margin: 0;
    padding: 0;
    overflow: hidden;
}
#neptune-play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #334455;
    color: white;
    border: none;
    padding: 20px;
    font-size: 20px;
    cursor: pointer;
    display: none;
}

#neptune-canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
}
    `;
        document.head.appendChild(style);
    }

}