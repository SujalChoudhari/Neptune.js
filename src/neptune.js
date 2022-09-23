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
            this.Gameloop(0)
            try {
                this.#playBtn.remove();
                this.#canvas.style.display = "block";
                document.getElementById("neptune-gamepage").remove();
            } catch (error) {}
            this.#canvas.setAttribute("tabindex", "1");
            this.Init();
        }

        document.body.appendChild(this.#playBtn);

        try {
            this.#playBtn.style.display = "block";
            document.getElementById("neptune-loading").remove();
        } catch (error) {}

        this.#currentTimeStamp = performance.now();
        this._deltaTime = 0;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get fps() {
        return this._fps;
    }

    set fps(value) {
        this._fps = value;
    }

    set clearColor(value) {
        this._clearColor = value;
    }

    get clearColor() {
        return this._clearColor;
    }

    get deltaTime() {
        return this._deltaTime;
    }

    


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
        PhysicsEngine.Init();
    }

    Draw(ctx){}

    Update(timeStamp){}

    Gameloop(timeStamp) {
        this._deltaTime = (timeStamp - this.#currentTimeStamp) * this._fps / 1000;  //in seconds
        this._deltaTime = Maths.clamp(this._deltaTime, 0, 1);
        this.#currentTimeStamp = timeStamp;

        this.#ctx.clearRect(0, 0, this._width, this.#ctx.height);
        this.#ctx.fillStyle = this._clearColor.toString() || Color.darkgray;
        this.#ctx.fillRect(0, 0, this._width, this._height);

        this.Update(this._deltaTime);
        PhysicsEngine.Step(this._deltaTime); //in seconds
        this.Draw(this.#ctx);
        Input.clear();
        DestroyQueue.destroy();

        requestAnimationFrame(this.Gameloop.bind(this));
    }
}

