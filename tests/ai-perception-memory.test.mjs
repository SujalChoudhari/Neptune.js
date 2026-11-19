import './setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    PerceptionSystem,
    BoundedMemory,
    NPCKnowledge,
    ARCHETYPES,
    extractPosition,
    extractFacing,
    segmentIntersectsAABB
} from '../src/larissa/perceptionMemory.js';

import {
    PerceptionSystem as LarissaPerception,
    BoundedMemory as LarissaMemory,
    NPCKnowledge as LarissaKnowledge
} from '../src/larissa/index.js';

import {
    Larissa,
    PerceptionSystem as NeptunePerception,
    BoundedMemory as NeptuneMemory,
    NPCKnowledge as NeptuneKnowledge,
    Entity,
    Transform,
    Vector2,
    ComponentRegistry
} from '../src/neptune.js';

test('Exports: PerceptionSystem, BoundedMemory, NPCKnowledge are exported from all entrypoints', () => {
    assert.equal(typeof PerceptionSystem, 'function');
    assert.equal(typeof BoundedMemory, 'function');
    assert.equal(typeof NPCKnowledge, 'function');

    assert.equal(LarissaPerception, PerceptionSystem);
    assert.equal(LarissaMemory, BoundedMemory);
    assert.equal(LarissaKnowledge, NPCKnowledge);

    assert.equal(NeptunePerception, PerceptionSystem);
    assert.equal(NeptuneMemory, BoundedMemory);
    assert.equal(NeptuneKnowledge, NPCKnowledge);

    assert.equal(Larissa.PerceptionSystem, PerceptionSystem);
    assert.equal(Larissa.BoundedMemory, BoundedMemory);
    assert.equal(Larissa.NPCKnowledge, NPCKnowledge);

    assert.ok(ComponentRegistry.has('NPCKnowledge'));
});

test('PerceptionSystem: FOV cone and vision range limits', () => {
    const perception = new PerceptionSystem({
        visionRange: 100,
        fov: Math.PI * 0.5, // 90 degree cone (+/- 45 deg)
        hearingRadius: 40
    });

    const observer = {
        x: 0,
        y: 0,
        facing: 0 // Facing East / Right
    };

    // 1. Direct line in front, within range (80 <= 100)
    const inFront = { id: 'target_front', x: 80, y: 0 };
    assert.equal(perception.isInVisionRange(observer, inFront), true);
    assert.equal(perception.isInFov(observer, inFront), true);
    assert.equal(perception.canSee(observer, inFront), true);

    // 2. Direct line in front, outside range (120 > 100)
    const outOfRange = { id: 'target_far', x: 120, y: 0 };
    assert.equal(perception.isInVisionRange(observer, outOfRange), false);
    assert.equal(perception.isInFov(observer, outOfRange), true);
    assert.equal(perception.canSee(observer, outOfRange), false);

    // 3. Within range and inside 90 deg FOV (+/- 45 deg): angle ~21.8 deg
    const insideFov = { id: 'target_in_fov', x: 50, y: 20 };
    assert.equal(perception.isInVisionRange(observer, insideFov), true);
    assert.equal(perception.isInFov(observer, insideFov), true);
    assert.equal(perception.canSee(observer, insideFov), true);

    // 4. Within range but outside 90 deg FOV: angle ~68.2 deg > 45 deg
    const outsideFov = { id: 'target_out_fov', x: 20, y: 50 };
    assert.equal(perception.isInVisionRange(observer, outsideFov), true);
    assert.equal(perception.isInFov(observer, outsideFov), false);
    assert.equal(perception.canSee(observer, outsideFov), false);

    // 5. Behind observer (angle 180 deg)
    const behind = { id: 'target_behind', x: -50, y: 0 };
    assert.equal(perception.isInVisionRange(observer, behind), true);
    assert.equal(perception.isInFov(observer, behind), false);
    assert.equal(perception.canSee(observer, behind), false);

    // 6. Observer observation list
    const candidates = [inFront, outOfRange, insideFov, outsideFov, behind];
    const observed = perception.observe(observer, candidates);
    assert.equal(observed.length, 2);
    assert.deepEqual(observed.map(c => c.id).sort(), ['target_front', 'target_in_fov']);

    // 7. Changing observer orientation changes the FOV cone
    observer.facing = 'up'; // North (-PI/2)
    const northTarget = { id: 'target_north', x: 0, y: -60 };
    assert.equal(perception.isInFov(observer, northTarget), true);
    assert.equal(perception.canSee(observer, northTarget), true);
    // Previous East target is now 90 deg away, outside +/- 45 deg cone
    assert.equal(perception.isInFov(observer, inFront), false);
    assert.equal(perception.canSee(observer, inFront), false);

    // 8. 360 degree FOV cone
    const omniPerception = new PerceptionSystem({
        visionRange: 100,
        fov: Math.PI * 2
    });
    assert.equal(omniPerception.isInFov({ x: 0, y: 0, facing: 0 }, behind), true);
    assert.equal(omniPerception.canSee({ x: 0, y: 0, facing: 0 }, behind), true);
});

