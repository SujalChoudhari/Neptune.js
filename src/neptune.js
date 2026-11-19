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
import { BoxCollider } from "./components/boxCollider.js";
import { Dialogue } from "./components/dialogue.js";
import { QuestDefinition } from "./components/questDefinition.js";
import { EnemyConfig } from "./components/enemyConfig.js";
import { SceneTransition } from "./components/sceneTransition.js";
import { SpawnPoint } from "./components/spawnPoint.js";
import { TriggerCollider, Hitbox, Hurtbox } from "./nereid/collider.js";
import { Renderable } from "./rendering/renderable.js";
import { Shape } from "./rendering/shape.js";
import { Sprite } from "./rendering/sprite.js";
import { Sound } from "./audio/audio.js";

import * as UI from "./ui/ui.js"

import { Script, Global, Behaviour } from "./scripts/script.js";
import { ScriptManager } from "./scripts/scriptManager.js";
import { ProjectBehaviour } from "./scripts/projectBehaviour.js";

import { MouseInput } from "./input/mouseinput.js";
import { KeyboardInput } from "./input/keyboardinput.js";
import { InputActions } from "./input/actions.js";
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
import { AbilityExecutor, AbilityBudgetExceededError, AbilityValidator, AbilityValidationError } from "./larissa/index.js";

// Galatea - Cutscene System
import * as Galatea from "./galatea/index.js";
import { StoryGraph, QuestGraph } from "./galatea/storyGraph.js";

// Sim - Environmental Simulation System
import * as Sim from "./sim/index.js";
import { MaterialRegistry, MaterialInteraction, MaterialState, InteractionType, CellGridSimulation } from "./sim/index.js";



import { ComponentRegistry } from "./core/componentRegistry.js";
import { SceneLoader } from "./core/sceneLoader.js";
import { SaveManager } from "./core/saveManager.js";
import { GameClock } from "./core/gameClock.js";
import { FixedStepper } from "./core/fixedStepper.js";
import { WorldFacts, TypedEventBus, RuleEngine } from "./core/worldFacts.js";

const application = new Application();
window.game = application;

// Register Core Components
ComponentRegistry.register("Transform", Transform);
ComponentRegistry.register("ProjectBehaviour", ProjectBehaviour);
ComponentRegistry.register("Sprite", Sprite);
ComponentRegistry.register("BoxCollider", BoxCollider);
ComponentRegistry.register("Shape", Shape);
ComponentRegistry.register("TriggerCollider", TriggerCollider);
ComponentRegistry.register("Hitbox", Hitbox);
ComponentRegistry.register("Hurtbox", Hurtbox);
ComponentRegistry.register("Dialogue", Dialogue);
ComponentRegistry.register("QuestDefinition", QuestDefinition);
ComponentRegistry.register("EnemyConfig", EnemyConfig);
ComponentRegistry.register("SceneTransition", SceneTransition);
ComponentRegistry.register("SpawnPoint", SpawnPoint);
// Register other components as needed...

export {
    application, Application, SaveManager, GameClock, FixedStepper,
    WorldFacts, TypedEventBus, RuleEngine,
    Storage, Color, Filter, Entity, Scene, DestroyQueue, SceneManager, SceneLoader,
    Component, Transform, BoxCollider, TriggerCollider, Hitbox, Hurtbox, Dialogue, QuestDefinition, EnemyConfig, SceneTransition, SpawnPoint, ComponentRegistry,
    Renderable, Shape, Sprite,
    Sound,
    UI,
    Script, ScriptManager, Global, Behaviour, ProjectBehaviour,
    MouseInput, KeyboardInput, InputActions, TouchInput,
    Maths, Vector2,
    Titan, Thalassa, Nereid, Proteus, Larissa, AbilityExecutor, AbilityBudgetExceededError, AbilityValidator, AbilityValidationError, Galatea, StoryGraph, QuestGraph,
    Sim, MaterialRegistry, MaterialInteraction, MaterialState, InteractionType, CellGridSimulation,
}
