import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const guideUrl = new URL("../docs/tutorials/combat-ai.md", import.meta.url);

test("combat and AI guide documents exported Larissa APIs and runtime behavior", async () => {
    const guide = await readFile(guideUrl, "utf8");
    const combat = await readFile(new URL("../src/larissa/combat.js", import.meta.url), "utf8");
    const enemyAI = await readFile(new URL("../src/larissa/enemyAI.js", import.meta.url), "utf8");
    const bossAI = await readFile(new URL("../src/larissa/bossAI.js", import.meta.url), "utf8");
    const index = await readFile(new URL("../src/larissa/index.js", import.meta.url), "utf8");

    for (const name of ["AttackDefinition", "Combatant", "CombatSystem", "EnemyAI", "BossAI"]) {
        assert.ok(index.includes(name), `Larissa index should export ${name}`);
        assert.ok(guide.includes(name), `guide should document ${name}`);
    }
    for (const [source, methods] of [
        [combat, ["receiveDamage", "applyEffect", "getModifiedStat", "update", "on", "startAttack"]],
        [enemyAI, ["update", "onStateChange"]],
        [bossAI, ["addPhase", "addAttackPhase", "setTarget", "update", "stun"]]
    ]) {
        for (const method of methods) {
            assert.ok(source.includes(method), `implementation should contain ${method}`);
            assert.ok(guide.includes(method), `guide should document ${method}`);
        }
    }
    assert.match(guide, /ranged.*alias/);
    assert.match(guide, /returns `\{ applied, damage, killed \}`/);
    assert.match(guide, /Manhattan tile distance/);
});
