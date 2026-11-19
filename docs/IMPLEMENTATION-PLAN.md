# Neptune release-one implementation plan

Updated November 19, 2026. This is the active task queue, grouped by engine subsystem. [LOCKED-SCOPE.md](LOCKED-SCOPE.md) owns feature boundaries; this plan decomposes S01-S17 without adding scope. [ROADMAP.md](ROADMAP.md) preserves historical delivery evidence. README describes current capability, not completion of this queue.

## Picking and completing a task

Every row starts **Open / needs verification**. Existing code must be inspected and reused; Open does not mean absent. A task may be marked Verified only with current behavioral evidence for its entire acceptance condition. Partial implementation stays open with its remaining work recorded.

Before editing, add a task record under the claim log with: task ID, status (Claimed/Blocked/Verified), owner/date, exact file ownership, prerequisite IDs, shared API/schema decisions, implementation checklist, checks and evidence, remaining limitations. Claim only one bounded task or explicitly named compatible batch. Check other claims before modifying shared files. New claims expire only through an explicit handoff, not an assumption that another agent stopped.

1. Read AGENTS.md, README, this plan, locked scope, git status and recent commits. Preserve unrelated user edits.
2. Confirm prerequisite contracts and identify existing implementations/tests. Shared contract changes must be resolved before dependent agents proceed.
3. Implement runtime behavior, validation, lifecycle/disposal and persistence as applicable. Retain public imports and serialized names/IDs unless a tested migration is included.
4. Add focused behavioral regressions, including relevant edge cases below. These examples are not exhaustive. Source-string assertions do not establish functional acceptance.
5. Run focused checks, then the integrated npm test baseline for implementation changes. Editor: build/lint plus real browser interactions. Native: locked cargo checks/relevant tests plus actual filesystem smoke when needed. Docs: docs and docs-contract checks; keep unrelated generated output out of commits.
6. Record evidence and limitations, update current status truthfully, inspect diff --check/status, and hand off. No publishing or push without session authorization.

Runtime code belongs in src; Triton authoring/native code stays separate. Game content belongs in project data/scripts. Keep the compact raised/inset editor style. No third collision or health subsystem. Public browser imports currently initialize the Application; headless tests need appropriate mocks.

## Dependencies and ownership

Directory names below identify primary ownership, not permission to edit every file in a directory. Each claim must name exact files and its focused tests. Shared registry/export/schema files require coordination. New module names or relocations require a contract decision, not a speculative reorganization.

CORE contracts precede consumers. Physics/spatial queries and assets precede world/navigation integration. World/facts/combat contracts feed abilities, simulation, AI and story. WebGL2 rendering precedes GPU lighting/effects. Persistence is developed alongside each state-owning system. Editor controls follow stable schemas; diagnostics and tests accompany all stages. Final proof and packaging require the integrated systems.

Do not assume rows in one subsystem are independent. In particular CORE, PHYS broadphase, WORLD/NAV, RENDER/FX, COMBAT/ABILITY and SAVE consumers share contracts. Independent file ownership alone does not resolve API dependencies.

## 1. Core engine (S01)

Primary ownership: src/core, src/components, src/scripts. Prerequisites: none for contract definition; consumers must use agreed contracts.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| CORE-01 | Lifecycle, activation, parenting, destruction | Correct start/update/disposal; removed objects leave runtime registries | Destroy during update; disabled parent; active reparent; double destroy |
| CORE-02 | Fixed ticks, pause/time scale, seeded randomness | Documented timing; controlled seed/tick scenarios reproduce outcomes | Long frame; zero delta; suspended tab; pause mid-attack |
| CORE-03 | Typed events, authoritative facts, ordered rules | Shared state and predictable ordering; subscriptions clean up | Self-removing listener; recursive event; duplicates; conflicting rules |
| CORE-04 | JS/TS project module build/loading/reload and API compatibility | Browser/editor/export loading and disposal; stable public imports and serialized IDs | Missing module; failed reload; stale async callback; same script name in different projects |

## 2. Input (S01/S13)

