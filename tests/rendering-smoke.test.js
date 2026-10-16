import "./setup_mocks.js";
import { describe, it, expect, beforeEach } from "./tester.js";
import { Scene, SceneManager, Entity, Sprite } from "../src/neptune.js";
import { Animation, Animator, Pose } from "../src/titan/index.js";
import { Camera, Tilemap, Tileset } from "../src/thalassa/index.js";

describe("M04 runnable rendering smoke", () => {
    beforeEach(() => SceneManager.removeAllScenes());
    it("renders animation on camera across layered maps and preserves player state on transition", () => {
        const tileset = new Tileset("smoke.png", 16, 16);
        tileset.columns = 4;
        const ground = new Tilemap(tileset, 1, 1);
        const bridge = new Tilemap(tileset, 1, 1);
        ground.setTile(0, 0, 0); bridge.setTile(0, 0, 1); ground.addLayer("bridge", bridge, 1);
        const animation = new Animation("walk", true);
        animation.addKeyframe(0, new Pose()); animation.addKeyframe(1, new Pose());
        const animator = new Animator(); animator.addAnimation(animation); animator.play("walk");
        animator.currentTime = 0.11;
        expect(animator.currentAnimation).toBe(animation);
        const source = new Scene("Map A"); const destination = new Scene("Map B");
        const player = new Entity("Player"); player.runtimeState = { health: 73 }; player.AddComponent(animator); source.AddChild(player);
        const camera = new Camera(32, 32); camera.position.x = 8; camera.position.y = 4; source.activeCamera = camera;
        SceneManager.LoadScene(source.id);
        const draws = []; tileset.drawTile = (_ctx, id) => draws.push(id); ground.draw({});
        expect(draws).toEqual([0, 1]);
        expect(camera.worldToScreen(8, 4)).toEqual({ x: 0, y: 0 });
        expect(SceneManager.TransitionToScene(destination.id, [player])).toBe(true);
        expect(SceneManager.GetActiveScene()).toBe(destination);
        expect(destination.children[0]).toBe(player);
        expect(player.runtimeState.health).toBe(73);
        expect(player.GetComponent(Animator)).toBe(animator);
        expect(animator.currentTime).toBe(0.11);
    });
});
