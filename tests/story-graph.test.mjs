import "./setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";

import { WorldFacts, TypedEventBus } from "../src/core/worldFacts.js";
import { StoryGraph, QuestGraph, evaluateConditions, applyEffects, detectContradictions } from "../src/galatea/storyGraph.js";
import { StoryGraph as GalateaStoryGraph, QuestGraph as GalateaQuestGraph } from "../src/galatea/index.js";
import { StoryGraph as NeptuneStoryGraph, QuestGraph as NeptuneQuestGraph } from "../src/neptune.js";

test("STORY-01 Re-exports: StoryGraph and QuestGraph are exported across modules", () => {
    assert.equal(typeof StoryGraph, "function", "StoryGraph is a class");
    assert.equal(typeof QuestGraph, "function", "QuestGraph is a class");
    assert.equal(GalateaStoryGraph, StoryGraph, "Galatea re-exports StoryGraph");
    assert.equal(GalateaQuestGraph, QuestGraph, "Galatea re-exports QuestGraph");
    assert.equal(NeptuneStoryGraph, StoryGraph, "Neptune re-exports StoryGraph");
    assert.equal(NeptuneQuestGraph, QuestGraph, "Neptune re-exports QuestGraph");
});

test("STORY-01 Dialogue choices branch based on WorldFacts and apply consequences", () => {
    const facts = new WorldFacts({
        "player.hasKey": false,
        "player.gold": 20,
        "player.charisma": 2
    });

    const story = new StoryGraph({
        id: "castle_gate_dialogue",
        facts,
        initialNodeId: "gate_guard",
        nodes: [
            {
                id: "gate_guard",
                speaker: "Gate Guard",
                text: "Halt! Who approaches the castle? Show the royal seal, pay the toll, or turn back.",
                choices: [
                    {
                        id: "use_seal",
                        text: "Show the Royal Key/Seal",
                        condition: { fact: "player.hasKey", value: true },
                        targetNodeId: "admitted_honor"
                    },
                    {
                        id: "pay_bribe",
                        text: "Pay 50 gold toll",
                        condition: { fact: "player.gold", op: ">=", value: 50 },
                        consequence: { fact: "player.gold", op: "subtract", value: 50 },
                        targetNodeId: "admitted_toll"
                    },
                    {
                        id: "persuade",
                        text: "Persuade the guard (Charisma 5+)",
                        condition: { fact: "player.charisma", op: ">=", value: 5 },
                        targetNodeId: "admitted_persuade"
                    },
                    {
                        id: "leave",
                        text: "Turn back and leave",
                        targetNodeId: "exit_gate"
                    }
                ]
            },
            {
                id: "admitted_honor",
                speaker: "Gate Guard",
                text: "Welcome back, noble hero! The gates are open.",
                next: "end"
            },
            {
                id: "admitted_toll",
                speaker: "Gate Guard",
                text: "Coins check out. You may enter.",
                next: "end"
            },
            {
                id: "admitted_persuade",
                speaker: "Gate Guard",
                text: "Fair enough, your words are true. Proceed.",
                next: "end"
            },
            {
                id: "exit_gate",
                speaker: "Gate Guard",
                text: "Move along then.",
                next: "end"
            }
        ]
    });

    // 1. Initial start: with default facts, only "leave" is available
    story.start();
    assert.equal(story.state, "active");
    assert.equal(story.currentNodeId, "gate_guard");

    let available = story.getAvailableChoices();
    assert.equal(available.length, 1, "Only unconditional choice is available initially");
    assert.equal(available[0].id, "leave");

    // Attempting to select a locked choice throws an Error
    assert.throws(() => {
        story.choose("pay_bribe");
    }, /locked/);

    // 2. Mutate facts: give key, verify key choice unlocks
    facts.set("player.hasKey", true);
    available = story.getAvailableChoices();
    assert.equal(available.length, 2, "Key choice unlocks when fact is satisfied");
    assert.deepEqual(available.map(c => c.id).sort(), ["leave", "use_seal"]);

    // 3. Mutate facts: add gold, verify pay_bribe choice unlocks
    facts.set("player.gold", 60);
    available = story.getAvailableChoices();
    assert.equal(available.length, 3, "Bribe choice unlocks when gold >= 50");
    assert.ok(available.some(c => c.id === "pay_bribe"));

    // 4. Select pay_bribe choice: verify fact consequence is applied
    const nextNode = story.choose("pay_bribe");
    assert.equal(story.currentNodeId, "admitted_toll");
    assert.equal(nextNode.speaker, "Gate Guard");
    assert.equal(facts.get("player.gold"), 10, "50 gold toll was deducted by consequence");

    // 5. Advance along linear 'next' transition to end
    const terminal = story.advance();
    assert.equal(terminal, null, "Reached end transition");
    assert.equal(story.isCompleted(), true, "Story completed");
    assert.equal(story.state, "completed");
});

