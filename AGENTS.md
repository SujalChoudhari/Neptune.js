# Working on Neptune.js

## Product scope

Finish the 2D entity-component engine and prove it through a playable ARPG demo. The root README contains current status and ordered TODOs. No 3D, multiplayer, speculative renderer rewrite or unrelated feature expansion in this delivery.

## Editor design and working preferences

- Preserve the raised/inset desktop control style. The user's reference is dark neumorphism: soft light/dark shadows, restrained gradients and rounded controls. Theme refinements must not flatten or replace this style.
- Keep controls compact and content-sized: small toolbar icons are 24px squares; text buttons get only the padding their labels need. Do not copy the reference music player's large spacing into a dense editor.
- The user prefers parallel agents for independent TODOs. Assign distinct file ownership, integrate and verify the combined result, and keep README/roadmap progress truthful. Do not substitute planning for implemented, tested changes.

## Architecture boundaries

- Preserve Entity -> components/children, Transform, Scene/SceneManager and Behaviour composition. This is an entity-component architecture, not a mandate to introduce a new data-oriented ECS framework.
- Runtime code lives in src/. Triton is a separate authoring tool in triton/. Games must not import editor UI, Tauri or native filesystem dependencies.
- Keep game-specific encounters/content in project scripts/data, not engine internals. Prefer small reusable components over a single large gameplay manager.
- Retain public import paths and serialized component names/IDs unless a documented migration and compatibility checks accompany a change.
- Use existing lifecycle methods when adding/removing/destroying entities and components. Check activation, loaded-scene membership, script cleanup and project-switch isolation.
- Authoring data and runtime save state have separate ownership. Preserve schema versions, validate references, and test save/reopen/load behavior.
- src/neptune.js currently creates the browser Application on import. Headless tests need mocks; do not claim the public entry is side-effect-free. Change bootstrap only as an explicit compatibility task.
- Do not add a third health/damage or collision subsystem. First reconcile Stats/Combatant and BoxCollider/Nereid paths as described in the README.

## Setup and commands

Use Node.js 24 LTS and Yarn Classic 1.22.x. Preserve both lockfiles.

```sh
npm ci --ignore-scripts --no-audit --no-fund
yarn --cwd triton install --frozen-lockfile
npx playwright install chromium
npm run serve
npm run dev:editor
npm run dev
```

serve is a local preview. dev:editor starts the frontend only. dev starts the Tauri desktop app and needs platform prerequisites. Do not commit machine-specific paths, installed tools, dependencies or compiler/browser caches.

## Verification

- Run focused behavioral regressions for changes, then npm test for the integrated baseline. The custom engine harness is only the first batch; it must return failure when expectations fail. Do not weaken assertions, skip browser suites, or count source-string checks as functional acceptance.
- Editor changes: npm run build:editor and npm run lint:editor. Native backend changes: cargo check --locked --manifest-path triton/src-tauri/Cargo.toml plus relevant Rust tests and actual desktop/filesystem smoke where behavior requires it.
- Documentation changes/generator: npm run docs and npm run test:docs-contract. Generated HTML is replaceable; preserve authored Markdown/tutorials. Avoid bundling unrelated generated-site churn with source changes.
- Browser tests with native-command stubs prove browser integration, not native Tauri persistence. Report the difference and any missing native evidence.
- Launch JS command-line tools using process.execPath and their JS entry points; avoid extensionless POSIX bin wrappers and direct Windows .cmd spawning. Use scripts/serve.js for portable example serving. Tests must tolerate LF/CRLF when inspecting source.
- Keep filesystem paths rooted and validated; preview/native operations must not escape project boundaries through traversal or symlinks.
- For performance, record workload, hardware and frame-time evidence. Correctness tests with many occupied cells are not FPS benchmarks. Profile before introducing caches, pools or new render backends.

## Delivery

Use a focused branch and inspect git diff --check and status before handing off. Keep README TODOs honest: update only work actually verified, with remaining blockers explicit. No publishing, releases or remote issue changes are required for ordinary local preparation. Explain the concrete changes, checks and limitations in the handoff.
