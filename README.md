# Neptune.js

A modular JavaScript **2D game engine** with an entity-component architecture and a separate visual editor, **Triton**. Games run in the browser using Canvas 2D; Triton uses React, TypeScript, and Tauri for desktop authoring. MIT licensed.

The current goal is to finish a coherent 2D engine and prove it with a small playable action-RPG demo. **3D and multiplayer are outside this delivery.** Existing modules and passing individual tests do not mean that the complete ARPG workflow is finished.

## Development setup

Use Node.js 24 LTS and Yarn Classic 1.22.x. Install from the committed lockfiles:

```sh
npm ci --ignore-scripts --no-audit --no-fund
yarn --cwd triton install --frozen-lockfile
npx playwright install chromium
```

On Linux, Playwright may also require its OS dependencies (`npx playwright install --with-deps chromium`). Browser tests require Chromium; do not skip them to obtain a passing result.

Run the sample from the repository root:

```sh
npm run serve
```

Open http://127.0.0.1:8000/debug_project/ and select **Play Game**. This preview server binds to localhost only and needs no Python installation. Use `npm run serve -- --port 8001` to choose another port. ES module examples must be served over HTTP rather than opened as local files.

The new [Emberfall ARPG starter](examples/emberfall/README.md) uses a real `.npt` project and editable scene. Play at http://127.0.0.1:8000/examples/emberfall/, or open the `examples/emberfall` folder in Triton. It includes top-down movement, solid walls, three guardians, melee combat, an altar objective and save/load. It is a playable starter, not the completed multi-map ARPG demo.

On Windows, double-click `Neptune.cmd` to start the desktop editor (`yarn --cwd triton tauri dev`). The launcher uses installed tools or the optional sibling `DevTools` folder.

Run Triton's frontend with `npm run dev:editor`. This previews the UI; native filesystem operations require the desktop app. For that, install the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) (on Windows: Rust MSVC toolchain, Microsoft C++ Build Tools/Windows SDK, and WebView2), then run `npm run dev`.

## Verify a change

```sh
npm test
npm run build:editor
npm run lint:editor
npm run docs
npm run test:docs-contract
```

`npm test` runs the existing legacy engine harness, runtime/editor integration suites, and browser checks in sequence, stopping at a failed batch. `npm run test:engine` runs only the first harness; it is not a substitute for the full suite. The batch list lives in `scripts/test.js`.

Documentation generation refreshes generated HTML in `docs/` while preserving authored Markdown guides and tutorials. Inspect generated changes separately from source edits. Native editor changes also need native verification; browser tests with Tauri command stubs do not establish real filesystem behavior. `cargo check --locked --manifest-path triton/src-tauri/Cargo.toml` checks native compilation prerequisites and code without packaging a release.

## Architecture and repository map

Keep the entity-component structure. An `Entity` owns components and children; `Transform` describes its 2D placement; `Scene` and `SceneManager` organize worlds; `Behaviour` supplies game lifecycle callbacks. Use public add/remove/destroy paths so scripts and runtime state are cleaned up correctly.

| Path | Responsibility |
| --- | --- |
| `src/core/` | Application loop, entities, scenes, component registry, loading, saves and clock |
| `src/components/`, `src/scripts/` | Components, transforms, authoring components and behaviours |
| `src/rendering/`, `src/ui/`, `src/input/`, `src/audio/`, `src/math/` | Canvas rendering, UI/HTML bridge, input, audio and 2D math |
| `src/titan/` | Animation, poses and rigs |
| `src/thalassa/` | Tilemaps, tilesets, navigation, cameras and feedback |
| `src/nereid/` | Bodies, colliders, interactions and physics helpers |
| `src/larissa/` | Combat, enemies/bosses, stats, progression and inventory |
| `src/galatea/` | Dialogue and cutscenes |
| `src/neptune.js` | Browser entry and exports; importing it currently creates the shared application |
| `triton/src/`, `triton/src-tauri/` | Editor UI and native backend; not game-runtime dependencies |
| `debug_project/`, `examples/` | Integrated sample and small task-oriented examples |
| `tests/`, `triton/tests/` | Engine, integration and browser checks |
| `scripts/`, `static/`, `docs/` | Contributor tools, JSDoc source/tutorials and generated/authored documentation |

Do not rename public modules or move runtime files solely for tidiness: games and saved resources can depend on those paths. Improve a module in place unless a migration is explicitly part of the change.

## Current capability and limits

The codebase includes scene/entity serialization, Canvas 2D rendering, cameras/layers, tilemaps and minimum-cost grid navigation, animation, collision and trigger helpers, configurable combat and enemy AI, RPG progression/inventory, dialogue, audio, HTML UI, save/load, and editor authoring/persistence. See the tutorials for actual entry points and examples.

`ProjectBehaviour` loads project-local gameplay modules in both the browser runtime and Triton Game View, without importing editor code into games. See Emberfall for its module/settings format and lifecycle contract. `KeyboardInput.IsKeyPressed` preserves quick taps until frame clear; focus loss clears held keys. Native opening, transform editing, save/reopen, activation, movement, gameplay saves and playback were exercised against the actual Windows editor; see [workflow evidence](docs/windows-workflows.md).

Important remaining integration work:

- `Stats` and `Combatant` have overlapping health/damage responsibilities. Choose one authoritative ARPG state flow before expanding the game.
- Legacy `BoxCollider`, Nereid physics, and the sample's custom collision handling need a documented supported movement path.
- The older debug sample uses platformer movement; Emberfall has a project-specific top-down controller. A configurable shared ARPG controller and a completed multi-map game remain planned.
- The public browser entry performs DOM/application initialization on import. Make any future bootstrap changes compatible and explicit.
- Tile rendering scans map cells, collision checks pairs, and some AI lookups scan occupants. Measure real workloads and optimize demonstrated limits; there is no established large-crowd FPS guarantee.

