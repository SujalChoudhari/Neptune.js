import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { ComponentRegistry } from "../src/core/componentRegistry.js";
import { Entity } from "../src/core/entity.js";
import { Scene } from "../src/core/scene.js";
import { SceneLoader } from "../src/core/sceneLoader.js";
import { SceneManager } from "../src/core/sceneManager.js";
import { Storage } from "../src/core/storage.js";
import { SceneTransition } from "../src/components/sceneTransition.js";
import { SpawnPoint } from "../src/components/spawnPoint.js";
import { Transform } from "../src/components/transform.js";
import { Vector2 } from "../src/math/vec2.js";
import { CollisionSystem } from "../src/nereid/collisionSystem.js";
import { TriggerCollider } from "../src/nereid/collider.js";

for (const [name, component] of [
    ["Transform", Transform],
    ["TriggerCollider", TriggerCollider],
    ["SceneTransition", SceneTransition],
    ["SpawnPoint", SpawnPoint]
]) {
    if (!ComponentRegistry.has(name)) ComponentRegistry.register(name, component);
}

const originalFetch = globalThis.fetch;
afterEach(() => {
    globalThis.fetch = originalFetch;
    SceneManager.removeAllScenes();
});

function jsonResponse(data, status = 200) {
    return { ok: status >= 200 && status < 300, status, json: async () => data };
}

async function enterSceneAtSpawn(facing) {
    globalThis.fetch = async path => {
        assert.equal(path, "levels/destination.scene");
        return jsonResponse({
            name: "Destination",
            entities: [{
                name: "Arrival Container",
                children: [{
                    name: "Castle Spawn",
                    transform: { position: { x: 18, y: -6 } },
                    components: [{ type: "SpawnPoint", props: { spawnId: "castle", facing } }]
                }]
            }]
        });
    };
    const source = SceneLoader.parse({
        name: "Source",
        entities: [{
            name: "Door",
            components: [
                { type: "TriggerCollider", props: { width: 32, height: 32 } },
                { type: "SceneTransition", props: { targetScene: "levels/destination.scene", spawnPoint: "castle", trigger: "enter" } }
            ]
        }]
    });
    const door = source.children[0];
    const transition = door.components.find(component => component instanceof SceneTransition);
    const actor = new Entity("Player");
    actor.runtimeHealth = 73;
    actor.AddComponent(new Transform(new Vector2(2, 3), 1.75));
    const actorCollider = new TriggerCollider(16, 16);
    actor.AddComponent(actorCollider);
    source.AddChild(actor);
    SceneManager.LoadScene(source.id);

    const collisionSystem = new CollisionSystem();
    collisionSystem.step([
        { collider: door.components.find(component => component instanceof TriggerCollider), x: 0, y: 0, entity: door },
        { collider: actorCollider, x: 0, y: 0, entity: actor }
    ]);
    assert.ok(transition.lastActivation instanceof Promise);
    assert.equal(await transition.lastActivation, true);

    return { source, destination: SceneManager.GetActiveScene(), actor };
}

for (const [facing, rotation] of Object.entries({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 })) {
    test(`enter transition applies ${facing} SpawnPoint facing to the transferred actor`, async () => {
        const { source, destination, actor } = await enterSceneAtSpawn(facing);
        assert.equal(destination.name, "Destination");
        assert.equal(source.children.includes(actor), false);
        assert.equal(destination.children.includes(actor), true);
        assert.equal(actor.parent, destination);
        assert.equal(SceneManager.GetScenes().includes(destination), true, "successful destinations remain registered");
        assert.equal(actor.runtimeHealth, 73);
        assert.deepEqual(actor.GetComponent(Transform).position, new Vector2(18, -6));
        assert.equal(actor.GetComponent(Transform).rotation, rotation);
    });
}

