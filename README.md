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

Important remaining integration work:

- `Stats` and `Combatant` have overlapping health/damage responsibilities. Choose one authoritative ARPG state flow before expanding the game.
- Legacy `BoxCollider`, Nereid physics, and the sample's custom collision handling need a documented supported movement path.
- The existing sample player uses platformer movement. A top-down ARPG controller is planned; do not describe it as shipped.
- The public browser entry performs DOM/application initialization on import. Make any future bootstrap changes compatible and explicit.
- Tile rendering scans map cells, collision checks pairs, and some AI lookups scan occupants. Measure real workloads and optimize demonstrated limits; there is no established large-crowd FPS guarantee.

The target [product contract](docs/PRODUCT-CONTRACT.md) and [performance budgets](docs/performance-budgets.md) describe scope and workload limits. Historical native observations are in [M12 acceptance evidence](docs/m12-acceptance.md); they are not verification of the current machine or a new release.

## TODO / next delivery

This is the active backlog. Mark work complete only after implementation and relevant behavioral verification. Reconcile existing code before replacing it. Use small proof scenes throughout engine work, then assemble the demo from the verified systems.

- [x] **Step 0 — development baseline:** portable tooling, editor launcher, contributor guide, cleanup and next-step backlog complete. Verified on Windows: 406 engine checks, 63 integration checks, final 102-test batch, docs generation/contract, editor build/lint and locked Rust compilation. Native compilation is verified; browser smoke tests use native-command stubs and do not claim a new native-window acceptance run.
- [ ] **Step 1 — canonical 2D runtime:** define coordinate units; consolidate authoritative health/damage and collision/movement paths; add input actions; verify lifecycle, fixed simulation timing, pause and cleanup while retaining entity-component composition.
- [ ] **Step 2 — world and authoring:** verify tile layers/collision/navigation, camera bounds, spawn points and transitions through real edit/save/reopen/play workflows.
- [ ] **Step 3 — reusable ARPG systems:** compose attacks/projectiles, three enemy types, boss phases, loot/equipment, XP, quests and dialogue through public APIs and project data.
- [ ] **Step 4 — UI and persistence:** coherent HUD/menus/pause, death/retry, checkpoints and complete world-state save/load across restarts.
- [ ] **Step 5 — playable demo:** one safe hub, one dungeon, one quest and boss; a complete approximately 10–15 minute adventure with readable art, animation, sound and feedback.
- [ ] **Step 6 — completion:** profile a documented workload on target hardware, address measured bottlenecks, run an endurance playtest, finish types/examples/templates and verify fresh-developer/AI modification tasks.

2D completion requires the demo to be authored, played, saved, reopened, modified and packaged through supported Neptune workflows with passing checks and recorded integration evidence. Only then consider 3D. No publication is implied by local preparation or packaging.

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

Read [AGENTS.md](AGENTS.md) for architecture boundaries and verification guidance. `main` is the integration branch; use short-lived `codex/*` or other focused feature branches. Keep changes reviewable and preserve unrelated work. Source/API readiness, native acceptance, and publishing are distinct outcomes.
