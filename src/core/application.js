import { Color } from "../rendering/color.js";
import { MouseInput } from "../input/mouseinput.js";
import { KeyboardInput } from "../input/keyboardinput.js";
import { TouchInput } from "../input/touchinput.js";
import { SceneManager } from "./sceneManager.js";
import { ScriptManager } from "../scripts/scriptManager.js";
import { DestroyQueue } from "./destroyQueue.js";
import { mountAuthoredUI } from "../ui/authoredUi.js";
import { FixedStepper } from "./fixedStepper.js";

const sceneLoadGenerations = new WeakMap();

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
    #isRunning = false;
    #playGeneration = 0;
    #authoredUI = null;
    #authoredUIScene = null;
    #fixedStepper = new FixedStepper();

    #isInitialized = false;

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
            this.start();
        }

        this.#currentTimeStamp = performance.now();
        this._deltaTime = 0;
        window.addEventListener("neptune:ui-capture", event => {
            this.#authoredUI?.setCapture(Boolean(event.detail?.enabled));
        });
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

    get isRunning() {
        return this.#isRunning;
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

            // Maths.generateMeterToPixelConversionFactor(this.#initialCanvasSize.width, this.#initialCanvasSize.height, this.#width, this.#height);

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

    /**
     * Start the application (public method)
     */
    start() {
        if (this.#isRunning) return;
        if (this.#playBtn) this.#playBtn.remove();
        document.getElementById("neptune-gamepage")?.remove();

        this.#canvas.setAttribute("tabindex", "1");
        this.#canvas.style.display = "block";
        this.#canvas.focus();

        this.#width = window.innerWidth;
        this.#height = window.innerHeight;
        this.#initialCanvasSize = { width: window.outerWidth, height: window.outerHeight };

        if (!this.#isInitialized) {
            this.#init();
            this.#isInitialized = true;
        }
        this.#fixedStepper.reset();
        this.#currentTimeStamp = null;
        this.#isRunning = true;
        this.#gameloop(0, ++this.#playGeneration);
    }

    /**
     * Pause the game logic (updates). Rendering continues.
     */
    pause() {
        this.isPaused = true;
        this.#fixedStepper.reset();
        KeyboardInput.clear();
    }

    /**
     * Resume the game logic.
     */
    resume() {
        this.isPaused = false;
        this.#currentTimeStamp = null;
    }

    /** Stop the game loop. Calling start() later resumes the existing instance. */
    stop() {
        this.isPaused = false;
        this.#isRunning = false;
        this.#playGeneration++;
        this.#fixedStepper.reset();
        KeyboardInput.reset();
        MouseInput.clear();
        TouchInput.clear();
    }


    /**
     * Get the active scene.
     */
    get scene() {
        return SceneManager.GetActiveScene();
    }

    /** Clear editor project state and invalidate asynchronous scene loads. */
    resetProject() {
        this.stop();
        this.#authoredUI?.dispose();
        this.#authoredUI = null;
        this.#authoredUIScene = null;
        sceneLoadGenerations.set(this, (sceneLoadGenerations.get(this) || 0) + 1);
        for (const scene of SceneManager.GetScenes()) {
            scene.active = false;
            // A scene may still be receiving asynchronous tilemap children.
            // Leave its root destroyable for the superseded-load cleanup.
            for (const child of [...scene.children]) child.destroy();
            for (const component of scene.components) component.destroy();
        }
        SceneManager.removeAllScenes();
        this.#ctx.clearRect(0, 0, this.#width, this.#height);
    }

    /**
     * Load a scene via the application (editor helper).
     * @param {string} path 
     */
    async loadScene(pathOrData) {
        const generation = (sceneLoadGenerations.get(this) || 0) + 1;
        sceneLoadGenerations.set(this, generation);
        console.log("Application: Loading Scene", typeof pathOrData === 'string' ? pathOrData : "from Data");

        try {
            const { SceneLoader } = await import("./sceneLoader.js");

            let data;
            if (typeof pathOrData === 'string') {
                const response = await fetch(pathOrData);
                data = await response.json();
            } else {
                data = pathOrData;
            }

            const newScene = await SceneLoader.parse(data);

            if (generation !== sceneLoadGenerations.get(this)) {
                SceneManager.removeScene(newScene);
                newScene.destroy();
                return false;
            }

            const previousScene = this.scene;
            SceneManager.replaceScene(newScene);
            SceneManager.LoadScene(newScene.id);
            if (previousScene && previousScene !== newScene && previousScene.id === newScene.id) {
                SceneManager.removeScene(previousScene);
                previousScene.destroy();
            }
            return true;

        } catch (e) {
            if (generation !== sceneLoadGenerations.get(this)) return false;
            console.error("Application: Failed to load scene", e);
            throw e;
        }
    }

    #draw(ctx) {
        SceneManager.draw(ctx);
        const scene = this.scene;
        if (globalThis.__NEPTUNE_EDITOR_PREVIEW__ === true) {
            this.#authoredUI?.dispose();
            this.#authoredUI = null;
            this.#authoredUIScene = scene || null;
            return;
        }
        if (scene !== this.#authoredUIScene) {
            this.#authoredUI?.dispose();
            this.#authoredUI = null;
            this.#authoredUIScene = scene || null;
            if (scene?.ui?.elements?.length) {
                this.#authoredUI = mountAuthoredUI(document.body, scene.ui, { mode: "game", captureInput: false });
            }
        }
    }

    #update(timeStamp) {
        ScriptManager.behaviourUpdate(timeStamp);
    }

    #gameloop(timeStamp, generation) {
        if (!this.#isRunning || generation !== this.#playGeneration) return;
        const frameDelta = this.#currentTimeStamp === null
            ? 0
            : Math.max(0, (timeStamp - this.#currentTimeStamp) / 1000);
        this.#currentTimeStamp = timeStamp;

        // Clear the canvas
        this.#ctx.clearRect(0, 0, this.#width, this.#height);
        this.#ctx.fillStyle = this.#clearColor.toString() || Color.darkgray;
        this.#ctx.fillRect(0, 0, this.#width, this.#height);

        // Update at a stable simulation rate, limiting catch-up work after stalls.
        if (!this.isPaused) {
            this.#fixedStepper.advance(frameDelta, fixedDelta => {
                this._deltaTime = fixedDelta;
                this.#update(fixedDelta);
                MouseInput.clear();
                KeyboardInput.clear();
                TouchInput.clear();
                DestroyQueue.destroy();
            });
        } else {
            this.#fixedStepper.reset();
            MouseInput.clear();
            KeyboardInput.clear();
            TouchInput.clear();
        }
        this.#draw(this.#ctx);

        // Call the next frame
        if (this.#isRunning && generation === this.#playGeneration) {
            requestAnimationFrame(nextTimeStamp => this.#gameloop(nextTimeStamp, generation));
        }
    }

    #pageSetup() {
        let playBtn = document.getElementById("neptune-play");
        if (!playBtn) {
            playBtn = document.createElement("button");
            playBtn.setAttribute("type", "button");
            playBtn.setAttribute("id", "neptune-play");
            playBtn.textContent = "Play Game";
            document.body.appendChild(playBtn);
        }

        let canvas = document.getElementById("neptune-canvas");
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.setAttribute("id", "neptune-canvas");
            document.body.appendChild(canvas);
        }

        if (!document.getElementById("neptune-style")) {
            let style = document.createElement("style");
            style.id = "neptune-style";
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

}
