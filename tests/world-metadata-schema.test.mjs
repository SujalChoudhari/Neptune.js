import "./setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";

import { WorldMetadataRegistry, SEMANTIC_LAYER_TYPES } from "../src/thalassa/worldMetadata.js";
import * as Thalassa from "../src/thalassa/index.js";
import * as Neptune from "../src/neptune.js";

test("WORLD-01 Exports: WorldMetadataRegistry and constants are exported across thalassa and neptune", () => {
    assert.equal(typeof WorldMetadataRegistry, "function");
    assert.ok(Array.isArray(SEMANTIC_LAYER_TYPES));

    assert.equal(Thalassa.WorldMetadataRegistry, WorldMetadataRegistry);
    assert.equal(Thalassa.SEMANTIC_LAYER_TYPES, SEMANTIC_LAYER_TYPES);

    assert.equal(Neptune.WorldMetadataRegistry, WorldMetadataRegistry);
    assert.equal(Neptune.SEMANTIC_LAYER_TYPES, SEMANTIC_LAYER_TYPES);
});

test("WorldMetadataRegistry: tile registration and metadata validation", () => {
    const registry = new WorldMetadataRegistry();

    const grass = registry.registerTile(1, {
        name: "Grass",
        walkable: true,
        material: "grass",
        traversalCost: 1.0,
        elevation: 0
    });

    const water = registry.registerTile(2, {
        name: "Water",
        walkable: false,
        material: "water",
        traversalCost: 3.5,
        hazard: { damage: 5, damageType: "drown" }
    });

    assert.equal(registry.hasTile(1), true);
    assert.equal(registry.hasTile(2), true);
    assert.equal(registry.hasTile(999), false);

    assert.equal(registry.getTile(1).material, "grass");
    assert.equal(registry.getTile(2).walkable, false);
});

test("WorldMetadataRegistry: diagnostics for unknown tile, missing layer, and invalid elevation", () => {
    const registry = new WorldMetadataRegistry();

    // Unknown tile lookup
    assert.throws(() => {
        registry.getTile(404);
    }, /Unknown tile id: 404/);

    // Missing layer lookup
    assert.throws(() => {
        registry.getLayer("non_existent_layer");
    }, /Missing layer: non_existent_layer/);

    // Invalid elevation
    assert.throws(() => {
        registry.registerTile(3, { elevation: -5 });
    }, /elevation must be a finite number >= 0/);
});

test("WorldMetadataRegistry: multi-layer composition and override conflict resolution", () => {
    const registry = new WorldMetadataRegistry();

    registry.registerTile("grass", { name: "Grass", walkable: true, material: "grass", traversalCost: 1.0 });
    registry.registerTile("wall", { name: "Stone Wall", walkable: false, material: "stone", traversalCost: Infinity });

    // Layer 1: Visual ground layer
    registry.addLayer({
        id: "ground",
        type: "visual",
        zIndex: 0,
        width: 5,
        height: 5
    });

    // Layer 2: Collision layer
    registry.addLayer({
        id: "collision",
        type: "collision",
        zIndex: 10,
        width: 5,
        height: 5
    });

    // Tile (2, 2) has grass on ground layer
    registry.setTileAt("ground", 2, 2, "grass");
    // Tile (2, 2) has solid wall on collision layer (override conflict)
    registry.setTileAt("collision", 2, 2, "wall");

    const composed = registry.getComposedMetadataAt(2, 2);

    // Conflict resolved: collision layer overrides ground layer -> walkable is FALSE, material is STONE
    assert.equal(composed.walkable, false);
    assert.equal(composed.material, "stone");

    // Tile (0, 0) only has grass
    registry.setTileAt("ground", 0, 0, "grass");
    const openTile = registry.getComposedMetadataAt(0, 0);
    assert.equal(openTile.walkable, true);
    assert.equal(openTile.material, "grass");
});

test("WorldMetadataRegistry: zone definitions and 3D elevation interval queries", () => {
    const registry = new WorldMetadataRegistry();

    // Ground safe zone: elevation 0..2
    registry.addZone({
        id: "town_square",
        name: "Town Square",
        type: "safe_zone",
        bounds: { left: 0, right: 10, top: 0, bottom: 10 },
        elevation: 0,
        height: 2
    });

    // Sky platform zone at same 2D coordinates: elevation 10..15
    registry.addZone({
        id: "sky_sanctuary",
        name: "Sky Sanctuary",
        type: "dungeon",
        bounds: { left: 0, right: 10, top: 0, bottom: 10 },
        elevation: 10,
        height: 5
    });

    // Query at ground level (elevation 1)
    const groundZones = registry.getZonesAt(5, 5, 1);
    assert.equal(groundZones.length, 1);
    assert.equal(groundZones[0].id, "town_square");

    // Query at high elevation (elevation 12)
    const skyZones = registry.getZonesAt(5, 5, 12);
    assert.equal(skyZones.length, 1);
    assert.equal(skyZones[0].id, "sky_sanctuary");

    // Query at intermediate elevation (elevation 6) -> no zone
    const midZones = registry.getZonesAt(5, 5, 6);
    assert.equal(midZones.length, 0);
});

test("WorldMetadataRegistry: serialization and restoration", () => {
    const registry = new WorldMetadataRegistry();

    registry.registerTile(1, { name: "Dirt", walkable: true, material: "dirt" });
    registry.addLayer({ id: "base", width: 2, height: 2 });
    registry.setTileAt("base", 0, 0, 1);
    registry.addZone({ id: "camp", bounds: { left: 0, right: 5, top: 0, bottom: 5 } });

    const json = registry.toJSON();
    const restored = WorldMetadataRegistry.fromJSON(json);

    assert.equal(restored.hasTile(1), true);
    assert.equal(restored.getTile(1).material, "dirt");
    assert.equal(restored.getLayer("base").width, 2);
    assert.equal(restored.zones.has("camp"), true);
});
