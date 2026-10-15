import "./setup_mocks.js";
import * as npt from "../src/neptune.js";
import { describe, it, expect } from "./tester.js";


const scene = new npt.Scene("TestScene");
npt.SceneManager.LoadScene(scene.id);
scene.AddComponent(new npt.Sound("Background","https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",true,true));
scene.AddComponent(new npt.Behaviour());
// scene.GetComponent(npt.Behaviour).Init = () => (scene.GetComponent(npt.Sound).Play());


describe("Sound", () => {
    it("rejects missing audio references in sound pools", () => {
        expect(() => new npt.Proteus.SoundPool("", 2)).toThrow(/audio resource reference/);
        expect(() => new npt.Proteus.SoundPool("test.wav", 0)).toThrow(/pool size must be a positive integer/);
    });
});