test("interact transitions require explicit activation and deduplicate concurrent loads", async () => {
    let resolveResponse;
    let signalFetchStarted;
    let fetchCount = 0;
    const fetchStarted = new Promise(resolve => { signalFetchStarted = resolve; });
    globalThis.fetch = async () => {
        fetchCount++;
        signalFetchStarted();
        return new Promise(resolve => { resolveResponse = resolve; });
    };

    const source = SceneLoader.parse({
        name: "Interact Source",
        entities: [{ components: [{ type: "SceneTransition", props: { targetScene: "levels/destination.scene", trigger: "interact" } }] }]
    });
    const transition = source.children[0].components.find(component => component instanceof SceneTransition);
    const actor = new Entity("Player");
    source.AddChild(actor);
    SceneManager.LoadScene(source.id);

    assert.equal(await transition.OnTriggerEnter(actor), false);
    assert.equal(fetchCount, 0);
    const first = transition.Interact(actor);
    const duplicate = transition.Interact(actor);
    await fetchStarted;
    assert.equal(fetchCount, 1);
    resolveResponse(jsonResponse({ name: "Destination", entities: [] }));
    assert.equal(await first, true);
    assert.equal(await duplicate, true);
    assert.equal(SceneManager.GetActiveScene().name, "Destination");
});

test("removing a scene transition detaches its runtime trigger listener", async () => {
    let fetchCount = 0;
    globalThis.fetch = async () => {
        fetchCount++;
        return jsonResponse({ name: "Unexpected Destination", entities: [] });
    };
    const source = SceneLoader.parse({
        name: "Source",
        entities: [{ components: [
            { type: "TriggerCollider", props: { width: 32, height: 32 } },
            { type: "SceneTransition", props: { targetScene: "levels/destination.scene", trigger: "enter" } }
        ] }]
    });
    const door = source.children[0];
    const collider = door.GetComponent(TriggerCollider);
    const transition = door.GetComponent(SceneTransition);
    const actor = new Entity("Player");
    door.RemoveComponent(SceneTransition);
    assert.equal(transition.entity, null);
    assert.equal(transition.properties, null);

    collider.emit("enter", { otherEntity: actor });
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(fetchCount, 0);
    assert.equal(SceneManager.GetScenes().length, 1);
    assert.equal(SceneManager.GetActiveScene(), undefined);
});

test("destroying a loaded trigger hierarchy detaches transitions and releases its entities", async () => {
    let fetchCount = 0;
    globalThis.fetch = async () => {
        fetchCount++;
        return jsonResponse({ name: "Unexpected Destination", entities: [] });
    };
    const source = SceneLoader.parse({
        name: "Source",
        entities: [{ components: [
            { type: "TriggerCollider", props: { width: 32, height: 32 } },
            { type: "SceneTransition", props: { targetScene: "levels/destination.scene", trigger: "enter" } }
        ] }]
    });
    const door = source.children[0];
    const collider = door.GetComponent(TriggerCollider);
    const transition = door.GetComponent(SceneTransition);
    SceneManager.LoadScene(source.id);

    door.destroy();
    collider.emit("enter", { otherEntity: new Entity("Player") });
    await Promise.resolve();

    assert.equal(fetchCount, 0);
    assert.equal(source.children.includes(door), false);
    assert.equal(door.parent, null);
    assert.equal(door.components.length, 0);
    assert.equal(transition.properties, null);
    assert.equal(SceneManager.GetActiveScene(), source);
});

