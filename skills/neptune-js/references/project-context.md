# Project context and corrections

Updated 2026-11-16. Check git and the live roadmap before treating these notes as current acceptance.

## Decisions

- Engine: Neptune.js, editor: **Neptune.js Triton**, game example: Emberfall. Complete 2D first; defer 3D, multiplayer and renderer rewrites.
- Emberfall is a real `.npt` project in `examples/emberfall`, with scene/data and project scripts. It remains a one-room placeholder-shape demo with movement, melee guardians, altar objective and saves; no finished menu/adventure/presentation flow.
- README and `docs/ROADMAP.md` are the active ordered backlog. User prefers those over maintaining duplicate issues. Do not create remote issues merely to track ordinary work.
- Preserve original entity-component composition. Reconcile Stats/Combatant and BoxCollider/Nereid before adding health/collision paths.
- User wants actionable parallel batches, direct implementation, and verified delivery. Prior requests specifically called for main integration and pushing; a branch-only handoff was insufficient.
- After hitting the usage allowance, user explicitly asked for cheaper subagent models with better scoped prompting. Prefer economical agents for independent bounded tasks; avoid redundant expensive investigation.

## Mistakes to avoid

- Flattening the original beveled theme into generic graphite/cyan controls was rejected. User wanted theme polish while retaining the style. Latest reference explicitly establishes dark neumorphism: subtle raised/inset depth, modern execution, compact content-sized controls. Do not remove gradients/shadows wholesale or add excessive padding.
- The shortcut had not been installed in the actual user's Start menu, while Tauri productName remained generic `triton`. Use `scripts/install-start-menu.ps1`; it creates **Neptune.js Triton** pointing at the checked-out editor, with icon and correct working directory. This is a development launcher, not an installed release. Tauri product and window title now match.
- `$PSHOME/powershell.exe` fails when installer runs under PowerShell 7. Shortcut uses Windows' actual `System32/WindowsPowerShell/v1.0/powershell.exe`.
- Scene transforms are meters, camera pan/render coordinates pixels (64px/unit). Mixing them placed gizmos near world origin and broke picking/drags. Convert at boundaries, including pan/zoom. Editor picking needs no gameplay collider and must respect render order and selection locks.
- Do not show every gizmo simultaneously. Q hand, W move, E rotate, R scale, T rect, Y combined; shortcuts ignore typing/dialogs/Game View. Drags capture pointers; Escape restores their starting transform. Positive Y is down.
- Nested renderable-parent picking follows render composition, but nested-parent gizmo editing still uses local coordinates. Root-level tests do not prove full nested/rotated editing.
- Drag transaction events prepare P1 undo integration; no undo history exists yet. Rect resize is center-based; do not claim Unity/Godot parity.
- Layout persistence currently restores complete docked layouts only; floating/popout/incomplete layouts fall back to defaults. No fake Timeline/Atlas layouts advertised as working.
- Vite must ignore `src-tauri` compiler artifacts; watching a locked Rust DLL previously produced EBUSY. Preserve frontend watch regression coverage.
- Launch JS tools through Node and JS entry points rather than extensionless wrappers/direct `.cmd` child spawning. Keep both lockfiles. Do not commit generated dependencies, caches, machine paths or example lib copies.

## Environment and evidence

- Node 24 LTS, Yarn Classic 1.22.x. This workstation has portable tools in `D:/Software/DevTools`; `node-path.txt` locates Node, `npm-global` contains Yarn, and `cargo`/`rustup` contain Rust. Derive machine paths; do not add them to shared config.
- `Neptune.cmd` -> `scripts/start-editor.ps1` -> Yarn Tauri dev. Windows prerequisites include C++ build tools. Frontend-only preview is different from desktop editor.
- Native verification attaches Playwright to a temporary loopback WebView2 debug port, enabled only in the test launch environment. Do not enable remote debugging in the normal launcher.
- `docs/windows-workflows.md` records actual native scene save/reopen and play/pause workflows. Current P0 native checks click Wanderer, compare gizmo/render positions, move one unit, cancel and save actual files. Browser stub tests separately cover zoom/pan and shortcut focus.
- On 2026-11-16 the full npm test baseline passed, including the final 119-test browser/runtime batch. After the reference-driven visual pass, editor build/lint, the focused browser viewport regression and actual native picking/drag/cancel/save checks passed again. Documentation generation/contracts and the skill validator also passed. Revalidate future changes rather than inheriting those results blindly.
- Scratch native scripts/screenshots are ignored under `work/`; they may not exist in another checkout. Maintained regressions live under tests and triton/tests.

## Continue

Finish P0 nested transform/visual acceptance, then P1 authoring safety and P2 runtime contracts according to the live roadmap. Do not imply the whole P0 checklist or full engine/game is done. For each batch, keep changes isolated, run applicable checks, review native appearance, update honest TODOs, and complete requested main integration/push.
