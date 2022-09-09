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
            this.Gameloop(0)
            try {
                this.play_btn.remove();
                this.canvas.style.display = "block";
                document.getElementById("neptune-gamepage").remove();
            } catch (error) {}
            this.canvas.setAttribute("tabindex", "1");
            this.Init();
        }

        document.body.appendChild(this.play_btn);

        this.currentTimeStamp = performance.now();
        this.deltaTime = 0;
        

        try {
            this.play_btn.style.display = "block";
            document.getElementById("neptune-loading").remove();
        } catch (error) {}
    }

    Init() {
        this.canvas.setAttribute("height", window.innerHeight);
        this.canvas.setAttribute("width", window.innerWidth);
        
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.setAttribute("height", window.innerHeight);
            this.canvas.setAttribute("width", window.innerWidth);
        });
        this.canvas.focus();


        setInterval(this.fixedUpdate,100);
    }

    Draw(ctx){}

    Update(timeStamp){}

    Gameloop(timeStamp) {
        this.deltaTime = (timeStamp - this.currentTimeStamp) * this.fps / 1000;
        this.currentTimeStamp = timeStamp;

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = this.clearColor.toString() || Color.darkgray;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.Update(timeStamp);
        this.Draw(this.ctx);

        requestAnimationFrame(this.Gameloop.bind(this));
    }
    

}