Primary ownership: src/input. Prerequisites: CORE-01/02 and agreed input-context contract.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| INPUT-01 | Actions and gameplay/menu/editor contexts | Configured devices work; active context owns capture | Typing moves player; quick tap; focus loss |
| INPUT-02 | Remapping, device changes, saved bindings | Valid settings persist; conflict policy documented | Disconnect; duplicate binding; corrupt settings; held key during remap |
| INPUT-03 | Pointer/touch coordinate conversion and compatibility | Correct coordinates across camera, viewport and display scaling | High DPI; zoom/pan; resize; canceled touch |

## 3. Nereid physics (S02)

Primary ownership: src/nereid and existing collider adapters. Prerequisites: CORE-01/02; agree world-unit/height and query contracts.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| PHYS-01 | Nereid/BoxCollider reconciliation | One supported top-down path; documented legacy compatibility | Mixed colliders; disabled body; scaled parent |
| PHYS-02 | Solid resolution, masks, triggers, contacts | Correct movement and enter/stay/exit semantics | Corners; overlapping spawn; removal in callback; asymmetric masks |
| PHYS-03 | Fast projectiles, knockback, hazards, elevation | No tunneling within documented speed/timestep bounds; consistent traversal | Thin wall; long step; knockback into wall; overlapping different heights |
| PHYS-04 | Spatial broadphase and nearby queries | Correct updates and result ordering; measured improvement without behavior changes | Negative cells; boundary; huge collider; teleport; unload |

## 4. Thalassa world (S03)

Primary ownership: src/thalassa and world/scene schemas. Prerequisites: CORE contracts, PHYS query/height contracts; coordinate persistence with SAVE.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| WORLD-01 | Semantic tiles/layers/elevation/zones | Validated visual, traversal, material and interaction metadata | Unknown tile; missing layer; invalid elevation; override conflict |
| WORLD-02 | Chunk ownership, async loading/prefetch/unload | No duplicates or stale loads into another scene; bounded normal traversal stalls | Rapid crossing; slow request; canceled load; unload during spawn |
| WORLD-03 | Portals, entries, persistent chunk changes | Valid destinations; modified terrain/objects survive unload/reload | Missing destination; blocked spawn; portal loop; destroyed object respawn |

## 5. Thalassa navigation (S04)

Primary ownership: existing navigation modules in src/thalassa. Prerequisites: PHYS query contracts, WORLD-01/02 for cross-chunk integration.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| NAV-01 | Weighted paths, height/traversal rules, chunk links | Routes obey costs and permissions | Unreachable goal; same start/goal; illegal diagonal; unloaded goal |
| NAV-02 | Dynamic obstacles, invalidation, local avoidance | Defined reactions to changed routes and congestion | Closing door; narrow doorway; actor swap |
| NAV-03 | Request budgets, cancellation, scheduling | Bounded frame work; stale requests discarded | Request burst; destroyed requester; moving goal |

## 6. Rendering and camera (S05)

Primary ownership: src/rendering and existing camera/render integration. Prerequisites: CORE and ASSET contracts; explicit WebGL2 compatibility corpus before migration.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| RENDER-01 | WebGL2 sprites/tiles/shapes/supported text | Existing supported scenes render correctly; clear unsupported-hardware diagnostic | Alpha edges; missing texture; context loss; resize |
| RENDER-02 | Atlas batching, visible culling, GPU disposal | Correct order; less offscreen work; resource cleanup | Atlas edge; negative scale; large partial sprite; repeated loads |
| RENDER-03 | Depth/Y/elevation ordering and occlusion | Predictable character/terrain/foreground overlap | Equal depth; nested transforms; bridge; roof |
| RENDER-04 | Camera follow/bounds/transitions/resolution | Stable camera across sizes and scene changes | Small world; teleport; interrupted transition; high DPI |

## 7. Lighting and effects (S06)