test('PerceptionSystem: Hearing and alert radius detects sound/danger events', () => {
    const perception = new PerceptionSystem({
        visionRange: 100,
        fov: Math.PI * 0.5,
        hearingRadius: 60
    });

    const observer = { x: 0, y: 0, facing: 0 };

    // Silent target behind observer: outside FOV cone, cannot be seen or heard
    const silentBehind = { id: 'silent', x: -40, y: 0 };
    assert.equal(perception.canSee(observer, silentBehind), false);
    assert.equal(perception.canHear(observer, silentBehind), false);

    // Sound event behind observer: outside FOV cone, but within hearing radius 60
    const soundEvent = { id: 'footstep_sound', x: -40, y: 0, type: 'sound' };
    assert.equal(perception.canSee(observer, soundEvent), false);
    assert.equal(perception.canHear(observer, soundEvent), true);

    // Distant sound event beyond hearing radius
    const distantSound = { id: 'distant_bang', x: -90, y: 0, type: 'sound' };
    assert.equal(perception.canHear(observer, distantSound), false);

    // Candidate with audible flag
    const audibleDanger = { id: 'noisy_danger', x: 0, y: 50, isAudible: true };
    assert.equal(perception.canHear(observer, audibleDanger), true);

    // observe() returns both visible targets and audible sound events
    const inFront = { id: 'visible_front', x: 50, y: 0 };
    const candidates = [silentBehind, soundEvent, distantSound, inFront];
    const results = perception.observe(observer, candidates);

    assert.equal(results.length, 2);
    assert.deepEqual(results.map(c => c.id).sort(), ['footstep_sound', 'visible_front']);

    // Detailed observations check
    const detailed = perception.observe(observer, candidates, [], { detailed: true });
    assert.equal(detailed.length, 2);
    const soundObs = detailed.find(o => o.target.id === 'footstep_sound');
    const visObs = detailed.find(o => o.target.id === 'visible_front');
    assert.equal(soundObs.sense, 'hearing');
    assert.equal(visObs.sense, 'vision');
});

test('PerceptionSystem: Wall obstruction blocks line-of-sight and danger behind wall cannot be seen', () => {
    const perception = new PerceptionSystem({
        visionRange: 150,
        fov: Math.PI * 0.75,
        hearingRadius: 30
    });

    const observer = { x: 0, y: 0, facing: 0 };
    const target = { id: 'target_behind_wall', x: 100, y: 0 };
    const danger = { id: 'trap_danger', x: 120, y: 0, type: 'danger' };

    // 1. Without walls: both target and danger are clearly visible
    assert.equal(perception.hasLineOfSight(observer, target), true);
    assert.equal(perception.canSee(observer, target), true);
    assert.equal(perception.canSee(observer, danger), true);
    assert.equal(perception.observe(observer, [target, danger]).length, 2);

    // 2. Wall obstacle placed between observer and target (x: 40..60, y: -20..20)
    const wallBox = {
        id: 'stone_wall',
        x: 40,
        y: -20,
        width: 20,
        height: 40
    };

    assert.equal(perception.hasLineOfSight(observer, target, [wallBox]), false);
    assert.equal(perception.hasLineOfSight(observer, danger, [wallBox]), false);
    assert.equal(perception.canSee(observer, target, [wallBox]), false);
    assert.equal(perception.canSee(observer, danger, [wallBox]), false);

    // Neither target nor danger behind wall can be seen
    const observedWithWall = perception.observe(observer, [target, danger], [wallBox]);
    assert.equal(observedWithWall.length, 0, 'Danger and target behind wall cannot be observed');

    // 3. Line segment wall test
    const segmentWall = {
        x1: 50,
        y1: -50,
        x2: 50,
        y2: 50
    };
    assert.equal(perception.hasLineOfSight(observer, target, [segmentWall]), false);
    assert.equal(perception.observe(observer, [target], [segmentWall]).length, 0);

    // 4. Wall placed beside the ray (not obstructing)
    const wallBeside = {
        x: 40,
        y: 30,
        width: 20,
        height: 20
    };
    assert.equal(perception.hasLineOfSight(observer, target, [wallBeside]), true);
    assert.equal(perception.canSee(observer, target, [wallBeside]), true);

    // 5. Wall placed behind target (not obstructing line to target)
    const wallBehind = {
        x: 130,
        y: -20,
        width: 20,
        height: 40
    };
    assert.equal(perception.hasLineOfSight(observer, target, [wallBehind]), true);
    assert.equal(perception.canSee(observer, target, [wallBehind]), true);

    // 6. Sound event behind a regular wall can still be heard if within hearing radius
    const soundBehindWall = { id: 'clank_sound', x: 25, y: 0, type: 'sound' };
    const wallAt15 = { x: 12, y: -10, width: 4, height: 20 };
    // LOS is blocked for vision
    assert.equal(perception.canSee(observer, soundBehindWall, [wallAt15]), false);
    // But sound is within hearingRadius (25 <= 30) and heard
    assert.equal(perception.canHear(observer, soundBehindWall), true);
    const heard = perception.observe(observer, [soundBehindWall], [wallAt15]);
    assert.equal(heard.length, 1);
    assert.equal(heard[0].id, 'clank_sound');
});

