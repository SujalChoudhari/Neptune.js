import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ChunkManager } from '../src/thalassa/chunkManager.js';
import { Portal, PortalRegistry } from '../src/thalassa/portal.js';
import { Entity } from '../src/core/entity.js';
import { Vector2 } from '../src/math/vec2.js';

test('WORLD-02: ChunkManager streams chunks within load radius and unloads distant chunks', async () => {
    const manager = new ChunkManager({ chunkSize: 16, loadRadius: 1, prefetchRadius: 2, unloadRadius: 2 });
    const loadedLog = [];
    const createdEntities = [];

    manager.setLoader(async (cx, cy) => {
        loadedLog.push(`${cx},${cy}`);
        const entity = new Entity(`Chunk_${cx}_${cy}`);
        createdEntities.push(entity);
        return {
            entities: [entity],
            tiles: new Uint8Array(16 * 16)
        };
    });

    // Player starts at (0, 0)
    await manager.updatePosition(0, 0);
    assert.equal(manager.isChunkLoaded(0, 0), true);
    assert.equal(manager.isChunkLoaded(1, 1), true);
    assert.equal(manager.loadedChunkCount, 9); // 3x3 grid around (0,0)

    // Player moves far away to (100, 100) -> chunk (6, 6)
    await manager.updatePosition(100, 100);
    assert.equal(manager.isChunkLoaded(0, 0), false, 'origin chunk must be unloaded');
    assert.equal(manager.isChunkLoaded(6, 6), true, 'new chunk must be loaded');

    manager.dispose();
});

test('WORLD-02: Fast movement cancels pending chunk loads outside prefetch distance', async () => {
    const manager = new ChunkManager({ chunkSize: 16, loadRadius: 1, prefetchRadius: 2, unloadRadius: 3 });
    const abortedKeys = [];

    manager.setLoader(async (cx, cy, { signal }) => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                resolve({ entities: [] });
            }, 50);
            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                abortedKeys.push(`${cx},${cy}`);
                reject(new Error('aborted'));
            });
        });
    });

    // Start load at (0, 0)
    const update1 = manager.updatePosition(0, 0);
    // Instantly teleport player far away before first load finishes
    const update2 = manager.updatePosition(500, 500);

    await Promise.allSettled([update1, update2]);
    assert.ok(abortedKeys.length > 0, 'out-of-range pending chunks must be aborted');

    manager.dispose();
});

test('WORLD-03: Persistent chunk changes survive unload, reload, and serialization', async () => {
    const manager = new ChunkManager({ chunkSize: 16, loadRadius: 1, unloadRadius: 2 });

    manager.setLoader(async (cx, cy, { changes }) => {
        return {
            entities: [],
            chestOpened: changes?.chest_1?.opened ?? false
        };
    });

    await manager.updatePosition(0, 0);
    let chunk = manager.getLoadedChunk(0, 0);
    assert.equal(chunk.data.chestOpened, false);

    // Player opens chest in chunk (0, 0)
    manager.recordChange(0, 0, 'chest_1', { opened: true });

    // Unload chunk
    manager.unloadChunk(0, 0);
    assert.equal(manager.isChunkLoaded(0, 0), false);

    // Reload chunk -> should reflect opened chest
    await manager.loadChunk(0, 0);
    chunk = manager.getLoadedChunk(0, 0);
    assert.equal(chunk.data.chestOpened, true);

    // Save/restore persistence
    const saved = manager.serialize();
    assert.equal(saved.version, 1);
    assert.deepEqual(saved.changes['0,0'].chest_1, { opened: true });

    const restoredManager = new ChunkManager({ chunkSize: 16 });
    restoredManager.deserialize(saved);
    assert.deepEqual(restoredManager.getChanges(0, 0).chest_1, { opened: true });

    manager.dispose();
    restoredManager.dispose();
});

test('WORLD-03: PortalRegistry links portals, handles locks, and diagnoses missing destinations', () => {
    PortalRegistry.clear();

    const townPortal = new Portal({
        portalId: 'town_gate',
        targetPortalId: 'dungeon_entrance',
        targetScene: 'dungeon.scene',
        position: new Vector2(10, 5)
    });

    const dungeonPortal = new Portal({
        portalId: 'dungeon_entrance',
        targetPortalId: 'town_gate',
        targetScene: 'town.scene',
        position: new Vector2(2, 2)
    });

    const lockedPortal = new Portal({
        portalId: 'boss_door',
        targetPortalId: 'boss_room',
        isLocked: true,
        keyItem: 'iron_key'
    });

    const bossRoomPortal = new Portal({
        portalId: 'boss_room',
        targetPortalId: 'boss_door',
        position: new Vector2(50, 50)
    });

    // 1. Valid bidirectional traversal
    const trans = PortalRegistry.resolve('town_gate');
    assert.equal(trans.canTraverse, true);
    assert.equal(trans.destination.portalId, 'dungeon_entrance');

    // 2. Locked portal without key
    const lockedRes = PortalRegistry.resolve('boss_door', { inventory: { hasItem: () => false } });
    assert.equal(lockedRes.canTraverse, false);
    assert.equal(lockedRes.reason, 'locked');

    // 3. Locked portal with key
    const unlockedRes = PortalRegistry.resolve('boss_door', { inventory: { hasItem: (item) => item === 'iron_key' } });
    assert.equal(unlockedRes.canTraverse, true);

    // 4. Missing destination diagnosis
    const brokenPortal = new Portal({ portalId: 'broken', targetPortalId: 'nowhere' });
    assert.throws(() => {
        PortalRegistry.resolve('broken');
    }, /PORTAL_DESTINATION_NOT_FOUND/);

    PortalRegistry.clear();
});
