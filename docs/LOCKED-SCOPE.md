# Neptune release one scope

Locked November 19, 2026 at the user's request. This is a target contract, not a claim that its features are complete.

Source: the user's `ARPG_Engine_Editor_SRS_v0.1.docx`, dated November 17, 2026. The document supplies product requirements; its proposed architecture and agent working agreement do not override the user's current instructions or the repository's compatibility rules. The decisions below resolve its open alternatives into one bounded release.

This file is the authority for release-one feature scope. README describes current capability. ROADMAP describes order and historical work; an older TODO or estimate cannot add a release requirement unless it maps to a scope ID here. The earlier 2D demo remains a foundation. This explicitly expanded product adds elevation, streamed worlds, lighting, local environmental simulation and integrated NPC/narrative authoring.

## Fixed product decisions

- Product: an opinionated top-down ARPG engine and Triton authoring tool, with no-code configuration for the included systems and optional project scripting.
- Geometry: 2D simulation and sprite/tile worlds with elevation, depth sorting and occlusion. This is the release's meaning of 2.5D. No freely rotating 3D camera, meshes or general-purpose 3D physics.
- Architecture: retain Entity, components/children, Transform, Scene/SceneManager and Behaviour composition. No ECS framework replacement. Runtime stays independent of React, Dockview, Tauri and native file APIs.
- Rendering: WebGL2 is the final world-rendering backend required by the SRS. Treat transition from current Canvas rendering as an explicit compatibility task preserving public APIs, scene data and supported visuals. One production GPU backend; no WebGPU implementation in this release.
- Game UI: one primary declarative HTML/DOM authoring path, sharing its schema between edit preview and game runtime. Existing Canvas UI APIs retain compatibility; they are not a second new UI designer.
- Editor: retain the compact dark neumorphic React/Dockview/Tauri shell. Ship a Windows editor and self-contained browser game exports. No editor-shell rewrite or additional desktop/mobile editor platforms.
- AI: data-defined utility decisions and reusable actions with decision traces. Combat phases remain state-driven. No parallel GOAP/behavior-tree frameworks or runtime LLM dependency.
- Data: versioned JSON project, scene, chunk and definition data with stable entity/component/asset IDs. Gameplay saves and editor preferences remain separate from authored content. Derived caches may be replaceable; binary authoring formats are not required.
- Extension support: project-local JavaScript and TypeScript modules with a defined build, versioned APIs and disposal. A built-in IDE, package marketplace and arbitrary remote plugin execution are not release requirements.

## Required capabilities

Each numbered item is a feature boundary. Existing partial implementations should be reconciled and completed, not rebuilt merely because they predate this scope.

