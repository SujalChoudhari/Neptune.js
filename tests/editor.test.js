import { describe, it, expect, beforeEach } from "./tester.js";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

// ============================================
// Editor Project Tests
// ============================================
describe('Editor Project Structure', () => {
    let project;

    beforeEach(() => {
        project = {
            name: 'Test Project',
            scenes: [],
            characters: [],
            enemies: [],
            cutscenes: [],
            settings: {}
        };
    });

    it('creates empty project with required fields', () => {
        expect(project.name).toBe('Test Project');
        expect(Array.isArray(project.scenes)).toBe(true);
        expect(Array.isArray(project.characters)).toBe(true);
        expect(Array.isArray(project.enemies)).toBe(true);
        expect(Array.isArray(project.cutscenes)).toBe(true);
    });
});

describe('Triton scene mutation round-trip', () => {
    it('preserves created component data and a reparented entity through save and reopen', () => {
        const adapterUrl = pathToFileURL(path.resolve('triton/src/lib/editorGameRunner.ts')).href;
        const script = `
            import { EditorGameRunner } from ${JSON.stringify(adapterUrl)};
            const source = {
                type: 'scene', version: '1.0.0', schemaVersion: 1,
                entities: [
                    { id: 'parent-a', name: 'Parent A', type: 'group', children: [], components: [] },
                    { id: 'parent-b', name: 'Parent B', type: 'group', children: [], components: [] }
                ]
            };
            const files = new Map();
            EditorGameRunner.openScene(source, 'scenes/main.scene');
            EditorGameRunner.createEntity('parent-a', {
                id: 'created-child', name: 'Created Child', type: 'empty',
                components: [{ type: 'Sprite', props: { path: 'hero.png', width: 32 } }]
            });
            EditorGameRunner.moveEntities(['created-child'], 'parent-b');
            await EditorGameRunner.saveScene(async (path, content) => { files.set(path, content); return true; });
            EditorGameRunner.closeScene();
            await EditorGameRunner.reopenScene(async path => files.get(path), 'scenes/main.scene');
            const scene = EditorGameRunner.currentScene;
            const parent = scene.entities.find(entity => entity.id === 'parent-b');
            const child = parent.children.find(entity => entity.id === 'created-child');
            console.log(JSON.stringify({ parent: parent.id, child: child.id, component: child.components[0] }));
        `;
        const result = JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '--eval', script], { encoding: 'utf8' }));
        expect(result).toEqual({
            parent: 'parent-b',
            child: 'created-child',
            component: { type: 'Sprite', props: { path: 'hero.png', width: 32 } }
        });
    });
});

// ============================================
// Scene Structure Tests
// ============================================
describe('Scene Structure', () => {
    it('creates scene with layers', () => {
        const scene = {
            id: 'scene_1',
            name: 'Test Scene',
            layers: [
                { id: 'main', type: 'tilemap', scrollFactor: 1 },
                { id: 'bg', type: 'image', scrollFactor: 0.5 }
            ],
            width: 50,
            height: 30,
            tileSize: 32
        };

        expect(scene.layers.length).toBe(2);
        expect(scene.layers[0].type).toBe('tilemap');
        expect(scene.layers[1].type).toBe('image');
    });

    it('layer scrollFactor defines parallax speed', () => {
        const layer = { id: 'parallax', type: 'image', scrollFactor: 0.5 };
        expect(layer.scrollFactor).toBeLessThan(1);
    });
});

// ============================================
// Character Structure Tests
// ============================================
describe('Character Structure', () => {
    it('creates NPC with dialogue', () => {
        const npc = {
            id: 'char_1',
            name: 'Elder',
            behavior: 'stationary',
            dialogue: {
                nodes: [
                    { id: 'start', text: 'Hello!', choices: [] }
                ]
            }
        };

        expect(npc.name).toBe('Elder');
        expect(npc.dialogue.nodes.length).toBe(1);
    });

    it('supports patrol behavior', () => {
        const npc = {
            id: 'char_2',
            name: 'Guard',
            behavior: 'patrol',
            patrolPath: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
        };

        expect(npc.behavior).toBe('patrol');
        expect(npc.patrolPath.length).toBe(2);
    });
});

// ============================================
// Enemy Structure Tests
// ============================================
describe('Enemy Structure', () => {
    it('creates aggressive enemy', () => {
        const enemy = {
            id: 'enemy_1',
            name: 'Goblin',
            type: 'aggressive',
            stats: { health: 50, attack: 10, defense: 5 },
            detectionRange: 200
        };

        expect(enemy.type).toBe('aggressive');
        expect(enemy.stats.health).toBe(50);
    });

    it('boss enemy has phases', () => {
        const boss = {
            id: 'boss_1',
            name: 'Dragon',
            type: 'boss',
            phases: [
                { threshold: 0.75, patterns: ['fire_breath'] },
                { threshold: 0.5, patterns: ['tail_swipe'] }
            ]
        };

        expect(boss.type).toBe('boss');
        expect(boss.phases.length).toBe(2);
    });
});

// ============================================
// Cutscene Structure Tests
// ============================================
describe('Cutscene Structure', () => {
    it('creates cutscene with actions', () => {
        const cutscene = {
            id: 'cs_1',
            name: 'Intro',
            duration: 10,
            actions: [
                { type: 'dialogue', startTime: 0, duration: 3 },
                { type: 'camera_pan', startTime: 3, duration: 2 }
            ]
        };

        expect(cutscene.actions.length).toBe(2);
        expect(cutscene.duration).toBe(10);
    });

    it('action types are valid', () => {
        const validTypes = ['dialogue', 'camera_pan', 'camera_shake', 'fade', 'wait', 'play_sound'];
        const action = { type: 'dialogue' };
        expect(validTypes.includes(action.type)).toBe(true);
    });
});

// ============================================
// Transition Structure Tests
// ============================================
describe('Transition Structure', () => {
    it('creates walk-through transition', () => {
        const transition = {
            id: 'trans_1',
            targetSceneId: 'scene_2',
            type: 'walk',
            zone: { x: 0, y: 0, width: 64, height: 64 }
        };

        expect(transition.type).toBe('walk');
        expect(transition.zone.width).toBe(64);
    });

    it('creates door/portal transition', () => {
        const transition = {
            id: 'trans_2',
            targetSceneId: 'scene_3',
            type: 'door'
        };

        expect(transition.type).toBe('door');
    });
});
