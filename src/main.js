import { Color } from "./basic/color.js";

/**
 * @class Application
 * @classdesc Main class of the Neptune engine.
 * An application is a Class that handles flow of the game and gameobjects.
 * The life cycle of the Entities is managed by the Application.
 * The Initialization of the Application is done by the constructor.
 * There are special init functions to provide another way of initialization other than the constructor. Here the Entities can be configured.
 * 
 * 
 * @hideconstructor
 * 
 * @property {number} width - Width of the canvas.
 * @property {number} height - Height of the canvas.
 * @property {HTMLCanvasElement} canvas - The canvas element.
 * @property {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @property {number} fps - The current frames per second.
 * @property {number} deltaTime - The time between the last frame and the current frame.
 * @property {number} currentTimeStamp - The current time stamp.
 * @property {number} lastTimeStamp - The last time stamp.
 * @property {Array.<Entity>} entities - The array of entities.
 * 
 * @tutorial Quick Start Guide
 */
export class Application {
    /**
     * @method
     * @description Starts the application. (Called by the engine)
     */
    constructor() {
        this.play_btn = document.getElementById("neptune-play");  
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.fps = 60;
        this.clearColor = Color.gray;

        this.canvas = document.getElementById("neptune-canvas");
        this.canvas.style.display = "none";
        this.ctx = this.canvas.getContext("2d");
        
        this.play_btn.onclick = () => {
            this.gameloop(0)
            try {
                this.play_btn.remove();
                this.canvas.style.display = "block";
                document.getElementById("neptune-gamepage").remove();
            } catch (error) {}
            this.init();
        }

        document.body.appendChild(this.play_btn);

        this.currentTimeStamp = performance.now();
        this.deltaTime = 0;
        
        this.entities = [];

        try {
            this.play_btn.style.display = "block";
            document.getElementById("neptune-loading").remove();
        } catch (error) {}
    }

    /**
     * @method
     * @description Initializes the application. (Called by the engine)
     */
    init() {
        this.canvas.setAttribute("height", window.innerHeight);
        this.canvas.setAttribute("width", window.innerWidth);
        
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.setAttribute("height", window.innerHeight);
            this.canvas.setAttribute("width", window.innerWidth);
        });
        this.canvas.focus();
        this.entities.forEach(entity => {
            entity.init();
        });
    }

    /**
     * @method
     * @description Adds an entity to the application. (Called by the engine)
     */
    update(deltaTime) {
        this.entities.forEach(entity => {
            entity.update(deltaTime);
        });
    }

    /**
     * @method
     * @description Draws the application. (Called by the engine)
     */
    draw(ctx) {
        this.entities.forEach(entity => {
            entity.draw(ctx);
        });
    }


    /**
     * @method
     * @description Updates the application. (Called by the engine)
     * @param {number} timeStamp - The current time stamp.
     */
    gameloop(timeStamp) {

        this.deltaTime = (timeStamp - this.currentTimeStamp) * this.fps / 1000;
        this.currentTimeStamp = timeStamp;

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = this.clearColor.toString() || Color.darkgray;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);


        if (this.update) this.update(this.deltaTime);
        if (this.draw) this.draw(this.ctx);
        requestAnimationFrame(this.gameloop.bind(this));
    }
    

}