| ID | Required capability | Observable completion condition |
| --- | --- | --- |
| S01 | Runtime and shared contracts: lifecycle, fixed ticks, seeded randomness, input contexts, typed events, authoritative world facts, ordered rules, stable IDs and schema validation. | Activation, spawn, destruction, scene/project switches and repeated Play/Stop clean up correctly. One event/rule path connects systems without duplicated health/world/story state. Controlled tick/seed replay reproduces tested gameplay outcomes. |
| S02 | Physics and traversal: one supported Nereid path for solid bodies, triggers, collision layers/masks, contact events, knockback, hazards and fast projectiles; legacy BoxCollider compatibility; elevation-aware traversal and transitions. | Movement and attacks respect walls and height/traversal rules at supported speeds and frame rates. Fast projectiles do not tunnel within documented bounds. No third collision subsystem or full 3D dynamics engine. |
| S03 | World data and streaming: layered semantic tiles, elevation, zones, spawn/entry points, portals, stable chunk ownership, asynchronous prefetch, unload/reload and persistent chunk changes. | Travel between adjacent chunks without blocking normal traversal or duplicating entities. Modified terrain, objects and spawns survive unloading and saving. Invalid/unreachable links are reported. |
| S04 | Navigation and spatial queries: weighted grid routes across chunk links, dynamic obstacles, local avoidance, spatial lookups and budgets for route requests. | Included NPC/enemy archetypes reach valid destinations, handle blocked paths and never request unlimited work each render frame. Reuse indexed queries for collision, perception and nearby interactions. |
| S05 | Rendering and camera: WebGL2 sprites/tile layers, atlases/batching, visible-region culling, stable depth/elevation/Y ordering, occlusion, camera follow/bounds/transitions and resolution handling. | The supported scene corpus renders correctly after migration and in exported games. Browser games contain no editor dependency. Render diagnostics expose supported draw/batch/timing measurements. |
| S06 | Lighting and effects: ambient and point lights, sprite/tile tint and emissive effects, authored 2D shadow occluders, bounded particles, rain/fog presets and a day/night presentation cycle. Postprocessing is limited to color grading and bloom. | Quality tiers can reduce or disable costly effects; light/occluder/particle limits are documented and benchmarked. Effects are controlled by data/events and clean up on scene/chunk changes. No photorealistic global illumination, volumetric renderer or arbitrary shader editor. |
| S07 | Asset and animation pipeline: PNG/JPEG/WebP assets, stable references and dependency tracking, import/reimport, spritesheet slicing, regions/pivots/pixels-per-unit, directional clips, transitions and animation events. | Reimport preserves references. An authored character walks, attacks, takes damage and dies with correctly timed gameplay/audio events. Missing resources produce actionable errors. Original source assets and licenses are tracked. |
| S08 | Combat and progression: one authoritative stats/health flow, melee/ranged attacks, dodge, startup/active/recovery, cooldowns, hit-once rules, damage/resistance, status effects, stagger, knockback, combos and death/retry. Inventory, equipment, consumables, loot, currency, XP and levels use validated definitions. | Included archetypes and abilities are configured through data. Simultaneous hits, repeated rewards, inventory limits, death/retry and save/reload have behavioral tests. Defaults do not require encounter-specific engine code. |
| S09 | Ability composition: a fixed reusable node vocabulary for target/filter, sequence/condition, projectile, area effect, damage/heal, status, knockback, timed action and presentation cues. | A creator authors the three proof abilities using these nodes without editing engine code. Invalid/cyclic/unbounded definitions are diagnosed and execution is budgeted. This is not a general visual programming language. |
| S10 | Environmental simulation: authored material properties and interaction rules, localized cell-based fire and simplified water flow, wet/burning/charred states, extinguishing, terrain/audio/traversal metadata and persistent changes. | Fire spreads only through configured local rules, water affects traversal and can extinguish it, and typed events reach AI/story/presentation. Conductivity and viscosity are queryable rule properties; dedicated global fluid, electrical-circuit or structural solvers are excluded. Distant chunks use reduced or aggregate updates with explicit exclusions. |
| S11 | NPC and enemy AI: archetypes, perception/knowledge, utility decisions, schedules/activity points, basic needs/goals, factions/reputation, structured memory/relationships, navigation, combat actions and ambient simulation budgets. | NPCs follow authored schedules and react to perceived danger rather than receiving omniscient world state. A trace explains observations, scores, chosen actions and changed facts. Structured memory is bounded; no free-form human simulation. |
| S12 | Narrative and world rules: dialogue and quest graphs, typed conditions, branching choices, world/faction/NPC fact queries, one-time rewards and simple ordered cutscene steps. | A world event changes a quest branch and dialogue, survives reload and cannot award twice. The included cutscene steps are movement, dialogue, camera, animation, wait and event; no cinematic production suite. |
| S13 | Game UI and audio: anchored/container layouts, text/images/buttons/bars/lists/fields, wrapping/scaling, themes, focus/input navigation and accessibility basics; title, New/Continue, pause, settings, HUD, inventory/equipment, quest/dialogue, death/victory and credits flows. Master/music/SFX/UI buses, volume persistence, sound concurrency, loops/crossfades and loading/disposal. | The entire proof project is usable through ordinary controls, including keyboard/controller focus and remapping for its actions. Input capture separates editor, menus and gameplay. Audio does not duplicate after transitions/retries; settings persist separately from world progress. |
| S14 | Persistence and recovery: versioned project/save schemas and tested migrations, world/player/NPC/chunk state, save slots/checkpoints, corruption/incompatibility diagnostics, safe writes and recovery. | Restart and Continue restore location, progression, inventory, quests, schedules, modified chunks and required world flags. Interrupted/rejected writes do not silently lose authored or saved state. |
| S15 | Triton authoring: reliable scene tools and nested transforms; shared undo/redo, multi-edit, hierarchy, typed searchable Inspector/resource selection; tile/elevation/semantic painting; reusable prefabs/overrides; authored UI preview; combat, AI, story and simulation editors; validated extension hooks. Safe hot reload and Play/Stop separation. | A creator imports assets, paints a river, places a tavern template, configures actors, composes an ability/quest, plays, saves/reopens and exports through supported tools. These are workspaces within the existing shell, not seven separate editor rewrites. Each automatic default exposes its source, enable/disable control and override. |
| S16 | Diagnostics, performance and testing: actionable errors/source links, runtime inspection, event/rule/AI traces, CPU/frame-time/memory/resource counters, controlled replay, representative benchmarks and regression suites. | Profile before optimizing. Correctness and frame-rate evidence are reported separately. Target 1280x720/60 FPS on a recorded reference desktop/laptop and 30 FPS on one recorded mid-range Android Chrome profile at reduced quality, using the fixed proof workload. Report frame-time percentiles, load stalls and hardware; no universal FPS or enemy-count guarantee. |
| S17 | Delivery and creator onboarding: reproducible standalone browser export, packaged Windows editor, safe project-root file handling, templates, schema/API documentation and a verified default sample. | Export runs from a clean static host without the repository/editor. Windows editor opens without a compiler toolchain. Normal project/browser entry points open the current sample. A second village is authored using existing data/tools without new engine code. |

