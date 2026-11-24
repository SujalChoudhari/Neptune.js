import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { NavigationGrid } from '../src/thalassa/navigationGrid.js';
import { PathfindingScheduler } from '../src/thalassa/pathfindingScheduler.js';
import { Entity } from '../src/core/entity.js';

test('NAV-02: Dynamic obstacles invalidate registered routes and block paths', () => {
    const grid = new NavigationGrid(10, 10);
    const initialPath = grid.findPath({ x: 0, y: 0 }, { x: 5, y: 0 });
    assert.equal(initialPath.isSuccess(), true);

    // Register active route
    grid.registerRoute('patrol_1', initialPath);

    let invalidationFired = false;
    grid.onRouteInvalidated((event) => {
        invalidationFired = true;
        assert.ok(event.invalidatedRoutes.includes('patrol_1'));
    });

    // Place obstacle directly across path at (2, 0)
    grid.addObstacle('door_1', 2, 0, 1, 1);
    assert.equal(invalidationFired, true);

    // Path now blocked at (2, 0)
    const blockedPath = grid.findPath({ x: 0, y: 0 }, { x: 5, y: 0 }, { allowDiagonal: false });
    assert.ok(blockedPath.every(p => !(p.x === 2 && p.y === 0)), 'path must route around obstacle');

    // Remove obstacle -> route becomes clear again
    grid.removeObstacle('door_1');
    assert.equal(grid.isWalkable(2, 0), true);
});

test('NAV-02: Local avoidance calculates steering separation in narrow corridors', () => {
    const agentPos = { x: 5, y: 5 };
    const desiredVelocity = { x: 1, y: 0 }; // Moving eastward

    // Approaching head-on neighbor moving westward
    const neighbors = [
        { x: 5.4, y: 5, velocity: { x: -1, y: 0 }, radius: 0.5 }
    ];

    const adjusted = NavigationGrid.computeLocalAvoidance(agentPos, desiredVelocity, neighbors, { radius: 0.5 });
    // Velocity must deflect laterally away from pure X movement
    assert.ok(Math.abs(adjusted.y) > 0.01, 'steering must introduce lateral deflection');
    // Speed should be preserved
    assert.ok(Math.abs(Math.hypot(adjusted.x, adjusted.y) - 1.0) < 1e-4);
});

test('NAV-03: PathfindingScheduler prioritizes requests, enforces request budgets, and supports cancellation', async () => {
    const grid = new NavigationGrid(20, 20);
    const scheduler = new PathfindingScheduler({ maxRequestsPerTick: 2, maxDurationMs: 50 });

    const entityA = new Entity('Player');
    const entityB = new Entity('Enemy1');
    const entityC = new Entity('Enemy2');

    // Queue 3 requests with different priorities
    const pLow = scheduler.requestPath(grid, { x: 0, y: 0 }, { x: 5, y: 5 }, { priority: 1, requester: entityB });
    const pHigh = scheduler.requestPath(grid, { x: 1, y: 1 }, { x: 6, y: 6 }, { priority: 10, requester: entityA });
    const pCanceled = scheduler.requestPath(grid, { x: 2, y: 2 }, { x: 7, y: 7 }, { priority: 5, requester: entityC });

    // Cancel entityC request before update
    entityC.destroy();

    // First tick: budget = 2 requests
    const processedTick1 = scheduler.update();
    assert.equal(processedTick1, 2);

    const resHigh = await pHigh;
    assert.equal(resHigh.isSuccess(), true);

    const resLow = await pLow;
    assert.equal(resLow.isSuccess(), true);

    await assert.rejects(pCanceled, /Requester was destroyed/);

    assert.equal(scheduler.totalProcessed, 2);
    assert.equal(scheduler.totalDropped, 1);
});
