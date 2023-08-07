import { Application } from "./basic/application.js";
import { Storage } from "./basic/storage.js";
import { Color } from "./basic/color.js";
import { Filter } from "./basic/filter.js";
import { Entity } from './basic/entity.js';
import { Scene } from './basic/scene.js';
import { DestroyQueue } from "./basic/destroyQueue.js";
import { SceneManager } from "./basic/sceneManager.js";

import { Component } from './components/component.js';
import { Transform } from "./components/transform.js";
import { Renderable } from "./components/renderable/renderable.js";
import { Shape } from "./components/renderable/shape.js";
import { Sprite } from "./components/renderable/sprite.js";
import { Sound } from "./components/audio.js";

import * as UI from "./ui/ui.js"

import { Script, Global, Behaviour } from "./components/scripts/script.js";
import { ScriptManager } from "./components/scripts/scriptManager.js";

import { MouseInput } from "./events/mouseinput.js";
import { KeyboardInput } from "./events/keyboardinput.js";
import { TouchInput } from "./events/touchinput.js";

import { Maths } from "./maths/math.js";
import { Vector2 } from "./maths/vec2.js";



const application = new Application();

export {
    application,
    Storage, Color, Filter, Entity, Scene, DestroyQueue, SceneManager,
    Component, Transform,
    Renderable, Shape, Sprite,
    Sound,
    UI,
    Script, ScriptManager, Global, Behaviour,
    MouseInput, KeyboardInput, TouchInput,
    Maths, Vector2,
}