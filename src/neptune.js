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
import { InputCoordinates } from "./input/coordinates.js";

import { Maths } from "./math/math.js";
import { Vector2 } from "./math/vec2.js";

// Titan - Animation System
import * as Titan from "./titan/index.js";

// Thalassa - World/Camera System
import * as Thalassa from "./thalassa/index.js";
import {
    NavigationGrid, NavigationPath, WorldMetadataRegistry, SEMANTIC_LAYER_TYPES,
    ChunkManager, Portal, PortalRegistry, PathfindingScheduler
} from "./thalassa/index.js";

// Nereid - Physics System
import * as Nereid from "./nereid/index.js";
import {
    CollisionLayers, createCollisionMask, canLayersCollide, ContactSolver, TriggerLifecycleSystem,
    SweptAABB, ElevationFilter, KnockbackMotor, HazardSystem, SpatialHashGrid
} from "./nereid/index.js";

// Proteus - Audio System
import * as Proteus from "./proteus/index.js";
import { AudioBus, AudioBusSystem } from "./proteus/index.js";

// Larissa - RPG System
import * as Larissa from "./larissa/index.js";
import {
    AbilityExecutor, AbilityBudgetExceededError, AbilityValidator, AbilityValidationError,
    PerceptionSystem, BoundedMemory, NPCKnowledge, UtilityAI, UtilityAction, UtilityConsideration, UtilityCurves,
    ScheduleSystem, FactionRegistry, NPCSchedule, ScheduleSlot, ROUTINE_ACTIVITIES, FACTION_DISPOSITION,
    ItemRegistry, Inventory, EquipmentSystem, LootTable,
    LevelProgression, StatusEffectManager, DeathRetryManager
} from "./larissa/index.js";

// Galatea - Cutscene System
import * as Galatea from "./galatea/index.js";
import { StoryGraph, QuestGraph } from "./galatea/storyGraph.js";

// Sim - Environmental Simulation System
import * as Sim from "./sim/index.js";
import { MaterialRegistry, MaterialInteraction, MaterialState, InteractionType, CellGridSimulation } from "./sim/index.js";



import { ComponentRegistry } from "./core/componentRegistry.js";
import { SceneLoader } from "./core/sceneLoader.js";
import { SaveManager } from "./core/saveManager.js";
import { VersionedSaveEngine, SchemaMigrationRegistry, ReferenceValidator, FutureVersionError, ReferenceValidationError, MigrationError, CorruptSaveError, MapStorage } from "./core/versionedSave.js";
import { GameClock } from "./core/gameClock.js";
import { FixedStepper } from "./core/fixedStepper.js";
import { SeededRandom } from "./core/seededRandom.js";
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
ComponentRegistry.register("NPCKnowledge", NPCKnowledge);
ComponentRegistry.register("NPCSchedule", NPCSchedule);
ComponentRegistry.register("UtilityAI", UtilityAI);
ComponentRegistry.register("LevelProgression", LevelProgression);
ComponentRegistry.register("StatusEffectManager", StatusEffectManager);
ComponentRegistry.register("DeathRetryManager", DeathRetryManager);
ComponentRegistry.register("KnockbackMotor", KnockbackMotor);
ComponentRegistry.register("SpatialHashGrid", SpatialHashGrid);
ComponentRegistry.register("WorldMetadataRegistry", WorldMetadataRegistry);
ComponentRegistry.register("AudioBusSystem", AudioBusSystem);
// Register other components as needed...

export {
    application, Application, SaveManager, GameClock, FixedStepper, SeededRandom,
    WorldFacts, TypedEventBus, RuleEngine,
    VersionedSaveEngine, SchemaMigrationRegistry, ReferenceValidator, FutureVersionError, ReferenceValidationError, MigrationError, CorruptSaveError, MapStorage,
    Storage, Color, Filter, Entity, Scene, DestroyQueue, SceneManager, SceneLoader,
    Component, Transform, BoxCollider, TriggerCollider, Hitbox, Hurtbox, Dialogue, QuestDefinition, EnemyConfig, SceneTransition, SpawnPoint, ComponentRegistry,
    Renderable, Shape, Sprite,
    Sound,
    UI,
    Script, ScriptManager, Global, Behaviour, ProjectBehaviour,
    MouseInput, KeyboardInput, InputActions, TouchInput, InputCoordinates,
    Maths, Vector2,
    Titan, Thalassa, NavigationGrid, NavigationPath, WorldMetadataRegistry, SEMANTIC_LAYER_TYPES,
    ChunkManager, Portal, PortalRegistry, PathfindingScheduler,
    Nereid, Proteus, Larissa, AbilityExecutor, AbilityBudgetExceededError, AbilityValidator, AbilityValidationError,
    PerceptionSystem, BoundedMemory, NPCKnowledge, UtilityAI, UtilityAction, UtilityConsideration, UtilityCurves,
    ScheduleSystem, FactionRegistry, NPCSchedule, ScheduleSlot, ROUTINE_ACTIVITIES, FACTION_DISPOSITION,
    ItemRegistry, Inventory, EquipmentSystem, LootTable,
    LevelProgression, StatusEffectManager, DeathRetryManager,
    CollisionLayers, createCollisionMask, canLayersCollide, ContactSolver, TriggerLifecycleSystem,
    SweptAABB, ElevationFilter, KnockbackMotor, HazardSystem, SpatialHashGrid,
    AudioBus, AudioBusSystem,
    Galatea, StoryGraph, QuestGraph,
    Sim, MaterialRegistry, MaterialInteraction, MaterialState, InteractionType, CellGridSimulation,
}