The target [product contract](docs/PRODUCT-CONTRACT.md) and [performance budgets](docs/performance-budgets.md) describe scope and workload limits. Historical native observations are in [M12 acceptance evidence](docs/m12-acceptance.md); they are not verification of the current machine or a new release.

## TODO / next delivery

November 17 checkpoint: implementation across the next five batches is saved as work in progress. Focused editor/runtime checks pass, but integrated baseline, native acceptance and the adventure remain unfinished. See [checkpoint evidence and remaining work](docs/five-batch-tsd.md#paused-implementation-checkpoint--november-17-2026). No milestone is closed by this checkpoint.

**Immediate direction:** finish the Scene View's world-unit grid/panning, per-object context menus and authored game UI preview, together with safe undo/save/edit commands. Then add code-defined editor extensions for custom gizmos, inspectors and editor-only scene helpers. Keep the current shell during this work; a whole editor rewrite is not part of this batch. See [the ordered delivery details](docs/ROADMAP.md#next-delivery--scene-view-essentials-then-editor-extensibility).

The [full engine, editor and game roadmap](docs/ROADMAP.md) is the active plan, with subsystem checklists, dependencies, estimates and observable acceptance. Existing code is reused and verified. Runtime capabilities and a working starter do not establish a finished authoring workflow or finished game.

- [x] **Development baseline:** launcher, portable checks, contributor guidance and initial native workflows verified. See [Windows evidence](docs/windows-workflows.md).
- [x] **Emberfall starter:** a versioned `.npt` project with movement, melee combat, guardians, an altar objective and saves. Placeholder visuals and no proper menu flow; not the finished demo.
- [ ] **P0 — viewport and visual foundation (in progress):** root-level coordinate conversion, direct picking, Q/W/E/R/T/Y tools, focus-safe shortcuts, snapping, drag cancellation and validated dock-layout persistence/reset are verified. Preserve compact raised/inset controls and refine the dark neumorphic style. Full nested-transform gizmo editing and remaining visual acceptance are still open; drag transaction events prepare P1 undo integration, but do not provide undo history.
- [ ] **P1 — safe editor authoring:** undo/redo, save/recovery safeguards, functional Add Component, typed searchable Inspector, script settings, resource pickers, multi-edit, hierarchy and shortcut QoL.
- [ ] **P2 — consistent runtime:** authoritative combat/collision paths, input actions, simulation timing, lifecycle, edit/play separation and versioned project/module contracts.
- [ ] **P3 — asset and presentation pipeline:** spritesheet slicing/pivots/imports, real animation timeline/state tools, music/SFX buses/previews/settings, effects and camera feedback.
- [ ] **P4 — world and reuse:** reusable entity/scene instances and overrides, viewport tile painting/terrain/layers, collision/navigation tools, spawns, transitions and reference repair.
- [ ] **P5 — ARPG systems and data tools:** melee/ranged/dodge, enemies and phased boss, inventory/equipment/loot, progression, NPCs/dialogue/quests and validated authoring.
- [ ] **P6 — complete UI and persistence:** title/new/continue/load/settings/credits, pause/HUD/inventory/quest/dialogue/death/victory flows, input navigation, checkpoints, slots and complete saved world state.
- [ ] **P7 — the actual adventure:** first a polished 10–15 minute slice, then a bounded approximately 30–60 minute game with coherent sprites, animation, music, sound, onboarding, encounters and ending.
- [ ] **P8 — hardening and delivery:** debugger/profiler tools, measured performance, native/browser/export tests, endurance playtests, packaged editor, game exports, templates/types/docs and fresh-developer usability.

Initial planning ranges: **4–8 focused development weeks for the polished vertical slice; approximately 12–22 weeks for the bounded engine/editor plus small complete game**. These are engineering-effort estimates with substantial uncertainty, not calendar promises or unattended work commitments. Original art/music production and larger content scope need separate estimates. Re-estimate after P1 and after the slice.

2D completion requires the game to be authored, played, saved, reopened, modified and packaged through supported workflows, with passing checks, actual native evidence and release acceptance. Only then consider 3D. The roadmap update itself does not mark the planned enhancements complete.

## Tutorials

- [First game](docs/tutorials/first-game.md)
- [Action RPG sample](docs/tutorials/action-rpg.md)
- [Runtime and lifecycle](docs/tutorials/runtime.md)
- [Triton editor API](docs/tutorials/editor-api.md)
- [Tilemaps and navigation](docs/tutorials/tilemaps.md)
- [Combat and enemy AI](docs/tutorials/combat-ai.md)
- [RPG systems](docs/tutorials/rpg-systems.md)
- [Save/load](docs/tutorials/save-load.md)
- [HTML UI](docs/tutorials/html-ui-bridge.md) and [Canvas UI](docs/tutorials/ui-layout.md)

## Contributing

The reusable [Neptune.js skill](skills/neptune-js/SKILL.md) stores project preferences, past corrections and the parallel TODO workflow. Its reference-driven design direction is compact dark neumorphism; preserve raised controls and inset fields. Keep the skill's dated context synchronized with verified changes.

The compact editor is checked at 125% browser scaling across 1024–1536px logical window widths. It starts maximized in a normal Windows window, preserves readable hierarchy/Inspector widths after layout restore, and reports live unsaved edits and file save activity. See the [native and browser evidence](docs/windows-workflows.md); full nested-transform editing remains unfinished.

Read [AGENTS.md](AGENTS.md) for architecture boundaries and verification guidance. `main` is the integration branch; use short-lived `codex/*` or other focused feature branches. Keep changes reviewable and preserve unrelated work. Source/API readiness, native acceptance, and publishing are distinct outcomes.
