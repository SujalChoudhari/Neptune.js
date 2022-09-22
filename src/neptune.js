import { Color } from "./basic/color.js";
import {Entity} from './basic/entity.js';
import {Scene} from './basic/scene.js';
import { DestroyQueue } from "./basic/destroyQueue.js";

import {Component} from './components/component.js';
import { Transform } from "./components/transform.js";
import { Shape } from "./components/renderable/shape.js";
import { Polygon } from "./components/renderable/polygon.js";
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

// import { PhysicsBody } from "./physics/bodies/physicsBody.js";
import { BoxBody } from "./physics/bodies/boxBody.js";
import { CircleBody } from "./physics/bodies/circleBody.js";
import { PolygonBody } from "./physics/bodies/polygonBody.js";
import { CollisionShape } from "./physics/collisionShape.js";
import { PhysicsEngine } from "./physics/physicsEngine.js";

import {Input} from './events/input.js'

import { Vector2 } from "./maths/vec2.js";
import { Maths } from "./maths/math.js";

export {
    Color, Entity,Scene,Sound,DestroyQueue,
    Component,Transform,
    Shape,Sprite,Polygon,
    UITransform,Container,MarginContainer,VBoxContainer,HBoxContainer,GridContainer,Text,UISprite,
    CollisionShape,PhysicsEngine,BoxBody,CircleBody,PolygonBody,
    Input,
    Vector2,Maths
}

export class Application {

    constructor() {
        this.play_btn = document.getElementById("neptune-play");  
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.fps = 60;
        this.physicsTimeStep = 1;
        this.clearColor = Color.fromHex(0x334455);

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

        try {
            this.play_btn.style.display = "block";
            document.getElementById("neptune-loading").remove();
        } catch (error) {}

        this.currentTimeStamp = performance.now();
        this.deltaTime = 0;
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

        Input.Init(this.canvas);
        PhysicsEngine.Init();

    }

    Draw(ctx){}

    Update(timeStamp){}

    Gameloop(timeStamp) {
        this.deltaTime = (timeStamp - this.currentTimeStamp) * this.fps / 1000;  //in seconds
        this.deltaTime = Maths.clamp(this.deltaTime, 0, 1);
        this.currentTimeStamp = timeStamp;

        this.ctx.clearRect(0, 0, this.width, this.ctx.height);
        this.ctx.fillStyle = this.clearColor.toString() || Color.darkgray;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 1x1 meter grid (), 1 meter = 10 pixels
        this.ctx.save();
        this.ctx.scale(10, 10);
        this.ctx.lineWidth = 0.1;
        this.ctx.strokeStyle = Color.gray.toString();
        for (let i = 0; i < this.width / 10; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.height / 10);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.height / 10; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.width / 10, i);
            this.ctx.stroke();
        }
        this.ctx.restore();


        this.Update(this.deltaTime);
        PhysicsEngine.Step(this.deltaTime); //in seconds
        this.Draw(this.ctx);
        Input.clear();
        DestroyQueue.destroy();

        requestAnimationFrame(this.Gameloop.bind(this));
    }
}