test("a missing requested spawn leaves the actor and active scene unchanged", async () => {
    globalThis.fetch = async () => jsonResponse({ name: "No Spawn", entities: [] });
    const source = SceneLoader.parse({ name: "Source", entities: [] });
    const sceneCountBeforeTransition = SceneManager.GetScenes().length;
    const transitionEntity = new Entity("Door");
    const transition = new SceneTransition();
    transition.deserialize({ targetScene: "levels/no-spawn.scene", spawnPoint: "not-here", trigger: "interact" });
    transitionEntity.AddComponent(transition);
    source.AddChild(transitionEntity);

    const actor = new Entity("Player");
    actor.AddComponent(new Transform(new Vector2(4, 5)));
    source.AddChild(actor);
    SceneManager.LoadScene(source.id);
    const discardedSceneId = SceneManager.getIdForNewScene();

    assert.equal(await transition.Interact(actor), false);
    assert.equal(SceneManager.GetActiveScene(), source);
    assert.equal(source.children.includes(actor), true);
    assert.equal(actor.parent, source);
    assert.deepEqual(actor.GetComponent(Transform).position, new Vector2(4, 5));
    assert.deepEqual(SceneManager.GetScenes(), [source], "the rejected destination is not retained in project scenes");
    assert.equal(SceneManager.GetSceneByName("No Spawn"), undefined);
    assert.equal(SceneManager.GetScenes().length, sceneCountBeforeTransition);

    const laterScene = new Scene("Later Scene");
    assert.ok(laterScene.id > discardedSceneId, "discarded destination IDs are not reused");
    assert.equal(SceneManager.GetScene(laterScene.id), laterScene);
});

test("a requested SpawnPoint without a Transform is discarded without changing actor state", async () => {
    globalThis.fetch = async () => jsonResponse({
        name: "Spawn Without Transform",
        entities: [{ components: [{ type: "SpawnPoint", props: { spawnId: "arrival", facing: "down" } }] }]
    });
    const source = SceneLoader.parse({ name: "Source", entities: [] });
    const transition = new SceneTransition();
    transition.deserialize({
        targetScene: "levels/missing-transform.scene",
        spawnPoint: "arrival",
        trigger: "interact"
    });
    const actor = new Entity("Player");
    actor.AddComponent(new Transform(new Vector2(9, 12), 0.25));
    source.AddChild(actor);
    SceneManager.LoadScene(source.id);

    assert.equal(await transition.Interact(actor), false);
    assert.equal(SceneManager.GetActiveScene(), source);
    assert.equal(actor.parent, source);
    assert.deepEqual(
        { x: actor.GetComponent(Transform).position.x, y: actor.GetComponent(Transform).position.y },
        { x: 9, y: 12 }
    );
    assert.equal(actor.GetComponent(Transform).rotation, 0.25);
    assert.deepEqual(SceneManager.GetScenes(), [source]);
    assert.equal(SceneManager.GetSceneByName("Spawn Without Transform"), undefined);
});

test("failed and throwing scene transfers restore the actor and discard the parsed destination", async () => {
    const originalTransfer = SceneManager.TransitionToScene;
    try {
        for (const outcome of ["false", "throw"]) {
            SceneManager.removeAllScenes();
            globalThis.fetch = async () => jsonResponse({
                name: "Destination",
                entities: [{
                    name: "Arrival",
                    transform: { position: { x: 18, y: -6 } },
                    components: [{ type: "SpawnPoint", props: { spawnId: "arrival", facing: "up" } }]
                }]
            });
            const source = SceneLoader.parse({ name: "Source", entities: [] });
            const transition = new SceneTransition();
            transition.deserialize({
                targetScene: "levels/destination.scene",
                spawnPoint: "arrival",
                trigger: "interact"
            });
            const actor = new Entity("Player");
            actor.runtimeHealth = 81;
            actor.AddComponent(new Transform(new Vector2(4, 5), 0.75));
            source.AddChild(actor);
            SceneManager.LoadScene(source.id);
            SceneManager.TransitionToScene = () => {
                if (outcome === "throw") throw new Error("synthetic transfer failure");
                return false;
            };

            if (outcome === "throw") {
                await assert.rejects(transition.Interact(actor), /synthetic transfer failure/);
            } else {
                assert.equal(await transition.Interact(actor), false);
            }
            assert.equal(SceneManager.GetActiveScene(), source);
            assert.equal(actor.parent, source);
            assert.equal(source.children.includes(actor), true);
            assert.deepEqual(
                { x: actor.GetComponent(Transform).position.x, y: actor.GetComponent(Transform).position.y },
                { x: 4, y: 5 }
            );
            assert.equal(actor.GetComponent(Transform).rotation, 0.75);
            assert.equal(actor.runtimeHealth, 81);
            assert.deepEqual(SceneManager.GetScenes(), [source]);
            assert.equal(SceneManager.GetSceneByName("Destination"), undefined);
        }
    } finally {
        SceneManager.TransitionToScene = originalTransfer;
    }
});

