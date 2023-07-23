import { Color } from "./basic/color.js";
import { DestroyQueue } from "./basic/destroyQueue.js";
import { SceneManager } from "./basic/sceneManager.js";
import { ScriptManager } from "./components/scripts/scriptManager.js";
import { Input } from './events/input.js'
import { Maths } from "./maths/math.js";


/**
 * @class Application
 * @description The main class of the engine. Inherit from this class to create your own game.
 * 
 * @example
 * class MyGame extends Application {
 *    constructor() {
 *      super();
 * 
 *      // Game Entities should be created here. 
 *    }
 * 
 *  Init() {
 *     super.Init();
 *      // This code will be executed when the game is initialized.
 *     }
 * 
 * Update(deltaTime) {
 *    super.Update();
 *      // update is called every frame
 *    }
 * 
 * Draw(ctx) {
 *      super.Draw();
 *      // After the Update function, the Draw function is called.
 *    }
 * }
 * 
 * new MyGame();
 * 
 * @hideconstructor
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
    constructor() {
        this.#pageSetup();

        this.#width = window.innerWidth;
        this.#height = window.innerHeight;
        this.#fps = 60;
        this.#clearColor = Color.fromHex(0x334455);

        this.#playBtn = document.getElementById("neptune-play");
        this.#canvas = document.getElementById("neptune-canvas");
        this.#canvas.setAttribute("height", window.innerHeight);
        this.#canvas.setAttribute("width", window.innerWidth);

        

        this.#canvas.style.display = "none";
        this.#ctx = this.#canvas.getContext("2d");
        this.#playBtn.onclick = () => {
            this.#Gameloop(0);
            try {
                this.#playBtn.remove();
                this.#canvas.style.display = "block";
                document.getElementById("neptune-gamepage").remove();
            } catch (error) { }
            this.#canvas.setAttribute("tabindex", "1");
            this.Init();
        }

        document.body.appendChild(this.#playBtn);

        try {
            this.#playBtn.style.display = "block";
            document.getElementById("neptune-loading").remove();
        } catch (error) { }

        this.#currentTimeStamp = performance.now();
        this._deltaTime = 0;
    }

    /**
     * @description Width of the screen(in pixels). Uses `window.innerWidth` by default.
     * @readonly
     * @protected
     * @type {number}
     */
    get width() {
        return this.#width;
    }


    /**
     * @description Height of the screen(in pixels). Uses `window.innerHeight` by default.
     * @protected
     * @readonly
     * @type {number}
     */
    get height() {
        return this.#height;
    }

    get fps() {
        return this.#fps;
    }

    /**
     * @description The suggested/ Maximum FPS (Frame per seconds) of the game. Default is 60.
     * @protected
     * @type {number}
     */
    set fps(value) {
        this.#fps = value;
    }

    /**
     * @description The background color of the game. Default is `#334455`.
     * @protected
     * @type {Color}
     */
    get clearColor() {
        return this.#clearColor;
    }


    set clearColor(value) {
        this.#clearColor = value;
    }

    /**
     * @description The time passed since the last frame.
     * @protected
     * @readonly
     * @type {number}
     */
    get deltaTime() {
        return this._deltaTime;
    }

    /**
     * This function is called when the game is initialized. Use this function to Setup your entities.
     * @callback
     * @method
     */
    Init() {
        this.#canvas.setAttribute("height", window.innerHeight);
        this.#canvas.setAttribute("width", window.innerWidth);

        window.onresize = () => {
            console.log("Resized");
            this.#width = window.innerWidth;
            this.#height = window.innerHeight;
            this.#canvas.width = this.#width;
            this.#canvas.height = this.#height;
        }
        this.#canvas.focus();

        Input.Init(this.#canvas);
        SceneManager.Init();
        ScriptManager.BehaviourInit();

    }


    /**
     * This function is called every frame. Use this function to draw your entities.
     * @param {HtmlCanvasContext} ctx - The canvas context.
     * @callback
     * @method
     */
    Draw(ctx) {
        SceneManager.Draw(ctx);
    }

    /**
     * This function is called every frame. Use this function to update your entities.
     * @param {number} timeStamp - The time passed since the game started.
     * @callback
     * @method
     * 
     */
    Update(timeStamp) {
        ScriptManager.BehaviourUpdate(timeStamp);
    }


    /**
     * The main game loop.
     * @param {number} timeStamp  - The time passed since the game started.
     * @method
     * @private
     * 
     */
    #Gameloop(timeStamp) {
        this._deltaTime = (timeStamp - this.#currentTimeStamp) * this.#fps / 1000;  //in seconds
        this._deltaTime = Maths.clamp(this._deltaTime, 0, 1);
        this.#currentTimeStamp = timeStamp;

        this.#ctx.clearRect(0, 0, this.#width, this.#ctx.height);
        this.#ctx.fillStyle = this.#clearColor.toString() || Color.darkgray;
        this.#ctx.fillRect(0, 0, this.#width, this.#height);

        this.Update(this._deltaTime);
        this.Draw(this.#ctx);
        Input.Clear();
        DestroyQueue.Destroy();

        requestAnimationFrame(this.#Gameloop.bind(this));
    }

   /**
 * @description Sets up the default CSS for the game and adds necessary elements to the page.
 * @method
 * @private
 */
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
        z-index: -1;
    }
    `;
    document.head.appendChild(style);
}

}

