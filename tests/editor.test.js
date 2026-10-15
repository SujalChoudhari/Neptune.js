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

    it('resolves projected layer IDs and round-trips mutations into the layer', () => {
        const adapterUrl = pathToFileURL(path.resolve('triton/src/lib/editorGameRunner.ts')).href;
        const script = `
            import { EditorGameRunner } from ${JSON.stringify(adapterUrl)};
            const source = {
                type: 'scene', version: '1.0.0', schemaVersion: 1,
                camera: { zoom: 1 },
                layers: [
                    { id: 'persisted-background', name: 'Background', type: 'image', entities: [] },
                    { id: 'persisted-layer', name: 'Gameplay', type: 'object_layer', entities: [] }
                ]
            };
            const files = new Map();
            EditorGameRunner.openScene(source, 'scenes/layers.scene');
            const hierarchy = {
                root: { children: ['camera-main', 'generated-background', 'generated-layer'] },
                'camera-main': { id: 'camera-main', name: 'Main Camera', type: 'camera', children: [] },
                'generated-background': { id: 'generated-background', name: 'Background', type: 'image', children: [] },
                'generated-layer': { id: 'generated-layer', name: 'Gameplay', type: 'object_layer', children: [] }
            };
            const parentId = EditorGameRunner.resolveHierarchyParentId('generated-layer', hierarchy);
            const created = EditorGameRunner.createEntity(parentId, {
                id: 'layer-child', name: 'Layer Child', type: 'empty',
                components: [{ type: 'Sprite', props: { path: 'layer-child.png' } }]
            });
            await EditorGameRunner.saveScene(async (path, content) => { files.set(path, content); return true; });
            EditorGameRunner.closeScene();
            await EditorGameRunner.reopenScene(async path => files.get(path), 'scenes/layers.scene');
            const layer = EditorGameRunner.currentScene.layers[1];
            console.log(JSON.stringify({ parentId, created, layerId: layer.id, child: layer.entities[0] }));
        `;
        const result = JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '--eval', script], { encoding: 'utf8' }));
        expect(result).toEqual({
            parentId: 'persisted-layer',
            created: true,
            layerId: 'persisted-layer',
            child: {
                id: 'layer-child',
                name: 'Layer Child',
                type: 'empty',
                active: true,
                transform: { pos: { x: 0, y: 0 }, rot: 0, scale: { x: 1, y: 1 } },
                components: [{ type: 'Sprite', props: { path: 'layer-child.png' } }],
                children: []
            }
        });
    });

    it('rejects invalid projected parents and cycles without mutating the scene', () => {
        const adapterUrl = pathToFileURL(path.resolve('triton/src/lib/editorGameRunner.ts')).href;
        const script = `
            import { EditorGameRunner } from ${JSON.stringify(adapterUrl)};
            EditorGameRunner.openScene({
                type: 'scene', version: '1.0.0', schemaVersion: 1,
                layers: [{ id: 'layer-a', type: 'object_layer', entities: [] }],
                entities: [{ id: 'parent', name: 'Parent', type: 'group', children: [{ id: 'child', name: 'Child', type: 'empty', children: [] }] }]
            });
            const before = JSON.stringify(EditorGameRunner.currentScene);
            const invalidParent = EditorGameRunner.resolveHierarchyParentId('unknown-layer', { root: { children: [] }, 'unknown-layer': { type: 'object_layer' } });
            const cycle = EditorGameRunner.moveEntities(['parent'], 'child');
            console.log(JSON.stringify({ invalidParent, cycle, unchanged: before === JSON.stringify(EditorGameRunner.currentScene) }));
        `;
        const result = JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '--eval', script], { encoding: 'utf8' }));
        expect(result).toEqual({ invalidParent: null, cycle: false, unchanged: true });
    });

    it('rejects duplicate move requests without mutating the scene', () => {
        const adapterUrl = pathToFileURL(path.resolve('triton/src/lib/editorGameRunner.ts')).href;
        const script = `
            import { EditorGameRunner } from ${JSON.stringify(adapterUrl)};
            EditorGameRunner.openScene({
                type: 'scene', version: '1.0.0', schemaVersion: 1,
                entities: [
                    { id: 'source', name: 'Source', type: 'group', children: [{ id: 'child', name: 'Child', type: 'empty', children: [] }] },
                    { id: 'target', name: 'Target', type: 'group', children: [] }
                ]
            });
            const before = JSON.stringify(EditorGameRunner.currentScene);
            const duplicate = EditorGameRunner.moveEntities(['child', 'child'], 'target');
            console.log(JSON.stringify({ duplicate, unchanged: before === JSON.stringify(EditorGameRunner.currentScene) }));
        `;
        const result = JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '--eval', script], { encoding: 'utf8' }));
        expect(result).toEqual({ duplicate: false, unchanged: true });
    });

    it('duplicates an entity with fresh IDs and round-trips it through save and reopen', () => {
        const adapterUrl = pathToFileURL(path.resolve('triton/src/lib/editorGameRunner.ts')).href;
        const script = `
            import { EditorGameRunner } from ${JSON.stringify(adapterUrl)};
            const source = {
                type: 'scene', version: '1.0.0', schemaVersion: 1,
                entities: [{
                    id: 'source', name: 'Source', type: 'group', parentId: null,
                    components: [{ id: 'source-component', type: 'Sprite', props: { path: 'hero.png' } }],
                    children: [{
                        id: 'nested-source', name: 'Nested Source', type: 'empty', parentId: 'source',
                        components: [{ id: 'nested-component', type: 'Script', props: { path: 'hero.js' } }], children: []
                    }]
                }]
            };
            const files = new Map();
            EditorGameRunner.openScene(source, 'scenes/main.scene');
            const originalBefore = JSON.stringify(EditorGameRunner.currentScene.entities[0]);
            const duplicate = EditorGameRunner.duplicateEntity('source');
            await EditorGameRunner.saveScene(async (path, content) => { files.set(path, content); return true; });
            EditorGameRunner.closeScene();
            await EditorGameRunner.reopenScene(async path => files.get(path), 'scenes/main.scene');
            const scene = EditorGameRunner.currentScene;
            const original = scene.entities.find(entity => entity.id === 'source');
            const copy = scene.entities.find(entity => entity.id === duplicate.id);
            console.log(JSON.stringify({
                dirtyAfterSave: EditorGameRunner.isDirty,
                duplicateId: copy.id,
                duplicateComponentId: copy.components[0].id,
                nestedDuplicateId: copy.children[0].id,
                nestedDuplicateComponentId: copy.children[0].components[0].id,
                originalUnchanged: JSON.stringify(original) === originalBefore,
                idsAreFresh: copy.id !== original.id && copy.components[0].id !== original.components[0].id && copy.children[0].id !== original.children[0].id && copy.children[0].components[0].id !== original.children[0].components[0].id
            }));
        `;
        const result = JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '--eval', script], { encoding: 'utf8' }));
        expect(result.originalUnchanged).toBe(true);
        expect(result.idsAreFresh).toBe(true);
        expect(result.dirtyAfterSave).toBe(false);
        expect(result.duplicateId).toContain('entity-');
        expect(result.duplicateComponentId).toContain('component-');
        expect(result.nestedDuplicateId).toContain('entity-');
        expect(result.nestedDuplicateComponentId).toContain('component-');
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
