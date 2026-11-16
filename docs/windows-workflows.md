# Windows editor and Emberfall workflow verification

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

## Remaining game scope

Emberfall is one room with placeholder shapes and three melee guardians. Multi-map progression, ranged abilities, dialogue, equipment UI and phased bosses remain on the README roadmap. Project modules use the injected engine API; relative imports from their Blob URLs are not supported. The current generic inspector preserves module/settings data but does not offer a specialized settings editor.