test("STORY-01 Quest state machine transitions and event/fact-driven completion", () => {
    const facts = new WorldFacts({
        herbsCollected: 0,
        potionBrewed: false
    });
    const bus = new TypedEventBus();

    const quest = new QuestGraph({
        id: "alchemist_cure",
        title: "The Alchemist's Cure",
        description: "Gather ingredients, brew the potion, and deliver it.",
        facts,
        bus,
        initialStageId: "gather_herbs",
        stages: [
            {
                id: "gather_herbs",
                title: "Gather Herbs",
                description: "Collect 3 moondew herbs in the forest.",
                conditions: { fact: "herbsCollected", op: ">=", value: 3 },
                next: "brew_potion"
            },
            {
                id: "brew_potion",
                title: "Brew Potion",
                description: "Brew the potion at the cauldron.",
                conditions: { fact: "potionBrewed", value: true },
                next: "deliver_potion"
            },
            {
                id: "deliver_potion",
                title: "Deliver Potion",
                description: "Hand the cure to the sick villager.",
                event: "potion:delivered"
            }
        ]
    });

    // 1. Initial unstarted state
    assert.equal(quest.state, "unstarted");
    assert.equal(quest.currentStageId, null);

    // 2. Quest start
    quest.start();
    assert.equal(quest.state, "active");
    assert.equal(quest.currentStageId, "gather_herbs");
    assert.equal(quest.getStage("gather_herbs").state, "active");

    // 3. Bind to automatic fact changes and bus events
    const unbind = quest.bind(facts, bus);

    // 4. Partial fact update: should not trigger transition yet
    facts.set("herbsCollected", 2);
    assert.equal(quest.currentStageId, "gather_herbs", "Stage remains active with insufficient herbs");

    // 5. Threshold fact update: triggers automatic stage advancement
    facts.set("herbsCollected", 3);
    assert.equal(quest.currentStageId, "brew_potion", "Advanced to brew_potion when herbs >= 3");
    assert.equal(quest.getStage("gather_herbs").state, "completed");
    assert.equal(quest.getStage("brew_potion").state, "active");

    // 6. Fact update completes stage 2
    facts.set("potionBrewed", true);
    assert.equal(quest.currentStageId, "deliver_potion", "Advanced to deliver_potion stage");
    assert.equal(quest.getStage("brew_potion").state, "completed");
    assert.equal(quest.getStage("deliver_potion").state, "active");

    // 7. Event emission triggers stage 3 and quest completion
    bus.emit("potion:delivered", { recipient: "villager_alice" });
    assert.equal(quest.state, "completed", "Quest transitions to completed on event match");
    assert.equal(quest.currentStageId, null);
    assert.equal(quest.getStage("deliver_potion").state, "completed");

    unbind();
});