## Work that needs no new Triton UI

"No UI" here means no new editor panels or layout work. Graphics, audio and game-UI runtimes can still be implemented and verified with small programmatic browser scenes before their authoring controls exist.

| Order | Backend task | Scope IDs and proof |
| --- | --- | --- |
| 1 | Reconcile lifecycle, state ownership, resource paths and project-module loading; validate schemas and references. | S01/S07/S14/S17. Same project loads in browser, editor and export; repeated switches do not leak or change authored data. |
| 2 | Establish typed world events, authoritative facts and ordered condition/effect rules. | S01/S10/S11/S12. Headless ability-to-fire-to-NPC-to-quest integration fixture with traceable provenance and overrides. |
| 3 | Complete collision/movement contracts, fast-projectile checks and indexed nearby queries. | S02/S04. Regression corpus covers contacts, masks, tunneling, blocked routes and stable ordering. |
| 4 | Implement chunk data, prefetch/unload, stable ownership and persistent changes. | S03/S14. Automated cross-boundary travel/save/reload without duplicate entities or lost state. |
| 5 | Complete navigation, obstacle updates, local avoidance and request budgets. | S04. Scripted congestion and unreachable-destination fixtures plus cost/timing profiles. |
| 6 | Build the WebGL2 renderer compatibility path, culling, batching and render counters. | S05/S16. Small programmatic visual regressions and recorded frame timings; no new editor workspace needed. |
| 7 | Build lighting, shadows, particle/weather presets and quality tiers. | S06/S16. Standalone lit/effect scenes, screenshots, resource-cleanup and performance checks. |
| 8 | Implement sprite/atlas import metadata, animation playback/state transitions and events. | S07. Programmatic actor test proves attack timing and stable reimport references. |
| 9 | Complete combat/RPG state and the fixed ability executor. | S08/S09. Data-only combat scenarios cover invalid hits, projectiles, status, equipment and rewards. |
| 10 | Implement bounded fire/water/material simulation and distant updates. | S10. Seeded cell fixtures prove spread, flow, extinguishing, persistence and update budgets. |
| 11 | Complete NPC schedules, utility actions, perception, factions and bounded memory. | S11. Headless schedule/danger/faction fixtures and readable decision traces. |
| 12 | Implement dialogue/quest condition evaluation and one-time consequences. | S12. Branching narrative fixtures use shared world facts and survive reload. |
| 13 | Complete declarative game-UI layout/focus and audio buses/lifecycle. | S13. Small browser examples test focus, input capture, scaling, mixing and transitions. |
| 14 | Complete save migrations/recovery, deterministic test replay and export validation. | S14/S16/S17. Restart/migration/failure tests and an exported-build smoke test. |
| 15 | Optimize only measured bottlenecks and verify long-session cleanup. | S16. Compare the same workload before/after with frame-time, CPU, memory and allocation evidence. No unmeasured pools/caches or renderer rewrite justified only as "optimization." |

