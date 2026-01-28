import { Cutscene } from "./cutscene.js";
import { DialogueBox } from "./dialogueBox.js";

/**
 * CutsceneManager handles cutscene playback and UI.
 * @class CutsceneManager
 */
export class CutsceneManager {
    constructor() {
        this.cutscenes = {}; // { name: Cutscene }
        this.currentCutscene = null;
        this.dialogueBox = new DialogueBox();
        this.isBlocking = false; // Blocks game input during cutscene

        this.onCutsceneStart = null;
        this.onCutsceneEnd = null;
    }

    /**
     * Register a cutscene.
     * @param {Cutscene} cutscene 
     */
    addCutscene(cutscene) {
        this.cutscenes[cutscene.name] = cutscene;
    }

    /**
     * Play a cutscene by name.
     * @param {string} name 
     * @param {Object} context 
     */
    play(name, context = {}) {
        const cutscene = this.cutscenes[name];
        if (!cutscene) {
            console.warn(`Cutscene "${name}" not found`);
            return;
        }

        this.currentCutscene = cutscene;
        this.isBlocking = true;

        // Inject dialogue box into context
        context.dialogue = this.dialogueBox;
        context.manager = this;

        cutscene.onComplete = () => {
            this.isBlocking = false;
            this.currentCutscene = null;
            if (this.onCutsceneEnd) this.onCutsceneEnd(name);
        };

        if (this.onCutsceneStart) this.onCutsceneStart(name);
        cutscene.play(context);
    }

    /**
     * Show dialogue (convenience method for cutscene steps).
     * @param {Array} lines 
     * @returns {Promise}
     */
    showDialogue(lines) {
        return new Promise(resolve => {
            this.dialogueBox.onDialogueComplete = resolve;
            this.dialogueBox.start(lines);
        });
    }

    /**
     * Skip current cutscene.
     */
    skip() {
        if (this.currentCutscene) {
            this.currentCutscene.skip();
            this.dialogueBox.skip();
        }
    }

    /**
     * Handle input (advance dialogue).
     */
    handleInput() {
        if (this.dialogueBox.isVisible) {
            this.dialogueBox.advance();
        } else if (this.currentCutscene) {
            this.currentCutscene.nextStep();
        }
    }

    /**
     * Update manager.
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        if (this.currentCutscene) {
            this.currentCutscene.update(deltaTime);
        }
        this.dialogueBox.update(deltaTime);
    }

    /**
     * Draw UI elements.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} screenWidth 
     * @param {number} screenHeight 
     */
    draw(ctx, screenWidth, screenHeight) {
        // Draw dialogue box at bottom of screen
        this.dialogueBox.draw(
            ctx,
            20,
            screenHeight - 120,
            screenWidth - 40,
            100
        );
    }

    /**
     * Check if currently blocking game input.
     */
    get isActive() {
        return this.isBlocking;
    }
}
