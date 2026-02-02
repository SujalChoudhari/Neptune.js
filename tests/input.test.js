import { describe, it, expect, beforeEach, afterEach } from "./tester.js";
import { KeyboardInput } from "../src/neptune.js";

describe('KeyboardInput', () => {
    let mockCanvas;

    beforeEach(() => {
        mockCanvas = {
            addEventListener: () => { },
            removeEventListener: () => { }
        };
        // Mock window if necessary or rely on JSDOM environment
        KeyboardInput.init(mockCanvas);
        KeyboardInput.clear();
    });

    it('IsKeyDown returns false initially', () => {
        expect(KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.A)).toBe(false);
    });

    it('IsKeyDown returns true after KeyDown event', () => {
        const event = new KeyboardEvent('keydown', { keyCode: KeyboardInput.KEY_CODE.A });
        window.dispatchEvent(event);
        expect(KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.A)).toBe(true);
    });

    it('IsKeyDown returns false after KeyUp event', () => {
        const downEvent = new KeyboardEvent('keydown', { keyCode: KeyboardInput.KEY_CODE.B });
        window.dispatchEvent(downEvent);
        expect(KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.B)).toBe(true);

        const upEvent = new KeyboardEvent('keyup', { keyCode: KeyboardInput.KEY_CODE.B });
        window.dispatchEvent(upEvent);
        expect(KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.B)).toBe(false);
    });

    it('Detects multiple keys correctly', () => {
        const eventA = new KeyboardEvent('keydown', { keyCode: KeyboardInput.KEY_CODE.A });
        const eventB = new KeyboardEvent('keydown', { keyCode: KeyboardInput.KEY_CODE.B });

        window.dispatchEvent(eventA);
        window.dispatchEvent(eventB);

        expect(KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.A)).toBe(true);
        expect(KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.B)).toBe(true);
    });
});
