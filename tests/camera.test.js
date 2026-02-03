import { describe, it, expect } from './tester.js';
import { Camera } from '../src/thalassa/camera.js';
import { Vector2 } from '../src/math/vec2.js';

describe("Camera Tests", () => {

    it("Camera Initialization", () => {
        const cam = new Camera(800, 600);
        expect(cam.viewWidth).toBe(800);
        expect(cam.viewHeight).toBe(600);
        // Default zoom might be 1 if we implement it, undefined if not
        if (cam.zoom !== undefined) {
            expect(cam.zoom).toBe(1);
        }
        expect(cam.position.x).toBe(0);
        expect(cam.position.y).toBe(0);
    });

    it("Camera Zoom", () => {
        const cam = new Camera(800, 600);
        if (cam.setZoom) {
            cam.setZoom(2);
            expect(cam.zoom).toBe(2);

            cam.setZoom(0.5);
            expect(cam.zoom).toBe(0.5);
        } else {
            // Fail if method not present (TDD)
            // But we can't throw here if we want to run other tests. 
            // Actually, TDD says write test that fails.
            // If I access cam.zoom and it's undefined, toBe(2) will fail.
            // So:
            cam.setZoom(2);
            expect(cam.zoom).toBe(2);
        }
    });

    it("World to Screen with Zoom", () => {
        const cam = new Camera(100, 100);

        // Zoom 1
        // Center is 0,0 world. Screen center is 50,50.
        // If cam.position is 0,0.
        // worldToScreen(0,0) -> 50,50?
        // Let's check existing behavior of worldToScreen
        // currently: worldX - this.x, worldY - this.y
        // If cam is at 0,0, then world 0,0 is screen 0,0.
        // So Neptune camera is Top-Left origin based?
        // If viewWidth=100, viewHeight=100.
        // Usually cameras center the view.
        // If Neptune doesn't, we should verify that.
        // Existing code:
        // this.position.x += (targetX - this.viewWidth / 2 - this.position.x) * t;
        // It tries to center the target.
        // If target is at 100,100. view is 100x100.
        // Target screen pos should be 50,50.
        // 100 - 50 = 50. So cam pos becomes 50.
        // worldToScreen(100) = 100 - 50 = 50. Correct.
        // So worldToScreen = world - camPos.

        // Now with Zoom.
        // Screen = (World - CamPos) * Zoom + CenterOffset?
        // If we want to zoom in on the center of the screen.
        // Let's assume simple scaling for now:
        // Screen = (World - CamPos) * Zoom.
        // If Zoom=2. World=10. CamPos=0. Screen=20.

        cam.setZoom(2);
        const screenPos = cam.worldToScreen(10, 10);
        expect(screenPos.x).toBe(20);
        expect(screenPos.y).toBe(20);
    });

    it("Screen to World with Zoom", () => {
        const cam = new Camera(100, 100);
        cam.setZoom(2);

        const worldPos = cam.screenToWorld(20, 20);
        expect(worldPos.x).toBe(10);
        expect(worldPos.y).toBe(10);
    });

});
