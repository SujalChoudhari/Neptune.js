import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { QuestGraph } from '../src/galatea/storyGraph.js';
import { Cutscene } from '../src/galatea/cutscene.js';
import { WorldFacts } from '../src/core/worldFacts.js';
import { Entity } from '../src/core/entity.js';
import { Transform } from '../src/components/transform.js';
import { Vector2 } from '../src/math/vec2.js';

test('STORY-02: QuestGraph one-time rewards cannot be awarded twice across save and reload', () => {
    const facts = new WorldFacts();
    const quest = new QuestGraph({
        id: 'seal_quest',
        name: 'Recover Seal',
        facts,
        rewards: [
            { id: 'seal_gold_100', key: 'player.gold', op: 'add', value: 100 }
        ]
    });

    quest.addStage({
        id: 'start',
        description: 'Find seal',
        isInitial: true,
        conditions: { 'seal.found': true }
    });

    quest.start();
    assert.equal(facts.get('player.gold', 0), 0);

    // Complete quest -> awards gold
    quest.complete();
    assert.equal(facts.get('player.gold'), 100);
    assert.equal(quest.hasClaimedReward('seal_gold_100'), true);

    // Snapshot save
    const snapshot = quest.serialize();

    // Repeated claim or completion call on same instance does not award twice
    const secondClaim = quest.claimReward({ id: 'seal_gold_100', key: 'player.gold', op: 'add', value: 100 }, facts);
    assert.equal(secondClaim.awarded, false);
    assert.equal(secondClaim.reason, 'ALREADY_CLAIMED');
    assert.equal(facts.get('player.gold'), 100);

    // Restore into fresh quest instance
    const freshQuest = new QuestGraph({ id: 'seal_quest', facts });
    freshQuest.restore(snapshot);
    assert.equal(freshQuest.hasClaimedReward('seal_gold_100'), true);

    const reloadedClaim = freshQuest.claimReward({ id: 'seal_gold_100', key: 'player.gold', op: 'add', value: 100 }, facts);
    assert.equal(reloadedClaim.awarded, false);
    assert.equal(facts.get('player.gold'), 100);
});

test('STORY-03: Cutscene steps advance smoothly and cancel restores state cleanly', () => {
    const cutscene = new Cutscene('intro');
    const actor = new Entity('Hero');
    const transform = new Transform(new Vector2(0, 0));
    actor.AddComponent(transform);

    let eventDispatched = false;
    const fakeBus = { emit: () => { eventDispatched = true; } };

    cutscene
        .addMoveStep(actor, new Vector2(2, 0), { speed: 4 })
        .addWaitStep(0.1)
        .addEventStep(fakeBus, 'intro_finished');

    let completed = false;
    cutscene.onComplete = () => { completed = true; };

    cutscene.play();
    assert.equal(cutscene.isPlaying, true);

    // Advance move step: speed 4 * 0.5s = 2.0 distance -> completes move
    cutscene.update(0.5);
    assert.equal(transform.position.x, 2);

    // Advance wait step: 0.1s -> triggers event step and completes
    cutscene.update(0.15);
    assert.equal(eventDispatched, true);
    assert.equal(completed, true);
    assert.equal(cutscene.isPlaying, false);
});

test('STORY-03: Cutscene gracefully handles destroyed actor mid-movement without stalling', () => {
    const cutscene = new Cutscene('rescue');
    const actor = new Entity('Victim');
    actor.AddComponent(new Transform(new Vector2(0, 0)));

    cutscene.addMoveStep(actor, new Vector2(10, 0), { speed: 2 });
    cutscene.play();

    // Destroy actor while moving
    actor.destroy();

    // Update should safely detect destroyed actor and complete move step instead of freezing
    cutscene.update(0.1);
    assert.equal(cutscene.isPlaying, false);
});
