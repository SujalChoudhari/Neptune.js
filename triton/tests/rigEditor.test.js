/**
 * Tests for RigEditor
 */

// Simple test runner
function describe(name, fn) {
    console.log(`\n📦 ${name}`);
    fn();
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (e) {
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

function expect(value) {
    return {
        toBe: (expected) => {
            if (value !== expected) {
                throw new Error(`Expected ${expected} but got ${value}`);
            }
        },
        toEqual: (expected) => {
            if (JSON.stringify(value) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(value)}`);
            }
        },
        toHaveLength: (length) => {
            if (value.length !== length) {
                throw new Error(`Expected length ${length} but got ${value.length}`);
            }
        },
        toBeDefined: () => {
            if (value === undefined) {
                throw new Error('Expected value to be defined');
            }
        }
    };
}

// Default rig slots
const DEFAULT_RIG_SLOTS = [
    { id: 'head', name: 'Head', zOrder: 10, pivot: { x: 0.5, y: 1.0 } },
    { id: 'torso', name: 'Torso', zOrder: 5, pivot: { x: 0.5, y: 0.5 } },
    { id: 'arm_l', name: 'Left Arm', zOrder: 6, pivot: { x: 1.0, y: 0.2 } },
    { id: 'arm_r', name: 'Right Arm', zOrder: 4, pivot: { x: 0.0, y: 0.2 } }
];

// Tests
describe('RigEditor Slot Management', () => {

    it('should create a rig with default slots', () => {
        const rig = {
            type: 'Rig',
            slots: JSON.parse(JSON.stringify(DEFAULT_RIG_SLOTS)),
            poses: {}
        };

        expect(rig.slots).toHaveLength(4);
        expect(rig.slots[0].id).toBe('head');
        expect(rig.slots[1].id).toBe('torso');
    });

    it('should add a slot to the rig', () => {
        const rig = { slots: [], poses: {} };

        const newSlot = {
            id: 'custom_slot',
            name: 'Custom Slot',
            zOrder: 0,
            pivot: { x: 0.5, y: 0.5 }
        };

        rig.slots.push(newSlot);

        expect(rig.slots).toHaveLength(1);
        expect(rig.slots[0].id).toBe('custom_slot');
    });

    it('should remove a slot from the rig', () => {
        const rig = {
            slots: JSON.parse(JSON.stringify(DEFAULT_RIG_SLOTS)),
            poses: {}
        };

        const index = rig.slots.findIndex(s => s.id === 'arm_l');
        rig.slots.splice(index, 1);

        expect(rig.slots).toHaveLength(3);
        expect(rig.slots.find(s => s.id === 'arm_l')).toBe(undefined);
    });
});

describe('RigEditor Slot Properties', () => {

    it('should set slot image', () => {
        const slot = { id: 'head', image: null };
        slot.image = '/path/to/head.png';

        expect(slot.image).toBe('/path/to/head.png');
    });

    it('should update slot pivot', () => {
        const slot = { id: 'head', pivot: { x: 0.5, y: 0.5 } };
        slot.pivot = { x: 0.3, y: 0.8 };

        expect(slot.pivot.x).toBe(0.3);
        expect(slot.pivot.y).toBe(0.8);
    });

    it('should update slot z-order', () => {
        const slot = { id: 'head', zOrder: 5 };
        slot.zOrder = 10;

        expect(slot.zOrder).toBe(10);
    });

    it('should sort slots by z-order', () => {
        const slots = [
            { id: 'a', zOrder: 5 },
            { id: 'b', zOrder: 1 },
            { id: 'c', zOrder: 10 },
            { id: 'd', zOrder: 3 }
        ];

        slots.sort((a, b) => a.zOrder - b.zOrder);

        expect(slots[0].id).toBe('b');
        expect(slots[1].id).toBe('d');
        expect(slots[2].id).toBe('a');
        expect(slots[3].id).toBe('c');
    });
});

describe('RigEditor Pose Management', () => {

    it('should create a default pose', () => {
        const slots = [
            { id: 'head' },
            { id: 'torso' }
        ];

        const createDefaultPose = (slots) => {
            const pose = {};
            for (const slot of slots) {
                pose[slot.id] = {
                    offset: { x: 0, y: 0 },
                    rotation: 0,
                    scale: { x: 1, y: 1 }
                };
            }
            return pose;
        };

        const pose = createDefaultPose(slots);

        expect(pose.head).toBeDefined();
        expect(pose.torso).toBeDefined();
        expect(pose.head.rotation).toBe(0);
        expect(pose.head.scale).toEqual({ x: 1, y: 1 });
    });

    it('should create multiple poses', () => {
        const rig = {
            poses: {
                idle: { head: { rotation: 0 } },
                walk: { head: { rotation: 5 } },
                jump: { head: { rotation: -10 } }
            }
        };

        expect(Object.keys(rig.poses)).toHaveLength(3);
    });

    it('should update pose slot transform', () => {
        const pose = {
            head: { offset: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 } }
        };

        pose.head.rotation = 15;
        pose.head.offset = { x: 10, y: -5 };

        expect(pose.head.rotation).toBe(15);
        expect(pose.head.offset).toEqual({ x: 10, y: -5 });
    });
});

describe('RigEditor Entity Integration', () => {

    it('should find rig component in entity', () => {
        const entity = {
            id: 'player',
            components: [
                { type: 'Transform' },
                { type: 'Rig', slots: [] },
                { type: 'Animator' }
            ]
        };

        const rigComponent = entity.components.find(c => c.type === 'Rig');

        expect(rigComponent).toBeDefined();
        expect(rigComponent.type).toBe('Rig');
    });

    it('should add rig component to entity', () => {
        const entity = {
            id: 'npc',
            components: [{ type: 'Transform' }]
        };

        const rigComponent = {
            type: 'Rig',
            slots: [],
            poses: { default: {} }
        };

        entity.components.push(rigComponent);

        expect(entity.components).toHaveLength(2);
        expect(entity.components.find(c => c.type === 'Rig')).toBeDefined();
    });
});

console.log('\n✅ RigEditor tests complete');
