import { describe, it, expect, beforeEach, afterEach } from "./tester.js";
import { KeyboardInput, MouseInput, TouchInput } from "../src/neptune.js";

describe('KeyboardInput', () => {
    // Note: These tests verify the static interface. 
    // Full integration requires DOM initialization which happens in Application.

    it('KeyboardInput has static init method', () => {
        expect(typeof KeyboardInput.init).toBe('function');
    });

    it('KeyboardInput has static clear method', () => {
        expect(typeof KeyboardInput.clear).toBe('function');
    });

    it('KeyboardInput has IsKeyDown method', () => {
        expect(typeof KeyboardInput.IsKeyDown).toBe('function');
    });

    it('KeyboardInput has GetSpecialKeyPressed method', () => {
        expect(typeof KeyboardInput.GetSpecialKeyPressed).toBe('function');
    });

    it('IsKeyDown returns false for uninitialized key', () => {
        // Before any keys are pressed, all should return false
        expect(KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.A)).toBe(false);
    });

    it('KEY_CODE enum exists with common keys', () => {
        expect(KeyboardInput.KEY_CODE.A).toBe(65);
        expect(KeyboardInput.KEY_CODE.SPACE).toBe(32);
        expect(KeyboardInput.KEY_CODE.ENTER).toBe(13);
    });
});

describe('MouseInput', () => {
    it('MouseInput has static init method', () => {
        expect(typeof MouseInput.init).toBe('function');
    });

    it('MouseInput has static clear method', () => {
        expect(typeof MouseInput.clear).toBe('function');
    });

    it('MouseInput has IsButtonDown method', () => {
        expect(typeof MouseInput.IsButtonDown).toBe('function');
    });

    it('MouseInput has IsButtonUp method', () => {
        expect(typeof MouseInput.IsButtonUp).toBe('function');
    });

    it('MouseInput has IsClicked method', () => {
        expect(typeof MouseInput.IsClicked).toBe('function');
    });

    it('MouseInput has GetPosition method', () => {
        expect(typeof MouseInput.GetPosition).toBe('function');
    });

    it('BUTTON enum exists', () => {
        expect(MouseInput.BUTTON.LEFT).toBe(0);
        expect(MouseInput.BUTTON.MIDDLE).toBe(1);
        expect(MouseInput.BUTTON.RIGHT).toBe(2);
    });
});

describe('TouchInput', () => {
    it('TouchInput has static init method', () => {
        expect(typeof TouchInput.init).toBe('function');
    });

    it('TouchInput has static clear method', () => {
        expect(typeof TouchInput.clear).toBe('function');
    });

    it('TouchInput has IsTouchActive method', () => {
        expect(typeof TouchInput.IsTouchActive).toBe('function');
    });

    it('TouchInput has GetTouch method', () => {
        expect(typeof TouchInput.GetTouch).toBe('function');
    });

    it('TouchInput has GetTouchCount method', () => {
        expect(typeof TouchInput.GetTouchCount).toBe('function');
    });
});
