# Neptune.js

A modular JavaScript **2D game engine** with an entity-component architecture and a separate visual editor, **Triton**. Games run in the browser using Canvas 2D; Triton uses React, TypeScript, and Tauri for desktop authoring. MIT licensed.

The current goal is to finish a coherent 2D engine and prove it with a small playable action-RPG demo. **3D and multiplayer are outside this delivery.** Existing modules and passing individual tests do not mean that the complete ARPG workflow is finished.

The user's final product scope is now locked in [release one scope](docs/LOCKED-SCOPE.md), based on the supplied 2.5D ARPG SRS. It retains 2D simulation and the existing architecture, while explicitly adding elevation, WebGL2 presentation, lighting, streamed worlds and integrated simulation/NPC/narrative authoring. That contract controls future feature scope; this README's capability statements describe what exists today.

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

The [Emberfall project](examples/emberfall/README.md) includes the original ruins starter and an expanded expedition. Open http://127.0.0.1:8000/examples/emberfall/adventure.html for the expedition's title menu, connected hollow/keep rooms, three guarded seals, phased boss, ending and Continue flow. The original starter remains at http://127.0.0.1:8000/examples/emberfall/. In Triton, open the project and then `scenes/expedition.scene` to play the expedition. It is a bounded playable demo; the 10–15 minute fresh-player quality target remains unverified.

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

- New ARPG code uses `Combatant` for authoritative health; `Stats.bindCombatant()` provides an explicit legacy health view. Standalone Stats and other RPG-stat integration still require deliberate ownership.
- `Nereid.TopDownController` moves in world units using Nereid solids and the centered `BoxCollider` adapter. Legacy platformer and collision APIs remain available; this does not make them interchangeable.
- Action-based keyboard input, bounded fixed simulation steps and authored-state restoration after Game View Stop are implemented. Gamepad input, broader rebinding UI and a completed multi-map game remain planned.
- The public browser entry performs DOM/application initialization on import. Make any future bootstrap changes compatible and explicit.
- Tile rendering scans map cells, collision checks pairs, and some AI lookups scan occupants. Measure real workloads and optimize demonstrated limits; there is no established large-crowd FPS guarantee.

The [locked scope](docs/LOCKED-SCOPE.md) controls release requirements. The earlier [product contract](docs/PRODUCT-CONTRACT.md) and [performance budgets](docs/performance-budgets.md) provide historical context and workload guidance where consistent with that scope. Historical native observations are in [M12 acceptance evidence](docs/m12-acceptance.md); they are not verification of the current machine or a new release.

## TODO / next delivery

November 19 delivery: scene edit history, the world grid, context commands, functional component authoring, authored HTML UI preview and opt-in editor tools are implemented alongside runtime foundations and the playable expedition. The reported nested-child overlay offset is fixed. See [delivery evidence and limits](docs/five-batch-tsd.md#november-19-delivery). These changes do not close the broader engine/editor/game roadmap.

**Active task queue:** [release-one implementation plan](docs/IMPLEMENTATION-PLAN.md). It groups the locked S01-S17 scope into tasks with acceptance criteria, edge-case tests, ownership rules and prerequisites. The [older roadmap](docs/ROADMAP.md) retains historical evidence; its content-length targets and estimates do not control this release.

| System | Task IDs |
| --- | --- |
| Core lifecycle, timing, facts, rules and project modules | CORE-01 through CORE-04 |
| Input and device mappings | INPUT-01 through INPUT-03 |
| Nereid physics and spatial queries | PHYS-01 through PHYS-04 |
| Thalassa world/chunks and navigation | WORLD-01 through WORLD-03; NAV-01 through NAV-03 |
| Rendering and camera | RENDER-01 through RENDER-04 |
| Lighting, particles and weather | FX-01 through FX-03 |
| Assets and Titan animation | ASSET-01/02; ANIM-01 |
| Proteus sound/music | AUDIO-01 through AUDIO-03 |
| Larissa combat and RPG | COMBAT-01/02; RPG-01/02 |
| Ability composition | ABILITY-01/02 |
| Local environmental simulation | SIM-01 through SIM-03 |
| NPC/enemy AI | AI-01 through AI-03 |
| Galatea dialogue, quests and cutscenes | STORY-01 through STORY-03 |
| Game UI runtime | GUI-01 through GUI-03 |
| Persistence and recovery | SAVE-01 through SAVE-03 |
| Triton authoring | EDIT-01 through EDIT-06 |
| Diagnostics, replay and measured optimization | QA-01/02; PERF-01/02 |
| Export, packaging, templates and documentation | SHIP-01 through SHIP-03 |
| Integrated Emberfall and independent creator proof | DEMO-01 through DEMO-03 |

**Agent starting instructions:** read AGENTS.md and the plan; inspect existing code/evidence; claim a task with exact files and dependencies; implement and run its behavioral checks; record results and remaining gaps. Queue items start Open / needs verification, not as claims that existing systems are absent. Shared contracts must be agreed before parallel dependent work.

Start with CORE contracts and existing runtime inconsistencies, then physics/spatial queries, world/navigation, combat and persistence. Rendering/assets/audio and later simulation/AI/story proceed where prerequisites and file ownership permit. Diagnostics and tests accompany every stage. Runtime work can precede new editor panels; authoring and native workflows still need their own acceptance.

The proof content is one village and adjacent dungeon, 10-20 NPCs, three enemy archetypes, three abilities, a phased boss, one branching quest, a fire/water interaction and an ending. A fresh creator must build a second village without engine changes. No playtime padding or inherited 30-60 minute requirement. See [locked boundaries and end-to-end gates](docs/LOCKED-SCOPE.md).

## Tutorials

- [Interactive Systems Showcase](docs/tutorials/showcase-demo.md) and [Playable Showcase Demo](https://neptune.sujal.xyz/demo.html)
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
