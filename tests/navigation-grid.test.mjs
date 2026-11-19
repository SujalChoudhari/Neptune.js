import "./setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";

import { NavigationGrid, NavigationPath } from "../src/thalassa/navigationGrid.js";
import {
    NavigationGrid as ThalassaNavigationGrid,
    NavigationPath as ThalassaNavigationPath
} from "../src/thalassa/index.js";
import * as Neptune from "../src/neptune.js";
import { MaterialRegistry, MaterialInteraction } from "../src/sim/materialRegistry.js";

// =============================================================================
// 1. Module Exports & Initialization
// =============================================================================

test("NAV-01 Module Exports: NavigationGrid and NavigationPath are re-exported correctly", () => {
    assert.equal(typeof NavigationGrid, "function", "NavigationGrid is a class");
    assert.equal(typeof NavigationPath, "function", "NavigationPath is a class");

    // Thalassa index re-exports
    assert.equal(ThalassaNavigationGrid, NavigationGrid, "Thalassa exports NavigationGrid");
    assert.equal(ThalassaNavigationPath, NavigationPath, "Thalassa exports NavigationPath");

    // Neptune top-level re-exports
    assert.equal(Neptune.NavigationGrid, NavigationGrid, "Neptune exports NavigationGrid");
    assert.equal(Neptune.NavigationPath, NavigationPath, "Neptune exports NavigationPath");
    assert.equal(Neptune.Thalassa.NavigationGrid, NavigationGrid, "Neptune.Thalassa exports NavigationGrid");
});

test("NavigationGrid initializes with correct default properties and dimensions", () => {
    const grid = new NavigationGrid(12, 8, {
        defaultCost: 2.0,
        defaultWalkable: true,
        defaultElevation: 5,
        maxClimbHeight: 2
    });

    assert.equal(grid.width, 12);
    assert.equal(grid.height, 8);
    assert.equal(grid.maxClimbHeight, 2);
    assert.equal(grid.defaultCost, 2.0);

    const cell = grid.getCell(3, 4);
    assert.ok(cell, "Cell (3, 4) should exist");
    assert.equal(cell.walkable, true);
    assert.equal(cell.cost, 2.0);
    assert.equal(cell.elevation, 5);
    assert.equal(grid.isWalkable(3, 4), true);

    // Out of bounds checks
    assert.equal(grid.inBounds(12, 8), false);
    assert.equal(grid.inBounds(-1, 0), false);
    assert.equal(grid.getCell(-1, 0), null);
    assert.equal(grid.isWalkable(-1, 0), false);
});

test("NavigationGrid accepts options object in constructor", () => {
    const grid = new NavigationGrid({
        width: 6,
        height: 6,
        maxClimbHeight: 3,
        defaultCost: 1.5
    });

    assert.equal(grid.width, 6);
    assert.equal(grid.height, 6);
    assert.equal(grid.maxClimbHeight, 3);
    assert.equal(grid.getCost(0, 0), 1.5);
});

// =============================================================================
// 2. Traversal Costs & Weighted Pathfinding
// =============================================================================

test("NAV-01 Weighted paths: A* prefers lower-cost route over expensive terrain", () => {
    // 5x5 grid
    // Start at (0, 2), Goal at (4, 2)
    // Row 2 is direct, but cells (1, 2), (2, 2), (3, 2) are high-cost swamp (cost 10)
    // Row 1 is a detour through a paved road (cost 1)
    const grid = new NavigationGrid(5, 5, { allowDiagonal: false });

    // Set row 2 as swamp
    grid.setCost(1, 2, 10);
    grid.setCost(2, 2, 10);
    grid.setCost(3, 2, 10);

    // Find 4-way path
    const result = grid.findPath({ x: 0, y: 2 }, { x: 4, y: 2 });

    assert.equal(result.status, "success");
    assert.equal(result.success, true);
    assert.ok(result.length > 0, "Path should not be empty");

    // Verify none of the steps passed through the expensive swamp cells
    for (const step of result) {
        const isSwamp = (step.y === 2 && (step.x === 1 || step.x === 2 || step.x === 3));
        assert.equal(isSwamp, false, `Path should avoid swamp cell at (${step.x}, ${step.y})`);
    }

    // Direct path cost would have been 10 + 10 + 10 + 1 = 31
    // Detour cost: (0,1)[1] + (1,1)[1] + (2,1)[1] + (3,1)[1] + (4,1)[1] + (4,2)[1] = 6
    assert.ok(result.cost < 31, `Cost ${result.cost} should be significantly lower than direct swamp cost`);
    assert.equal(result.cost, 6, "Detour should have total cost 6");
});