test("a transition without a named spawn preserves the actor's existing transform", async () => {
    globalThis.fetch = async () => jsonResponse({ name: "Destination", entities: [] });
    const source = SceneLoader.parse({
        name: "Source",
        entities: [{ components: [{ type: "SceneTransition", props: { targetScene: "levels/destination.scene", trigger: "interact" } }] }]
    });
    const transition = source.children[0].components.find(component => component instanceof SceneTransition);
    const actor = new Entity("Player");
    actor.AddComponent(new Transform(new Vector2(3, 4), 0.375));
    source.AddChild(actor);
    SceneManager.LoadScene(source.id);

    assert.equal(await transition.Interact(actor), true);
    assert.equal(SceneManager.GetActiveScene().children.includes(actor), true);
    assert.deepEqual(actor.GetComponent(Transform).position, new Vector2(3, 4));
    assert.equal(actor.GetComponent(Transform).rotation, 0.375);
});

test("empty destination configuration and invalid actors do not load a scene", async () => {
    let fetchCount = 0;
    globalThis.fetch = async () => {
        fetchCount++;
        return jsonResponse({ name: "Unexpected", entities: [] });
    };
    const transition = new SceneTransition();
    transition.deserialize({ targetScene: "", trigger: "interact" });
    assert.equal(await transition.Interact(new Entity("Player")), false);
    assert.equal(await transition.Interact(null), false);
    assert.equal(fetchCount, 0);
});

test("SceneLoader discards scenes when synchronous layer parsing throws", () => {
    const source = SceneLoader.parse({ name: "Stable Source", entities: [] });
    const scenesBefore = SceneManager.GetScenes();
    assert.throws(
        () => SceneLoader.parse({ name: "Broken Layer", layers: [null] }),
        /Invalid scene layer definition/
    );
    assert.deepEqual(SceneManager.GetScenes(), scenesBefore);
    assert.equal(SceneManager.GetSceneByName("Broken Layer"), undefined);
    assert.equal(SceneManager.GetScene(source.id), source);
});

test("SceneLoader discards scenes when asynchronous tilemap loading rejects", async () => {
    globalThis.fetch = async () => jsonResponse({}, 404);
    const source = SceneLoader.parse({ name: "Stable Source", entities: [] });
    const scenesBefore = SceneManager.GetScenes();
    const pendingScene = SceneLoader.parse({
        name: "Broken Tilemap Scene",
        layers: [{ type: "tilemap", src: "maps/missing.map" }]
    });
    await assert.rejects(pendingScene, /Failed to load tilemap/);
    assert.deepEqual(SceneManager.GetScenes(), scenesBefore);
    assert.equal(SceneManager.GetSceneByName("Broken Tilemap Scene"), undefined);
    assert.equal(SceneManager.GetScene(source.id), source);
});

test("failed editor-authored destination resource loads preserve the active source actor", async () => {
    globalThis.fetch = async path => path === "levels/broken.scene"
        ? jsonResponse({ name: "Broken Destination", layers: [{ type: "tilemap", src: "maps/missing.map" }] })
        : jsonResponse({}, 404);
    const source = SceneLoader.parse({ name: "Source", entities: [] });
    const transition = new SceneTransition();
    transition.deserialize({
        targetScene: "levels/broken.scene",
        trigger: "interact"
    });
    const actor = new Entity("Player");
    actor.AddComponent(new Transform(new Vector2(7, 11), 0.5));
    source.AddChild(actor);
    SceneManager.LoadScene(source.id);

    await assert.rejects(transition.Interact(actor), /Failed to load tilemap/);
    assert.equal(SceneManager.GetActiveScene(), source);
    assert.equal(actor.parent, source);
    assert.deepEqual(
        { x: actor.GetComponent(Transform).position.x, y: actor.GetComponent(Transform).position.y },
        { x: 7, y: 11 }
    );
    assert.equal(actor.GetComponent(Transform).rotation, 0.5);
    assert.deepEqual(SceneManager.GetScenes(), [source]);
    assert.equal(SceneManager.GetSceneByName("Broken Destination"), undefined);
});