test('BoundedMemory: Capacity limit evicts oldest and lowest-confidence entries', () => {
    const memory = new BoundedMemory({
        maxEntries: 3,
        defaultConfidence: 1.0
    });

    // 1. Add 3 entries with sequential timestamps
    memory.record({ id: 'target_1', x: 10, y: 10 }, { timestamp: 100 });
    memory.record({ id: 'target_2', x: 20, y: 20 }, { timestamp: 200 });
    memory.record({ id: 'target_3', x: 30, y: 30 }, { timestamp: 300 });

    assert.equal(memory.size, 3);
    assert.equal(memory.has('target_1'), true);
    assert.equal(memory.has('target_2'), true);
    assert.equal(memory.has('target_3'), true);

    // 2. Add 4th entry: since confidences tie (all 1.0), the oldest entry (target_1) is evicted
    memory.record({ id: 'target_4', x: 40, y: 40 }, { timestamp: 400 });

    assert.equal(memory.size, 3);
    assert.equal(memory.has('target_1'), false, 'Oldest entry target_1 should be evicted');
    assert.equal(memory.has('target_2'), true);
    assert.equal(memory.has('target_3'), true);
    assert.equal(memory.has('target_4'), true);

    // 3. Lowest-confidence eviction priority:
    // If target_3 has lower confidence than target_2, target_3 should be evicted even if target_2 is older
    const entry2 = memory.get('target_2');
    const entry3 = memory.get('target_3');
    entry3.confidence = 0.2; // target_3 now has low confidence
    entry2.confidence = 1.0; // target_2 has high confidence, but older timestamp

    memory.record({ id: 'target_5', x: 50, y: 50 }, { timestamp: 500 });
    assert.equal(memory.size, 3);
    assert.equal(memory.has('target_3'), false, 'Lowest confidence entry target_3 should be evicted');
    assert.equal(memory.has('target_2'), true);
    assert.equal(memory.has('target_4'), true);
    assert.equal(memory.has('target_5'), true);

    // 4. Refreshing an existing entry updates its timestamp and confidence, keeping it fresh
    memory.record('target_2', { timestamp: 600, confidence: 1.0 });
    // Now target_4 is oldest (timestamp 400)
    memory.record({ id: 'target_6', x: 60, y: 60 }, { timestamp: 700 });
    assert.equal(memory.has('target_4'), false, 'target_4 was oldest and is now evicted');
    assert.equal(memory.has('target_2'), true, 'Refreshed target_2 was retained');
    assert.equal(memory.has('target_5'), true);
    assert.equal(memory.has('target_6'), true);
});