test("NAV-01 Weighted paths: Integrates with SIM-01 material traversal costs", () => {
    const grid = new NavigationGrid(6, 3, { allowDiagonal: false });

    // Middle row is water (SIM-01 water traversal cost is 2)
    for (let x = 0; x < 6; x++) {
        grid.setCellMaterial(x, 1, "water");
    }
    // Top row is grass (SIM-01 grass traversal cost is 1)
    for (let x = 0; x < 6; x++) {
        grid.setCellMaterial(x, 0, "grass");
    }

    assert.equal(grid.getCost(2, 1), 2, "Water cell should have traversal cost 2");
    assert.equal(grid.getCost(2, 0), 1, "Grass cell should have traversal cost 1");

    // Path from (0, 0) to (5, 0) stays entirely on grass row 0
    const res = grid.findPath({ x: 0, y: 0 }, { x: 5, y: 0 });
    assert.equal(res.status, "success");
    assert.equal(res.cost, 5); // 5 steps * 1
    for (const step of res) {
        assert.equal(step.y, 0, "Path should stay on cheaper grass row");
    }
});

// =============================================================================
// 3. Solid Walls and Obstacles Block Paths
// =============================================================================

test("NAV-01 Walls: Solid wall blocks path when no route around exists", () => {
    const grid = new NavigationGrid(5, 5);

    // Build solid vertical wall at x = 2
    for (let y = 0; y < 5; y++) {
        grid.setWalkable(2, y, false);
    }

    const res = grid.findPath({ x: 0, y: 2 }, { x: 4, y: 2 });
    assert.equal(res.status, "unreachable");
    assert.equal(res.success, false);
    assert.equal(res.length, 0);
    assert.equal(res.cost, Infinity);
    assert.equal(res.isUnreachable(), true);
});

test("NAV-01 Walls: Path routes through a doorway in a solid wall", () => {
    const grid = new NavigationGrid(5, 5, { allowDiagonal: false });

    // Vertical wall at x = 2 with doorway at y = 3
    for (let y = 0; y < 5; y++) {
        if (y !== 3) {
            grid.setWalkable(2, y, false);
        }
    }

    const res = grid.findPath({ x: 0, y: 1 }, { x: 4, y: 1 });
    assert.equal(res.status, "success");
    assert.equal(res.success, true);

    // Path must pass through doorway at (2, 3)
    const doorStep = res.find((s) => s.x === 2 && s.y === 3);
    assert.ok(doorStep, "Path must traverse through doorway at (2, 3)");
});

// =============================================================================
// 4. Diagonal Corner Cutting Prevention
// =============================================================================

test("NAV-01 Diagonal corner-cutting: Strictly prevented past a solid wall", () => {
    // 3x3 grid
    // Start at (0, 0), Goal at (1, 1)
    // Solid wall at (1, 0)
    // Walkable at (0, 1)
    const grid = new NavigationGrid(3, 3, { allowDiagonal: true });
    grid.setWalkable(1, 0, false);

    const res = grid.findPath({ x: 0, y: 0 }, { x: 1, y: 1 });

    assert.equal(res.status, "success");
    // With corner cutting strictly prevented, the direct diagonal (0,0) -> (1,1) is illegal.
    // Instead, it must move to (0, 1) orthogonally, then to (1, 1).
    assert.equal(res.length, 2, "Path must take 2 orthogonal steps rather than cutting corner");
    assert.deepEqual(res[0], { x: 0, y: 1, cost: 1 });
    assert.deepEqual(res[1], { x: 1, y: 1, cost: 1 });
});

test("NAV-01 Diagonal corner-cutting: Squeezing between two diagonal walls is blocked", () => {
    // Start at (0, 0), Goal at (1, 1)
    // Walls at (1, 0) AND (0, 1)
    const grid = new NavigationGrid(3, 3, { allowDiagonal: true });
    grid.setWalkable(1, 0, false);
    grid.setWalkable(0, 1, false);

    // Goal (1, 1) is completely boxed off from (0, 0)
    const res = grid.findPath({ x: 0, y: 0 }, { x: 1, y: 1 });
    assert.equal(res.status, "unreachable");
    assert.equal(res.success, false);
    assert.equal(res.length, 0);
});