test("failed project opening removes scenes parsed earlier in the same attempt", async () => {
    const key = "test-project-open-rollback";
    Storage.SaveProject(key, {
        name: "Broken Project",
        scenes: [
            { id: "first", name: "First Scene", entities: [] },
            { id: "broken", name: "Broken Scene", layers: [null] }
        ]
    });

    try {
        await assert.rejects(SceneManager.OpenProject(key), /Invalid scene layer definition/);
        assert.deepEqual(SceneManager.GetScenes(), []);
        assert.equal(SceneManager.GetSceneByName("First Scene"), undefined);
    } finally {
        Storage.Remove(key);
    }
});

test("successful project opening replaces the current project with every parsed scene exactly once", async () => {
    const key = "test-project-open-success";
    const currentScene = SceneLoader.parse({ id: "current", name: "Current Project Scene", entities: [] });
    SceneManager.LoadScene(currentScene.id);
    Storage.SaveProject(key, {
        name: "Valid Project",
        scenes: [
            { id: "one", name: "First Scene", entities: [] },
            { id: "two", name: "Second Scene", entities: [] }
        ]
    });

    try {
        const opened = await SceneManager.OpenProject(key);
        assert.deepEqual(opened.scenes.map(scene => scene.name), ["First Scene", "Second Scene"]);
        assert.deepEqual(opened.scenes.map(scene => scene.id), ["one", "two"]);
        assert.equal(SceneManager.GetScenes().length, 2);
        assert.deepEqual(SceneManager.GetScenes(), opened.scenes);
        assert.equal(SceneManager.GetScene(currentScene.id), undefined);
        assert.equal(SceneManager.GetActiveScene(), undefined);
    } finally {
        Storage.Remove(key);
    }
});

test("failed project opening preserves the currently active project", async () => {
    const key = "test-project-open-preserve-current";
    const currentScene = SceneLoader.parse({ id: "current", name: "Current Project Scene", entities: [] });
    SceneManager.LoadScene(currentScene.id);
    Storage.SaveProject(key, {
        name: "Broken Replacement",
        scenes: [
            { id: "replacement-first", name: "Replacement First", entities: [] },
            { id: "replacement-broken", name: "Replacement Broken", layers: [null] }
        ]
    });

    try {
        await assert.rejects(SceneManager.OpenProject(key), /Invalid scene layer definition/);
        assert.deepEqual(SceneManager.GetScenes(), [currentScene]);
        assert.equal(SceneManager.GetActiveScene(), currentScene);
    } finally {
        Storage.Remove(key);
    }
});

test("failed asynchronous project resources preserve the currently active project", async () => {
    const key = "test-project-open-preserve-current-resource-failure";
    const currentScene = SceneLoader.parse({ id: "current", name: "Current Project Scene", entities: [] });
    SceneManager.LoadScene(currentScene.id);
    globalThis.fetch = async path => {
        assert.equal(path, "maps/missing.map");
        return jsonResponse({}, 404);
    };
    Storage.SaveProject(key, {
        name: "Broken Resource Replacement",
        scenes: [
            { id: "replacement-first", name: "Replacement First", entities: [] },
            { id: "replacement-broken", name: "Replacement Broken", layers: [{ type: "tilemap", src: "maps/missing.map" }] }
        ]
    });

    try {
        await assert.rejects(SceneManager.OpenProject(key), /Failed to load tilemap/);
        assert.deepEqual(SceneManager.GetScenes(), [currentScene]);
        assert.equal(SceneManager.GetActiveScene(), currentScene);
    } finally {
        Storage.Remove(key);
    }
});