test('BoundedMemory: Observation decay and forgetting unrefreshed targets', () => {
    const memory = new BoundedMemory({
        maxEntries: 10,
        decayRate: 0.2, // 0.2 confidence lost per second
        forgetThreshold: 0,
        defaultConfidence: 1.0
    });

    memory.record({ id: 'alpha', x: 10, y: 0 });
    memory.record({ id: 'beta', x: 20, y: 0 });

    assert.equal(memory.get('alpha').confidence, 1.0);
    assert.equal(memory.get('beta').confidence, 1.0);

    // 1. Decay by 2 seconds: confidence loses 0.4 -> 0.6
    memory.decay(2);
    assert.equal(Math.abs(memory.get('alpha').confidence - 0.6) < 1e-6, true);
    assert.equal(Math.abs(memory.get('beta').confidence - 0.6) < 1e-6, true);
    assert.equal(memory.has('alpha'), true);
    assert.equal(memory.has('beta'), true);

    // 2. Refresh alpha: reset confidence to 1.0; beta remains unrefreshed at 0.6
    memory.record('alpha', { confidence: 1.0 });
    assert.equal(memory.get('alpha').confidence, 1.0);
    assert.equal(Math.abs(memory.get('beta').confidence - 0.6) < 1e-6, true);

    // 3. Decay by 3.5 seconds:
    // alpha loses 0.7 -> 0.3 (retained)
    // beta loses 0.7 -> -0.1 <= 0 (forgotten!)
    memory.decay(3.5);

    assert.equal(memory.has('alpha'), true, 'Alpha was refreshed and should remain remembered');
    assert.equal(Math.abs(memory.get('alpha').confidence - 0.3) < 1e-6, true);
    assert.equal(memory.has('beta'), false, 'Beta expired and should be forgotten');
    assert.equal(memory.get('beta'), null);
    assert.equal(memory.size, 1);

    // 4. Decay alpha past expiration
    memory.decay(2);
    assert.equal(memory.has('alpha'), false);
    assert.equal(memory.size, 0);
});

test('Perception and Memory: Missing target and destroyed entity safety', () => {
    const perception = new PerceptionSystem();
    const memory = new BoundedMemory();

    // 1. Missing / null input robustness
    assert.deepEqual(perception.observe(null, [{ x: 10, y: 10 }]), []);
    assert.deepEqual(perception.observe({ x: 0, y: 0 }, null), []);
    assert.deepEqual(perception.observe({ x: 0, y: 0 }, [null, undefined, { invalid: true }]), []);
    assert.equal(perception.hasLineOfSight(null, { x: 10, y: 10 }), false);
    assert.equal(perception.hasLineOfSight({ x: 0, y: 0 }, null), false);
    assert.equal(perception.canSee(null, null), false);
    assert.equal(perception.canHear(null, null), false);

    assert.equal(memory.record(null), null);
    assert.equal(memory.get(null), null);
    assert.equal(memory.has(null), false);
    assert.equal(memory.forget(null), false);
    assert.doesNotThrow(() => memory.decay(1));

    // 2. Destroyed entity handling
    const livingEntity = new Entity('LivingGoblin');
    livingEntity.AddComponent(new Transform(new Vector2(30, 0)));

    const destroyedEntity = new Entity('DeadGoblin');
    destroyedEntity.AddComponent(new Transform(new Vector2(40, 0)));
    destroyedEntity.destroy(); // Mark destroyed

    const observer = new Entity('Guard');
    observer.AddComponent(new Transform(new Vector2(0, 0)));

    // Destroyed entity is omitted from perception
    const observed = perception.observe(observer, [livingEntity, destroyedEntity]);
    assert.equal(observed.length, 1);
    assert.equal(observed[0], livingEntity);

    // Destroyed entity cannot be recorded in memory
    assert.equal(memory.record(destroyedEntity), null);

    // Entity destroyed while in memory is safely purged
    memory.record(livingEntity);
    assert.equal(memory.has(livingEntity), true);

    livingEntity.destroy(); // Destroy it now
    assert.equal(memory.has(livingEntity), false, 'Destroyed entity must be reported as not in memory');
    assert.equal(memory.get(livingEntity), null, 'get() must safely return null for destroyed entity');
    assert.equal(memory.size, 0);

    // pruneDestroyed() cleans up safely
    assert.doesNotThrow(() => memory.pruneDestroyed());
});

