import { Color } from "./basic/color.js";
import {Entity} from './basic/entity.js';
import {Scene} from './basic/scene.js';

import {Component} from './components/component.js';
import { Transform } from "./components/transform.js";
import { Shape } from "./components/renderable/shape.js";
import { Sprite } from "./components/renderable/sprite.js";
import { Sound } from "./components/audio.js";

import {UITransform} from './components/ui/transform.js';
import {Container} from './components/ui/containers/container.js';
import { MarginContainer } from "./components/ui/containers/margin.js";
import { VBoxContainer } from "./components/ui/containers/vbox.js";
import { HBoxContainer } from "./components/ui/containers/hbox.js";
import { GridContainer } from "./components/ui/containers/grid.js";
import { Text } from "./components/ui/text.js";
import { UISprite } from "./components/ui/sprite.js";


import {Input} from './events/input.js'
import { Vector2 } from "./maths/vec2.js";


export {
    Color, Entity,Scene,
    Component,Transform,Shape,Sprite,Sound,
    UITransform,Container,MarginContainer,VBoxContainer,HBoxContainer,GridContainer,Text,UISprite,
    Input,Vector2
}

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
        
        window.onresize = () => {
            console.log("Resized");
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
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

