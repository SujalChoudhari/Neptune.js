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
        const guideType = ComponentRegistry.get("TownGuide");
        const guideEntity = findEntity(scene, entity => entity.GetComponent(guideType));
        assert.ok(guideEntity, "town should include an interactable guide NPC");
        const guide = guideEntity.GetComponent(guideType);
        player.GetComponent(Transform).position.x = 8;
        player.GetComponent(Transform).position.y = 5;
        window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: KeyboardInput.KEY_CODE.E }));
        guide.Update();
        assert.equal(guide.dialogue.isVisible, true, "interacting with the nearby guide should open dialogue");
        assert.equal(guide.quests.states.get("slimeTrouble").status, "active", "guide dialogue should start the slime quest");
        assert.equal(guide.inventory.hasItem("trainingBlade"), true, "the guide should provide a blade in the player's inventory");
        assert.match(guideEntity.GetComponent(ComponentRegistry.get("Text")).text, /Town Guide:/,
            "NPC dialogue should be visible as scene text");
        assert.match(document.getElementById("rpg-hud").textContent, /Inventory: Training Blade ×1/,
            "the HTML HUD should show the player's starting inventory");
        assert.match(document.getElementById("rpg-hud").textContent, /Slime Trouble: 0\/3 \(active\)/,
            "the HTML HUD should show active quest progress");
        window.dispatchEvent(new KeyboardEvent("keyup", { keyCode: KeyboardInput.KEY_CODE.E }));
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
        assert.equal(encounter.enemies.length, 4, "dungeon should load all four authored tile-aware enemies");
        assert.ok(encounter.enemies.some(enemy => enemy.entity.name === "Slime Verdant"), "an additional scene-authored slime should be playable without runtime code changes");
        assert.ok(encounter.boss, "dungeon should instantiate its named Warden boss");
        assert.equal(encounter.boss.combatant.maxHealth, 100, "Warden should have a boss health pool");
        assert.equal(encounter.boss.ai.phases.length, 2, "Warden should have two configured attack phases");
        window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: KeyboardInput.KEY_CODE.U }));
        encounter.Update(0);
        assert.equal(encounter.inventory.equipment.weapon.id, "trainingBlade", "U should equip the training blade");
        assert.equal(encounter.playerMelee.damage, 16, "equipping the blade should increase melee damage");
        assert.match(document.getElementById("rpg-hud").textContent, /Equipment: weapon: Training Blade/,
            "the HTML HUD should reflect equipped gear");
        window.dispatchEvent(new KeyboardEvent("keyup", { keyCode: KeyboardInput.KEY_CODE.U }));
        const healthBeforePause = encounter.playerCombatant.health;
        const enemyPositionsBeforePause = encounter.enemies.map(enemy => ({ ...enemy.combatant.position }));
        const playerPositionBeforePause = { ...player.GetComponent(Transform).position };
        window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: KeyboardInput.KEY_CODE.P }));
        encounter.Update(1);
        window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: KeyboardInput.KEY_CODE.RIGHTARROW }));
        player.GetComponent(PlayerController).Update(1);
        window.dispatchEvent(new KeyboardEvent("keyup", { keyCode: KeyboardInput.KEY_CODE.RIGHTARROW }));
        assert.equal(encounter.paused, true, "P should pause dungeon simulation");
        assert.equal(encounter.playerCombatant.health, healthBeforePause, "paused enemies should not damage the player");
        assert.deepEqual(
            [player.GetComponent(Transform).position.x, player.GetComponent(Transform).position.y],
            [playerPositionBeforePause.x, playerPositionBeforePause.y],
            "paused player movement should not advance"
        );
        assert.deepEqual(encounter.enemies.map(enemy => enemy.combatant.position), enemyPositionsBeforePause,
            "paused enemy navigation should not advance");
        assert.match(document.getElementById("rpg-hud").textContent, /Status: PAUSED/,
            "the HTML HUD should display the paused state");
        window.dispatchEvent(new KeyboardEvent("keyup", { keyCode: KeyboardInput.KEY_CODE.P }));
        encounter.Update(0);
        window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: KeyboardInput.KEY_CODE.P }));
        encounter.Update(0);
        assert.equal(encounter.paused, false, "pressing P again should resume the dungeon");
        window.dispatchEvent(new KeyboardEvent("keyup", { keyCode: KeyboardInput.KEY_CODE.P }));
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
        assert.equal(guide.quests.states.get("slimeTrouble").progress.defeatSlimes, 1,
            "defeating a dungeon slime should advance the guide's quest");
        encounter.Update(0);
        assert.match(document.getElementById("rpg-hud").textContent, /Slime Trouble: 1\/3 \(active\)/,
            "the HTML HUD should refresh after quest progress changes");
        const savedPosition = { ...player.GetComponent(Transform).position };
        const savedExperience = encounter.progression.experience;
        window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: KeyboardInput.KEY_CODE.S }));
        encounter.Update(0);
        assert.match(document.getElementById("rpg-hud").textContent, /Saved/, "S should save the dungeon state");
        window.dispatchEvent(new KeyboardEvent("keyup", { keyCode: KeyboardInput.KEY_CODE.S }));
        player.GetComponent(Transform).position.x = 12;
        encounter.inventory.removeItem("slimeGel", 1);
        encounter.progression.grantExperience(3);
        guide.quests.advance("slimeTrouble", "defeatSlimes");
        window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: KeyboardInput.KEY_CODE.L }));
        encounter.Update(0);
        assert.deepEqual(
            [player.GetComponent(Transform).position.x, player.GetComponent(Transform).position.y],
            [savedPosition.x, savedPosition.y],
            "L should restore the saved player position"
        );
        assert.equal(encounter.inventory.getItemCount("slimeGel"), 1, "L should restore saved inventory");
        assert.equal(encounter.progression.experience, savedExperience, "L should restore saved progression");
        assert.equal(guide.quests.states.get("slimeTrouble").progress.defeatSlimes, 1, "L should restore saved quest progress");
        assert.match(document.getElementById("rpg-hud").textContent, /Loaded/, "the HUD should report a successful load");
        window.dispatchEvent(new KeyboardEvent("keyup", { keyCode: KeyboardInput.KEY_CODE.L }));
        for (const enemy of encounter.enemies) if (enemy.combatant.isAlive) {
            enemy.combatant.invulnerableRemaining = 0;
            enemy.combatant.receiveDamage({ amount: enemy.combatant.maxHealth });
        }
        encounter.boss.combatant.health = 40;
        encounter.boss.combatant.invulnerableRemaining = 0;
        encounter.boss.ai.setTarget(encounter.playerCombatant);
        encounter.Update(0);
        assert.ok(encounter.enemies.every(enemy => !enemy.combatant.isAlive), "the Warden should activate after all three slimes fall");
        assert.equal(encounter.boss.ai.target, encounter.playerCombatant, "the Warden should acquire the player after the slime wave");
        assert.equal(encounter.boss.ai.currentPhase, 1, "Warden should switch phases below half health");
        assert.equal(encounter.boss.ai.state, "transitioning", "Warden should telegraph its phase transition");
        let phaseTwoAttackStarted = false;
        encounter.boss.ai.onAttack = () => { phaseTwoAttackStarted = true; };
        encounter.Update(1);
        encounter.Update(0);
        assert.equal(encounter.boss.ai.state, "attacking", "Warden should attack after its transition");
        assert.equal(phaseTwoAttackStarted, true, "Warden should launch its phase-two attack through the combat system");
        assert.match(document.getElementById("rpg-hud").textContent, /Warden: 40\/100 \(Phase 2\)/,
            "the HTML HUD should show Warden health and current phase");
        assert.equal(encounter.boss.combatant.isAlive, true, "phase transition should not defeat the boss");
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
