import { Color } from "./basic/color.js";

export class Application {

    constructor() {
        this.play_btn = document.getElementById("neptune-play");  
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.fps = 60;
        this.clearColor = Color.gray;

        this.canvas = document.getElementById("neptune-canvas");
        this.canvas.setAttribute("height", window.innerHeight);
        this.canvas.setAttribute("width", window.innerWidth);
        
        this.canvas.style.display = "none";
        this.ctx = this.canvas.getContext("2d");
        
        this.play_btn.onclick = () => {
            this.gameloop(0)
            try {
                this.play_btn.remove();
                this.canvas.style.display = "block";
                document.getElementById("neptune-gamepage").remove();
            } catch (error) {}
            this.canvas.setAttribute("tabindex", "1");
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

        setInterval(this.fixedUpdate,100);
    }





    gameloop(timeStamp) {
        this.deltaTime = (timeStamp - this.currentTimeStamp) * this.fps / 1000;
        this.currentTimeStamp = timeStamp;

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = this.clearColor.toString() || Color.darkgray;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        requestAnimationFrame(this.gameloop.bind(this));
    }
    

}