test("NAV-01 Diagonal movement: Permitted when corner is clear or corner-cutting allowed", () => {
    const grid = new NavigationGrid(3, 3, { allowDiagonal: true });
    // Both (1, 0) and (0, 1) are walkable
    const clearRes = grid.findPath({ x: 0, y: 0 }, { x: 1, y: 1 });
    assert.equal(clearRes.status, "success");
    assert.equal(clearRes.length, 1, "Direct diagonal step is 1 step");
    assert.equal(clearRes[0].x, 1);
    assert.equal(clearRes[0].y, 1);

    // Test with preventCornerCutting: false
    const wallGrid = new NavigationGrid(3, 3, { allowDiagonal: true });
    wallGrid.setWalkable(1, 0, false);
    const cutRes = wallGrid.findPath({ x: 0, y: 0 }, { x: 1, y: 1 }, { preventCornerCutting: false });
    assert.equal(cutRes.status, "success");
    assert.equal(cutRes.length, 1, "When corner cutting is explicitly allowed, diagonal is taken");
});

// =============================================================================
// 5. Elevation Climb Limits
// =============================================================================

test("NAV-01 Elevation climb limits: Block traversal exceeding maxClimbHeight", () => {
    const grid = new NavigationGrid(5, 5, { maxClimbHeight: 1, allowDiagonal: false });

    // Base elevation 0
    // Cliff at x = 2 with elevation 4 across all y
    for (let y = 0; y < 5; y++) {
        grid.setElevation(2, y, 4);
    }

    // Height difference |4 - 0| = 4 > maxClimbHeight(1)
    const res = grid.findPath({ x: 0, y: 2 }, { x: 4, y: 2 });
    assert.equal(res.status, "unreachable", "Cliff should block traversal");
    assert.equal(res.success, false);

    // With higher maxClimbHeight, cliff can be climbed
    const climbRes = grid.findPath({ x: 0, y: 2 }, { x: 4, y: 2 }, { maxClimbHeight: 4 });
    assert.equal(climbRes.status, "success", "Cliff can be climbed when maxClimbHeight allows");
    assert.ok(climbRes.length > 0);
});

test("NAV-01 Elevation: Detours around steep cliff via gentle slope/pass", () => {
    const grid = new NavigationGrid(5, 3, { maxClimbHeight: 1, allowDiagonal: false });

    // High cliff at (2, 0) and (2, 1)
    grid.setElevation(2, 0, 5);
    grid.setElevation(2, 1, 5);
    // Low pass at (2, 2) with elevation 1 (climb diff <= 1)
    grid.setElevation(2, 2, 1);

    const res = grid.findPath({ x: 0, y: 0 }, { x: 4, y: 0 });
    assert.equal(res.status, "success");

    // Path must detour through the pass at (2, 2)
    const passStep = res.find((s) => s.x === 2 && s.y === 2);
    assert.ok(passStep, "Path must cross cliff through the pass at (2, 2)");
});

// =============================================================================
// 6. Edge Cases: Same Start/Goal, Unreachable, Out of Bounds
// =============================================================================

test("NAV-01 Edge cases: Same start and goal returns immediately", () => {
    const grid = new NavigationGrid(10, 10);

    const res = grid.findPath({ x: 4, y: 4 }, { x: 4, y: 4 });
    assert.equal(res.status, "same_start_goal");
    assert.equal(res.success, true);
    assert.equal(res.cost, 0);
    assert.equal(res.length, 0);
    assert.equal(res.visitedNodes, 0);
    assert.equal(res.isSameStartGoal(), true);

    // With includeStart: true
    const resWithStart = grid.findPath({ x: 4, y: 4 }, { x: 4, y: 4 }, { includeStart: true });
    assert.equal(resWithStart.status, "same_start_goal");
    assert.equal(resWithStart.length, 1);
    assert.deepEqual(resWithStart[0], { x: 4, y: 4, cost: 0 });
});

