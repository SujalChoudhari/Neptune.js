# Learning Beyond the Basics

## Introduction
Its time to say bye, and start your journey with Neptune.
While this guide has introduced you to the various classes, Neptune offers a wide range of additional classes and features to enhance your application's functionality. This guide covers only a fraction of what Neptune can do. To unlock the full potential, we encourage you to explore the comprehensive documentation.

## Further Exploration
### Sound

The `Sound` class allows you to manage audio elements in your application, enabling sound effects, music, and more. To learn how to utilize sound in your app, refer to the Neptune documentation's **Sound** section.

### Renderables

The `Renderables` module provides various classes for rendering visuals, including sprites, textures, and more. To create stunning visuals for your entities, dive into the **Renderables** section in the documentation.

### HTML UI bridge

Neptune can connect an HTML interface to game state with the `UI` bridge. The game-side bridge subscribes to explicitly allowlisted UI actions and emits state events; HTML pages can use the `neptuneUI` client to send actions and subscribe to events.

```js
import { UI } from "neptune";

const bridge = UI.createUIBridge({
  origin: "https://game.example",
  targetOrigin: "https://game.example",
  actions: ["pause", "dialogue:choose"]
});

bridge.onAction("pause", ({ paused }) => game.setPaused(paused));
bridge.emit("hud:update", { health: 80 });
```

Install the HTML client from a module in the embedded page and subscribe only to events your interface needs:

```js
import { installHTMLUI } from "neptune";

const ui = installHTMLUI({ actions: ["pause"], events: ["hud:update"] });
ui.on("hud:update", ({ health }) => {
  document.querySelector("[data-health]").textContent = String(health);
});
document.querySelector("[data-pause]").addEventListener("click", () => {
  ui.emit("pause", { paused: true });
});
```

Use exact, non-opaque origins (never `*`). The bridge accepts only messages from the configured window and origin, and payloads must be acyclic JSON data. For keyboard focus order, arrow navigation, activation callbacks, and an optional controller adapter, install `UI.installUINavigation(root, { gamepad })`; the adapter receives a callback that accepts `up`, `down`, `left`, `right`, and `activate`, and returns an optional cleanup function. Use semantic controls, visible focus, labels, and `aria-live` for changing status/dialogue text. For scaling, size the HTML overlay relative to its game container (for example `width: 100%`, `max-width`, and `clamp()` for text), preserve browser zoom, and apply any engine camera/DPI scale as a CSS custom property rather than baking pixel sizes into controls. The bridge itself stays presentation-agnostic; implement HUD, dialogue, choice, inventory, equipment, quest, shop, pause, and settings layouts in HTML/CSS and route their actions through the allowlist.

### Filters and BlendModes

For advanced visual effects, Neptune offers filters and blend modes. These allow you to apply shaders and manipulate how entities are rendered. To create eye-catching graphics, head over to the **Filters** and **BlendModes** sections.

### There's More!
We highly recommend exploring the documentation to discover all the features Neptune has to offer. The documentation is organized into sections, making it easy to find the information you need.

## Conclusion

The world of Neptune is rich with classes and features waiting to be explored. This guide has provided you with a solid foundation, but there's so much more to discover. We invite you to dive into the documentation, experiment with various classes, and unleash the full potential of Neptune in your applications.

Visit the [Neptune Documentation](https://neptune-js.vercel.app) to learn more about each class, explore examples, and gain a deeper understanding of Neptune's capabilities.
