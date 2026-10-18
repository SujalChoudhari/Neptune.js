import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const guideUrl = new URL("../docs/tutorials/tilemaps.md", import.meta.url);

test("tilemap guide covers implemented Thalassa APIs and contracts", async () => {
    const guide = await readFile(guideUrl, "utf8");
    const tilemap = await readFile(new URL("../src/thalassa/tilemap.js", import.meta.url), "utf8");
    const tileset = await readFile(new URL("../src/thalassa/tileset.js", import.meta.url), "utf8");
    const index = await readFile(new URL("../src/thalassa/index.js", import.meta.url), "utf8");

    for (const method of [
        "addLayer", "getLayer", "setTileMetadata", "getTileMetadata", "gridIndex",
        "occupy", "moveOccupant", "moveOccupantToward", "vacate", "getOccupant",
        "isWalkable", "findPath", "setTile", "getTile", "loadFromArray",
        "worldToTile", "isSolid", "draw"
    ]) {
        assert.ok(tilemap.includes(`${method}(`), `Tilemap should implement ${method}`);
        assert.ok(guide.includes(method), `guide should document ${method}`);
    }
    for (const method of ["getTileRect", "drawTile"]) {
        assert.ok(tileset.includes(`${method}(`), `Tileset should implement ${method}`);
        assert.ok(guide.includes(`${method}(`), `guide should document ${method}`);
    }
    assert.match(index, /export \{ Tileset \}/);
    assert.match(index, /export \{ Tilemap \}/);
    assert.match(guide, /or `null` when no route exists/);
    assert.match(guide, /asynchronously/);
});