Primary ownership: renderer/effect modules; name exact files before claim. Prerequisites: RENDER contracts and CORE lifecycle.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| FX-01 | Ambient/point lights, tint/emissive, 2D shadow occluders | Consistent data-authored results within measured limits | Light in occluder; overlapping lights; zero radius; moving occluder |
| FX-02 | Bounded particles, rain/fog, day/night presentation | Event-driven effects dispose on scene/chunk changes | Destroy mid-burst; extreme spawn count; pause/resume |
| FX-03 | Quality tiers, bloom, color grading | Disable/reduce cost without breaking gameplay visibility | Live quality switch; resize targets; all effects off |

## 8. Assets and Titan animation (S07)

Primary ownership: resource-loading modules, src/titan and import metadata. Prerequisites: CORE lifecycle/schema contracts; editor import UI belongs to EDIT.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| ASSET-01 | PNG/JPEG/WebP import/reimport, stable refs, dependencies, rooted paths | Reimport/export preserve refs; errors identify source; licenses/original sources tracked | Rename; malformed image; case-sensitive host; project switch mid-load |
| ASSET-02 | Slicing, regions, pivots, pixels-per-unit | Metadata agrees between preview and runtime | Partial sheet row; bad region; offset pivot; changed dimensions |
| ANIM-01 | Directional clips/transitions/playback/events | Walk/attack/hit/death with documented loop/interruption semantics | Skipped frame; zero duration; interrupted attack; duplicate loop event |

## 9. Proteus sound/music (S13)

Primary ownership: src/proteus, src/audio. Prerequisites: CORE lifecycle, asset loading; coordinate preferences with SAVE.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| AUDIO-01 | Master/music/SFX/UI buses, saved volumes | Correct composed gain; preferences separate from progress | Muted parent; invalid volume; settings before unlock |
| AUDIO-02 | Concurrency, existing pooling, loading/disposal | Defined limits; no orphan audio after transitions | Hit burst; decode failure; stop before load finishes |
| AUDIO-03 | Music loops/fades/crossfades/ownership | One intended music state across menus/combat/scenes | Rapid switches; interrupted fade; pause; autoplay restriction |

## 10. Larissa combat/RPG (S08)

Primary ownership: src/larissa. Prerequisites: CORE timing/events, PHYS, INPUT; SAVE integration in parallel.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| COMBAT-01 | Authoritative health/stats/damage/resistance | Combatant/Stats use one health source and explicit rules | Simultaneous lethal hits; healing dead actor; invalid damage |
| COMBAT-02 | Melee/ranged/dodge/phases/cooldowns/hit-once/stagger/combos | Data-driven timing/cancel/invulnerability rules | Multi-frame overlap; death during startup; dodge ends in hazard |
| RPG-01 | Inventory/equipment/consumables/loot/currency | Valid transfers/stat changes without duplication | Full inventory; last item; incompatible equipment; reload during pickup |
| RPG-02 | XP/levels/statuses/death/retry | Defined stacking/progression and persistent state | Multiple levels; expiry while paused; death with buff; repeated retry |

## 11. Ability runtime (S09)

Primary ownership: existing combat/ability modules; agree exact files. Prerequisites: COMBAT, PHYS and CORE rule contracts.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| ABILITY-01 | Validate fixed targeting/filter/sequence/condition/effect nodes | Useful source/node diagnostics for invalid definitions | Missing node; unknown effect; cycle; wrong target type |
| ABILITY-02 | Budgeted timing/execution/cancellation/presentation | Three proof abilities use data, not encounter-specific engine code | Dead caster; missing target; scene change during delay; budget exceeded |

## 12. Environmental simulation (S10)

Primary ownership: bounded runtime simulation modules and material data contracts; no new general physics framework. Prerequisites: WORLD, CORE rules, SAVE contract.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| SIM-01 | Material properties and wet/burning/charred rules | Properties drive traversal/interactions/events; conductivity/viscosity are queryable, not global solvers | Missing material; conflicting states; repeated ignition; disabled override |
| SIM-02 | Local cell fire and simplified water/extinguishing | Seeded fixtures and explicit update limits | Chunk boundary; enclosed water; removed source; simultaneous ignite/extinguish |
| SIM-03 | Distant updates and persistence | Documented reduced simulation and saved state | Long absence; save mid-update; boundary reload; catch-up budget |

