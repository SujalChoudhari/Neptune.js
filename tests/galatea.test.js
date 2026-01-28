import { describe, it, expect, beforeEach } from "./tester.js";
import { DialogueBox, Cutscene, CutsceneManager } from "../src/galatea/index.js";

// ============================================
// DialogueBox Tests
// ============================================
describe('DialogueBox', () => {
    let dialogue;

    beforeEach(() => {
        dialogue = new DialogueBox();
    });

    it('starts invisible', () => {
        expect(dialogue.isVisible).toBe(false);
    });

    it('start makes visible', () => {
        dialogue.start([{ speaker: 'Test', text: 'Hello' }]);
        expect(dialogue.isVisible).toBe(true);
    });

    it('start sets speaker and text', () => {
        dialogue.start([{ speaker: 'NPC', text: 'Welcome!' }]);
        expect(dialogue.speaker).toBe('NPC');
        expect(dialogue.fullText).toBe('Welcome!');
    });

    it('update progresses typewriter', () => {
        dialogue.start([{ text: 'Hello' }]);
        dialogue.typeSpeed = 1000; // Very fast
        dialogue.update(0.1);
        expect(dialogue.displayedText.length).toBeGreaterThan(0);
    });

    it('advance completes typing if still typing', () => {
        dialogue.start([{ text: 'Hello World' }]);
        dialogue.advance();
        expect(dialogue.displayedText).toBe('Hello World');
        expect(dialogue.isTyping).toBe(false);
    });

    it('advance moves to next line', () => {
        dialogue.start([
            { text: 'Line 1' },
            { text: 'Line 2' }
        ]);
        dialogue.advance(); // Complete typing
        dialogue.advance(); // Next line
        expect(dialogue.fullText).toBe('Line 2');
    });

    it('skip hides dialogue', () => {
        dialogue.start([{ text: 'Hello' }]);
        dialogue.skip();
        expect(dialogue.isVisible).toBe(false);
    });
});

// ============================================
// Cutscene Tests
// ============================================
describe('Cutscene', () => {
    let cutscene;

    beforeEach(() => {
        cutscene = new Cutscene('test');
    });

    it('creates cutscene with name', () => {
        expect(cutscene.name).toBe('test');
    });

    it('addStep adds steps', () => {
        cutscene.addStep(() => { });
        cutscene.addStep(() => { });
        expect(cutscene.steps.length).toBe(2);
    });

    it('wait adds wait step', () => {
        cutscene.wait(2);
        expect(cutscene.steps.length).toBe(1);
    });

    it('play starts cutscene', () => {
        cutscene.addStep(() => { });
        cutscene.play();
        expect(cutscene.isPlaying).toBe(true);
    });

    it('pause pauses execution', () => {
        cutscene.addStep(() => { });
        cutscene.play();
        cutscene.pause();
        expect(cutscene.isPaused).toBe(true);
    });

    it('skip ends cutscene', () => {
        cutscene.addStep(() => { });
        cutscene.play();
        cutscene.skip();
        expect(cutscene.isPlaying).toBe(false);
    });

    it('update advances wait time', () => {
        let executed = false;
        cutscene.wait(0.1);
        cutscene.addStep(() => { executed = true; });
        cutscene.play({});
        cutscene.update(0.2);
        expect(executed).toBe(true);
    });
});

// ============================================
// CutsceneManager Tests
// ============================================
describe('CutsceneManager', () => {
    let manager;

    beforeEach(() => {
        manager = new CutsceneManager();
    });

    it('addCutscene registers cutscene', () => {
        const cs = new Cutscene('intro');
        manager.addCutscene(cs);
        expect(manager.cutscenes['intro']).toBe(cs);
    });

    it('isActive returns false initially', () => {
        expect(manager.isActive).toBe(false);
    });

    it('play sets isBlocking', () => {
        const cs = new Cutscene('test');
        cs.addStep(() => { });
        manager.addCutscene(cs);
        manager.play('test');
        expect(manager.isBlocking).toBe(true);
    });

    it('skip ends current cutscene', () => {
        const cs = new Cutscene('test');
        cs.addStep(() => { });
        manager.addCutscene(cs);
        manager.play('test');
        manager.skip();
        expect(manager.isBlocking).toBe(false);
    });
});
