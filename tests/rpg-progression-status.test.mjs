import "./setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";

import { LevelProgression, StatusEffectManager, DeathRetryManager } from "../src/larissa/progressionSystem.js";
import * as Larissa from "../src/larissa/index.js";
import * as Neptune from "../src/neptune.js";

test("RPG-02 Exports: classes are exported across progressionSystem, larissa, and neptune", () => {
    assert.equal(typeof LevelProgression, "function");
    assert.equal(typeof StatusEffectManager, "function");
    assert.equal(typeof DeathRetryManager, "function");

    assert.equal(Larissa.LevelProgression, LevelProgression);
    assert.equal(Larissa.StatusEffectManager, StatusEffectManager);
    assert.equal(Larissa.DeathRetryManager, DeathRetryManager);

    assert.equal(Neptune.LevelProgression, LevelProgression);
    assert.equal(Neptune.StatusEffectManager, StatusEffectManager);
    assert.equal(Neptune.DeathRetryManager, DeathRetryManager);
});

test("LevelProgression: grants multiple levels in a single large XP reward", () => {
    const prog = new LevelProgression({
        level: 1,
        experience: 0,
        baseExperience: 100,
        growthRate: 1.5,
        maxLevel: 10,
        statGains: { maxHealth: 20, attack: 5 },
        baseStats: { maxHealth: 100, attack: 10 }
    });

    const levelUps = [];
    prog.onProgression(evt => {
        if (evt.type === "level-up") levelUps.push(evt);
    });

    // Level 1 -> 2 requires 100 XP
    // Level 2 -> 3 requires floor(100 * 1.5) = 150 XP
    // Total for level 3 = 250 XP
    // If we grant 300 XP, should gain Level 2 and Level 3, with 50 XP remaining
    const gained = prog.grantExperience(300);

    assert.deepEqual(gained, [2, 3]);
    assert.equal(prog.level, 3);
    assert.equal(prog.experience, 50);
    assert.equal(prog.unspentStatPoints, 6); // 3 per level * 2 levels
    assert.equal(levelUps.length, 2);
    assert.equal(levelUps[0].level, 2);
    assert.equal(levelUps[1].level, 3);

    // Verify calculated stats at level 3 (2 levels gained)
    const stats = prog.getCalculatedStats();
    assert.equal(stats.maxHealth, 140); // 100 + 20 * 2
    assert.equal(stats.attack, 20);     // 10 + 5 * 2
});

test("LevelProgression: respects maxLevel cap and serialization", () => {
    const prog = new LevelProgression({
        level: 4,
        experience: 0,
        baseExperience: 100,
        growthRate: 1.0,
        maxLevel: 5
    });

    const gained = prog.grantExperience(500);
    assert.deepEqual(gained, [5]);
    assert.equal(prog.level, 5);
    assert.equal(prog.experience, 0); // At max level, excess XP is capped

    const json = prog.toJSON();
    const restored = LevelProgression.fromJSON(json);
    assert.equal(restored.level, 5);
    assert.equal(restored.maxLevel, 5);
    assert.equal(restored.experienceToNextLevel(), Infinity);
});

test("StatusEffectManager: handles replace stacking mode", () => {
    const mgr = new StatusEffectManager();
    const events = [];
    mgr.onStatusEvent(e => events.push(e));

    mgr.applyEffect({
        name: "haste",
        duration: 5.0,
        stackMode: "replace",
        modifiers: { speed: 1.5 }
    });

    assert.equal(mgr.effects.length, 1);
    assert.equal(mgr.getEffect("haste").duration, 5.0);

    mgr.update(2.0);
    assert.equal(mgr.getEffect("haste").duration, 3.0);

    // Reapplying with replace should refresh duration
    mgr.applyEffect({
        name: "haste",
        duration: 5.0,
        stackMode: "replace",
        modifiers: { speed: 1.8 }
    });

    assert.equal(mgr.effects.length, 1);
    assert.equal(mgr.getEffect("haste").duration, 5.0);
    assert.equal(mgr.getEffect("haste").modifiers.speed, 1.8);
    assert.equal(mgr.getModifiedStat("speed", 10), 18);
});

test("StatusEffectManager: handles duration_stack and intensity_stack modes", () => {
    const mgr = new StatusEffectManager();

    // Duration stack: adds durations up to maxDuration
    mgr.applyEffect({
        name: "regen",
        duration: 4.0,
        stackMode: "duration_stack",
        maxDuration: 10.0
    });
    mgr.applyEffect({
        name: "regen",
        duration: 5.0,
        stackMode: "duration_stack",
        maxDuration: 10.0
    });
    assert.equal(mgr.getEffect("regen").duration, 9.0);

    // Intensity stack: stacks potency up to maxStacks
    mgr.applyEffect({
        name: "poison",
        duration: 6.0,
        stackMode: "intensity_stack",
        maxStacks: 3,
        modifiers: { attack: 0.9 } // 10% attack reduction per stack
    });
    mgr.applyEffect({
        name: "poison",
        duration: 6.0,
        stackMode: "intensity_stack",
        maxStacks: 3,
        modifiers: { attack: 0.9 }
    });

    const poison = mgr.getEffect("poison");
    assert.equal(poison.stacks, 2);
    // Modified stat: 100 * (1 + (0.9 - 1) * 2) = 100 * 0.8 = 80
    assert.equal(Math.round(mgr.getModifiedStat("attack", 100)), 80);
});

