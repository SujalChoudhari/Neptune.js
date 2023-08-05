import { describe, it, expect, beforeEach, afterEach } from "./tester.js";
import { Entity, Behaviour, Global, Scene, SceneManager } from "../src/neptune.js";

describe("Behaviour", () => {
    let scene;
    beforeEach(() => {
        scene = new Scene("TestScene");
        SceneManager.LoadScene(scene.id);
    });

    afterEach(() => {
        scene = null;
    });

    it("should be able to add a behaviour", () => {
        const entity = new Entity("TestEntity");
        const behaviour = new Behaviour();
        entity.AddComponent(behaviour);
        expect(entity.components).toContain(behaviour);
    });

    it("can run the Behaviour script", () => {
        const entity = new Entity("TestEntity");
        const behaviour = new Behaviour();
        behaviour.Init = () => { console.log("Init"); };
        behaviour.Update = () => {
            console.log("Update");
            behaviour.Update = () => { };
        };
        entity.AddComponent(behaviour);
        expect(behaviour).toBeInstanceOf(Behaviour);
    });

});