# Neptune HTML UI demo

Serve the repository root so the demo can import `src/ui/bridge.js`:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/examples/html-ui/` for the nine example screens. The demo covers HUD, dialogue, choices, inventory, equipment, quests, shop, pause, and settings; keyboard arrows/Enter move through focusable controls, and a small controller adapter can be supplied via `installUINavigation`. The Settings screen includes an accessible scale control, semantic navigation, visible focus, and a live status region.

For a real-browser, cross-frame bridge check, open `http://localhost:8000/examples/html-ui/smoke.html`. It loads the UI in an iframe, sends a typed choice action into the engine bridge, sends a HUD update back to the UI, and displays `PASS` only after both directions succeed. No browser automation package is required.

The game-side integration uses `createUIBridge({ window, parent: iframe.contentWindow, origin, targetOrigin, actions })`; subscribe with `onAction` and send state using `emit`. The embedded page uses `installHTMLUI({ actions, events })`, then `window.neptuneUI.on(...)` and `window.neptuneUI.emit(...)`. Keep origins exact and use only allowlisted action/event names; never use `*` as an origin.
