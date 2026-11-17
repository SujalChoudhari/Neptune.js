# Five-batch implementation and acceptance

Requested November 17, 2026. This document specifies the work and its checks; it is not completion evidence. README and ROADMAP remain the product backlog.

## Shared contracts

- Preserve existing public module paths, component names and schema versions. Additive contracts must be versioned and validated.
- Runtime stays in `src/`; editor extensions stay in Triton or project editor modules. Project gameplay contains encounters, menus and world progression.
- Every authoring mutation uses the shared edit command/history path. A pointer drag is one operation; cancel restores the starting state without adding history. Undo restores runtime preview and authored data together.
- Authoring, gameplay saves and editor tool preferences have distinct ownership. Project/scene switches dispose extensions, previews, scripts, input capture and old history.
- Keep the compact raised/inset visual style. Preserve the pre-existing local Emberfall ruins scene edit.

## 1. Safe editing and accurate Scene View

Implement history and transactions for transform, hierarchy and component edits, with guarded Undo/Redo shortcuts. Saved snapshots must not mark later edits saved. Nested renderable-parent overlays and translation must use the same composed coordinates as rendering. Grid major cells represent one world unit (64 render pixels), track negative pan and zoom, and adapt density without redefining the unit.

Acceptance: functional history tests, real viewport drag/undo/redo/cancel, nested rotated/scaled parents, pan/zoom alignment and save/reopen. Panning must not change authored data or dirty the scene.

## 2. Everyday authoring

Implement searchable Add Component from supported runtime metadata, validated property inputs and project resource selection. Reuse shared commands for hierarchy and Scene View context actions. Right-click preserves a selected group, respects locks, distinguishes empty space and cannot start a transform drag. Menus stay within the viewport and dismiss with Escape.

Acceptance: add/configure/remove a supported component, duplicate/delete/rename/activate objects, undo/redo and save/reopen through the actual UI. Unavailable actions stay explicitly unavailable.

## 3. Authored UI and editor extensions

Choose an explicit supported declarative UI path shared by browser runtime, Game View and edit-time preview. Preview does not start project gameplay. Layout supports anchors, visibility and stacking with explicit input capture. Provide a versioned opt-in editor module host with diagnostics and enable/reload/dispose ownership. Capabilities include selection, queries, coordinate conversion, overlay drawing/hit tests, validated commands, transactions and custom authoring registrations.

Acceptance: a working collider-area extension edits an existing component through undo and save; tool objects never enter game lists, physics, saves or exports; reload/switch/failure cleanup works; the same authored UI agrees in Scene View and Game View. Do not claim existing Canvas classes are fully authorable if only the HTML path is implemented.

## 4. Runtime foundations

Choose Combatant as authoritative ARPG health state with an explicit compatibility bridge for Stats. Reuse Nereid overlap/collision for supported top-down movement and bridge BoxCollider dimensions rather than adding a collision system. Add action-based input with focus/context handling and bounded fixed simulation stepping. Restore authored state after Stop and preserve existing lifecycle and project-module contracts.

Acceptance: damage/death/heal synchronization, collision at different frame rates, pressed/held/released actions and focus loss, bounded catch-up, repeated play/stop and project switching without leaked listeners or authored mutation. Exercise browser and editor integration.

## 5. Emberfall slice

Develop a bounded two-area adventure with onboarding, animated character presentation, telegraphed encounters and boss, title/pause/death/victory flow, audio/settings and validated Continue. Prefer reusable small project modules/data; do not move game rules into the engine. Preserve the existing ruins scene. Use source-tracked assets or original procedural presentation with honest attribution.

Acceptance: ordinary input starts a fresh game, reaches the second area, defeats encounters, completes the objective, retries after death and reloads a persisted world. Save restoration includes location, health, enemy/objective progress and settings as appropriate. Measure actual play duration before calling it a polished 10–15 minute slice.

## Integration gate

Each batch has a smaller-model agent with distinct ownership; dependent work waits for the shared contracts. The primary agent reviews combined changes, runs focused regressions, the complete `npm test` baseline, editor build/lint and documentation generation/contracts. Actual Windows editor persistence checks are separate from browser tests using native-command stubs. Record missing evidence and remaining product scope explicitly, and inspect `git diff --check` and status before handoff. No publishing or remote changes are requested.

## Paused implementation checkpoint — November 17, 2026

The user requested an immediate stop and local commit without pushing. This is a work-in-progress checkpoint, not completion of all five batches.

Implemented: shared scene edit history and transactions; nested composed-transform tools and world grid; component catalog/Inspector/context commands; versioned authored HTML UI; opt-in editor extension loading, custom Inspector/context actions and collider-area handles; Stats/Combatant binding, action input, shared top-down movement, fixed simulation stepping and Game View restoration. An additional Emberfall adventure entry, scene, original assets, gameplay and browser tests are present but unfinished and not accepted.

Verified before stopping: TypeScript project check passed; the scene/history/grid/transform/CRUD focused suite passed 52 tests; runtime foundations/playback passed 12 tests; extension/UI focused checks passed 7 tests. The primary agent's real Chromium editor test passed opt-in loading, custom Inspector edits, custom gizmo drag as one undo operation, undo/redo, context action, save/reopen, Scene/Game UI preview and script disposal after Stop. These browser checks use native-command stubs.

Still required: finish the legacy persistence test harness adaptation; run the complete integrated baseline, full editor build/lint and docs checks after final integration; finish and playtest the adventure through ordinary input, including victory/death/save recovery; complete actual Windows persistence acceptance. The attempted native session did not complete: its Scene View tab detached during interaction. Do not count that as native evidence. Full P0/P1, editor extensibility and the polished 10–15 minute game remain open until their complete acceptance passes.

The pre-existing local `examples/emberfall/scenes/ruins.scene` edit was preserved unchanged and excluded from this checkpoint commit.