test("NAV-01 Edge cases: Out-of-bounds start and goal return safely without throwing", () => {
    const grid = new NavigationGrid(10, 10);

    // Out of bounds goal
    assert.doesNotThrow(() => {
        const res = grid.findPath({ x: 0, y: 0 }, { x: 99, y: 99 });
        assert.equal(res.status, "out_of_bounds");
        assert.equal(res.success, false);
        assert.equal(res.length, 0);
        assert.equal(res.cost, Infinity);
        assert.equal(res.isOutOfBounds(), true);
    });

    // Negative coordinates
    assert.doesNotThrow(() => {
        const res = grid.findPath({ x: -1, y: 0 }, { x: 5, y: 5 });
        assert.equal(res.status, "out_of_bounds");
        assert.equal(res.success, false);
    });

    // Numerical coordinates signature: findPath(startX, startY, goalX, goalY)
    assert.doesNotThrow(() => {
        const res = grid.findPath(0, 0, 100, 100);
        assert.equal(res.status, "out_of_bounds");
        assert.equal(res.success, false);
    });
});

test("NAV-01 Edge cases: Unreachable goal on unwalkable tile", () => {
    const grid = new NavigationGrid(5, 5);
    grid.setWalkable(4, 4, false);

    const res = grid.findPath({ x: 0, y: 0 }, { x: 4, y: 4 });
    assert.equal(res.status, "unreachable");
    assert.equal(res.success, false);
    assert.equal(res.length, 0);
    assert.equal(res.cost, Infinity);
});

// =============================================================================
// 7. Dynamic Obstacles & Route Invalidation
// =============================================================================

test("NAV-01 Dynamic Obstacles: Adding and removing obstacles invalidates and reroutes paths", () => {
    const grid = new NavigationGrid(6, 4, { allowDiagonal: false });

    // Initial clear path along row 1
    const initialPath = grid.findPath({ x: 0, y: 1 }, { x: 5, y: 1 });
    assert.equal(initialPath.status, "success");
    assert.equal(grid.isRouteValid(initialPath), true);

    // Register route for monitoring
    grid.registerRoute("player_route", initialPath);

    let invalidationFired = false;
    const unsub = grid.onRouteInvalidated((event) => {
        invalidationFired = true;
        assert.equal(event.type, "obstacle_added");
    });

    // Add dynamic obstacle blocking (2, 1)
    const obstacle = grid.addObstacle("boulder_1", 2, 1);
    assert.ok(obstacle);
    assert.equal(invalidationFired, true, "Invalidation listener should be triggered");
    assert.equal(grid.hasObstacle("boulder_1"), true);
    assert.equal(grid.isCellBlockedByObstacle(2, 1), true);
    assert.equal(grid.isWalkable(2, 1), false, "Blocked cell is no longer walkable");

    // The initial path is now invalid!
    assert.equal(grid.isRouteValid(initialPath), false);
    const validation = grid.validateRoute(initialPath);
    assert.equal(validation.valid, false);
    assert.equal(validation.reason, "obstacle_blocked");

    // Query invalidated registered routes
    const invalidated = grid.getInvalidatedRoutes();
    assert.deepEqual(invalidated, ["player_route"]);

    // Recalculating path routes around the boulder
    const rerouted = grid.findPath({ x: 0, y: 1 }, { x: 5, y: 1 });
    assert.equal(rerouted.status, "success");
    const hitsBoulder = rerouted.some((s) => s.x === 2 && s.y === 1);
    assert.equal(hitsBoulder, false, "Rerouted path avoids boulder");

    unsub();

    // Remove obstacle
    const removed = grid.removeObstacle("boulder_1");
    assert.equal(removed, true);
    assert.equal(grid.hasObstacle("boulder_1"), false);
    assert.equal(grid.isCellBlockedByObstacle(2, 1), false);
    assert.equal(grid.isWalkable(2, 1), true);

    // Initial straight path is valid once again
    assert.equal(grid.isRouteValid(initialPath), true);
});

test("NAV-01 Dynamic Obstacles: Multi-cell rectangular and custom-cell obstacles", () => {
    const grid = new NavigationGrid(10, 10);

    // Add 2x3 obstacle
    grid.addObstacle({
        id: "large_wall",
        x: 3,
        y: 2,
        width: 2,
        height: 3
    });

    for (let x = 3; x <= 4; x++) {
        for (let y = 2; y <= 4; y++) {
            assert.equal(grid.isWalkable(x, y), false, `Cell (${x}, ${y}) should be blocked by obstacle`);
        }
    }

    grid.clearObstacles();
    assert.equal(grid.getObstacles().length, 0);
    assert.equal(grid.isWalkable(3, 2), true);
});

