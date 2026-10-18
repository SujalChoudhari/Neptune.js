# Tilemaps and tilesets

Thalassa provides `Tileset` for a sprite sheet and `Tilemap` for a rectangular grid. A tile ID is zero-based, read left-to-right and then top-to-bottom in the sheet. `-1` means an empty cell.

```js
import { Tilemap, Tileset } from "../../src/thalassa/index.js";

const tileset = new Tileset("assets/tiles.png", 16, 16);
const ground = new Tilemap(tileset, 20, 12);
ground.loadFromArray([
  [0, 0, 0, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0]
]);
ground.setTile(2, 1, -1); // clear a cell
ground.getTile(0, 0);     // 0
```

`loadFromArray` sets the map dimensions from a rectangular two-dimensional array. A null or undefined cell becomes empty; ragged rows and tile IDs below `-1` are rejected. `setTile` ignores coordinates outside the map; `getTile` returns `-1` outside it. Dimensions passed to the constructor must be non-negative integers. A `Tileset` requires a resource path and positive tile pixel dimensions (default `16 × 16`).

## Tile coordinates and rendering

Tilemap coordinates are integer grid coordinates. `worldToTile(worldX, worldY)` divides by the scaled tile pixel size and floors each result. `pixelWidth` and `pixelHeight` include `scale`; `isSolid(x, y)` means the cell contains a non-empty tile, not necessarily that it blocks movement.

```js
const tile = ground.worldToTile(player.transform.position.x, player.transform.position.y);
if (ground.isSolid(tile.x, tile.y)) {
  // Apply the game's collision or interaction rule here.
}

// In the render loop; offsets are camera offsets in pixels.
ground.draw(context, camera.x, camera.y);
```

The tileset image loads asynchronously. Drawing before its image has loaded is a no-op. Tile IDs resolve to source rectangles in row-major order; `getTileRect(tileId)` returns `{ x, y, w, h }` in source-image pixels.

For direct spritesheet drawing, `Tileset.drawTile(context, tileId, destX, destY, scale = 1)` draws one tile at the requested destination. `Tilemap.draw` calls this helper for each non-empty cell.

## Layers

Use `addLayer(name, map, renderOrder)` to compose maps that share world dimensions and coordinates (for example, ground, decorations, and foreground). The method returns the added map; `getLayer(name)` returns it or `undefined`. Layers draw after their parent in ascending `renderOrder`, with insertion order retained for equal orders. Nested layers are supported.

```js
const decoration = new Tilemap(tileset, ground.width, ground.height);
ground.addLayer("decoration", decoration, 10);
const sameDecoration = ground.getLayer("decoration");
```

Names must be unique within a map, render order must be finite, and a map cannot be its own layer. This API does not automatically enforce matching dimensions between layers.

## Gameplay metadata and grid movement

Metadata is keyed by tile ID, so every cell using that ID has the same properties. Supported fields are `walkable`, `terrain`, non-negative `damage` and `slowdown`, and object-or-null `interaction` and `transition` values. Metadata is cloned when stored and returned, so callers cannot mutate the map by retaining an object reference.

```js
ground.setTileMetadata(1, {
  walkable: false,
  terrain: "stone",
  damage: 2,
  interaction: { prompt: "Inspect" }
});
const stone = ground.getTileMetadata(1);

const guard = { name: "guard" };
ground.occupy(0, 0, guard);
const path = ground.findPath(0, 0, 3, 2, guard);
const nextCell = ground.moveOccupantToward(guard, 3, 2);
// moveOccupantToward has already moved the guard by one cardinal step.
const oldCell = ground.vacate(guard);
```

`isWalkable` requires an in-bounds, empty tile unless metadata explicitly marks its tile ID walkable; an occupant blocks other movers. `occupy` places or relocates an occupant and returns false if blocked. `moveOccupant` moves one cardinal cell and leaves occupancy unchanged on failure. `findPath` returns a deterministic shortest four-way path excluding the start, or `null` when no route exists; the same start and goal returns an empty path. `moveOccupantToward` advances one path step and returns the new coordinates (or `null`). `gridIndex(x, y)` exposes the row-major index, or `null` out of bounds; `getOccupant` returns the occupant or `null`.

For physics-based collision against tilemaps, see the [Nereid tile collision source](../../src/nereid/tilecollision.js). For the playable tilemap sample, see the [action-RPG tutorial](action-rpg.md).
