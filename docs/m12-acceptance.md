# M12 Triton Editor Core — acceptance evidence

Functional acceptance for issue #27 was completed locally on November 16, 2026 across three supervised chunks. This report records observed behavior, not a claim that tests prove every possible game works. Integration and the exact main SHA are recorded separately in the issue and worker handoff after remote readback.

## Scope and preservation

Worktree: `/root/Neptune.js-m12-20261030`, branch `codex/m12-hierarchy-selection-20261030`, based on main `027ecf86e7f5f00868b4621976a7a269993f0d88`. Accumulated source changes against main were reviewed, including old draft PR #54's distinct source behavior. The old endpoint was not transplanted over newer runtime/M13 work.

The unrelated `/root/Neptune.js` generated-doc batch remains untouched: it contains stale generated API output and deletes authored `performance-budgets.md`. Copied static tutorial/SRS/TSD prose was previously compared to tracked sources; no unique authored prose was found to transfer. Never stage that batch wholesale. This authored report is a separate coherent document.

Existing native artifacts and local checkpoints were retained. New native tests used a copy of the versioned `triton/tests/fixtures/native-smoke` project at `triton/.native-smoke-run/current-project`. No Rust changes, new GitHub Actions, releases, other repositories or credentials were involved. Free disk remained 59 GiB at the final local check.

## Acceptance mapping

| Issue criterion | Actual implementation and evidence |
| --- | --- |
| Open and navigate a project | Native Tauri opened the real fixture via project launcher. Created `Second.scene` using Project panel, created/renamed/saved SecondActor, navigated main → Second → main → Second. Inspector/hierarchy and real file readback matched each scene/save target. Automated project isolation, navigation, load/save race and persistence suites also cover failures. |
| Real hierarchy | Native Gameplay/VerifiedHero/Partner and parent-child branches came from real scene files. Creation, duplication, movement, sibling reordering and deletion were observed; fresh native reopen retained identities/order. Runtime CRUD regressions use real SceneLoader/Entity instances. |
| Editor ↔ running-game selection | Native Game View clicks on rendered Shapes selected the actual topmost Partner in hierarchy/Inspector. Hierarchy selection populated Inspector. Runtime-origin selection relays to both views without editor-origin feedback. Additive/range/transition cases have focused regressions. |
| Inspector edits update and save | Native transform X edits visibly separated two rendered Shapes/Sprites. Native active toggles removed/restored the selected Shape. Native Sprite enabled toggles removed/restored its pixels and persisted false through scene navigation/reopen. Real file readback and canonical save/reopen tests cover aliases, component props, rejected/overlapping writes. |
| Rename, duplicate, delete, persist | Native parent-child create/rename/duplicate/move/reorder/delete/save/reopen/navigation completed. IDs regenerated on duplication and retained afterward; deleted FirstChild remained absent, MovedChild remained under Partner. Final Sprite duplicate also reloaded into Game View with relative assets intact. |
| Play/pause/stop and diagnostics | Native Play/Pause/resume/Stop/restart controlled the real game with visible rendered pixels and Console boot/load/init logs. Actual Application regressions measure loop/session behavior. An intentionally missing tilemap produced an actionable GAME_SCENE_LOAD_ERROR in native Console; returning to a valid scene after clearing intentional diagnostics produced zero warnings/errors. |

Native screenshots are UI/runtime evidence, not measurements of paused simulation timing. Chromium UI smoke uses native-command filesystem stubs and is not substituted for the native evidence above. Native tests reused the existing debug Tauri binary with the current Vite-served frontend/runtime source, not a newly packaged release build.

## Reproduced failures and repairs

All detailed logs/captures below are preserved under `triton/.native-smoke-run/` on the worker host.