// =============================================================================
// 8. Chunk Links and Portals
// =============================================================================

test("NAV-01 Chunk links: Connects chunk boundary coordinates and enables portal traversal", () => {
    // 10x5 grid where column x = 5 is a deep chasm (unwalkable)
    const grid = new NavigationGrid(10, 5, { allowDiagonal: false });
    for (let y = 0; y < 5; y++) {
        grid.setWalkable(5, y, false);
    }

    // Without chunk link, (2, 2) to (8, 2) is impossible
    const blockedRes = grid.findPath({ x: 2, y: 2 }, { x: 8, y: 2 });
    assert.equal(blockedRes.status, "unreachable");

    // Add a chunk link / portal connecting boundary coordinate (4, 2) to (6, 2)
    const link = grid.addChunkLink({
        id: "bridge_portal",
        from: { x: 4, y: 2 },
        to: { x: 6, y: 2 },
        cost: 1.0,
        bidirectional: true
    });

    assert.ok(link);
    assert.equal(grid.getChunkLinks(4, 2).length, 1);
    assert.equal(grid.getChunkLinks(6, 2).length, 1, "Bidirectional link should exist at destination");

    // Path can now cross the chasm via the chunk link
    const res = grid.findPath({ x: 2, y: 2 }, { x: 8, y: 2 });
    assert.equal(res.status, "success");
    assert.equal(res.success, true);

    // Verify chunk link was used
    const linkStep = res.find((s) => s.isChunkLink && s.x === 6 && s.y === 2);
    assert.ok(linkStep, "Path should traverse chunk link to (6, 2)");
    assert.equal(linkStep.linkId, "bridge_portal");

    // Bidirectional: path can travel backwards from right chunk to left chunk
    const backRes = grid.findPath({ x: 8, y: 2 }, { x: 2, y: 2 });
    assert.equal(backRes.status, "success");
    const backLinkStep = backRes.find((s) => s.isChunkLink && s.x === 4 && s.y === 2);
    assert.ok(backLinkStep, "Path should traverse chunk link back to (4, 2)");
});

test("NAV-01 Chunk boundary wrap-around via chunk link", () => {
    // 10x1 grid
    // Right boundary (9, 0) connects to left boundary (0, 0)
    const grid = new NavigationGrid(10, 1, { allowDiagonal: false });
    grid.addChunkLink(9, 0, 0, 0, { id: "wrap_link", cost: 1.0, bidirectional: true });

    // Moving from (8, 0) to (1, 0)
    // Direct left traversal takes 7 steps: (8,0)->(7,0)->...->(1,0)
    // Traversal via wrap link takes 3 steps: (8,0)->(9,0)->(0,0)->(1,0)
    const res = grid.findPath({ x: 8, y: 0 }, { x: 1, y: 0 });
    assert.equal(res.status, "success");
    assert.equal(res.length, 3, "A* should choose shorter wrap-around chunk link");
    assert.deepEqual(res.map((s) => ({ x: s.x, y: s.y })), [
        { x: 9, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 }
    ]);
});

// =============================================================================
// 9. Static Utilities: fromAscii, fromTilemap, clone
// =============================================================================

test("NavigationGrid.fromAscii parses layout with legend", () => {
    const layout = `
        .....
        .###.
        .....
    `;
    const grid = NavigationGrid.fromAscii(layout, {
        "#": { walkable: false },
        ".": { walkable: true, cost: 1.0 }
    });

    assert.equal(grid.isWalkable(1, 1), false);
    assert.equal(grid.isWalkable(2, 1), false);
    assert.equal(grid.isWalkable(3, 1), false);
    assert.equal(grid.isWalkable(0, 0), true);

    const res = grid.findPath({ x: 0, y: 1 }, { x: 4, y: 1 });
    assert.equal(res.status, "success");
});

test("NavigationGrid.clone creates independent copy", () => {
    const original = new NavigationGrid(5, 5);
    original.setCost(2, 2, 8);
    original.addObstacle("crate", 1, 1);

    const clone = original.clone();
    assert.equal(clone.width, 5);
    assert.equal(clone.getCost(2, 2), 8);
    assert.equal(clone.hasObstacle("crate"), true);

    // Mutating clone does not affect original
    clone.removeObstacle("crate");
    assert.equal(clone.hasObstacle("crate"), false);
    assert.equal(original.hasObstacle("crate"), true);
});
