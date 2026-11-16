# Neptune 2D engine, Triton editor, and ARPG delivery plan

Updated November 16, 2026. This is the active delivery plan. README links here and tracks milestone status. It extends the initial vertical-slice product contract into a bounded small-game release; historical closed issues and an implemented runtime API are not completion evidence.

## Outcome and scope

Deliver a reliable 2D entity-component engine, a usable Windows editor, and a complete small top-down ARPG made through their supported workflows. Finish 2D before planning or implementing 3D. Keep Entity/components/children, Transform, Scene/SceneManager, and Behaviour composition.

Three distinct outcomes:

1. **Current starter:** Emberfall is one room with placeholder shapes, melee guardians, an altar and saves. It is not the finished demo or game. There is no proper menu flow yet.
2. **First polished vertical slice:** 10–15 minutes demonstrating the intended visual/audio/gameplay quality, menus and an end-to-end adventure. Engine and editor proof scenes are developed before and alongside integration.
3. **Small complete release:** approximately 30–60 minutes of intentional content, using a reusable ARPG toolset and passing the release acceptance below. This is the estimate baseline, not a promise of a commercial-scale game.

“Fully featured” for this release means spritesheets/animation, input actions, movement/collision/navigation, combat and AI, world transitions, RPG data, sound/music, effects, game menus/UI, robust persistence, useful authoring tools, debugging, packaging and documentation. It does not mean reproducing every Godot/Unity feature.

No multiplayer, 3D, custom low-level renderer, massive procedural/open world, cinematic pipeline, console ports or marketplace in this release. Crafting, complex economy, farming, procedural generation and elaborate skill trees require a separate scope decision. Prefer a small amount of finished content over expanding systems indefinitely.

## Estimate and assumptions

Planning ranges, not calendar commitments. Count focused engineering days with regular review/playtesting. AI can accelerate edits, but cannot remove integration, asset, debugging and acceptance work. Work proceeds in active development sessions; these numbers do not imply unattended continuous work between chats.

| Target | Initial effort range |
| --- | --- |
| Immediate viewport interaction repair and first theme/layout pass | 2–4 engineering days |
| Polished 10–15 minute vertical slice, reusing verified existing systems | approximately 4–8 focused development weeks |
| Reliable engine/editor plus the bounded 30–60 minute game | approximately 12–22 focused development weeks including contingency |
| Several-hour game plus broader production tooling and original content | roughly 6–12+ months, requiring a new content/asset estimate |

The detailed phases below total roughly 52–86 engineering days before contingency, with some integration overlap. Schedule uncertainty is currently high. Re-estimate after P1 and again after the vertical slice; publish measured progress and revised remaining work rather than defend the original estimate.

Assumptions: one coherent art direction; reuse licensed assets initially; a limited world/content count; Windows editor and browser game first; one supported gameplay model; no major renderer rewrite; timely user decisions. Custom art, hand-drawn animation, voice acting, extensive music composition and large story/content production are not included in the engineering range. Asset availability can become the critical path.

## Current evidence and gaps

- Existing engine modules cover most broad runtime categories. Verify, reconcile and reuse them rather than replace everything.
- Actual Windows acceptance covers project open, transform edit, file save/reopen, entity activation, project gameplay loading, keyboard movement, gameplay saves and playback. See windows-workflows.md.
- Startup watcher repair, quick-key input and project behaviour loading are implemented. These do not establish complete editor usability.
- The supplied screenshot demonstrates a misplaced gizmo. Code inspection shows scene overlays and drag paths mix transform units with camera pixel coordinates. Root cause must be verified with a real viewport regression before calling it repaired.
- Viewport picking exists, including a render-aware Game View picker. The Scene View must use correct coordinates, visible geometry and draw order. A new gameplay collision subsystem is not the solution to editor selection.
- Basic gizmos, hierarchy operations, inspector editing and tile painting already exist. Precision, safety, composition, reuse and authoring completeness remain limited.
- Some visible controls/layouts are unfinished. An Add Component button must perform its advertised operation; an Inspector named Timeline does not count as an animation editor.
- Stats/Combatant and BoxCollider/Nereid paths overlap. Consolidation remains necessary.
- ProjectBehaviour supports injected APIs and project-root module loading; relative module imports and specialized settings authoring remain limited.

## Delivery order and effort

