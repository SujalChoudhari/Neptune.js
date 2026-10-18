import { Behaviour } from "../../src/scripts/script.js";
import { Transform } from "../../src/components/transform.js";
import { SceneManager } from "../../src/core/sceneManager.js";
import { KeyboardInput } from "../../src/input/keyboardinput.js";
import { Tileset } from "../../src/thalassa/tileset.js";
import { Tilemap } from "../../src/thalassa/tilemap.js";
import { AttackDefinition, Combatant, CombatSystem, EnemyAI, Inventory, Progression, GameData, RewardSystem } from "../../src/larissa/index.js";
import { PlayerController } from "./playerController.js";
import { renderRpgHud } from "./hud.js";

function collect(entity, predicate, matches = []) {
    if (predicate(entity)) matches.push(entity);
    for (const child of entity.children) collect(child, predicate, matches);
    return matches;
}

export class DungeonEncounter extends Behaviour {
    constructor() {
        super("DungeonEncounter");
        this.initializedScene = null;
        this.enemies = [];
        this.inventory = null;
        this.equipLatched = false;
        this.pauseLatched = false;
        this.paused = false;
        this.progression = new Progression({ baseExperience: 10 });
        this.rewardSystem = new RewardSystem(new GameData({
            items: { slimeGel: { id: "slimeGel", name: "Slime Gel", type: "material", stackable: 10 } },
            rewards: { slimeDefeat: { experience: 10, items: [{ itemId: "slimeGel", quantity: 1 }] } }
        }));
    }

    Init() {
        const scene = SceneManager.GetActiveScene();
        if (scene?.name === "Dungeon") this.#initialize(scene);
    }

    Update(deltaTime) {
        const scene = SceneManager.GetActiveScene();
        if (scene?.name !== "Dungeon") return;
        if (this.initializedScene !== scene && !this.#initialize(scene)) return;

        const pausePressed = KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.P);
        if (!pausePressed) this.pauseLatched = false;
        else if (!this.pauseLatched) {
            this.pauseLatched = true;
            this.paused = !this.paused;
            this.player.paused = this.paused;
        }
        if (this.paused) {
            renderRpgHud({ inventory: this.inventory, questLog: this.questLog, location: "Dungeon", paused: true });
            return;
        }

        const playerTransform = this.player.GetComponent(Transform);
        const requestedCell = {
            x: Math.round(playerTransform.position.x),
            y: Math.round(playerTransform.position.y)
        };
        if (this.tilemap.gridIndex(requestedCell.x, requestedCell.y) !== null) {
            this.tilemap.occupy(requestedCell.x, requestedCell.y, this.player);
        }

        for (const enemy of this.enemies) {
            enemy.ai.update(deltaTime, { target: this.player });
            const index = this.tilemap.occupantCells.get(enemy.entity);
            if (index !== undefined) {
                const x = index % this.tilemap.width;
                const y = Math.floor(index / this.tilemap.width);
                enemy.entity.GetComponent(Transform).position.x = x;
                enemy.entity.GetComponent(Transform).position.y = y;
                enemy.combatant.position.x = x;
                enemy.combatant.position.y = y;
            }
        }

        this.playerCombatant.position.x = playerTransform.position.x;
        this.playerCombatant.position.y = playerTransform.position.y;
        const equipPressed = KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.U);
        if (!equipPressed) this.equipLatched = false;
        else if (!this.equipLatched) {
            this.equipLatched = true;
            if (this.inventory.equip("trainingBlade")) {
                const attackBonus = this.inventory.equipment.weapon?.stats?.attack ?? 0;
                this.playerMelee = new AttackDefinition({ ...this.playerMelee, damage: 12 + attackBonus });
            }
        }
        const controller = this.player.GetComponent(PlayerController);
        if (KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.J)) {
            this.combatSystem.startAttack(this.playerCombatant, this.playerMelee, controller.facing);
        }
        if (KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.K)) {
            this.combatSystem.startAttack(this.playerCombatant, this.playerRanged, controller.facing);
        }
        this.combatSystem.update(deltaTime, [this.playerCombatant, ...this.enemies.map(enemy => enemy.combatant)]);
        renderRpgHud({ inventory: this.inventory, questLog: this.questLog, location: "Dungeon", paused: this.paused });
    }

    #initialize(scene) {
        const player = collect(scene, entity => entity.components.some(component => component instanceof PlayerController))[0];
        const enemyEntities = collect(scene, entity => entity.name.startsWith("Slime "));
        if (!player || enemyEntities.length !== 3) return false;

        this.tilemap = new Tilemap(new Tileset("assets/tileset.png", 1, 1), 20, 15);
        this.player = player;
        player.paused = false;
        this.inventory = player.inventory ?? new Inventory();
        player.inventory = this.inventory;
        this.questLog = player.questLog ?? null;
        this.combatSystem = new CombatSystem();
        const playerTransform = player.GetComponent(Transform);
        this.playerCombatant = new Combatant({
            id: "dungeon-player",
            faction: "heroes",
            x: playerTransform.position.x,
            y: playerTransform.position.y,
            maxHealth: 100,
            hurtbox: { width: 1, height: 1 }
        });
        this.playerMelee = new AttackDefinition({ name: "hero-slash", mode: "melee", startup: 0.05, active: 0.15, recovery: 0.1, cooldown: 0.3, range: 2, damage: 12, hitbox: { width: 2, height: 1.5 } });
        this.playerRanged = new AttackDefinition({ name: "hero-bolt", mode: "ranged", startup: 0.05, active: 0.1, recovery: 0.1, cooldown: 0.4, range: 8, damage: 8, projectileSpeed: 20, hitbox: { width: 0.5, height: 0.5 } });
        const playerCell = { x: Math.round(playerTransform.position.x), y: Math.round(playerTransform.position.y) };
        if (!this.tilemap.occupy(playerCell.x, playerCell.y, player)) return false;

        const attackDefinition = new AttackDefinition({
            name: "slime-strike",
            mode: "melee",
            startup: 0.1,
            active: 0.2,
            recovery: 0.1,
            cooldown: 0.5,
            range: 1.5,
            damage: 4,
            hitbox: { width: 1.25, height: 1.25 },
            staggerDuration: 0.1
        });
        this.enemies = enemyEntities.map(entity => {
            const transform = entity.GetComponent(Transform);
            const spawn = { x: Math.round(transform.position.x), y: Math.round(transform.position.y) };
            if (!this.tilemap.occupy(spawn.x, spawn.y, entity)) {
                throw new Error(`Dungeon enemy '${entity.name}' has an invalid or occupied spawn cell.`);
            }
            const combatant = new Combatant({
                id: entity.id,
                faction: "monsters",
                x: spawn.x,
                y: spawn.y,
                maxHealth: 30,
                hurtbox: { width: 1, height: 1 }
            });
            combatant.onDeath = () => {
                this.tilemap.vacate(entity);
                entity.name = `${entity.name} (defeated)`;
                this.rewardSystem.grant("slimeDefeat", { inventory: this.inventory, progression: this.progression });
                this.questLog?.advance("slimeTrouble", "defeatSlimes");
            };
            return {
                entity,
                combatant,
                ai: new EnemyAI({
                    tilemap: this.tilemap,
                    actor: entity,
                    spawn,
                    perceptionRadius: 15,
                    attackRange: 1,
                    moveInterval: 0.2,
                    attackCooldown: 0.5,
                    combatSystem: this.combatSystem,
                    combatant,
                    attackDefinition
                })
            };
        });
        this.initializedScene = scene;
        return true;
    }
}
