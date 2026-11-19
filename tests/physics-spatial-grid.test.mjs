import "./setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";

import { SpatialHashGrid } from "../src/nereid/spatialHashGrid.js";
import * as Nereid from "../src/nereid/index.js";
import * as Neptune from "../src/neptune.js";

test("PHYS-04 Exports: SpatialHashGrid is exported across spatialHashGrid, nereid, and neptune", () => {
    assert.equal(typeof SpatialHashGrid, "function");
    assert.equal(Nereid.SpatialHashGrid, SpatialHashGrid);
    assert.equal(Neptune.SpatialHashGrid, SpatialHashGrid);
});

test("SpatialHashGrid: insertion, AABB query, and circular radius query", () => {
    const grid = new SpatialHashGrid({ cellSize: 32 });

    const objA = { name: "A" };
    const objB = { name: "B" };
    const objC = { name: "C" };

    grid.insert(objA, { left: 10, right: 20, top: 10, bottom: 20 });
    grid.insert(objB, { left: 40, right: 50, top: 10, bottom: 20 });
    grid.insert(objC, { left: 100, right: 110, top: 100, bottom: 110 });

    assert.equal(grid.size, 3);

    // Query AABB covering objA and objB
    const aabbResults = grid.queryAABB({ left: 0, right: 60, top: 0, bottom: 30 });
    assert.equal(aabbResults.length, 2);
    assert.ok(aabbResults.includes(objA));
    assert.ok(aabbResults.includes(objB));
    assert.ok(!aabbResults.includes(objC));

    // Query radius around objA center (15, 15) with radius 10
    const radiusResults = grid.queryRadius(15, 15, 10);
    assert.equal(radiusResults.length, 1);
    assert.equal(radiusResults[0], objA);
});

test("SpatialHashGrid: handles negative coordinates without index or modulo bugs", () => {
    const grid = new SpatialHashGrid({ cellSize: 32 });

    const negA = { id: "negA" };
    const negB = { id: "negB" };

    // Place objects in negative coordinate space
    grid.insert(negA, { left: -50, right: -40, top: -50, bottom: -40 });
    grid.insert(negB, { left: -10, right: 5, top: -10, bottom: 5 }); // Spans negative and positive cell

    assert.equal(grid.worldToCell(-50), -2); // Math.floor(-50 / 32) = -2
    assert.equal(grid.worldToCell(5), 0);

    const results = grid.queryAABB({ left: -60, right: -30, top: -60, bottom: -30 });
    assert.equal(results.length, 1);
    assert.equal(results[0], negA);

    const spanResults = grid.queryRadius(0, 0, 15);
    assert.equal(spanResults.length, 1);
    assert.equal(spanResults[0], negB);
});

test("SpatialHashGrid: movement updates and boundary crossing optimization", () => {
    const grid = new SpatialHashGrid({ cellSize: 64 });
    const actor = { id: "player" };

    grid.insert(actor, { left: 10, right: 20, top: 10, bottom: 20 });

    // Move slightly within same cell (0..64)
    const changed1 = grid.update(actor, { left: 15, right: 25, top: 15, bottom: 25 });
    assert.equal(changed1, false); // No cell re-indexing required!

    // Cross cell boundary into cell (1, 0) -> x = 70..80
    const changed2 = grid.update(actor, { left: 70, right: 80, top: 15, bottom: 25 });
    assert.equal(changed2, true);

    // Old cell should no longer return actor
    const oldQuery = grid.queryAABB({ left: 0, right: 50, top: 0, bottom: 50 });
    assert.equal(oldQuery.length, 0);

    // New cell returns actor
    const newQuery = grid.queryAABB({ left: 60, right: 100, top: 0, bottom: 50 });
    assert.equal(newQuery.length, 1);
    assert.equal(newQuery[0], actor);
});

test("SpatialHashGrid: handles oversized colliders spanning multiple cells safely", () => {
    const grid = new SpatialHashGrid({ cellSize: 32, maxCellSpan: 16 });
    const hugeBoss = { id: "huge_boss" };

    // Bounding box: 150x150 units, spans ~5x5 = 25 cells
    grid.insert(hugeBoss, { left: 0, right: 150, top: 0, bottom: 150 });

    // Query tiny region at far corner (140, 140) -> should find hugeBoss without duplicates
    const queryCorner = grid.queryAABB({ left: 135, right: 145, top: 135, bottom: 145 });
    assert.equal(queryCorner.length, 1);
    assert.equal(queryCorner[0], hugeBoss);

    // Query entire area -> should still return hugeBoss exactly ONCE
    const queryFull = grid.queryAABB({ left: -20, right: 200, top: -20, bottom: 200 });
    assert.equal(queryFull.length, 1);
    assert.equal(queryFull[0], hugeBoss);
});

test("SpatialHashGrid: teleportation and removal on scene unload", () => {
    const grid = new SpatialHashGrid({ cellSize: 64 });
    const mob = { id: "mob" };

    grid.insert(mob, { left: 0, right: 10, top: 0, bottom: 10 });
    assert.equal(grid.size, 1);

    // Teleport far away
    grid.teleport(mob, { left: 1000, right: 1010, top: 1000, bottom: 1010 });
    assert.equal(grid.queryAABB({ left: 0, right: 20, top: 0, bottom: 20 }).length, 0);
    assert.equal(grid.queryAABB({ left: 990, right: 1020, top: 990, bottom: 1020 }).length, 1);

    // Remove
    const removed = grid.remove(mob);
    assert.equal(removed, true);
    assert.equal(grid.size, 0);
    assert.equal(grid.queryAABB({ left: 990, right: 1020, top: 990, bottom: 1020 }).length, 0);

    // Clear
    grid.insert({ id: "x" }, { left: 0, right: 1, top: 0, bottom: 1 });
    grid.clear();
    assert.equal(grid.size, 0);
});

test("SpatialHashGrid: getPotentialCollisionPairs generates unique deduplicated candidate pairs", () => {
    const grid = new SpatialHashGrid({ cellSize: 32 });

    const a = { id: "a" };
    const b = { id: "b" };
    const c = { id: "c" };

    // a and b overlap
    grid.insert(a, { left: 10, right: 30, top: 10, bottom: 30 });
    grid.insert(b, { left: 20, right: 40, top: 20, bottom: 40 }); // Overlaps a

    // c is far away
    grid.insert(c, { left: 200, right: 220, top: 200, bottom: 220 });

    const pairs = grid.getPotentialCollisionPairs();
    assert.equal(pairs.length, 1);
    assert.ok(pairs[0].includes(a));
    assert.ok(pairs[0].includes(b));
});
