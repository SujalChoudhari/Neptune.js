import { Color } from "./basic/color.js";
import { Entity } from './basic/entity.js';
import { Scene } from './basic/scene.js';
import { DestroyQueue } from "./basic/destroyQueue.js";
import { SceneManager } from "./basic/sceneManager.js";

import { Component } from './components/component.js';
import { Transform } from "./components/transform.js";
import { Renderable } from "./components/renderable/renderable.js";
import { Shape } from "./components/renderable/shape.js";
import { Line } from './components/renderable/line.js';
import { Polygon } from "./components/renderable/polygon.js";
import { Sprite } from "./components/renderable/sprite.js";
import { Sound } from "./components/audio.js";

import { Script, Global, Behaviour } from "./components/scripts/script.js";
import { ScriptManager } from "./components/scripts/scriptManager.js";

import { MouseInput } from "./events/mouseinput.js";
import { KeyboardInput } from "./events/keyboardinput.js";
import { TouchInput } from "./events/touchinput.js";

import { Maths } from "./maths/math.js";
import { Vector2 } from "./maths/vec2.js";


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
class Application {
    #playBtn;
    #canvas;
    #ctx;
    #currentTimeStamp;
    #width;
    #height;
    #clearColor;
    #fps;
    #initialCanvasSize = { width: 0, height: 0 };
    constructor() {
        this.#pageSetup();

        this.#width = window.innerWidth;
        this.#height = window.innerHeight;
        this.#initialCanvasSize = { width: window.outerWidth, height: window.outerHeight };
        this.#fps = 60;
        this.#clearColor = Color.FromHex(0x334455);

        this.#playBtn = document.getElementById("neptune-play");
        this.#canvas = document.getElementById("neptune-canvas");
        this.#canvas.setAttribute("height", window.innerHeight);
        this.#canvas.setAttribute("width", window.innerWidth);

        this.#canvas.style.display = "none";
        this.#ctx = this.#canvas.getContext("2d");
        this.#playBtn.onclick = () => {
            this.#gameloop(0);
            try {
                this.#playBtn.remove();
                this.#canvas.style.display = "block";
                document.getElementById("neptune-gamepage").remove();
            } catch (error) { }
            this.#canvas.setAttribute("tabindex", "1");
            this.init();
            
            this.#width = window.innerWidth;
            this.#height = window.innerHeight;
            this.#initialCanvasSize = { width: window.outerWidth, height: window.outerHeight };
            Maths.generateMeterToPixelConversionFactor(this.#initialCanvasSize.width, this.#initialCanvasSize.height, this.#width, this.#height);
        }

        document.body.appendChild(this.#playBtn);

        try {
            this.#playBtn.style.display = "block";
            document.getElementById("neptune-loading").remove();
        } catch (error) { }

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

    /**
     * This function is called when the game is initialized. Use this function to Setup your entities.
     * @callback
     * @method
     */
    init() {
        this.#canvas.setAttribute("height", window.innerHeight);
        this.#canvas.setAttribute("width", window.innerWidth);

        window.onresize = () => {
            this.#width = window.innerWidth;
            this.#height = window.innerHeight;
            this.#canvas.width = this.#width;
            this.#canvas.height = this.#height;

            Maths.generateMeterToPixelConversionFactor(this.#initialCanvasSize.width, this.#initialCanvasSize.height, this.#width, this.#height);

        }
        this.#canvas.focus();

        MouseInput.init(this.#canvas);
        KeyboardInput.init(this.#canvas);
        TouchInput.init(this.#canvas);

        SceneManager.init();
        ScriptManager.behaviourInit();

    }


    /**
     * This function is called every frame. Use this function to draw your entities.
     * @param {HtmlCanvasContext} ctx - The canvas context.
     * @callback
     * @method
     */
    draw(ctx) {
        SceneManager.draw(ctx);
    }

    /**
     * This function is called every frame. Use this function to update your entities.
     * @param {number} timeStamp - The time passed since the game started.
     * @callback
     * @method
     * 
     */
    update(timeStamp) {
        ScriptManager.behaviourUpdate(timeStamp);
    }


    /**
     * The main game loop.
     * @param {number} timeStamp  - The time passed since the game started.
     * @method
     * @private
     * 
     */
    #gameloop(timeStamp) {

        this._deltaTime = (timeStamp - this.#currentTimeStamp) * this.#fps / 1000;  //in seconds
        this._deltaTime = Maths.Clamp(this._deltaTime, 0, 1);
        this.#currentTimeStamp = timeStamp;

        this.#ctx.clearRect(0, 0, this.#width, this.#ctx.height);
        this.#ctx.fillStyle = this.#clearColor.toString() || Color.darkgray;
        this.#ctx.fillRect(0, 0, this.#width, this.#height);

        this.update(this._deltaTime);
        this.draw(this.#ctx);

        MouseInput.clear();
        KeyboardInput.clear();
        TouchInput.clear();

        DestroyQueue.destroy();

        requestAnimationFrame(this.#gameloop.bind(this));
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
        z-index: 1;
    }
    `;
        document.head.appendChild(style);
    }

}

let application = new Application();

export {
    Application, application,

    Color, Entity, Scene, DestroyQueue, SceneManager,

    Component, Transform, Renderable, Line, Shape, Script, Polygon, ScriptManager, Sprite, Sound,

    Global, Behaviour,

    MouseInput, KeyboardInput, TouchInput,

    Maths, Vector2,
}