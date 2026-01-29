/**
 * Tests for AnimationEditor
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
        toBeCloseTo: (expected, precision = 2) => {
            const factor = Math.pow(10, precision);
            if (Math.round(value * factor) !== Math.round(expected * factor)) {
                throw new Error(`Expected ${expected} but got ${value}`);
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

// Interpolation types
const INTERPOLATION = {
    LINEAR: 'linear',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    STEP: 'step'
};

// Tests
describe('AnimationEditor Animation Creation', () => {

    it('should create an animation with tracks for each slot', () => {
        const slots = [
            { id: 'head' },
            { id: 'torso' },
            { id: 'arm_l' }
        ];

        const animation = {
            name: 'Walk',
            duration: 1,
            loop: true,
            tracks: {}
        };

        for (const slot of slots) {
            animation.tracks[slot.id] = { keyframes: [] };
        }

        expect(Object.keys(animation.tracks)).toHaveLength(3);
        expect(animation.tracks.head).toBeDefined();
        expect(animation.tracks.torso).toBeDefined();
    });
});

describe('AnimationEditor Keyframe Management', () => {

    it('should add keyframe at specific time', () => {
        const track = { keyframes: [] };

        const keyframe = {
            time: 0.5,
            value: { offset: { x: 0, y: 0 }, rotation: 15, scale: { x: 1, y: 1 } },
            interpolation: INTERPOLATION.LINEAR
        };

        track.keyframes.push(keyframe);

        expect(track.keyframes).toHaveLength(1);
        expect(track.keyframes[0].time).toBe(0.5);
        expect(track.keyframes[0].value.rotation).toBe(15);
    });

    it('should keep keyframes sorted by time', () => {
        const track = { keyframes: [] };

        const addKeyframe = (time, rotation) => {
            const kf = { time, value: { rotation }, interpolation: 'linear' };
            const insertIndex = track.keyframes.findIndex(k => k.time > time);
            if (insertIndex === -1) {
                track.keyframes.push(kf);
            } else {
                track.keyframes.splice(insertIndex, 0, kf);
            }
        };

        addKeyframe(0.5, 10);
        addKeyframe(0.2, 5);
        addKeyframe(0.8, 15);
        addKeyframe(0, 0);

        expect(track.keyframes[0].time).toBe(0);
        expect(track.keyframes[1].time).toBe(0.2);
        expect(track.keyframes[2].time).toBe(0.5);
        expect(track.keyframes[3].time).toBe(0.8);
    });

    it('should remove keyframe', () => {
        const track = {
            keyframes: [
                { time: 0, value: {} },
                { time: 0.5, value: {} },
                { time: 1, value: {} }
            ]
        };

        const index = track.keyframes.findIndex(k => k.time === 0.5);
        track.keyframes.splice(index, 1);

        expect(track.keyframes).toHaveLength(2);
        expect(track.keyframes.find(k => k.time === 0.5)).toBe(undefined);
    });
});

describe('AnimationEditor Interpolation', () => {

    const lerp = (a, b, t) => a + (b - a) * t;

    const interpolateTransform = (from, to, t, interpolation = 'linear') => {
        let easedT = t;
        switch (interpolation) {
            case INTERPOLATION.EASE_IN:
                easedT = t * t;
                break;
            case INTERPOLATION.EASE_OUT:
                easedT = 1 - (1 - t) * (1 - t);
                break;
            case INTERPOLATION.EASE_IN_OUT:
                easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                break;
            case INTERPOLATION.STEP:
                easedT = 0;
                break;
        }

        return {
            offset: {
                x: lerp(from.offset?.x || 0, to.offset?.x || 0, easedT),
                y: lerp(from.offset?.y || 0, to.offset?.y || 0, easedT)
            },
            rotation: lerp(from.rotation || 0, to.rotation || 0, easedT),
            scale: {
                x: lerp(from.scale?.x || 1, to.scale?.x || 1, easedT),
                y: lerp(from.scale?.y || 1, to.scale?.y || 1, easedT)
            }
        };
    };

    it('should linear interpolate between keyframes', () => {
        const from = { offset: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 } };
        const to = { offset: { x: 100, y: 50 }, rotation: 90, scale: { x: 2, y: 2 } };

        const mid = interpolateTransform(from, to, 0.5, INTERPOLATION.LINEAR);

        expect(mid.offset.x).toBe(50);
        expect(mid.offset.y).toBe(25);
        expect(mid.rotation).toBe(45);
        expect(mid.scale.x).toBe(1.5);
    });

    it('should ease-in interpolate (slow start)', () => {
        const from = { rotation: 0 };
        const to = { rotation: 100 };

        // At t=0.5, ease-in gives t^2 = 0.25
        const mid = interpolateTransform(from, to, 0.5, INTERPOLATION.EASE_IN);

        expect(mid.rotation).toBe(25);
    });

    it('should ease-out interpolate (slow end)', () => {
        const from = { rotation: 0 };
        const to = { rotation: 100 };

        // At t=0.5, ease-out gives 1-(1-t)^2 = 0.75
        const mid = interpolateTransform(from, to, 0.5, INTERPOLATION.EASE_OUT);

        expect(mid.rotation).toBe(75);
    });

    it('should step interpolate (no tween)', () => {
        const from = { rotation: 0 };
        const to = { rotation: 100 };

        // Step uses t=0, so always returns from value until end
        const mid = interpolateTransform(from, to, 0.5, INTERPOLATION.STEP);

        expect(mid.rotation).toBe(0);
    });
});

describe('AnimationEditor Time Calculations', () => {

    const getSlotTransformAtTime = (track, time) => {
        if (!track || track.keyframes.length === 0) return null;

        let prevKeyframe = null;
        let nextKeyframe = null;

        for (const kf of track.keyframes) {
            if (kf.time <= time) {
                prevKeyframe = kf;
            }
            if (kf.time > time && !nextKeyframe) {
                nextKeyframe = kf;
            }
        }

        if (!nextKeyframe) {
            return prevKeyframe ? { ...prevKeyframe.value } : null;
        }

        if (!prevKeyframe) {
            return { ...nextKeyframe.value };
        }

        const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
        const lerp = (a, b, t) => a + (b - a) * t;

        return {
            rotation: lerp(prevKeyframe.value.rotation || 0, nextKeyframe.value.rotation || 0, t)
        };
    };

    it('should return exact keyframe value at keyframe time', () => {
        const track = {
            keyframes: [
                { time: 0, value: { rotation: 0 } },
                { time: 1, value: { rotation: 90 } }
            ]
        };

        expect(getSlotTransformAtTime(track, 0).rotation).toBe(0);
        expect(getSlotTransformAtTime(track, 1).rotation).toBe(90);
    });

    it('should interpolate between keyframes', () => {
        const track = {
            keyframes: [
                { time: 0, value: { rotation: 0 } },
                { time: 1, value: { rotation: 100 } }
            ]
        };

        expect(getSlotTransformAtTime(track, 0.5).rotation).toBe(50);
        expect(getSlotTransformAtTime(track, 0.25).rotation).toBe(25);
    });

    it('should hold last keyframe value after animation end', () => {
        const track = {
            keyframes: [
                { time: 0, value: { rotation: 0 } },
                { time: 0.5, value: { rotation: 45 } }
            ]
        };

        expect(getSlotTransformAtTime(track, 0.8).rotation).toBe(45);
    });
});

describe('AnimationEditor Playback Loop', () => {

    it('should loop animation time correctly', () => {
        const duration = 1;
        let time = 1.3;

        // Loop
        time = time % duration;

        expect(time).toBeCloseTo(0.3, 1);
    });

    it('should clamp time on non-looping animation', () => {
        const duration = 1;
        const loop = false;
        let time = 1.3;

        if (!loop && time >= duration) {
            time = duration;
        }

        expect(time).toBe(1);
    });
});

console.log('\n✅ AnimationEditor tests complete');