test("STORY-01 One-time rewards cannot be awarded twice (deduplication guards)", () => {
    const facts = new WorldFacts({
        "player.gold": 100,
        "player.xp": 0
    });

    const quest = new QuestGraph({
        id: "crypt_cleanup",
        title: "Crypt Cleanup",
        facts,
        initialStageId: "clear_skeletons",
        stages: [
            {
                id: "clear_skeletons",
                title: "Clear Skeletons",
                conditions: { fact: "skeletons_cleared", value: true },
                rewards: [
                    {
                        id: "stage_skeleton_bounty",
                        type: "gold",
                        fact: "player.gold",
                        op: "add",
                        amount: 50
                    }
                ],
                next: "vanquish_necromancer"
            },
            {
                id: "vanquish_necromancer",
                title: "Vanquish Necromancer",
                conditions: { fact: "necromancer_defeated", value: true },
                rewards: [
                    {
                        id: "stage_necro_xp",
                        type: "xp",
                        fact: "player.xp",
                        op: "add",
                        amount: 250
                    }
                ]
            }
        ],
        rewards: [
            {
                id: "quest_crypt_grand_reward",
                type: "gold",
                fact: "player.gold",
                op: "add",
                amount: 500
            }
        ]
    });

    quest.start();
    assert.equal(facts.get("player.gold"), 100);
    assert.equal(facts.get("player.xp"), 0);

    // 1. Complete Stage 1
    facts.set("skeletons_cleared", true);
    quest.evaluate(facts);

    assert.equal(facts.get("player.gold"), 150, "Stage 1 reward awarded 50 gold");
    assert.ok(quest.hasClaimedReward("stage_skeleton_bounty"), "Reward recorded as claimed");

    // 2. Re-evaluating or claiming stage 1 reward again does NOT duplicate reward
    quest.evaluate(facts);
    assert.equal(facts.get("player.gold"), 150, "Gold remains 150 after second evaluate");

    const duplicateClaim = quest.claimReward({
        id: "stage_skeleton_bounty",
        fact: "player.gold",
        op: "add",
        amount: 50
    }, facts);
    assert.equal(duplicateClaim.awarded, false);
    assert.equal(duplicateClaim.reason, "ALREADY_CLAIMED");
    assert.equal(facts.get("player.gold"), 150, "Gold strictly preserved at 150");

    // 3. Complete Stage 2 (final stage): triggers quest completion and grand reward
    facts.set("necromancer_defeated", true);
    quest.evaluate(facts);

    assert.equal(quest.state, "completed");
    assert.equal(facts.get("player.xp"), 250, "XP rewarded 250");
    assert.equal(facts.get("player.gold"), 650, "Grand reward awarded 500 gold (150 + 500 = 650)");
    assert.ok(quest.hasClaimedReward("quest_crypt_grand_reward"));

    // 4. Calling complete() again cannot award grand reward again
    quest.complete();
    assert.equal(facts.get("player.gold"), 650, "Gold remains 650, grand reward not duplicated");

    // 5. Claimed rewards are queryable and deduplicated
    const claimedList = quest.getClaimedRewards();
    assert.ok(claimedList.includes("stage_skeleton_bounty"));
    assert.ok(claimedList.includes("stage_necro_xp"));
    assert.ok(claimedList.includes("quest_crypt_grand_reward"));
});