| Phase | Focus | Rough engineering effort | Depends on |
| --- | --- | --- | --- |
| P0 | Correct viewport tools; coherent visual/layout foundation | 2–4 days | Current baseline |
| P1 | Safe, usable editor authoring | 5–8 days | P0 |
| P2 | Consistent runtime and project contracts | 5–8 days | P0; coordinate contract shared with P1 |
| P3 | Sprites, animation, sound, music and feedback | 8–12 days | P1/P2 contracts |
| P4 | World, tilemap and reusable-content authoring | 5–9 days | P1/P2 |
| P5 | ARPG mechanics and gameplay-data tools | 8–12 days | P2; P3/P4 integration |
| P6 | Menus, UI, settings and persistence | 6–10 days | P2/P5; prototype menus earlier |
| P7 | Build and polish the actual adventure | 8–15 days | Proven systems; integrate continuously |
| P8 | Performance, compatibility, packaging and release candidate | 5–8 days | Complete loop; profile earlier too |

These are dependency gates, not nine isolated waterfall projects. Keep a runnable build and proof scenes throughout. A minimal title/pause/retry shell should appear during the vertical slice, not wait until all tooling is finished. P8 formalizes release checks; testing and profiling start earlier.

## P0 — viewport, selection, gizmos, theme and layout

### Coordinate correctness and editor picking

- [x] Define the root-level conversion contract: transforms/bounds use world units; rendering and camera pan use pixels; convert at named boundaries with 64 pixels per world unit.
- [x] Correct root-level gizmo origins, selection outlines, collider overlays, drag deltas and Frame Selection together.
- [x] Derive picking from rendered geometry/camera transforms, including zoom and pan; verify the actual viewport against the runtime camera.
- [ ] Complete nested renderable-parent gizmo/overlay editing and full rotated/scaled authoring acceptance. Picking accounts for render composition; overlays and edits still use local transforms for nested renderable parents.
- [x] Click visible objects directly in Scene View. Respect draw order, active state and selection locks; support Shift/Ctrl additive selection and empty-space deselection.
- [x] Keep editor hit testing independent of gameplay physics. Objects can be selectable without having colliders.
- [x] Prevent a giant floor or background from unexpectedly stealing a foreground selection.
- [x] Keep selection synchronized between viewport, hierarchy and Inspector.

### Tool interactions

- [x] Q: view/hand tool. W: move. E: rotate. R: scale. T: center-based rect/resize. Y: combined transform.
- [x] Show a compact toolbar with active-tool state, tooltips and shortcuts. Render the active tool's handles instead of every gizmo at once.
- [x] Ignore tool shortcuts while typing, editing a field, using a dialog or controlling Game View.
- [x] Support free movement and constrained X/Y movement; sensible positive-down behavior for the 2D coordinate system.
- [x] Keep handles a fixed screen size across zoom levels.
- [ ] Tune enlarged invisible hit areas around handles without covering nearby objects; verify dense scenes.
- [x] Pointer capture keeps drags reliable across viewport boundaries; Escape cancels and restores the starting values.
- [x] Add numeric feedback, Shift fine movement, configurable snapping increments and Ctrl temporary snapping.
- [ ] Wire a coarse pointer-drag modifier; coarse delta calculation exists in the helper but is not exposed by Scene View yet.
- [x] Emit begin/commit/cancel events with an immutable starting snapshot for one drag transaction.
- [ ] Connect drag transactions to the P1 undo/redo history.

### Visual system and docking foundation

