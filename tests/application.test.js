import { application, Application, Color } from '../src/neptune.js';
import { describe, expect, it } from './tester.js';

describe("Application", () => {
    it("should be an instance of Application", () => {
        expect(application).toBeInstanceOf(Application);
    });

    it("should have same size as of window", () => {
        expect(application.width).toBe(window.innerWidth);
        expect(application.height).toBe(window.innerHeight);
    });

    it("should update color of canvas",()=>{
        application.clearColor = Color.FromHex(0x123456);
        expect(application.clearColor).toBeInstanceOf(Color);
        expect(application.clearColor.toString()).toBe(Color.FromHex(0x123456).toString());
    });

});