test("STORY-01 Diagnostics detects missing nodes, absent speakers, contradictory conditions, and unsupported cycles", () => {
    // 1. Missing node reference in StoryGraph
    const brokenStory = new StoryGraph({
        initialNodeId: "missing_entry_node",
        nodes: [
            {
                id: "node_1",
                speaker: "Elder",
                text: "Hello traveler.",
                choices: [
                    {
                        text: "Enter portal",
                        targetNodeId: "non_existent_portal_destination"
                    }
                ],
                next: "non_existent_next"
            }
        ]
    });
    const storyDiag1 = brokenStory.diagnostics();
    assert.equal(storyDiag1.valid, false);
    assert.ok(storyDiag1.errors.some(e => e.code === "MISSING_NODE_REFERENCE" && e.nodeId === "missing_entry_node"));
    assert.ok(storyDiag1.errors.some(e => e.code === "MISSING_NODE_REFERENCE" && e.targetNodeId === "non_existent_portal_destination"));
    assert.ok(storyDiag1.errors.some(e => e.code === "MISSING_NODE_REFERENCE" && e.targetNodeId === "non_existent_next"));

    // 2. Absent speaker in StoryGraph
    const namelessStory = new StoryGraph({
        nodes: [
            {
                id: "silent_node",
                speaker: "",
                text: "Whispers in the dark..."
            },
            {
                id: "null_speaker_node",
                speaker: null,
                text: "Silence..."
            }
        ]
    });
    const storyDiag2 = namelessStory.diagnostics();
    assert.equal(storyDiag2.valid, false);
    assert.ok(storyDiag2.errors.some(e => e.code === "ABSENT_SPEAKER" && e.nodeId === "silent_node"));
    assert.ok(storyDiag2.errors.some(e => e.code === "ABSENT_SPEAKER" && e.nodeId === "null_speaker_node"));

    // 3. Contradictory conditions in dialogue choices
    const contradictoryStory = new StoryGraph({
        nodes: [
            {
                id: "paradox_choice_node",
                speaker: "Sphinx",
                text: "Answer the riddle.",
                choices: [
                    {
                        text: "Impossible condition",
                        condition: [
                            { fact: "player.gold", op: ">", value: 100 },
                            { fact: "player.gold", op: "<", value: 50 }
                        ],
                        targetNodeId: "paradox_choice_node"
                    },
                    {
                        text: "Conflicting equality",
                        condition: [
                            { fact: "door_state", op: "==", value: "open" },
                            { fact: "door_state", op: "==", value: "closed" }
                        ],
                        targetNodeId: "paradox_choice_node"
                    }
                ]
            }
        ]
    });
    const storyDiag3 = contradictoryStory.diagnostics();
    assert.equal(storyDiag3.valid, false);
    assert.ok(storyDiag3.errors.some(e => e.code === "CONTRADICTORY_CONDITIONS" && e.fact === "player.gold"));
    assert.ok(storyDiag3.errors.some(e => e.code === "CONTRADICTORY_CONDITIONS" && e.fact === "door_state"));

    // 4. Missing stage reference in QuestGraph
    const brokenQuest = new QuestGraph({
        initialStageId: "missing_start_stage",
        stages: [
            {
                id: "stage_1",
                next: "missing_stage_2"
            }
        ]
    });
    const questDiag1 = brokenQuest.diagnostics();
    assert.equal(questDiag1.valid, false);
    assert.ok(questDiag1.errors.some(e => e.code === "MISSING_STAGE_REFERENCE" && e.stageId === "missing_start_stage"));
    assert.ok(questDiag1.errors.some(e => e.code === "MISSING_STAGE_REFERENCE" && e.targetStageId === "missing_stage_2"));

    // 5. Unsupported cycles in quest graphs
    const cyclicQuest = new QuestGraph({
        initialStageId: "stage_alpha",
        stages: [
            { id: "stage_alpha", next: "stage_beta" },
            { id: "stage_beta", next: "stage_gamma" },
            { id: "stage_gamma", next: "stage_alpha" } // Directed loop: alpha -> beta -> gamma -> alpha
        ]
    });
    const questDiag2 = cyclicQuest.diagnostics();
    assert.equal(questDiag2.valid, false);
    const cycleErr = questDiag2.errors.find(e => e.code === "UNSUPPORTED_CYCLE");
    assert.ok(cycleErr, "Detected unsupported cycle in quest graph");
    assert.deepEqual(cycleErr.cycle, ["stage_alpha", "stage_beta", "stage_gamma", "stage_alpha"]);

    // 6. Valid graph returns clean diagnostics
    const cleanQuest = new QuestGraph({
        initialStageId: "stage_a",
        stages: [
            { id: "stage_a", next: "stage_b" },
            { id: "stage_b", next: "stage_c" },
            { id: "stage_c", next: null }
        ]
    });
    const cleanDiag = cleanQuest.diagnostics();
    assert.equal(cleanDiag.valid, true);
    assert.equal(cleanDiag.errors.length, 0);
});

