import { Behaviour } from "../../src/scripts/script.js";
import { Transform } from "../../src/components/transform.js";
import { KeyboardInput } from "../../src/input/keyboardinput.js";
import { DialogueBox } from "../../src/galatea/dialogueBox.js";
import { GameData, Inventory, QuestLog } from "../../src/larissa/index.js";
import { PlayerController } from "./playerController.js";
import { Text } from "../../src/ui/text.js";
import { renderRpgHud } from "./hud.js";

function findPlayer(entity) {
    if (entity.components.some(component => component instanceof PlayerController)) return entity;
    for (const child of entity.children) {
        const player = findPlayer(child);
        if (player) return player;
    }
    return null;
}

export class TownGuide extends Behaviour {
    constructor() {
        super("TownGuide");
        this.dialogue = new DialogueBox();
        this.questData = new GameData({
            quests: {
                slimeTrouble: {
                    name: "Slime Trouble",
                    objectives: [{ id: "defeatSlimes", description: "Defeat the dungeon slimes", required: 3 }]
                }
            }
        });
        this.quests = new QuestLog(this.questData);
        this.inventory = new Inventory();
        this.inventory.addItem({ id: "trainingBlade", name: "Training Blade", type: "weapon", slot: "weapon", stats: { attack: 4 }, stackable: 1 });
        this.interactionLatched = false;
    }

    Update() {
        const text = this.entity.GetComponent(Text);
        if (!KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.E)) {
            this.interactionLatched = false;
            return;
        }
        if (this.interactionLatched) return;
        this.interactionLatched = true;

        let sceneRoot = this.entity;
        while (sceneRoot.parent) sceneRoot = sceneRoot.parent;
        const player = findPlayer(sceneRoot);
        const playerPosition = player?.GetComponent(Transform)?.position;
        const guidePosition = this.entity.GetComponent(Transform)?.position;
        if (!playerPosition || !guidePosition || Math.hypot(playerPosition.x - guidePosition.x, playerPosition.y - guidePosition.y) > 2) return;

        if (!this.dialogue.isVisible) {
            this.quests.start("slimeTrouble");
            player.questLog = this.quests;
            player.inventory = this.inventory;
            this.dialogue.start([
                { speaker: "Town Guide", text: "The dungeon is crawling with slimes." },
                { speaker: "Town Guide", text: "Defeat three slimes and bring peace back to town!" }
            ]);
        } else {
            this.dialogue.advance();
        }
        text.text = this.dialogue.isVisible ? `${this.dialogue.speaker}: ${this.dialogue.displayedText || this.dialogue.fullText} [E]` : "";
        renderRpgHud({ inventory: this.inventory, questLog: this.quests, location: "Town" });
    }
}