- [ ] Keep a compact desktop editor direction, with a consistent spacing/type hierarchy rather than decorating every control separately.
- [ ] Refine a dark neumorphic desktop theme using the user's music-player reference: subtle paired light/dark shadows, raised controls and inset fields. Retain clear contrast and compact editor density. The earlier flat graphite/cyan palette proposal is withdrawn.
- [ ] Use Segoe UI/system UI for Windows controls, approximately 12–13px body and 11–12px labels; use tabular numerals for numeric fields.
- [ ] Use restrained control radii and square docking seams; use soft shadows to communicate raised/inset depth without making controls oversized or muddy.
- [x] Preserve the original beveled desktop style: raised gradient buttons, inset fields and compact controls. New viewport icons use 24px square buttons; text buttons fit their labels.
- [x] Fix Dockview color variables to receive valid CSS color values, not raw HSL component strings.
- [x] Prioritize the viewport: starting sidebars around 220px/280px and bottom panels around 180px, with minimum-size constraints.
- [ ] Finish native visual acceptance at multiple window sizes and display scales.
- [x] Repair compact layout at 1024–1536px logical widths with 125% browser-scale checks: readable hierarchy names, usable position fields, viewport and live activity bar. Reapply panel constraints after restoring layouts; verify native maximized-window startup at this machine's 150% scale. Actual Windows 125% setting acceptance remains open.
- [x] Replace static Ready/version filler with live property/value edits marked unsaved and real pending/success/failure file activity; ignore stale save completions after switching scenes.
- [x] Draw root-level rotated rectangle selection as a thin unfilled oriented outline rather than a tinted world-axis bounding box.
- [ ] Resolve flex overflow/clipping, coordinate offsets, resize behavior, contrast, focus rings and selected/hover/disabled states.
- [x] Persist valid complete docked layouts per project and restore/reset them. Reject malformed, stale, floating/popout or incomplete records and use the default workspace.
- [x] Remove or explicitly disable nonfunctional layouts; do not advertise fake specialized editors.

Implemented and verified: root-level coordinate conversion, render-aware picking, Q/W/E/R/T/Y tools, focus-safe shortcuts, drag capture/cancellation, snapping and validated dock persistence/reset. Native scene edits were saved to disk. Browser tests additionally cover pan/zoom and typing guards. Full P0 remains open: nested renderable-parent gizmo editing still uses local coordinates; complete rotated/nested editing and visual acceptance remain. Dock restoration currently accepts complete docked layouts only; floating/popout/incomplete layouts fall back to defaults. Drag transaction events prepare undo integration; they do not implement undo history.

Acceptance: native screenshots at multiple window sizes; click Wanderer in the actual scene; its gizmo and outline align at different zoom/pan values; switch tools with keyboard; drag, cancel and save/reopen; verify typing and Game View input are unaffected. Theme review is performed in the running app, not from CSS alone.

## P1 — safe, productive editor authoring

- [ ] Scene edit commands with undo/redo for transforms, properties, creation, duplication, deletion, reparenting and painting.
- [ ] Group numeric scrubs, drags and brush strokes into single history entries; label commands meaningfully.
- [ ] Accurate dirty state, Save/Save All, unsaved-change prompts, failed-save retry and crash recovery.
- [ ] External-file-change handling with explicit reload/keep-local decisions.
- [ ] Functional searchable Add Component, remove/reset/copy/paste component operations and validation of incompatible additions.
- [ ] Typed component/property schemas: defaults, ranges, units, enums, grouping and tooltips; public type information for AI/external tools.
- [ ] Property search, reset/revert, numeric scrubbing, fine/coarse adjustments, Enter commit/Escape cancel and visible validation.
- [ ] Arrays and nested settings can be edited, reordered and persisted; support ProjectBehaviour settings without manual JSON edits for ordinary tasks.
- [ ] Reliable multi-edit with mixed-value indicators and explicit unsupported cases.
- [ ] Inspector lock, resource picking, drag-and-drop assignment and reveal-in-project.
- [ ] Hierarchy search/filter, reveal selection, create child/sibling/group, selection locks and separate editor visibility/runtime activation.
- [ ] Context-aware shortcuts, command search, shortcut help and predictable keyboard focus.

Acceptance: create an entity, attach/configure a component, duplicate/reparent it, undo/redo, save/reopen and compare the actual native file/runtime. No visible control is accepted merely because it looks functional. Deliberately test failed/rejected saves and unsaved project switches.

## P2 — runtime, input and project contracts

- [ ] Consolidate authoritative health/damage and collision/movement paths; provide compatibility adapters for retained APIs.
- [ ] Fixed simulation timestep with bounded catch-up; render cadence and interpolation separated where needed.
- [ ] Action-based keyboard/mouse/gamepad input, rebinding, pressed/held/released states, focus-loss cleanup and input-context separation.
- [ ] One documented lifecycle for activation, initialization, late-spawned components, destruction and project/scene switches.
- [ ] Explicit editor preview versus game simulation; run project/current scene, restart, pause/step/time scale and defined Stop behavior.
- [ ] Restore authored state after a play session; provide an explicit operation for intentionally keeping selected runtime changes.
- [ ] Versioned `.npt`, scene/resource and gameplay-save schemas, stable IDs, validated references and useful migration failures.
- [ ] Predictable project module dependencies, diagnostics and typed exposed properties, preserving current ProjectBehaviour compatibility.
- [ ] Keep authoring state and gameplay saves distinct. No editor UI or Tauri dependency in games.

