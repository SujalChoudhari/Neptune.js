# Windows editor and Emberfall workflow verification

## November 19 five-batch acceptance

Verified the built frontend in the actual Windows Tauri editor using an isolated WebView2 profile and disposable projects. The verification page uses the configured `http://localhost:5173` dev URL: navigating the native webview to `127.0.0.1` instead is a different origin and does not receive the default native capability permissions. No additional production permission was introduced.

The Scene View passed nested child picking and gizmo alignment under a rotated, nonuniformly scaled renderable parent; authored HTML UI preview; an opt-in BoxCollider Inspector change written to a real scene file; save/reopen; and Undo/Redo after reopening. The production Chromium viewport regression additionally covers the reported 180% zoom/negative-pan offset, visible grid pixels, dragging and undo. These are distinct native and browser checks.

Opened an isolated copy of Emberfall with `scenes/expedition.scene` as its main scene. Game View passed its self-contained title menu, PNG asset loading, ordinary keyboard movement, game-owned pause, gameplay save, return-to-title, Continue at the saved position and Stop cleanup. Scene View did not start the gameplay HUD. Original SVG art is retained as source; native image loading uses PNG copies supported by the existing backend.

The complete integrated tests, editor build/lint and documentation contracts passed. The browser expedition route completed its seals, boss, altar, saved-world reload and ending through ordinary input. Its 140.7-second automated measurement does not establish the 10–15 minute fresh-player quality target. No release/package, broad performance or complete-roadmap acceptance is implied.

The remaining sections record earlier checks and their historical limits.

November 16, 2026. These observations cover the named workflows, not every engine feature or the completed ARPG roadmap.

## Startup repair

Reproduced `EBUSY` when Vite attempted to watch a Rust compiler DLL inside `triton/src-tauri/target`. The frontend watcher now ignores the native backend subtree; Tauri retains responsibility for watching native source. A real watcher regression confirms frontend changes are still observed and native artifacts are excluded. The native debug executable completed compilation and opened a responding Neptune window.

## Native acceptance

Used Playwright over a loopback WebView2 debugging session attached to the actual Windows Tauri app. Native commands were not stubbed. Used an ignored copy of Emberfall under `work/native-emberfall` for destructive verification so the shipped starter remains unchanged.

- Opened the versioned `.npt` project through the Recent Projects UI and auto-loaded its main scene.
- Selected Wanderer, changed X to 2.5, clicked Save scene, and read the real scene file from disk to confirm the serialized change.
- Reloaded the editor, reopened the project, and verified X remained 2.5 in Inspector.
- Disabled/re-enabled the entity and saved through the production UI.
- Started Game View and verified all four project behaviours loaded, including the HUD and gameplay code read through the native project resource bridge.
- Used actual keyboard input to move the player and round-trip a gameplay save slot.
- Paused, pressed movement input and confirmed position did not change; resumed and stopped successfully.
- No page errors occurred during these acceptance flows.

This validates native file persistence and real editor controls. It is separate from automated Chromium tests that use native-command stubs. Debugging was enabled for this verification session, not added to the shipped launcher.

## Runtime acceptance

The browser regression opens `examples/emberfall/index.html`, reads its `project.npt` and scene, starts the runtime, and exercises ordinary keyboard movement, collision, attacks and save/load. It reloads the runtime to verify persistent saves and resets the project to confirm project-owned UI is disposed. Additional tests cover quick key taps, repeat suppression, focus-loss cleanup, module path restrictions and behaviour destruction.

## Viewport and Windows launcher follow-up

Verified the restored original beveled controls in the native editor. New tool icons are 24px squares; Snap and Reset layout fit their labels. Clicked Wanderer directly in Scene View and confirmed the gizmo origin matches its rendered position. W moved 64 screen pixels at 100% zoom to exactly one world unit; Escape restored the initial transform. E/R/T/Y switched handles. Save scene wrote the expected transform to the actual scene file. Browser regressions additionally cover pan/zoom, foreground selection without colliders, drag cancellation outside the viewport and typing-safe shortcuts. Full nested renderable-parent gizmo editing remains incomplete.

The Windows product and window title are now **Neptune.js Triton**. Run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install-start-menu.ps1` from the checkout to create a per-user Start menu entry. This development shortcut starts the checkout through `scripts/start-editor.ps1`; it requires installed Node/Yarn/Rust/C++ prerequisites and is not a packaged release. Paths derive from the checkout. A minimized console keeps startup errors visible. Launched the installed shortcut and verified the real native window title plus scene editing and saving.

## Compact editor and display scaling

The editor now starts maximized in a normal decorated Windows window, not exclusive fullscreen. The native window reports maximized on this machine (1280×710 logical pixels, device scale 1.5). Opening Emberfall retains the Neptune.js Triton window name. Native picking, one-unit movement, cancellation through the asynchronous bridge and actual scene saving passed after the compact UI changes.

Browser integration at device scale 1.25 tests logical workspaces of 1024×640, 1280×720 and 1536×864. It checks readable hierarchy names, both position fields fitting within Inspector, usable viewport width and an onscreen status bar. This is emulated display scaling; the machine's actual Windows display setting was not changed to 125%.

Dock constraints are reapplied after restoring saved layouts; default widths are assigned after all groups exist. Hierarchy hover/focus actions overlay rows instead of permanently consuming label space. Inspector fields, toolbars, dialogs and shared controls use compact raised/inset styling with semantic colors. Rotated rectangle outlines follow the local visual frame with a thin unfilled stroke; nested-parent transform editing remains a separate open task.

Live activity reports property/value edits as unsaved, scene loading, play/stop and real file writes as pending/success/failure. Tests delay a write, reject one and retry successfully through the editor Save button. Save-race tests keep completions from old scenes from replacing current activity. Add Component is explicitly disabled because its earlier visible button had no handler.

## Remaining game scope

Emberfall is one room with placeholder shapes and three melee guardians. Multi-map progression, ranged abilities, dialogue, equipment UI and phased bosses remain on the README roadmap. Project modules use the injected engine API; relative imports from their Blob URLs are not supported. The current generic inspector preserves module/settings data but does not offer a specialized settings editor.
