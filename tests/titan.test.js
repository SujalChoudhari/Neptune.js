import { describe, it, expect, beforeEach } from "./tester.js";
import { Entity, Component, Transform, Vector2 } from "../src/neptune.js";
import { Pose, Animation, Rig, Animator } from "../src/titan/index.js";

// ============================================
// Pose Tests
// ============================================
describe('Pose', () => {
    it('creates an empty pose', () => {
        const pose = new Pose();
        expect(pose.getLimbNames().length).toBe(0);
    });

    it('creates pose with limb data', () => {
        const pose = new Pose({
            "LegL": { rotation: -0.3 },
            "LegR": { rotation: 0.3 }
        });
        expect(pose.getLimbNames().length).toBe(2);
        expect(pose.hasLimb("LegL")).toBe(true);
        expect(pose.hasLimb("LegR")).toBe(true);
    });

    it('getLimb returns limb data', () => {
        const pose = new Pose({
            "Arm": { rotation: 0.5, position: { x: 1, y: 2 } }
        });
        const limb = pose.getLimb("Arm");
        expect(limb.rotation).toBe(0.5);
        expect(limb.position.x).toBe(1);
        expect(limb.position.y).toBe(2);
    });

    it('getLimb returns null for unknown limb', () => {
        const pose = new Pose();
        expect(pose.getLimb("Unknown")).toBe(null);
    });

    it('Pose.Lerp interpolates rotation', () => {
        const poseA = new Pose({ "Leg": { rotation: 0 } });
        const poseB = new Pose({ "Leg": { rotation: 1 } });
        const result = Pose.Lerp(poseA, poseB, 0.5);
        expect(result.getLimb("Leg").rotation).toBeCloseTo(0.5, 5);
    });

    it('Pose.Lerp interpolates position', () => {
        const poseA = new Pose({ "Arm": { rotation: 0, position: { x: 0, y: 0 } } });
        const poseB = new Pose({ "Arm": { rotation: 0, position: { x: 10, y: 20 } } });
        const result = Pose.Lerp(poseA, poseB, 0.5);
        expect(result.getLimb("Arm").position.x).toBeCloseTo(5, 5);
        expect(result.getLimb("Arm").position.y).toBeCloseTo(10, 5);
    });

    it('Pose.Lerp handles missing limbs', () => {
        const poseA = new Pose({ "LegL": { rotation: 0.3 } });
        const poseB = new Pose({ "LegR": { rotation: -0.3 } });
        const result = Pose.Lerp(poseA, poseB, 0.5);
        expect(result.hasLimb("LegL")).toBe(true);
        expect(result.hasLimb("LegR")).toBe(true);
    });
});

// ============================================
// Animation Tests
// ============================================
describe('Animation', () => {
    let anim;

    beforeEach(() => {
        anim = new Animation("walk", true);
    });

    it('creates animation with name and loop', () => {
        expect(anim.name).toBe("walk");
        expect(anim.loop).toBe(true);
    });

    it('addKeyframe adds and sorts keyframes', () => {
        const pose1 = new Pose({ "Leg": { rotation: 0 } });
        const pose2 = new Pose({ "Leg": { rotation: 1 } });

        anim.addKeyframe(0.5, pose2);
        anim.addKeyframe(0, pose1);

        expect(anim.keyframes.length).toBe(2);
        expect(anim.keyframes[0].time).toBe(0);
        expect(anim.keyframes[1].time).toBe(0.5);
    });

    it('duration updates with keyframes', () => {
        anim.addKeyframe(0, new Pose());
        anim.addKeyframe(1.5, new Pose());
        expect(anim.duration).toBe(1.5);
    });

    it('getPoseAtTime returns single keyframe pose', () => {
        const pose = new Pose({ "Arm": { rotation: 0.5 } });
        anim.addKeyframe(0, pose);
        const result = anim.getPoseAtTime(0);
        expect(result.getLimb("Arm").rotation).toBe(0.5);
    });

    it('getPoseAtTime interpolates between keyframes', () => {
        anim.addKeyframe(0, new Pose({ "Leg": { rotation: 0 } }));
        anim.addKeyframe(1, new Pose({ "Leg": { rotation: 1 } }));

        const result = anim.getPoseAtTime(0.5);
        expect(result.getLimb("Leg").rotation).toBeCloseTo(0.5, 5);
    });

    it('getPoseAtTime loops correctly', () => {
        anim.addKeyframe(0, new Pose({ "Leg": { rotation: 0 } }));
        anim.addKeyframe(1, new Pose({ "Leg": { rotation: 1 } }));

        // Time 1.5 should wrap to 0.5
        const result = anim.getPoseAtTime(1.5);
        expect(result.getLimb("Leg").rotation).toBeCloseTo(0.5, 5);
    });

    it('Animation.fromJSON creates animation from data', () => {
        const data = {
            name: "test",
            loop: false,
            frames: [
                { time: 0, limbs: { "Arm": { rotation: 0 } } },
                { time: 0.5, limbs: { "Arm": { rotation: 1 } } }
            ]
        };

        const fromJson = Animation.fromJSON(data);
        expect(fromJson.name).toBe("test");
        expect(fromJson.loop).toBe(false);
        expect(fromJson.keyframes.length).toBe(2);
    });
});

