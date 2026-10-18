# HTML UI bridge

Neptune's HTML UI bridge connects a game running in a window or iframe with a separate HTML interface. It uses versioned `postMessage` messages, validates the sender and exact origin, and accepts only action names explicitly allowlisted by the game.

## Install the game-side bridge

```js
import { createUIBridge } from "../../src/ui/ui.js";

const bridge = createUIBridge({
  window,
  parent: window.parent,
  origin: "https://ui.example.com",
  targetOrigin: "https://game.example.com",
  actions: ["dialogue:choose", "game:pause"]
});

const stopChoice = bridge.onAction("dialogue:choose", ({ choice }) => chooseDialogue(choice));
bridge.emit("hud:update", { health: 8, maxHealth: 10 });
// When the game view is disposed:
stopChoice();
bridge.destroy();
```

`origin` is the exact trusted sender origin; `targetOrigin` is the exact destination. Both must be explicit, non-opaque origins; wildcard `*` is rejected. Keep the action allowlist small and validate application-level values in each handler as well. Messages from any other source or origin, unknown action names, unsupported protocol versions, and non-JSON/cyclic payloads are ignored. Never put secrets in UI messages.

`createUIBridge` returns `subscribe(name, callback)`, `onAction(name, callback)`, `emit(name, payload)`, and `destroy()`. `onAction` only subscribes to configured actions. `subscribe("*", callback)` receives `(name, payload)` for any accepted action. `emit` sends engine-to-UI events and requires a non-empty event name. Unsubscribe callbacks detach handlers; `destroy()` removes the window message listener and clears subscriptions.

## Build the HTML-side client

Use the same allowlists in the embedded UI. `createHTMLUIClient` sends only approved actions and accepts only configured event names from the parent window.

```js
import { createHTMLUIClient } from "../../src/ui/ui.js";

const ui = createHTMLUIClient({
  window,
  actions: ["dialogue:choose", "game:pause"],
  events: ["hud:update"]
});

ui.on("hud:update", ({ health, maxHealth }) => renderHealth(health, maxHealth));
ui.emit("dialogue:choose", { choice: 1 });
ui.emit("game:pause", { paused: true });
ui.destroy(); // removes its listener and clears handlers
```

Inbound messages must come from `window.parent` with the same origin as the HTML page. Use `on(name, callback)` for event subscriptions; `on("*", callback)` receives the event name and payload. Payloads are cloned JSON data: finite numbers, strings, booleans, null, arrays, and plain objects. Functions, cyclic objects, class instances, and non-finite numbers are rejected or ignored. Call `destroy()` when the UI is disposed.

For a one-call install helper, `installHTMLUI({ window, actions, events })` sets `window.neptuneUI` to the client and returns it. Destroy the client when done. Installing twice on the same window throws.

## Keyboard and controller navigation

`installUINavigation(root, options)` adds arrow-key focus movement and Enter/Space activation for buttons, links, inputs, selects, and elements marked `[data-neptune-nav]`. Hidden and `aria-hidden="true"` elements are skipped. The optional `gamepad` adapter receives a callback; call it with `up`, `down`, `left`, `right`, or `activate` to reuse the same navigation behavior.

```js
import { installUINavigation } from "../../src/ui/ui.js";

const stopNavigation = installUINavigation(document.querySelector("#menu"), {
  onNavigate: ({ index, element, direction }) => updateSelection(index, direction),
  onActivate: ({ element }) => element.click(),
  gamepad: dispatch => controller.onCommand(dispatch)
});

// On menu close, release keyboard and controller listeners.
stopNavigation();
```

The returned cleanup callback removes the key listener and invokes the cleanup function returned by the controller adapter, if any. `createUIBridge`, `createHTMLUIClient`, `installHTMLUI`, and `installUINavigation` are exported by `src/ui/ui.js`.

See [UI layout and rendering](ui-layout.md) for canvas UI components and containers.