Acceptance: the same project works in browser, Game View and exported build; frame-rate variation does not change basic movement/combat timing; repeated play/stop/switch cycles do not leak scripts/listeners or mutate authored scenes.

## P3 — sprites, animation, audio and feedback

### Sprites and animation

- [ ] Asset thumbnails/previews, pixel-art/filtering presets, pixels-per-unit and batch import/reimport.
- [ ] Grid/manual spritesheet slicing, regions, pivots, frame names and transparent-margin handling.
- [ ] Atlas/resource identity stays stable when source images change.
- [ ] Actual timeline: scrub, frame step, keyframe create/move/copy/delete, loop ranges and interpolation.
- [ ] Sprite clips for idle/walk/attack/hurt/death, directional animation and gameplay-driven state transitions.
- [ ] Animation events for hit windows, footsteps, projectiles and sound, with missing-frame/track diagnostics.

### Music, sound and visual feedback

- [ ] Sound preview and basic waveform/range/loop inspection.
- [ ] Master/music/SFX/UI buses, persistent volumes, mute and pause/focus behavior.
- [ ] Music transitions, looping, crossfades, sound concurrency and pitch/volume variation.
- [ ] Spatial-audio range preview where supported; predictable loading/unloading and missing-file errors.
- [ ] Hit flashes, knockback feedback, particles, camera shake and UI response authored as reusable resources.
- [ ] Smooth camera follow, bounds, room transitions, aspect-ratio/resolution handling and pixel-art camera rules.

Acceptance: one authored animated character, synchronized attack impact/sound, looping music, adjustable audio settings and repeated scene transitions without duplicated sounds or abandoned resources. Use licensed/source-tracked assets; runtime support alone does not satisfy authoring acceptance.

## P4 — maps, reusable scenes and world authoring

- [ ] Reusable entity hierarchies/scenes, drag-in instances and isolated editing.
- [ ] Instance overrides, apply/revert, stable child identity and clearly defined shared versus unique resources.
- [ ] Direct viewport tile painting; brush, eraser, line/rectangle, fill, eyedropper, region copy/paste and stamps.
- [ ] Terrain/autotile support, tile variants, rotation/flipping, animated tiles and layer organization.
- [ ] Collision/navigation/hazard/interaction overlays and metadata editing with undo.
- [ ] Spawn markers, destination scene/entry selectors, doorway links and open/test-destination actions.
- [ ] Asset reference tracking and repair on move/rename/delete; duplicate/missing-ID validation.
- [ ] Village, dungeon, encounter and room-transition templates rather than repeated manual setup.

Acceptance: author two connected maps, reusable enemy/chest instances and working transitions in Triton; reopen and play without rewriting editor output. Demonstrate propagating a shared change and preserving a deliberate instance override.

## P5 — combat, enemies and RPG data

- [ ] Melee and ranged attacks, cooldowns, startup/active/recovery, hit-once rules, hurtboxes, invulnerability and damage categories.
- [ ] Dodging, knockback, status effects, death/revive and animation/feedback integration.
- [ ] Enemy perception, patrol/chase/attack/return behaviors, path request budgeting, obstacle handling and encounter activation.
- [ ] At least three enemy archetypes and a clearly telegraphed multi-phase boss.
- [ ] Inventory, stacking, equipment, consumables, loot tables, gold, XP and leveling with one authoritative state model.
- [ ] NPC interaction/dialogue, quest prerequisites/objectives/rewards and world flags; rewards cannot duplicate after reload/re-entry.
- [ ] Enemy, attack, item, loot, quest and dialogue authoring through validated data and appropriate editor forms.
- [ ] Debug overlays for attack phase, hit/hurt geometry, perception, targets, navigation and encounter state.

Acceptance: add an enemy/item/quest variation without engine source changes. Test invalid attacks, simultaneous damage, death/retry, inventory-full behavior, path blockage and reward-once behavior. These are our ARPG tools, not a requirement to copy a third-party engine's class model.

## P6 — complete game UI, menus, settings and saves