// ============================================
// Rig Tests
// ============================================
describe('Rig', () => {
    let rig;

    beforeEach(() => {
        rig = new Rig();
    });

    it('creates empty rig', () => {
        expect(rig.getLimbNames().length).toBe(0);
    });

    it('addLimb registers limb entity', () => {
        const entity = new Entity("TestLimb");
        rig.addLimb("Arm", entity);
        expect(rig.getLimb("Arm")).toBe(entity);
    });

    it('getLimb returns null for unknown limb', () => {
        expect(rig.getLimb("Unknown")).toBe(null);
    });

    it('applyPose sets limb transforms', () => {
        const limbEntity = new Entity("TestLimb");
        limbEntity.AddComponent(new Transform());
        rig.addLimb("Arm", limbEntity);

        const pose = new Pose({ "Arm": { rotation: 0.5 } });
        rig.applyPose(pose);

        expect(limbEntity.GetComponent(Transform).rotation).toBe(0.5);
    });
});

// ============================================
// Animator Tests
// ============================================
describe('Animator', () => {
    let animator;
    let anim;

    beforeEach(() => {
        animator = new Animator();
        anim = new Animation("idle", true);
        anim.addKeyframe(0, new Pose({ "Arm": { rotation: 0 } }));
        anim.addKeyframe(1, new Pose({ "Arm": { rotation: 1 } }));
    });

    it('addAnimation registers animation', () => {
        animator.addAnimation(anim);
        expect(animator.getAnimation("idle")).toBe(anim);
    });

    it('play sets current animation', () => {
        animator.addAnimation(anim);
        animator.play("idle");
        expect(animator.playing).toBe(true);
        expect(animator.currentAnimation).toBe(anim);
    });

    it('stop stops playback', () => {
        animator.addAnimation(anim);
        animator.play("idle");
        animator.stop();
        expect(animator.playing).toBe(false);
    });

    it('isPlaying returns correct state', () => {
        animator.addAnimation(anim);
        expect(animator.isPlaying("idle")).toBe(false);
        animator.play("idle");
        expect(animator.isPlaying("idle")).toBe(true);
    });

    it('update advances animation time', () => {
        // Create entity with rig and animator
        const root = new Entity("Character");
        const armEntity = new Entity("Arm");
        armEntity.AddComponent(new Transform());
        root.AddChild(armEntity);

        const testRig = new Rig();
        testRig.addLimb("Arm", armEntity);
        root.AddComponent(testRig);
        root.AddComponent(animator);

        animator.addAnimation(anim);
        animator.play("idle");
        animator.update(0.5);

        // Check rotation was applied
        const transform = armEntity.GetComponent(Transform);
        expect(transform.rotation).toBeCloseTo(0.5, 3);
    });
});
