import { Application } from "./core/application.js";
import { Storage } from "./core/storage.js";
import { Color } from "./rendering/color.js";
import { Filter } from "./rendering/filter.js";
import { Entity } from './core/entity.js';
import { Scene } from './core/scene.js';
import { DestroyQueue } from "./core/destroyQueue.js";
import { SceneManager } from "./core/sceneManager.js";

import { Component } from './components/component.js';
import { Transform } from "./components/transform.js";
import { Renderable } from "./rendering/renderable.js";
import { Shape } from "./rendering/shape.js";
import { Sprite } from "./rendering/sprite.js";
import { Sound } from "./audio/audio.js";

import * as UI from "./ui/ui.js"

import { Script, Global, Behaviour } from "./scripts/script.js";
import { ScriptManager } from "./scripts/scriptManager.js";

import { MouseInput } from "./input/mouseinput.js";
import { KeyboardInput } from "./input/keyboardinput.js";
import { TouchInput } from "./input/touchinput.js";

import { Maths } from "./math/math.js";
import { Vector2 } from "./math/vec2.js";

// Titan - Animation System
import * as Titan from "./titan/index.js";

// Thalassa - World/Camera System
import * as Thalassa from "./thalassa/index.js";

// Nereid - Physics System
import * as Nereid from "./nereid/index.js";

// Proteus - Audio System
import * as Proteus from "./proteus/index.js";

// Larissa - RPG System
import * as Larissa from "./larissa/index.js";

// Galatea - Cutscene System
import * as Galatea from "./galatea/index.js";



import { ComponentRegistry } from "./core/componentRegistry.js";
import { SceneLoader } from "./core/sceneLoader.js";

const application = new Application();

// Register Core Components
ComponentRegistry.register("Transform", Transform);
ComponentRegistry.register("Sprite", Sprite);
ComponentRegistry.register("Shape", Shape);
// Register other components as needed...

export {
    application,
    Storage, Color, Filter, Entity, Scene, DestroyQueue, SceneManager, SceneLoader,
    Component, Transform, ComponentRegistry,
    Renderable, Shape, Sprite,
    Sound,
    UI,
    Script, ScriptManager, Global, Behaviour,
    MouseInput, KeyboardInput, TouchInput,
    Maths, Vector2,
    Titan, Thalassa, Nereid, Proteus, Larissa, Galatea,
}