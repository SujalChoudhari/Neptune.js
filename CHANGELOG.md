# Changelog

All notable changes to Neptune.js are documented here. Versions and dates are assigned when a release is explicitly approved; entries under Unreleased are not a release announcement.

## [Unreleased]

### Release notes

- Tilemap occupancy mutations now use actor-to-cell indexing, and a 100 × 100 map with 10,000 occupants is covered by a regression test.
- The debug sample is loaded by a runtime smoke test that verifies scene/tilemap startup and detects console errors.
- Triton desktop packaging is reproducible in Linux CI using frozen Yarn dependencies and a Tauri Debian bundle build; frontend, Tauri, and Cargo app versions are synchronized.
- Runtime workload limits and scaling characteristics are documented in `docs/performance-budgets.md`.

### Versioning

- The engine npm package version remains `3.4.0` until an explicitly approved release.
- Triton is a separately versioned desktop app at `0.1.0`; its frontend, Tauri configuration, and Cargo manifest/lockfile must stay aligned.
- This Unreleased entry does not create a tag, publish a package, or assign a release date.

### Migration

- No migration is required for these M17 changes. Project payloads remain at schema version 1, scene payloads remain at schema version 1, and game-save records remain at schema version 1.
- The tilemap occupancy index is runtime-only and does not alter serialized project, scene, or save data. Existing version-1 data remains compatible.

## [3.4.0] - 2026-11-19

### Major Additions & New Subsystems
- **CORE-03: Reactive Facts & Rules**: Added `WorldFacts`, `TypedEventBus`, and `RuleEngine` providing declarative reactive conditions and events.
- **ABILITY-01 & ABILITY-02: Graph Validation & Execution**: Full ability validation, operation budgeting, targeting, and execution pipeline via `AbilityValidator` and `AbilityExecutor`.
- **SIM-01 & SIM-02: Material Interactions & Cellular Simulation**: Physical state models (`MaterialRegistry`, `MaterialState`) and high-performance thermodynamic 2D cellular automaton (`CellGridSimulation`).
- **STORY-01: Branching Story & Dialogue**: Graph-based narrative branching with fact condition checks and choices (`StoryGraph`, `QuestGraph`).
- **AI-01: Perception & Memory**: Conical FOV vision cones, line-of-sight raycasts, acoustic hearing, and temporal memory decay (`PerceptionSystem`, `BoundedMemory`, `NPCKnowledge`).
- **NAV-01: Navigation Grid & Pathfinding**: Real-time 2D A* pathfinding supporting cost maps, dynamic obstacles, and Euclidean/Manhattan heuristics (`NavigationGrid`, `NavigationPath`).
- **SAVE-01: Versioned Save Engine**: Robust JSON persistence with version headers, migration steps, reference verification, and corrupt payload recovery (`VersionedSaveEngine`).
- **AI-02: Utility AI Decision Engine**: Multi-criteria utility scoring, continuous response curves, and real-time decision traces (`UtilityAI`, `UtilityAction`, `UtilityConsideration`).
- **AI-03: Schedules & Faction Registry**: 24-hour routine dispatcher and multi-faction attitude/reputation registry (`ScheduleSystem`, `NPCSchedule`, `ScheduleSlot`, `FactionRegistry`).
- **RPG-01 & RPG-02: Progression, Inventory, Equipment & Status**: Full RPG equipment slots, weighted drop tables, XP progression curves, and duration status effects (`LevelProgression`, `StatusEffectManager`, `ItemRegistry`, `Inventory`, `EquipmentSystem`, `LootTable`).
- **PHYS-02, PHYS-03 & PHYS-04: Collision Masks, Swept AABB & Spatial Hash Grid**: Continuous swept collision detection, knockback motor with friction decay and wall deflection, collision bitmasks, and broadphase partitioning (`CollisionLayers`, `SweptAABB`, `KnockbackMotor`, `SpatialHashGrid`).
- **WORLD-01: World Semantic Metadata**: Elevation strata (ground, elevated, flying), hazard zones, and terrain friction coefficients (`WorldMetadataRegistry`).
- **AUDIO-01: Hierarchical Audio Bus System**: Master/sub-bus routing, volume gain composition, ducking, and mute propagation (`AudioBusSystem`, `AudioBus`).
- **Showcase Demo**: Complete interactive systems playground at `examples/showcase/` and `docs/demo.html`.
