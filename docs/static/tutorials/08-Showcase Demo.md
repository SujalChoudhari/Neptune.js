# Interactive Systems Showcase Demo

Welcome to the **Neptune.js v3.4.0** comprehensive systems showcase. This playable interactive experience exercises all 18 core architectural modules implemented across the engine, demonstrating their real-time cohesion in an action-RPG environment.

---

## Play the Live Showcase Demo

You can interact directly with the embedded runtime demo below, or open it in a dedicated window via [Open Fullscreen Demo](./demo.html).

<iframe src="./showcase/index.html" width="100%" height="840" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin: 16px 0; background: #0a0e17;" title="Neptune.js Systems Showcase"></iframe>

---

## Showcase Subsystems Overview

### 1. Cellular Automaton Simulation & Material Registry (`SIM-01`, `SIM-02`)
- **`MaterialRegistry`**: Defines physical states (`SOLID`, `LIQUID`, `GAS`, `PLASMA`), densities, flammability, thermal conductivity, and custom interaction reactions (combustion, extinguish, dissolve).
- **`CellGridSimulation`**: 2D cellular automaton grid supporting thermodynamic heat transfer, fire propagation across flammable wood cells, fluid horizontal water leveling, falling sand gravity, and rising steam vapors.
- **Interactive Controls**: Paint wood barricades, ignite fires, pour water, or cast abilities directly into simulation cells.

### 2. AI Perception & Bounded Knowledge Memory (`AI-01`)
- **`PerceptionSystem`**: Evaluates conical field-of-view (FOV) vision checks (radius, aperture angle, facing orientation, wall occlusions) and acoustic hearing radiuses.
- **`NPCKnowledge` & `BoundedMemory`**: Records discrete player observation events with capacity limits and temporal recency decay scoring.
- **Interactive Controls**: Adjust FOV sliders in real-time, test noise pulses with abilities or footsteps, and observe NPC awareness states.

### 3. Utility AI Decision Engine (`AI-02`)
- **`UtilityAI`**: Evaluates candidate actions (`Patrol`, `Attack`, `Flee`, `Heal`) against game contexts using multi-factor considerations and continuous response curves.
- **Decision Traces**: Real-time evaluation logging with deterministic priority tie-breaking.
- **Interactive Controls**: Inspect live action scores in the sidebar inspector box and watch NPC behavior transition dynamically as health and distance vary.

### 4. 24-Hour Schedule System & Faction Registry (`AI-03`)
- **`NPCSchedule` & `ScheduleSystem`**: Coordinates daily NPC activity cycles across scheduled time slots (`PATROL`, `GUARD`, `TAVERN`, `REST`).
- **`FactionRegistry`**: Manages faction relationships, dispositions (`FRIENDLY`, `NEUTRAL`, `HOSTILE`), and reputation scores.
- **Interactive Controls**: Scrub the 24-hour world clock slider and toggle guard disposition between Friendly and Hostile.

### 5. A* Navigation Grid & Pathfinding (`NAV-01`)
- **`NavigationGrid` & `NavigationPath`**: 2D grid pathfinder supporting Manhattan and Euclidean heuristics, configurable diagonal movement, dynamic obstacles, and variable traversal costs.
- **Interactive Controls**: Click anywhere on the map in Navigate mode to trace real-time A* waypoints avoiding water obstacles and stone walls.

### 6. Physics: Swept AABB & Knockback Motor (`PHYS-02`, `PHYS-03`, `PHYS-04`)
- **`SweptAABB`**: Continuous swept collision detection eliminating high-speed entity and projectile tunneling through obstacle geometry.
- **`KnockbackMotor`**: Applies directional velocity impulses, deflects against wall surfaces along surface normals, and smoothly decelerates via friction decay.
- **`SpatialHashGrid`**: Dynamic spatial partitioning for fast broadphase proximity querying.

### 7. World Semantic Metadata & Elevation (`WORLD-01`)
- **`WorldMetadataRegistry`**: Defines semantic tile properties, elevation strata (`ground` = 0, `elevated` = 1, `flying` = 2), and hazard zones (chasm pits).
- **Elevation Filtering**: High-elevation bridges permit safe traversal over ground hazard abysses.

### 8. RPG Progression, Inventory & Loot (`RPG-01`, `RPG-02`)
- **`LevelProgression`**: Mathematical XP curves, level thresholds, and attribute scaling (`ATK`, `DEF`, `SPD`).
- **`Inventory` & `EquipmentSystem`**: Dedicated equipment slots (`mainHand`, `offHand`, `armor`, `accessory`) modifying combat statistics upon equipping.
- **`LootTable`**: Weighted random drop generator.
- **`StatusEffectManager`**: Handles duration-based buffs and debuffs (`Burning`, `Chilled`, `Regeneration`) with periodic tick callbacks.

### 9. Audio Bus Routing System (`AUDIO-01`)
- **`AudioBusSystem`**: Hierarchical routing network (`master` -> `music`, `sfx`, `ui`) with cascading volume calculation, muting, and Web Audio synthesis.
- **Interactive Controls**: Dedicated volume sliders and mute toggles with real-time composed gain output.

### 10. Reactive World Facts, Rules & Story Graph (`CORE-03`, `STORY-01`)
- **`WorldFacts` & `TypedEventBus`**: Authoritative key-value fact store with hierarchical dot-notation and decoupled event emission.
- **`RuleEngine`**: Reactive condition-action listeners that mutate world state upon specific events (e.g. unlocking the bridge pass at Level 2).
- **`StoryGraph`**: Branching dialogue trees evaluating fact conditions and triggering narrative side-effects.

### 11. Versioned Save Engine (`SAVE-01`)
- **`VersionedSaveEngine`**: Robust serialization pipeline with schema version headers, migration pipelines, and corrupt JSON diagnosis and repair.
- **Interactive Controls**: Save and load live state snapshots, and test corruption error handling.

---

## Running Locally

To launch the showcase demo in your local development environment:

```bash
npm run serve
```

Then navigate to `http://localhost:8000/examples/showcase/` or `http://localhost:8000/docs/demo.html`.