- Rapid Stop/Play left an old RAF callback able to fork another animation loop. Application play generations reject prior-session callbacks; production-handler regression passes.
- Malformed playback reports could throw, and Scene View/old-project state could control the toolbar. Validate state, accept Game View only, tag acknowledgements with project session, and reset playback/project state on switch.
- Newly created hierarchy entities never entered mounted Game View. Install the existing runtime entity bridge and expose the real engine module. `chunk-current-create-red.log` failed missing created entity; corresponding green run passed.
- Deleting a scripted parent/child left Behaviours ticking: [2,2,2] instead of [1,1,2]. Destroy through the Entity lifecycle and unregister destroyed scripts. `current-delete-{red,green}.log`.
- Delayed tilemap parsing replaced a newer scene. Generation-bound activation discards/destroys superseded scenes, including same-ID loads. Project reset invalidates pending old-project success/error even when the next project has no main scene. `current-race-*`, `chunk2-reset-*`.
- Unloaded scenes' Behaviours ran alongside active scenes. Gate lifecycle work by loaded main/additive scenes. Regression red [1,1,1] vs [1,0,0], then green. `chunk2-script-navigation-*`.
- Lifecycle review found late scripts updating without Init. Initialize once before first eligible Update; stop/restart does not reinitialize the same script. Use Set membership instead of quadratic array includes, retain per-pass snapshot semantics and skip scripts destroyed during the pass. `chunk3-lifecycle-red.log` failed two regressions; focused green run passed 27/27.
- Runtime-origin selection did not reach the other view. Relay accepted IDs via editor:select. Transform hydration ignored position/rotation aliases and component-only Transform values; writes could lose prior fields or be shadowed by stale aliases. Normalize complete transform bases and match loader precedence. `current-selection-*`, `current-transform-*`.
- A synthesized scene-camera row exposed rejected entity edits. It is explicitly read-only instead of pretending edits persist.
- Final production review found setScenePath('') throwing on project reset and data-only duplication. The old harness's permissive resource stub hid the bug. Exercise the real resource bridge in the embedded Game View harness, preserve the scene base on data-only reloads, and support an explicit empty base reset without allowing empty resource references. `chunk3-resource-red.log` failed two tests with the actual non-empty-path exception; green run passed 14/14. Native `chunk3-duplicate-live-fixed.png` confirms two independently moved relative-asset Sprites and zero warning/error counters.
- Docs generation discarded authored root Markdown. Preserve root .md guides plus tutorials, not stale HTML. The regression first failed missing generated/performance-budgets.md. Actual isolated JSDoc generation then exposed an invalid @private comment; corrected its syntax. A fresh isolated real generator run passed and preserved PRODUCT-CONTRACT.md, performance-budgets.md and this report byte-for-byte. `chunk2-docs-*`, `chunk3-docs-generation-v2.log`. Generated validation output is in `chunk3-docs-check-v2/docs`; neither original docs checkout was regenerated.

## Native evidence index

- Reopen Inspector: `chunk2-reopened-inspector.png`.
- Parent-child CRUD/reopen/order/navigation: `chunk2-reopen-crud.png`, `chunk2-child-order.png`, `chunk2-deleted-child.png`, `chunk2-main-returned.png`, `chunk2-second-reopened.png`.
- Picking/live transform/playback: `chunk2-game-pick.png`, `chunk2-live-transform.png`, `chunk2-play-console.png`, `chunk2-paused.png`, `chunk2-restarted.png`.
- Active hide/restore (inspected in chunk 3): `chunk2-native-inactive.png`, `chunk2-native-active.png`.
- Native relative PNG Sprite: `chunk3-sprite-real-server.png`.
- Enabled persistence and restored pixels: `chunk3-sprite-disabled-reopened.png`, `chunk3-sprite-enabled-again.png`.
- Intentional runtime resource error: `chunk3-native-diagnostic.png`; red errors are expected in this negative test, not ignored unexplained failures.
- Recovery/duplicate reload: `chunk3-duplicate-live-fixed.png`, zero warning/error counters.

The first chunk-3 Sprite attempt had a black iframe because the Vite server had exited (curl returned 000). Restarted Vite, verified HTTP 200, reopened the actual project and repeated the test successfully. Do not count that failed attempt as rendering evidence. GTK folder-autocomplete failures from earlier chunks likewise remain recorded, not hidden.

## Local verification

- Full canonical `npm test` passed after the final production fixes: `chunk3-canonical-final.log`, final Node-test batch 100/100. The initial chunk-3 full run failed a test manually calling script.Init outside scheduler tracking; updated that test to use the actual ScriptManager scheduler and reran the full command.
- Focused real-runtime lifecycle/Inspector/console suite passed 27/27; real-resource/embedded-playback suite passed 14/14; docs preservation regression passed.
- `cd triton && npm run lint && npm run build` passed; nonfatal old Browserslist data and >500kB bundle warnings remain.
- Real isolated `node scripts/generate-docs.js` completed successfully with authored-guide byte checks and fresh resetProject source docs.
- `git diff --check` passed. Final committed-head canonical/lint/build results and main integration SHA are recorded in the issue/handoff after execution, not predicted here.

No remaining functional acceptance item is being waived due to environment limitations. This is not a claim of a packaged-native build, exhaustive simulation timing instrumentation, release readiness, or validation of the unrelated stale generated-doc batch.