These tasks can be implemented before editor controls, but a backend-only implementation does not close S15 or the creator acceptance workflow.

## Fixed proof project and completion gates

The proof content is one village, one adjacent dungeon, 10-20 NPCs, three enemy archetypes, three composable player abilities, one phased boss, one branching quest and one local fire/water interaction. Use coherent licensed or original assets, working animation/audio/UI and an ending. A second village must be constructible without new engine code. A larger commercial-length game is not a release-one requirement; playtime is measured, not padded to satisfy a stopwatch.

Required end-to-end checks:

1. Painting a river supplies its configured visuals, traversal and water metadata.
2. Placing the tavern template creates editable activity points/doors/default schedule affordances. This is a reusable authored template, not automatic understanding of arbitrary buildings.
3. A data-authored fire ability ignites configured material; nearby NPCs perceive it and choose a defined reaction.
4. That world event changes a branching quest/dialogue condition and survives save/reload.
5. A creator composes the other proof abilities using supported nodes without custom engine code.
6. Chunk traversal, unload/reload, save recovery and repeated Play/Stop preserve the correct state.
7. Game menus, progression, inventory, death/retry and the ending work through ordinary input.
8. Desktop/mobile benchmark targets, diagnostics and documented limits are checked on their recorded profiles.
9. The packaged editor and exported browser game work independently of the development checkout.
10. A fresh creator follows the documented workflow and builds the second village without live assistance or engine changes.

A feature is complete only when its shared schema/data contract, runtime behavior, persistence/lifecycle, applicable authoring controls, tests and actual supported workflow agree. Existing code is evidence to reuse, not evidence that an entire scope ID is finished. Development-browser stubs, built-browser acceptance and native file persistence are different checks.

## Exclusions and change control

- No general-purpose 3D engine, isometric/rotatable alternative world mode, WebGPU backend, multiplayer, console support or additional editor platform.
- No global physically accurate fluids, deformable/structural physics, ragdolls or full rigid-body constraint/joint framework.
- No open-world procedural generation, crafting/farming/economy expansions, large skill trees or additional game genres.
- No runtime generative-AI requirement, GOAP/behavior-tree alternatives, social-life simulator or arbitrary natural-language NPC knowledge.
- No arbitrary visual programming, shader graph, cinematic suite, plugin marketplace or editor-shell rewrite.
- No new feature created solely to make the demo longer or a panel look busier.

All implementation tasks must reference S01-S17. Fixes, compatibility adapters, migrations, tests and measured optimizations remain within their existing ID. New capabilities outside these boundaries require the user's explicit approval for a separately versioned scope; agents must not append them automatically to this release. Scope changes must state what is added and what is removed or delayed. Expanding proof content is not a substitute for finishing reusable systems.

## SRS coverage

- FR-W01-W06: S02-S04/S07/S14/S15.
- FR-R01-R04: S05-S07/S16; WebGPU remains excluded for release one.
- FR-C01-C04: S01/S08/S09.
- FR-S01-S04: S01/S03/S10.
- FR-A01-A05: S01/S04/S11/S16.
- FR-N01-N03: S12/S14/S15.
- FR-E01-E05: S01/S07/S14/S15/S17.
- NFR-01-NFR-08: S01/S03/S14-S17 and the completion gates above.

The SRS's weekend table is sequencing guidance, not an additional scope or a completion-date promise. This contract makes no implementation estimate from the existence of current modules.
