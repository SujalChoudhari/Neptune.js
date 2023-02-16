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
    constructor() {

        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._fps = 60;
        this._clearColor = Color.fromHex(0x334455);

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
        return this._width;
    }


    /**
     * @description Height of the screen(in pixels). Uses `window.innerHeight` by default.
     * @protected
     * @readonly
     * @type {number}
     */
    get height() {
        return this._height;
    }

    get fps() {
        return this._fps;
    }

    /**
     * @description The suggested/ Maximum FPS (Frame per seconds) of the game. Default is 60.
     * @protected
     * @type {number}
     */
    set fps(value) {
        this._fps = value;
    }

    /**
     * @description The background color of the game. Default is `#334455`.
     * @protected
     * @type {Color}
     */
    get clearColor() {
        return this._clearColor;
    }


    set clearColor(value) {
        this._clearColor = value;
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
            this._width = window.innerWidth;
            this._height = window.innerHeight;
            this.#canvas.width = this._width;
            this.#canvas.height = this._height;
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
        this._deltaTime = (timeStamp - this.#currentTimeStamp) * this._fps / 1000;  //in seconds
        this._deltaTime = Maths.clamp(this._deltaTime, 0, 1);
        this.#currentTimeStamp = timeStamp;

        this.#ctx.clearRect(0, 0, this._width, this.#ctx.height);
        this.#ctx.fillStyle = this._clearColor.toString() || Color.darkgray;
        this.#ctx.fillRect(0, 0, this._width, this._height);

        this.Update(this._deltaTime);
        this.Draw(this.#ctx);
        Input.Clear();
        DestroyQueue.Destroy();

        requestAnimationFrame(this.#Gameloop.bind(this));
    }
}