## 13. NPC/enemy AI (S11)

Primary ownership: existing AI modules and project archetypes. Prerequisites: CORE facts, PHYS queries, NAV, WORLD.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| AI-01 | Archetypes/perception/knowledge/bounded memory | Actors act on available observations, not omniscient state | Danger behind wall; forgotten observation; missing target; memory limit |
| AI-02 | Utility scoring/actions/decision traces | Explain decisions and clean up interrupted actions | Equal scores; no action; target switch; repeated failure |
| AI-03 | Schedules/activity/needs/goals/factions/relationships | Authored routines/danger reactions persist with bounded ambient work | Missed appointment; occupied point; midnight; faction change |

## 14. Galatea story (S12)

Primary ownership: src/galatea and existing quest/world-rule modules. Prerequisites: CORE facts/events, SAVE; AI/world integration through contracts.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| STORY-01 | Dialogue/quest graphs, conditions/branches | Shared facts; invalid references/unsupported cycles diagnosed | Missing node; contradictory conditions; absent speaker |
| STORY-02 | Persistent consequences/one-time rewards | World event changes branch; reload cannot repeat reward | Duplicate event; save at completion; full inventory |
| STORY-03 | Move/dialogue/camera/animation/wait/event cutscene steps | Finish/cancel restores camera/input ownership | Destroyed actor; scene interruption; paused wait; failed move |

## 15. Game UI runtime (S13)

Primary ownership: src/ui and game-flow integration in project scripts. Prerequisites: INPUT, CORE, ASSET, SAVE; one primary HTML/DOM authoring path with legacy API compatibility.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| GUI-01 | Layout/widgets/themes/shared preview schema | Text/images/buttons/bars/lists/fields wrap/scale consistently | Long text; empty list; missing image; small viewport |
| GUI-02 | Focus/navigation/capture/accessibility basics | Keyboard/controller navigation; menus capture gameplay actions correctly | Removed focused control; duplicate modal; disconnect |
| GUI-03 | Title/New/Continue/pause/settings/HUD/inventory/equipment/quests/dialogue/death/victory/credits | Complete ordinary-input proof-project flows | No save; death with menu; double New; return to title |

## 16. Persistence/recovery (S14)

Primary ownership: src/core save/storage/loader and native persistence adapter; exact file coordination required. Prerequisites: CORE schemas; each state owner supplies a contract.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| SAVE-01 | Versioned schemas/references/migrations | Supported old data loads; incompatible data gives useful errors | Future version; duplicate ID; dangling ref; partial migration |
| SAVE-02 | Player/world/NPC/chunk snapshots/slots/checkpoints | Continue restores required state without changing authoring | Combat save; unloaded changes; multiple slots; different project IDs |
| SAVE-03 | Safe writes/failure reporting/recovery | Previous valid data or documented recovery survives failure | Disk full; denied permission; truncated file; concurrent save |

## 17. Triton authoring (S15)

Primary ownership: triton/src and relevant native commands. Requires editor UI work. Prerequisites: runtime/schema contracts for each tool; preserve the existing shell/style.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| EDIT-01 | Scene tools/nested transforms/selection/undo-redo | Geometry and reversible transactions agree | Rotated/scaled parent; canceled drag; undo deletion; zoom/DPI |
| EDIT-02 | Hierarchy/multi-edit/typed searchable Inspector/resources/script settings | Valid edits serialize and reopen; mixed selections handled | Mixed components; invalid value; missing script; duplicate IDs |
| EDIT-03 | Semantic/elevation painting/prefabs/overrides | River/tavern workflows produce editable data with provenance, enable/disable and overrides | Undo paint; missing base; override conflict; reimport |
| EDIT-04 | Animation/audio/effect controls and UI preview | Authors configure supported features; preview agrees with runtime | Missing asset; preview restart; invalid event; blocked audio |
| EDIT-05 | Ability/AI/story/simulation workspaces | Proof behaviors authored without engine changes | Bad graph; broken reference; disabled rule; undo/save/reopen |
| EDIT-06 | Hot reload/extensions/Play-Stop isolation | Gameplay cannot overwrite authoring; failures dispose safely | Script exception; stop during load; removed extension; project switch |

