import Keyboard from "./src/events/keyboard.js";
import Mouse from "./src/events/mouse.js";
import EventHandler from "./src/events/userevents.js";

/**
 * Application class
 * ==================
 * @class Application
 * @classdesc The main class of the framework. It handles the game loop and the rendering.
 * 
 * Properties:
 * @property {Mouse} mouse - The mouse object.
 * @property {Keyboard} keyboard - The keyboard object.
 * @property {EventHandler} events - The event handler object.
 * @property {Number} deltaTime - The time between the last frame and the current frame.
 * @property {Number} currentTimeStamp - The current time stamp.
 * @property {Number} lastTimeStamp - The last time stamp.
 * @property {Number} width - The width of the canvas.
 * @property {Number} height - The height of the canvas.
 * 
 * Methods:
 * @method init() - Initializes the application. Called once when the application is created and game is ready to start.
 * @method update(deltaTime) - Updates the application. Called every frame.
 * @method draw(ctx) - Draws the application. Called every frame. Application is drawn after the update.
 * @method gameloop() - The game loop.
 */
export default class Application {

    /**
     * @constructor
     */
    constructor() {
        // add play btn and a canvas
        this.play_btn = document.getElementById("__play__");  
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas = document.getElementById("__panel__");
        this.ctx = this.canvas.getContext("2d");
        
        play_btn.onclick = () => {
            this.gameloop(0)
            try {
                this.play_btn.remove();
                document.getElementById("__removable__").remove();
            } catch (error) {
                console.log("[Not Found] '__removable__'not found in the DOM. Ignoring...");
            }
            this.init();
        }

        // this.mouse = new Mouse(this.canvas);
        Mouse.init(this.canvas);
        this.keyboard = new Keyboard(this.canvas);
        this.events = new EventHandler();
        document.body.appendChild(play_btn);
        this.currentTimeStamp = performance.now();
        this.deltaTime = 0;
        
        this.entities = [];

        try {
            document.getElementById("__loading_text__").innerHTML = " ";
            this.play_btn.style.display = "block";
        } catch (error) {
            console.log("[Not Found] '__loading_text__' not found in the DOM. Ignoring...");
        }
    }
    
    /**
     * Initializes the application. Called once when the application is created and game is ready to start.
     */
    init() {
        this.canvas.setAttribute("height", window.innerHeight);
        this.canvas.setAttribute("width", window.innerWidth);
        this.canvas.focus();
        this.entities.forEach(entity => {
            entity.init();
        });
    }

    /**
     * Updates the application. Called every frame.
     * @param {Number} deltaTime - The time between the last frame and the current frame.
     */
    update(deltaTime) {
        this.entities.forEach(entity => {
            entity.update(deltaTime);
        });
    }

    /**
     * Draws the application. Called every frame. Application is drawn after the update.
     */
    draw() {
        this.entities.forEach(entity => {
            entity.draw(this.ctx);
        });
    }

    /**
     * The game loop.
     * @param {Number} deltaTime - The time between the last frame and the current frame.
     */
    gameloop(timeStamp) {

        this.deltaTime = (timeStamp - this.currentTimeStamp) * 60 / 1000;
        this.currentTimeStamp = timeStamp;
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);


        if (this.update) this.update(this.deltaTime);
        if (this.draw) this.draw(this.deltaTime);

        // this.mouse.clear();
        Mouse.clear();
        this.keyboard.clear();
        requestAnimationFrame(this.gameloop.bind(this));
    }


}