import { describe, it, expect, beforeEach, afterEach } from "./tester.js";
import { Scene, SceneManager } from "../src/neptune.js";

describe("SceneManager", () => {
    beforeEach(() => {
        SceneManager.removeAllScenes();
    });

    it("should be able to get a scene", () => {
        const scene = new Scene("TestScene");
        expect(SceneManager.GetScene(0)).toBe(scene);
    });

    it("should be able to get a scene by name", () => {
        const scene = new Scene("TestScene");
        expect(SceneManager.GetSceneByName("TestScene")).toBe(scene);
    });

    it("should load a scene and change the current scene index", () => {
        const scene1 = new Scene("1");
        const scene2 = new Scene("2");

        SceneManager.LoadScene(0);
        expect(SceneManager.GetSceneByName("1")).toBe(scene1);

    });

    it("should unload all additive scenes except the current scene", () => {
        const scene1 = new Scene("One");
        const scene2 = new Scene("Two");

        SceneManager.LoadScene(scene1.id);
        SceneManager.LoadSceneAdditive(scene2.id);
        expect(SceneManager.GetSceneByName("One")).toBe(scene1);
    });

    it("should properly call the callbacks", () => {
        const scene1 = new Scene("One");
        const scene2 = new Scene("Two");

        scene1.OnSceneLoad = () => { console.log("Scene 1 loaded"); };
        scene1.OnSceneUnload = () => { console.log("Scene 1 unloaded"); };
        scene1.OnSceneLoadAdditive = () => { console.log("Scene 1 loaded additive"); };
        scene1.OnSceneUnloadAdditive = () => { console.log("Scene 1 unloaded additive"); };

        SceneManager.LoadScene(scene1.id);
        SceneManager.LoadScene(scene2.id);
        SceneManager.LoadSceneAdditive(scene1.id);
        SceneManager.UnloadAllAdditiveScenes();

    });

});