## 18. Diagnostics/performance/testing (S16)

Primary ownership: runtime diagnostics, tests and benchmark scripts; name exact files. Starts with CORE and continues throughout delivery.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| QA-01 | Errors/source links/inspection/event-rule-AI traces | Creator locates invalid data and explains decisions | Exported error; unloaded source; bounded trace overflow |
| QA-02 | Controlled replay and behavioral corpus | Seed/tick outcomes reproduce; nondeterministic boundaries documented | Different render rate; async loads; replay version mismatch |
| PERF-01 | Workload and frame/resource measurements | Recorded hardware/quality/percentiles/stalls/memory/resource counts | Cold load; border crossing; busy combat; long session; repeated Play/Stop |
| PERF-02 | Profile-led optimization/regression limits | Equivalent behavior with comparable before/after evidence | Dense collision; offscreen map; route burst; effect overload |

Performance targets: 1280x720 at 60 FPS on a recorded reference desktop/laptop; 30 FPS on one recorded mid-range Android Chrome profile at reduced quality. Define workload, warm-up, duration and frame-time criteria before assessing pass/fail. Record missed targets honestly. Occupied-cell correctness tests are not FPS benchmarks. Do not add pools/caches without measured need.

## 19. Delivery/docs/templates (S17)

Primary ownership: build/export scripts, native packaging, docs and templates. Prerequisites: exported runtime compatibility and relevant state contracts.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| SHIP-01 | Standalone browser export and module build | Clean static host needs no editor/repository | Subdirectory host; spaces; missing resource; case-sensitive host |
| SHIP-02 | Packaged Windows editor/root-safe file operations | No compiler needed; paths stay within allowed project roots | Traversal; symlink escape; read-only project; Unicode path |
| SHIP-03 | Default sample/templates/API/schema/migration/creator docs | Normal entries open current sample; clean setup follows docs | Stale startup scene; missing dependency; unsupported save |

## 20. Emberfall proof (S01-S17 integration)

Primary ownership: examples/emberfall project content/scripts, not engine internals. Prerequisites: integrated supported runtime and creator workflows; compose continuously rather than wait until the end.

| ID | Work | Acceptance | Example edge cases |
| --- | --- | --- | --- |
| DEMO-01 | Village/dungeon, 10-20 NPCs, 3 enemy archetypes, 3 abilities, phased boss/ending | Complete loop with coherent licensed/original art, animation, sound/UI | Death in each area; alternate branch; revisit after boss |
| DEMO-02 | Fire -> NPC perception/reaction -> quest consequence | Authored cross-system interaction survives reload | Absent NPC; early extinguish; repeated event; unloaded chunk |
| DEMO-03 | Independent creator/release verification | Fresh creator builds second village without engine edits; packaged editor/export work independently | Fresh profile; no dev tools; documentation-only workflow |

## Scope coverage and stop condition

S01: CORE/INPUT; S02: PHYS; S03: WORLD; S04: NAV/PHYS-04; S05: RENDER; S06: FX; S07: ASSET/ANIM; S08: COMBAT/RPG; S09: ABILITY; S10: SIM; S11: AI; S12: STORY; S13: INPUT/AUDIO/GUI; S14: SAVE; S15: EDIT; S16: QA/PERF; S17: SHIP. DEMO verifies integration and all locked end-to-end gates, including river painting, tavern template and second-village authoring.

No 3D, alternate isometric/rotating world mode, WebGPU, multiplayer, global fluid/electrical/structural solver, GOAP/behavior-tree alternative, runtime LLM requirement, arbitrary visual programming/shader graph, marketplace, shell rewrite or content padding. Stop when this queue and locked acceptance gates are verified. New capability requires explicit user scope approval with what is removed/delayed.

## Claim log

No tasks claimed in this planning update. Add claim records here using the required fields above; do not mark a whole subsystem complete because one task passed.
