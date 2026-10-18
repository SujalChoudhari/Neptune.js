import "./setup_mocks.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ComponentRegistry, KeyboardInput, SceneManager, Transform } from "../src/neptune.js";
import { PlayerController } from "../debug_project/scripts/playerController.js";

const sampleRoot = new URL("../debug_project/", import.meta.url);

function findEntity(entity, predicate) {
    if (predicate(entity)) return entity;
    for (const child of entity.children ?? []) {
        const match = findEntity(child, predicate);
        if (match) return match;
    }
    return null;
}

test("debug sample boots its real scene and tilemap without console errors", async () => {
    const originalFetch = globalThis.fetch;
    const originalError = console.error;
    const errors = [];
    const fetched = [];
    globalThis.fetch = async resource => {
        const url = new URL(resource, sampleRoot);
        fetched.push(url.href);
        try {
            const text = await readFile(fileURLToPath(url), "utf8");
            return { ok: true, status: 200, json: async () => JSON.parse(text) };
        } catch {
            return { ok: false, status: 404, json: async () => null };
        }
    };
    console.error = (...args) => errors.push(args.map(String).join(" "));

    try {
        const project = JSON.parse(await readFile(new URL("project.npt", sampleRoot), "utf8"));
        const townDefinition = JSON.parse(await readFile(new URL("scenes/demo.scn", sampleRoot), "utf8"));
        assert.deepEqual(new Set(townDefinition.layers.map(layer => layer.type)), new Set(["parallax", "tilemap", "main"]),
            "town should include background, tilemap, and gameplay layers");
        assert.equal(
            new URL(project.mainScene, sampleRoot).href,
            new URL("scenes/demo.scn", sampleRoot).href,
            "project mainScene should resolve to the bundled sample scene from any checkout location"
        );
        await access(new URL("assets/player.png", sampleRoot));
        await access(new URL("assets/tileset.png", sampleRoot));
        const { ready } = await import("../debug_project/main.js");
        const scene = await ready;

        assert.ok(scene, "sample startup should return the loaded scene");
        assert.equal(scene.name, "Town");
        assert.ok(findEntity(scene, entity => entity.name === "Town Square"), "town should include a named safe area");
        assert.equal(findEntity(scene, entity => entity.name.startsWith("Slime ")), null, "the town should not contain hostile slimes");
        assert.equal(SceneManager.GetActiveScene(), scene);
        const gameplay = scene.children.find(entity => entity.name === "Gameplay");
        const player = gameplay?.children.find(entity => entity.name === "Player");
        assert.ok(player, "sample scene should contain its player");
        assert.ok(player.components.some(component => component instanceof PlayerController));
        const portalType = ComponentRegistry.get("ScenePortal");
        assert.ok(portalType, "sample should register its scene transition component");
        const entryPortal = findEntity(scene, entity => entity.GetComponent(portalType));
        assert.ok(entryPortal, "sample should contain an entry portal");
        assert.ok(scene.children.filter(entity => entity.name.startsWith("Tile_")).length > 0,
            "sample tilemap should instantiate tile entities");
        assert.equal(fetched.length, 2, "startup should fetch the scene and its tilemap");

        KeyboardInput.init(document.createElement("canvas"));
        player.GetComponent(Transform).position.x = entryPortal.GetComponent(Transform).position.x;
        player.GetComponent(Transform).position.y = entryPortal.GetComponent(Transform).position.y;
        window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: KeyboardInput.KEY_CODE.E }));
        await entryPortal.GetComponent(portalType).Update(0);
        const dungeon = SceneManager.GetActiveScene();
        assert.equal(dungeon.name, "Dungeon");
        assert.equal(player.parent, dungeon, "the same player entity should survive the transition");
        assert.deepEqual(
            [player.GetComponent(Transform).position.x, player.GetComponent(Transform).position.y],
            [3, 5],
            "the player should arrive at the configured dungeon entrance"
        );
        const encounterType = ComponentRegistry.get("DungeonEncounter");
        assert.ok(encounterType, "dungeon should register its enemy encounter controller");
        const encounterEntity = findEntity(dungeon, entity => entity.GetComponent(encounterType));
        const encounter = encounterEntity.GetComponent(encounterType);
        encounter.Init();
        assert.equal(encounter.enemies.length, 3, "dungeon should have three tile-aware enemies");
        for (let step = 0; step < 30; step++) encounter.Update(0.25);
        assert.ok(encounter.enemies.every(enemy => enemy.ai.state === "attack"),
            "each enemy should navigate to the player and enter its combat attack state");
        assert.ok(encounter.playerCombatant.health < encounter.playerCombatant.maxHealth,
            "enemy combat behaviors should damage the player");
        const meleeTarget = encounter.enemies.find(enemy => enemy.combatant.isAlive);
        meleeTarget.combatant.position.x = encounter.playerCombatant.position.x + 1;
        meleeTarget.combatant.position.y = encounter.playerCombatant.position.y;
        const meleeHealth = meleeTarget.combatant.health;
        assert.equal(encounter.combatSystem.startAttack(encounter.playerCombatant, encounter.playerMelee, { x: 1, y: 0 }), true);
        encounter.combatSystem.update(0.4, [encounter.playerCombatant, ...encounter.enemies.map(enemy => enemy.combatant)]);
        assert.ok(meleeTarget.combatant.health < meleeHealth, "player melee hitbox should damage a nearby enemy hurtbox");
        const rangedTarget = encounter.enemies.find(enemy => enemy.combatant.isAlive && enemy !== meleeTarget);
        for (const enemy of encounter.enemies) {
            if (enemy !== rangedTarget) enemy.combatant.position.y = encounter.playerCombatant.position.y + 10;
        }
        rangedTarget.combatant.position.x = encounter.playerCombatant.position.x + 3;
        rangedTarget.combatant.position.y = encounter.playerCombatant.position.y;
        rangedTarget.combatant.invulnerableRemaining = 0;
        const rangedHealth = rangedTarget.combatant.health;
        assert.equal(encounter.combatSystem.startAttack(encounter.playerCombatant, encounter.playerRanged, { x: 1, y: 0 }), true);
        encounter.combatSystem.update(0.1, [encounter.playerCombatant, ...encounter.enemies.map(enemy => enemy.combatant)]);
        encounter.combatSystem.update(0.4, [encounter.playerCombatant, ...encounter.enemies.map(enemy => enemy.combatant)]);
        assert.ok(rangedTarget.combatant.health < rangedHealth, "player ranged projectile should hit an enemy hurtbox");
        const defeatedEnemy = encounter.enemies[0];
        defeatedEnemy.combatant.receiveDamage({ amount: defeatedEnemy.combatant.maxHealth });
        assert.equal(defeatedEnemy.combatant.isAlive, false, "a defeated enemy should be removed from combat");
        assert.equal(encounter.inventory.getItemCount("slimeGel"), 1, "enemy death should grant its loot");
        assert.equal(encounter.progression.level, 2, "enemy death should grant enough XP to level up");
        window.dispatchEvent(new KeyboardEvent("keyup", { keyCode: KeyboardInput.KEY_CODE.E }));
        entryPortal.GetComponent(portalType).Update(0);

        const exitPortal = findEntity(dungeon, entity => entity.GetComponent(portalType));
        player.GetComponent(Transform).position.x = exitPortal.GetComponent(Transform).position.x;
        player.GetComponent(Transform).position.y = exitPortal.GetComponent(Transform).position.y;
        window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: KeyboardInput.KEY_CODE.E }));
        await exitPortal.GetComponent(portalType).Update(0);
        assert.equal(SceneManager.GetActiveScene().name, "Town", "the town scene should be reused on return");
        assert.equal(SceneManager.GetActiveScene().id, scene.id);
        assert.equal(player.parent, scene, "the same player should return to the town scene");
        assert.equal(fetched.length, 4, "the dungeon and its tilemap should load only once");
        assert.deepEqual(errors, [], `sample logged console errors: ${errors.join("; ")}`);
    } finally {
        globalThis.fetch = originalFetch;
        console.error = originalError;
        SceneManager.removeAllScenes();
    }
});
