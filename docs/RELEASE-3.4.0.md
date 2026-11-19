# Neptune.js v3.4.0 Release Notes

**Release Date:** November 19, 2026  
**Package Version:** `3.4.0`  
**License:** MIT  
**Release Tag:** `v3.4.0`

---

## Executive Summary

Neptune.js v3.4.0 is a milestone release delivering eighteen major game runtime subsystems spanning local environmental cellular simulation, perception and utility AI, 24-hour schedules, dynamic A* pathfinding, continuous swept physics with knockback motors, RPG progression and equipment systems, branching story graphs, hierarchical audio buses, and robust versioned persistence.

Alongside these architectural additions, this release introduces a comprehensive, unified **Interactive Systems Showcase Demo** available both as a standalone web application (`examples/showcase/`) and directly within the documentation site (`docs/demo.html`).

---

## Key Modules & Architecture

### 1. Cellular Simulation & Material Thermodynamics (`SIM-01`, `SIM-02`)
- **`MaterialRegistry`**: Centralized physical property definition supporting physical states (`SOLID`, `LIQUID`, `GAS`, `PLASMA`), flammability, thermal conductivity, viscosity, and chemical interaction reactions.
- **`CellGridSimulation`**: High-performance 2D cellular automaton executing thermodynamic heat transfer, fire propagation across flammable wood cells, fluid horizontal water leveling, falling sand gravity, and rising steam vapors.

### 2. AI Perception & Bounded Knowledge Memory (`AI-01`)
- **`PerceptionSystem`**: Conical field-of-view (FOV) vision sweeps with angular apertures, range checks, and raycasted obstacle occlusion, combined with omnidirectional hearing alert radii.
- **`NPCKnowledge` & `BoundedMemory`**: Event-based observation storage with capacity caps and continuous recency decay scoring.

### 3. Utility AI Decision Engine (`AI-02`)
- **`UtilityAI`**: Multi-factor utility consideration evaluation using customizable mathematical response curves (`linear`, `quadratic`, `logistic`, `step`).
- **Real-Time Decision Traces**: Authoritative scoring inspection with deterministic tie-breaking and action lifecycle hooks (`execute`, `cleanup`, `onInterrupt`).

### 4. 24-Hour Schedule System & Faction Registry (`AI-03`)
- **`NPCSchedule` & `ScheduleSystem`**: Coordinates daily NPC activity cycles across scheduled time slots (`PATROL`, `GUARD`, `TAVERN`, `REST`).
- **`FactionRegistry`**: Configurable multi-faction relationships with numerical reputation meters, dynamic disposition mapping (`FRIENDLY`, `NEUTRAL`, `HOSTILE`), and asymmetric or bidirectional modifications.

### 5. A* Navigation Grid (`NAV-01`)
- **`NavigationGrid` & `NavigationPath`**: 2D grid pathfinder supporting Manhattan and Euclidean heuristics, configurable 8-way diagonal movement, dynamic obstacles, and variable traversal costs.

### 6. Physics: Swept Collision, Knockback & Spatial Grid (`PHYS-02`, `PHYS-03`, `PHYS-04`)
- **`SweptAABB`**: Continuous swept collision detection eliminating high-speed entity and projectile tunneling through obstacle geometry.
- **`KnockbackMotor`**: Applies directional velocity impulses, deflects against wall surfaces along surface normals, and smoothly decelerates via friction decay.
- **`SpatialHashGrid`**: Dynamic spatial partitioning for fast broadphase proximity querying.
- **`CollisionLayers`**: Bitmask layers and collision masks supporting one-way platforms and triggers.

### 7. World Semantic Metadata & Elevation (`WORLD-01`)
- **`WorldMetadataRegistry`**: Defines semantic tile properties, elevation strata (`ground` = 0, `elevated` = 1, `flying` = 2), and hazard zones (chasm pits).

### 8. RPG Progression, Inventory, Equipment & Status (`RPG-01`, `RPG-02`)
- **`LevelProgression`**: Mathematical XP curves, level thresholds, and attribute scaling (`ATK`, `DEF`, `SPD`).
- **`Inventory` & `EquipmentSystem`**: Dedicated equipment slots (`mainHand`, `offHand`, `armor`, `accessory`) modifying combat statistics upon equipping.
- **`LootTable`**: Weighted random drop generator.
- **`StatusEffectManager`**: Handles duration-based buffs and debuffs (`Burning`, `Chilled`, `Regeneration`) with periodic tick callbacks.

### 9. Audio Bus Routing System (`AUDIO-01`)
- **`AudioBusSystem`**: Hierarchical routing network (`master` -> `music`, `sfx`, `ui`) with cascading volume calculation, muting, and Web Audio synthesis.

### 10. Reactive World Facts, Rules & Story Graph (`CORE-03`, `STORY-01`)
- **`WorldFacts` & `TypedEventBus`**: Authoritative key-value fact store with hierarchical dot-notation and decoupled event emission.
- **`RuleEngine`**: Reactive condition-action listeners that mutate world state upon specific events.
- **`StoryGraph`**: Branching dialogue trees evaluating fact conditions and triggering narrative side-effects.

### 11. Versioned Save Engine (`SAVE-01`)
- **`VersionedSaveEngine`**: Robust serialization pipeline with schema version headers, migration pipelines, and corrupt JSON diagnosis and repair.

---

## Interactive Showcase Demo

The interactive systems showcase can be run locally or viewed in documentation:
- **Local Dev Server:** `npm run serve` -> `http://localhost:8000/examples/showcase/`
- **Documentation Page:** `http://localhost:8000/docs/demo.html`
- **Tutorial Guide:** `docs/tutorials/showcase-demo.md`

---

## Migration Guide

Upgrading from `3.3.1` to `3.4.0` is non-breaking and backwards-compatible. All existing APIs continue to function as expected.

Existing game projects can adopt new systems incrementally:
```javascript
import {
  WorldFacts, RuleEngine,
  CellGridSimulation, MaterialRegistry,
  NavigationGrid,
  UtilityAI, NPCSchedule, FactionRegistry,
  LevelProgression, Inventory, EquipmentSystem,
  SweptAABB, KnockbackMotor,
  AudioBusSystem
} from '@sujalchoudhari/neptune-js';
```