test("StatusEffectManager: periodic ticks and paused state prevention of expiry", () => {
    const target = { health: 100 };
    const mgr = new StatusEffectManager({ target });

    let tickCount = 0;
    mgr.applyEffect({
        name: "burn",
        duration: 3.0,
        tickInterval: 1.0,
        onTick: (eff, tgt) => {
            tickCount++;
            tgt.health -= 10;
        }
    });

    // Step 1.5 seconds -> 1 tick fires
    mgr.update(1.5);
    assert.equal(tickCount, 1);
    assert.equal(target.health, 90);
    assert.equal(mgr.getEffect("burn").duration, 1.5);

    // PAUSED STATE: update with paused: true or setPaused(true)
    mgr.setPaused(true);
    mgr.update(2.0); // should NOT tick, should NOT decrement duration
    assert.equal(tickCount, 1);
    assert.equal(target.health, 90);
    assert.equal(mgr.getEffect("burn").duration, 1.5);

    // Unpause and finish duration
    mgr.setPaused(false);
    mgr.update(1.5); // should fire ticks and expire
    assert.equal(tickCount, 3);
    assert.equal(target.health, 70);
    assert.equal(mgr.hasEffect("burn"), false);
});

test("StatusEffectManager: cleansing by tag, category, and name", () => {
    const mgr = new StatusEffectManager();

    mgr.applyEffect({ name: "slow", duration: 5, category: "debuff", tags: ["movement"] });
    mgr.applyEffect({ name: "chill", duration: 5, category: "debuff", tags: ["elemental", "ice"] });
    mgr.applyEffect({ name: "might", duration: 5, category: "buff", tags: ["offensive"] });

    assert.equal(mgr.effects.length, 3);

    // Cleanse movement tag
    const removedTag = mgr.cleanse("movement");
    assert.equal(removedTag, 1);
    assert.equal(mgr.hasEffect("slow"), false);
    assert.equal(mgr.effects.length, 2);

    // Cleanse all remaining debuffs
    const removedDebuff = mgr.cleanse("debuff");
    assert.equal(removedDebuff, 1);
    assert.equal(mgr.hasEffect("chill"), false);
    assert.equal(mgr.hasEffect("might"), true);
});

test("DeathRetryManager: records checkpoint, handles death penalty, and cleanses buffs on death", () => {
    const combatant = { health: 100, maxHealth: 100, isAlive: true };
    const prog = new LevelProgression({ level: 2, experience: 80 });
    const statusMgr = new StatusEffectManager({ target: combatant });

    const deathMgr = new DeathRetryManager({
        target: combatant,
        progression: prog,
        statusManager: statusMgr,
        experienceLossRatio: 0.25 // Lose 25% XP on death
    });

    // Save checkpoint
    deathMgr.recordCheckpoint({ scene: "dungeon_1", spawnIndex: 2 });
    assert.notEqual(deathMgr.checkpoint, null);

    // Add temporary buff
    statusMgr.applyEffect({ name: "berserk", duration: 10, category: "buff" });
    assert.equal(statusMgr.hasEffect("berserk"), true);

    // Actor takes fatal damage and dies with buff
    combatant.health = 0;
    combatant.isAlive = false;

    const deathSummary = deathMgr.handleDeath();
    assert.equal(deathSummary.deathCount, 1);
    assert.equal(deathSummary.experienceLost, 20); // 25% of 80 = 20
    assert.equal(prog.experience, 60);

    // "Death with buff": temporary effects must be cleansed upon death
    assert.equal(statusMgr.hasEffect("berserk"), false);
    assert.equal(deathMgr.isDead, true);

    // Retry
    const retryResult = deathMgr.retry();
    assert.equal(retryResult.retryCount, 1);
    assert.equal(deathMgr.isDead, false);
    assert.equal(combatant.health, 100);
    assert.equal(combatant.isAlive, true);
});

test("DeathRetryManager: repeated retry preserves checkpoint without state drift", () => {
    const combatant = { health: 100, maxHealth: 100, isAlive: true };
    const prog = new LevelProgression({ level: 3, experience: 200 });
    const deathMgr = new DeathRetryManager({
        target: combatant,
        progression: prog,
        experienceLossRatio: 0.1
    });

    deathMgr.recordCheckpoint();

    // Die and retry 3 times in a row
    for (let i = 1; i <= 3; i++) {
        combatant.health = 0;
        combatant.isAlive = false;
        deathMgr.handleDeath();
        assert.equal(deathMgr.deathCount, i);
        assert.equal(deathMgr.isDead, true);

        const retry = deathMgr.retry();
        assert.equal(retry.retryCount, i);
        assert.equal(deathMgr.isDead, false);
        assert.equal(combatant.health, 100);
        assert.equal(combatant.isAlive, true);
    }
});
