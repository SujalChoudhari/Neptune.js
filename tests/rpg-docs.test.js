import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const guideUrl = new URL("../docs/tutorials/rpg-systems.md", import.meta.url);

test("RPG guide covers exported Larissa progression and inventory APIs", async () => {
    const guide = await readFile(guideUrl, "utf8");
    const stats = await readFile(new URL("../src/larissa/stats.js", import.meta.url), "utf8");
    const inventory = await readFile(new URL("../src/larissa/inventory.js", import.meta.url), "utf8");
    const progression = await readFile(new URL("../src/larissa/progression.js", import.meta.url), "utf8");
    const index = await readFile(new URL("../src/larissa/index.js", import.meta.url), "utf8");

    for (const name of ["Stats", "Inventory", "Progression", "GameData", "RewardSystem", "Shop", "QuestLog"]) {
        assert.ok(index.includes(name), `Larissa index should export ${name}`);
        assert.ok(guide.includes(name), `guide should document ${name}`);
    }
    for (const [source, methods] of [
        [stats, ["takeDamage", "heal", "useStamina", "regenStamina", "applyEffect", "updateEffects", "getModifiedStat"]],
        [inventory, ["addItem", "removeItem", "hasItem", "getItemCount", "canAddItem", "useItem", "equip", "unequip", "toJSON", "loadJSON"]],
        [progression, ["experienceToNextLevel", "onProgression", "grantExperience", "unlockSkill", "fromJSON", "rollLoot", "grant", "buy", "start", "advance", "subscribe"]]
    ]) {
        for (const method of methods) {
            assert.ok(source.includes(method), `implementation should contain ${method}`);
            assert.ok(guide.includes(method), `guide should document ${method}`);
        }
    }
    assert.match(guide, /experienceToNextLevel/);
    assert.match(guide, /checks happen before applying the reward/);
    assert.match(guide, /progress is capped at the objective requirement/);
});