- [ ] Title menu: New Game, Continue/Load, Settings, Credits and appropriate Exit/back behavior.
- [ ] Pause menu: Resume, Settings, Return to Title, with unsaved-progress consequences made clear.
- [ ] HUD, inventory/equipment, dialogue/choices, quest journal, interaction prompts and victory/death screens.
- [ ] Loading/transition feedback and actionable error states; no unexplained blank screens.
- [ ] Mouse/keyboard navigation, controller focus, rebinding UI and input capture separated from the editor.
- [ ] Resolution/aspect-ratio previews, anchors/containers, text wrapping, theme resources, focus styling and basic accessibility options.
- [ ] Choose and document a primary UI authoring path; define how Canvas UI and the HTML bridge interoperate.
- [ ] Multiple save slots, autosave/checkpoints, recovery and schema migrations; persist audio/input/display settings separately.
- [ ] Round-trip location, health, inventory, equipment, quests, defeated enemies, opened chests and required world flags.
- [ ] Handle corrupt/incompatible/missing saves and clear/reset operations safely; browser/editor/export storage boundaries documented.

Acceptance: start from a menu, play, pause, adjust audio, save, close/restart, Continue into the correct state, complete the adventure, return to title and start a genuinely fresh game. The menu must be usable without developer instructions or keyboard shortcuts memorized from a README.

## P7 — game content and quality

Proposed small-release content budget, to confirm before production expansion:

- [ ] One safe village/hub, one dungeon with several purposeful rooms and a boss arena.
- [ ] A small named cast, one main quest and a limited optional objective.
- [ ] Three ordinary enemy archetypes, one boss and a small set of meaningful loot/equipment/consumables.
- [ ] Approximately 30–60 minutes of playable content, with a shorter 10–15 minute vertical slice produced first.
- [ ] Consistent licensed art, animated sprites, music, environmental sound, UI sounds and feedback.
- [ ] Teach movement, attack, dodge, interaction and saving through the game itself.
- [ ] Readable encounter cues, movement/camera polish, balanced damage/rewards and useful recovery after death.
- [ ] Coherent title/HUD/menu styling, transitions, credits and a clear ending.

Acceptance: a fresh player can start, understand, finish and reload the game without opening source files, knowing internal controls or receiving live assistance. Test the full route through ordinary input, not only direct mutation of test state.

## P8 — diagnostics, performance and delivery

- [ ] Clickable console stack traces and source navigation; grouped/filterable errors and entity/component context.
- [ ] Runtime Inspector and clear local/authored versus running-state distinction.
- [ ] CPU/frame-time graphs, entity/listener/resource counters, memory checks and debug rendering.
- [ ] Profile representative map layers, actors, projectiles, effects and UI on the actual i5/Iris Xe laptop.
- [ ] Choose and publish a measured workload at a provisional 1280×720/60 FPS target; record frame-time distributions and headroom instead of guaranteeing arbitrary enemy counts.
- [ ] Implement viewport culling, spatial broadphase, indexed lookups and controlled pathfinding where measurements justify them.
- [ ] Test cold start, resize, minimize/focus loss, missing assets, repeated transitions, save failures and long sessions.
- [ ] Packaged Windows editor that opens without a terminal/toolchain; separate development mode remains available.
- [ ] Browser/game export profiles, progress/errors, clean output folders and launch exported game actions.
- [ ] Project templates, types/schemas, onboarding, tutorials, migration guidance and AI contribution tasks.
- [ ] Fresh-session tasks: create an enemy, add an item and alter a quest using supported tooling/APIs.

Acceptance: clean-checkout verification; actual native filesystem/UI evidence; exported-build smoke; 30–60 minute endurance playtest; no unresolved release blocker. Publication and release tags remain separate decisions.

## Definition of done and status discipline

- A feature is complete only when implementation, persistence/lifecycle implications, focused behavior tests and the applicable real UI/runtime workflow agree.
- Keep visual controls honest: wired and verified, or clearly unavailable. Never mark a feature complete because a panel or runtime class exists.
- A native filesystem claim requires native evidence; stubbed Chromium tests are complementary.
- Store progress under the phase IDs in README; split implementation work into reviewable changes with observable acceptance. GitHub issues are optional and must not become a duplicate conflicting backlog.
- Re-estimate after P1, after the vertical slice and before expanding content. Cut optional scope openly when integration or asset work exceeds the budget.
- Complete the remaining P0 nested-transform editing and visual acceptance before closing this phase. Preserve the original beveled desktop style throughout theme refinements.