test("STORY-01 Snapshot and restore for persistence (save/load round-trip)", () => {
    const facts = new WorldFacts({
        "player.gold": 100,
        "story.step": 1
    });

    // 1. Dialogue Graph snapshot and restore
    const storyDef = {
        id: "tavern_brawl",
        facts,
        initialNodeId: "brawl_start",
        nodes: [
            {
                id: "brawl_start",
                speaker: "Barkeep",
                text: "Trouble's brewing! What will you do?",
                choices: [
                    { id: "draw_weapon", text: "Draw sword", targetNodeId: "fight" },
                    { id: "calm_crowd", text: "Calm the patron", targetNodeId: "talk" }
                ]
            },
            {
                id: "fight",
                speaker: "Barkeep",
                text: "Keep the chairs intact at least!",
                choices: [
                    { id: "knock_out", text: "Knock out bandit", targetNodeId: "aftermath" }
                ]
            },
            {
                id: "talk",
                speaker: "Patron",
                text: "You make a good point...",
                next: "aftermath"
            },
            {
                id: "aftermath",
                speaker: "Barkeep",
                text: "Thanks for handling that.",
                next: "end"
            }
        ]
    };

    const story1 = new StoryGraph(storyDef);
    story1.start();
    story1.choose("draw_weapon");
    assert.equal(story1.currentNodeId, "fight");
    assert.deepEqual(story1.history, ["brawl_start", "fight"]);

    // Create snapshot
    const storySnapshot = story1.snapshot();
    assert.equal(storySnapshot.currentNodeId, "fight");
    assert.equal(storySnapshot.state, "active");

    // Restore into a fresh StoryGraph instance
    const story2 = new StoryGraph(storyDef);
    assert.equal(story2.state, "unstarted");
    story2.restore(storySnapshot);

    assert.equal(story2.currentNodeId, "fight");
    assert.equal(story2.state, "active");
    assert.deepEqual(story2.history, ["brawl_start", "fight"]);

    // Continue restored dialogue
    const currentNode = story2.getCurrentNode();
    assert.equal(currentNode.id, "fight");
    assert.equal(currentNode.availableChoices.length, 1);
    story2.choose("knock_out");
    assert.equal(story2.currentNodeId, "aftermath");

    // 2. Quest Graph snapshot and restore
    const questDef = {
        id: "dragon_slayer",
        title: "Dragon Slayer",
        facts,
        initialStageId: "find_lair",
        stages: [
            {
                id: "find_lair",
                title: "Find Lair",
                conditions: { fact: "lair_found", value: true },
                rewards: [{ id: "map_reward", type: "gold", fact: "player.gold", op: "add", amount: 50 }],
                next: "slay_dragon"
            },
            {
                id: "slay_dragon",
                title: "Slay Dragon",
                conditions: { fact: "dragon_slain", value: true },
                rewards: [{ id: "dragon_scale", type: "item", fact: "has_scale", value: true }]
            }
        ],
        rewards: [
            { id: "title_dragonslayer", type: "title", fact: "player.title", value: "Dragonslayer" }
        ]
    };

    const quest1 = new QuestGraph(questDef);
    quest1.start();
    facts.set("lair_found", true);
    quest1.evaluate(facts);

    assert.equal(quest1.currentStageId, "slay_dragon");
    assert.equal(facts.get("player.gold"), 150); // 100 + 50
    assert.ok(quest1.hasClaimedReward("map_reward"));

    // Take snapshot of quest state
    const questSnapshot = quest1.snapshot();
    assert.equal(questSnapshot.state, "active");
    assert.equal(questSnapshot.currentStageId, "slay_dragon");
    assert.ok(questSnapshot.claimedRewards.includes("map_reward"));

    // Restore into a fresh QuestGraph instance
    const quest2 = new QuestGraph(questDef);
    assert.equal(quest2.state, "unstarted");
    quest2.restore(questSnapshot);

    assert.equal(quest2.state, "active");
    assert.equal(quest2.currentStageId, "slay_dragon");
    assert.ok(quest2.hasClaimedReward("map_reward"));

    // Verify deduplication remains enforced after restore
    const duplicateMapReward = quest2.claimReward({ id: "map_reward", fact: "player.gold", op: "add", amount: 50 }, facts);
    assert.equal(duplicateMapReward.awarded, false);
    assert.equal(facts.get("player.gold"), 150, "Gold remained unchanged because map_reward was already claimed");

    // Advance restored quest to completion
    facts.set("dragon_slain", true);
    quest2.evaluate(facts);

    assert.equal(quest2.state, "completed");
    assert.equal(facts.get("has_scale"), true);
    assert.equal(facts.get("player.title"), "Dragonslayer");
    assert.ok(quest2.hasClaimedReward("dragon_scale"));
    assert.ok(quest2.hasClaimedReward("title_dragonslayer"));
});
