import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { ComponentRegistry } from "../src/core/componentRegistry.js";
import { Entity } from "../src/core/entity.js";
import { SceneLoader } from "../src/core/sceneLoader.js";
import { SceneManager } from "../src/core/sceneManager.js";
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

test("SceneLoader binds enter transitions to collision events and transfers actors to named spawns", async () => {
    const destinationData = {
        name: "Destination",
        entities: [{
            name: "Arrival Container",
            children: [{
                name: "Castle Spawn",
                transform: { position: { x: 18, y: -6 } },
                components: [{ type: "SpawnPoint", props: { spawnId: "castle" } }]
            }]
        }]
    };
    globalThis.fetch = async path => {
        assert.equal(path, "levels/destination.scene");
        return jsonResponse(destinationData);
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
    actor.AddComponent(new Transform(new Vector2(2, 3)));
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

    const destination = SceneManager.GetActiveScene();
    assert.equal(destination.name, "Destination");
    assert.equal(source.children.includes(actor), false);
    assert.equal(destination.children.includes(actor), true);
    assert.equal(actor.parent, destination);
    assert.equal(actor.runtimeHealth, 73);
    assert.deepEqual(actor.GetComponent(Transform).position, new Vector2(18, -6));
});

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

test("a missing requested spawn leaves the actor and active scene unchanged", async () => {
    globalThis.fetch = async () => jsonResponse({ name: "No Spawn", entities: [] });
    const source = SceneLoader.parse({ name: "Source", entities: [] });
    const transitionEntity = new Entity("Door");
    const transition = new SceneTransition();
    transition.deserialize({ targetScene: "levels/no-spawn.scene", spawnPoint: "not-here", trigger: "interact" });
    transitionEntity.AddComponent(transition);
    source.AddChild(transitionEntity);

    const actor = new Entity("Player");
    actor.AddComponent(new Transform(new Vector2(4, 5)));
    source.AddChild(actor);
    SceneManager.LoadScene(source.id);

    assert.equal(await transition.Interact(actor), false);
    assert.equal(SceneManager.GetActiveScene(), source);
    assert.equal(source.children.includes(actor), true);
    assert.deepEqual(actor.GetComponent(Transform).position, new Vector2(4, 5));
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
