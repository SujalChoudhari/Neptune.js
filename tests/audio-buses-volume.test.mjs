import "./setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";

import { AudioBus, AudioBusSystem } from "../src/audio/audioBuses.js";
import * as Proteus from "../src/proteus/index.js";
import * as Neptune from "../src/neptune.js";

test("AUDIO-01 Exports: AudioBus and AudioBusSystem are exported across audioBuses, proteus, and neptune", () => {
    assert.equal(typeof AudioBus, "function");
    assert.equal(typeof AudioBusSystem, "function");

    assert.equal(Proteus.AudioBus, AudioBus);
    assert.equal(Proteus.AudioBusSystem, AudioBusSystem);

    assert.equal(Neptune.AudioBus, AudioBus);
    assert.equal(Neptune.AudioBusSystem, AudioBusSystem);
});

test("AudioBusSystem: default bus hierarchy and composed effective volume", () => {
    const audio = new AudioBusSystem();

    // Defaults: master = 1.0, music = 0.8, sfx = 1.0, ui = 0.9
    assert.equal(audio.getEffectiveVolume("master"), 1.0);
    assert.equal(audio.getEffectiveVolume("music"), 0.8);
    assert.equal(audio.getEffectiveVolume("sfx"), 1.0);
    assert.equal(audio.getEffectiveVolume("ui"), 0.9);

    // Adjust master volume to 0.5
    audio.setVolume("master", 0.5);

    // Effective volumes should compose with master:
    // music: 0.5 * 0.8 = 0.4
    // sfx: 0.5 * 1.0 = 0.5
    // ui: 0.5 * 0.9 = 0.45
    assert.equal(audio.getEffectiveVolume("master"), 0.5);
    assert.equal(audio.getEffectiveVolume("music"), 0.4);
    assert.equal(audio.getEffectiveVolume("sfx"), 0.5);
    assert.equal(audio.getEffectiveVolume("ui"), 0.45);
});

test("AudioBusSystem: handles muted parent edge case", () => {
    const audio = new AudioBusSystem();
    audio.setVolume("master", 0.8);
    audio.setVolume("music", 0.7);
    audio.setVolume("sfx", 0.6);

    // Mute master bus (parent of all standard buses)
    audio.setMuted("master", true);

    // With master muted, ALL descendant buses must report 0.0 effective volume
    assert.equal(audio.isMuted("master"), true);
    assert.equal(audio.isMuted("music"), true);
    assert.equal(audio.isMuted("sfx"), true);

    assert.equal(audio.getEffectiveVolume("master"), 0.0);
    assert.equal(audio.getEffectiveVolume("music"), 0.0);
    assert.equal(audio.getEffectiveVolume("sfx"), 0.0);

    // Unmute master bus
    audio.setMuted("master", false);

    // Effective volumes should immediately recover their previous gains
    assert.equal(Math.round(audio.getEffectiveVolume("music") * 100) / 100, 0.56); // 0.8 * 0.7 = 0.56
    assert.equal(Math.round(audio.getEffectiveVolume("sfx") * 100) / 100, 0.48);   // 0.8 * 0.6 = 0.48
});

test("AudioBusSystem: validates volume inputs and clamps bounds", () => {
    const audio = new AudioBusSystem();

    // Values outside [0, 1] are clamped
    audio.setVolume("sfx", 1.8);
    assert.equal(audio.getBus("sfx").volume, 1.0);

    audio.setVolume("sfx", -0.5);
    assert.equal(audio.getBus("sfx").volume, 0.0);

    // Invalid / non-finite volume throws TypeError
    assert.throws(() => {
        audio.setVolume("sfx", NaN);
    }, /volume must be a finite number/);

    assert.throws(() => {
        audio.setVolume("sfx", "loud");
    }, /volume must be a finite number/);
});

test("AudioBusSystem: settings before unlock and independent preferences persistence", () => {
    const audio = new AudioBusSystem();

    // Player configures audio settings before starting the game / before audio context unlocks
    audio.setVolume("master", 0.6);
    audio.setVolume("music", 0.4);
    audio.setMuted("ui", true);

    const savedPrefs = audio.exportPreferences();
    assert.equal(savedPrefs.master.volume, 0.6);
    assert.equal(savedPrefs.music.volume, 0.4);
    assert.equal(savedPrefs.ui.muted, true);

    // In a fresh session / new instance:
    const freshAudio = new AudioBusSystem();
    freshAudio.importPreferences(savedPrefs);

    assert.equal(freshAudio.getBus("master").volume, 0.6);
    assert.equal(freshAudio.getBus("music").volume, 0.4);
    assert.equal(freshAudio.getBus("ui").muted, true);
    assert.equal(freshAudio.getEffectiveVolume("ui"), 0.0);
});

test("AudioBusSystem: dynamic custom bus creation and change event dispatch", () => {
    const audio = new AudioBusSystem();
    const events = [];

    audio.onBusChanged(e => events.push(e));

    // Create a sub-bus under sfx (e.g. ambient environment sounds)
    const ambient = audio.createBus("ambient", { parent: "sfx", volume: 0.5 });
    assert.equal(ambient.name, "ambient");
    assert.equal(ambient.parent.name, "sfx");

    // Master = 1.0, SFX = 1.0, Ambient = 0.5 -> Effective = 0.5
    assert.equal(audio.getEffectiveVolume("ambient"), 0.5);

    // Set volume on ambient bus
    audio.setVolume("ambient", 0.2);
    assert.equal(events.length, 1);
    assert.equal(events[0].type, "volume");
    assert.equal(events[0].bus, "ambient");
    assert.equal(events[0].effective, 0.2);

    // Mute SFX -> ambient should become effectively 0
    audio.toggleMute("sfx");
    assert.equal(audio.getEffectiveVolume("ambient"), 0.0);
});
