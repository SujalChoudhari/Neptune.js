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

    // New expanded tests
    it("getIdForNewScene returns incrementing IDs", () => {
        const id1 = SceneManager.getIdForNewScene();
        new Scene("Test1");
        const id2 = SceneManager.getIdForNewScene();
        expect(id2).toBeGreaterThan(id1);
    });

    it("removeAllScenes clears all scenes", () => {
        new Scene("Test1");
        new Scene("Test2");
        SceneManager.removeAllScenes();
        expect(SceneManager.GetSceneByName("Test1")).toBeUndefined();
        expect(SceneManager.GetSceneByName("Test2")).toBeUndefined();
    });

    it("GetSceneByName returns undefined for non-existent scene", () => {
        expect(SceneManager.GetSceneByName("NonExistent")).toBeUndefined();
    });

    it("multiple scenes can be created and retrieved", () => {
        const scene1 = new Scene("First");
        const scene2 = new Scene("Second");
        const scene3 = new Scene("Third");

        expect(SceneManager.GetSceneByName("First")).toBe(scene1);
        expect(SceneManager.GetSceneByName("Second")).toBe(scene2);
        expect(SceneManager.GetSceneByName("Third")).toBe(scene3);
    });

    it("scenes have unique IDs", () => {
        const scene1 = new Scene("A");
        const scene2 = new Scene("B");
        expect(scene1.id).not.toBe(scene2.id);
    });
});