test('NPCKnowledge: Archetype profiles configured budgets', () => {
    // 1. Sentinel archetype
    const sentinel = new NPCKnowledge('sentinel');
    assert.equal(sentinel.archetype, 'sentinel');
    assert.equal(sentinel.perception.visionRange, ARCHETYPES.sentinel.visionRange);
    assert.equal(sentinel.perception.fov, ARCHETYPES.sentinel.fov);
    assert.equal(sentinel.perception.hearingRadius, ARCHETYPES.sentinel.hearingRadius);
    assert.equal(sentinel.memory.maxEntries, ARCHETYPES.sentinel.maxEntries);
    assert.equal(sentinel.memory.decayRate, ARCHETYPES.sentinel.decayRate);

    // 2. Patrol archetype
    const patrol = new NPCKnowledge('patrol');
    assert.equal(patrol.archetype, 'patrol');
    assert.equal(patrol.perception.visionRange, ARCHETYPES.patrol.visionRange);
    assert.equal(patrol.perception.fov, ARCHETYPES.patrol.fov);
    assert.equal(patrol.memory.maxEntries, ARCHETYPES.patrol.maxEntries);

    // 3. Civilian archetype
    const civilian = new NPCKnowledge('civilian');
    assert.equal(civilian.archetype, 'civilian');
    assert.equal(civilian.perception.visionRange, ARCHETYPES.civilian.visionRange);
    assert.equal(civilian.memory.maxEntries, ARCHETYPES.civilian.maxEntries);

    // 4. Boss archetype
    const boss = new NPCKnowledge('boss');
    assert.equal(boss.archetype, 'boss');
    assert.equal(boss.perception.visionRange, ARCHETYPES.boss.visionRange);
    assert.equal(boss.perception.hearingRadius, ARCHETYPES.boss.hearingRadius);
    assert.equal(boss.memory.maxEntries, ARCHETYPES.boss.maxEntries);

    // 5. Attached as component to an Entity
    const entity = new Entity('GuardNPC');
    const transform = new Transform(new Vector2(100, 100));
    entity.AddComponent(transform);
    const knowledge = new NPCKnowledge('sentinel');
    entity.AddComponent(knowledge);

    assert.equal(knowledge.entity, entity);
});

test('NPCKnowledge & BoundedMemory: Save game snapshot and restoration', () => {
    const npc = new NPCKnowledge('patrol');
    npc.state = 'alert';
    npc.facts.patrolRoute = 'route_alpha';
    npc.facts.alertCount = 2;

    // Record some memories
    npc.remember('player_1', {
        position: { x: 55, y: 75 },
        confidence: 0.85,
        timestamp: 1600000000000,
        data: { hostile: true, armor: 'light' }
    });
    npc.remember('distraction_rock', {
        position: { x: 40, y: 20 },
        confidence: 0.5,
        timestamp: 1600000001000,
        sense: 'hearing'
    });

    assert.equal(npc.memory.size, 2);

    // 1. Serialize to snapshot
    const snapshot = npc.serialize();
    assert.equal(typeof snapshot, 'object');
    assert.equal(snapshot.archetype, 'patrol');
    assert.equal(snapshot.state, 'alert');
    assert.equal(snapshot.facts.patrolRoute, 'route_alpha');
    assert.equal(snapshot.memory.entries.length, 2);

    // Test JSON round-trip
    const json = JSON.stringify(snapshot);
    const restoredData = JSON.parse(json);

    // 2. Restore onto new NPCKnowledge instance
    const restoredNpc = NPCKnowledge.restore(restoredData);
    assert.equal(restoredNpc.archetype, 'patrol');
    assert.equal(restoredNpc.state, 'alert');
    assert.equal(restoredNpc.facts.patrolRoute, 'route_alpha');
    assert.equal(restoredNpc.facts.alertCount, 2);
    assert.equal(restoredNpc.memory.size, 2);

    const memPlayer = restoredNpc.memory.get('player_1');
    assert.ok(memPlayer);
    assert.equal(memPlayer.confidence, 0.85);
    assert.deepEqual(memPlayer.position, { x: 55, y: 75 });
    assert.equal(memPlayer.data.hostile, true);
    assert.equal(memPlayer.data.armor, 'light');

    const memRock = restoredNpc.memory.get('distraction_rock');
    assert.ok(memRock);
    assert.equal(memRock.confidence, 0.5);
    assert.equal(memRock.sense, 'hearing');

    // 3. Verify restored NPC continues functioning normally
    restoredNpc.memory.decay(3); // Decays 0.1 * 3 = 0.3
    assert.equal(Math.abs(restoredNpc.memory.get('player_1').confidence - 0.55) < 1e-6, true);
    assert.equal(Math.abs(restoredNpc.memory.get('distraction_rock').confidence - 0.2) < 1e-6, true);

    // 4. Standalone BoundedMemory snapshot and restore
    const standaloneMem = new BoundedMemory({ maxEntries: 5, decayRate: 0.15 });
    standaloneMem.record('point_a', { position: { x: 1, y: 2 }, confidence: 0.9 });
    const memSnap = standaloneMem.serialize();

    const freshMem = new BoundedMemory();
    freshMem.restore(memSnap);
    assert.equal(freshMem.maxEntries, 5);
    assert.equal(freshMem.decayRate, 0.15);
    assert.equal(freshMem.has('point_a'), true);
    assert.equal(freshMem.get('point_a').confidence, 0.9);
});
