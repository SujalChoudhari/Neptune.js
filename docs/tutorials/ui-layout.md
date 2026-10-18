# Canvas UI layout and rendering

The canvas UI module exports `UITransform`, `Panel`, `Text`, `UISprite`, and layout containers from `src/ui/ui.js`. Add a `UITransform` to each UI entity and compose the visual components and children on the same entity tree.

```js
import { Entity, Color, UI } from "../../src/neptune.js";
import { Font } from "../../src/rendering/font.js";

const card = new Entity("Card");
card.AddComponent(new UI.UITransform(0.2, 0.2, 4, 2));
card.AddComponent(new UI.Panel(Color.white));

const title = new Entity("Title");
title.AddComponent(new UI.UITransform(0, 0, 4, 0.5));
title.AddComponent(new UI.Text("Inventory", new Font(), UI.Text.ALIGN.LEFT, Color.black));
card.AddChild(title);
```

`UITransform(x, y, width, height, rotation)` defaults to `(0, 0, 10, 10, 0)`. It exposes `x`, `y`, `width`, `height`, and `rotation` (degrees), plus a `center` getter/setter. UI elements use rectangular dimensions rather than world-transform scale. `Align(mode)` positions an element against its parent (or the browser window when there is no parent): `left`, `right`, `top`, `bottom`, `center`, or `middle`. `Fill(mode, padX, padY)` sets width, height, and position to fill the parent/window with optional padding; `mode` is `both`, `x`, or `y`. `IsHovered()` and `IsClicked()` use the mouse input system.

## Visual components

`Panel(color)` draws a flat rectangle and defaults to fuchsia when no color is provided. `UISprite(path)` draws an image stretched to its UITransform rectangle; update its `path` property to change the image. `Text(text, font, align, color)` draws text using a `Font`, `Color`, and `Text.ALIGN` value (`LEFT`, `CENTER`, `RIGHT`, `START`, or `END`). These are renderables: child renderables are drawn in render-order order. Use the same entity for multiple visual components when they should share one transform and child tree.

## Containers

Containers lay out the direct children of the entity holding the container. Call `Update()` after changing child membership, container dimensions, or layout properties; layout is not automatically recalculated.

```js
import { Entity, UI } from "../../src/neptune.js";

const row = new Entity("Toolbar");
row.AddComponent(new UI.UITransform(0, 0, 8, 1));
row.AddComponent(new UI.HBoxContainer(0.1));
for (const name of ["Play", "Pause", "Stop"]) {
  const button = new Entity(name);
  button.AddComponent(new UI.UITransform());
  row.AddChild(button);
}
row.GetComponent(UI.HBoxContainer).Update();
```

- `HBoxContainer(spacing)` divides parent width evenly across children and places them from left to right; each child receives the parent's height.
- `VBoxContainer(spacing)` divides parent height evenly across children and places them from top to bottom; each child receives the parent's width.
- `GridContainer(columns, rows, spacing)` divides parent width/height by the configured columns/rows, then places children in row-major order. It does not cap child count to the configured grid size.
- `MarginContainer(left, right, top, bottom)` divides available parent width among its children and applies top/bottom margins to their height; its horizontal margins affect the stride between children.

For these current layout implementations, spacing/margins are added to placement strides rather than subtracted before dividing child dimensions. Large spacing can therefore place later children beyond the parent bounds. `Container` is the base class; use a concrete layout container and explicitly call its `Update()` method.

The canvas UI components render through Neptune's canvas renderer. For an HTML DOM overlay or UI in another window, use the [HTML UI bridge](html-ui-bridge.md) instead.
