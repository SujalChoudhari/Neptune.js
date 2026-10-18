import { describe, it, expect, beforeEach } from "./tester.js";
import { MusicManager, SoundPool, AudioMixer } from "../src/proteus/index.js";

// ============================================
// SoundPool Tests
// ============================================
describe('SoundPool', () => {
    it('creates pool with specified size', () => {
        const pool = new SoundPool("test.wav", 3);
        expect(pool.pool.length).toBe(3);
    });

    it('setVolume updates volume', () => {
        const pool = new SoundPool("test.wav", 2);
        pool.setVolume(0.5);
        expect(pool.volume).toBe(0.5);
    });

    it('setVolume clamps to valid range', () => {
        const pool = new SoundPool("test.wav", 2);
        pool.setVolume(1.5);
        expect(pool.volume).toBe(1);
        pool.setVolume(-0.5);
        expect(pool.volume).toBe(0);
    });
});

// ============================================
// MusicManager Tests
// ============================================
describe('MusicManager', () => {
    let manager;

    beforeEach(() => {
        manager = new MusicManager();
    });

    it('addTrack registers track', () => {
        manager.addTrack("theme", "theme.mp3");
        expect(manager.tracks["theme"]).toBeDefined();
    });

    it('setVolume updates volume', () => {
        manager.setVolume(0.3);
        expect(manager.volume).toBe(0.3);
    });

    it('setVolume clamps to valid range', () => {
        manager.setVolume(2);
        expect(manager.volume).toBe(1);
    });
});

// ============================================
// AudioMixer Tests
// ============================================
describe('AudioMixer', () => {
    let mixer;

    beforeEach(() => {
        mixer = new AudioMixer();
    });

    it('creates mixer with default channels', () => {
        expect(mixer.channels.music).toBeDefined();
        expect(mixer.channels.sfx).toBeDefined();
        expect(mixer.channels.ui).toBeDefined();
    });

    it('setChannelVolume updates channel', () => {
        mixer.setChannelVolume('sfx', 0.5);
        expect(mixer.channels.sfx.volume).toBe(0.5);
    });

    it('setChannelMuted mutes channel', () => {
        mixer.setChannelMuted('music', true);
        expect(mixer.channels.music.muted).toBe(true);
    });

    it('setMasterVolume updates master', () => {
        mixer.setMasterVolume(0.7);
        expect(mixer.masterVolume).toBe(0.7);
    });

    it('_getEffectiveVolume calculates correctly', () => {
        mixer.masterVolume = 0.5;
        mixer.channels.sfx.volume = 0.8;
        expect(mixer._getEffectiveVolume('sfx')).toBe(0.4);
    });

    it('routes data-driven gameplay events to sound effects and music', () => {
        const listeners = new Map();
        const source = {
            on(name, listener) {
                listeners.set(name, listener);
                return () => listeners.delete(name);
            }
        };
        const played = [];
        mixer.playSound = (name, channel) => played.push(["sound", name, channel]);
        mixer.playMusic = (name) => played.push(["music", name]);
        mixer.bindGameplayEvents(source, {
            "enemy-hit": { type: "sound", name: "hit", channel: "sfx" },
            "scene-enter": (event) => ({ type: "music", name: event.theme })
        });
        listeners.get("enemy-hit")({});
        listeners.get("scene-enter")({ theme: "dungeon" });
        expect(played).toEqual([["sound", "hit", "sfx"], ["music", "dungeon"]]);
        mixer.unbindGameplayEvents();
        expect(listeners.size).toBe(0);
    });

    it('validates event binding inputs', () => {
        expect(() => mixer.bindGameplayEvents(null, {})).toThrow();
        expect(() => mixer.bindGameplayEvents({ on() {} }, null)).toThrow();
        expect(() => mixer.bindGameplayEvents({ on() {} }, { hit: 4 })).toThrow();
    });

    it('muted channel returns 0 volume', () => {
        mixer.setChannelMuted('music', true);
        expect(mixer._getEffectiveVolume('music')).toBe(0);
    });
});
