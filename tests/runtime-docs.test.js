import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const guideUrl = new URL("../docs/tutorials/runtime.md", import.meta.url);

test("runtime guide documents the public entity, scene, and application APIs", async () => {
    const guide = await readFile(guideUrl, "utf8");
    const entry = await readFile(new URL("../src/neptune.js", import.meta.url), "utf8");
    const entity = await readFile(new URL("../src/core/entity.js", import.meta.url), "utf8");
    const scene = await readFile(new URL("../src/core/scene.js", import.meta.url), "utf8");
    const sceneManager = await readFile(new URL("../src/core/sceneManager.js", import.meta.url), "utf8");
    const application = await readFile(new URL("../src/core/application.js", import.meta.url), "utf8");
    const registry = await readFile(new URL("../src/core/componentRegistry.js", import.meta.url), "utf8");

    for (const name of ["Entity", "Transform", "Vector2", "Scene", "SceneManager", "SceneLoader", "ComponentRegistry", "application", "Behaviour"]) {
        assert.ok(entry.includes(name), `entry point should export ${name}`);
        assert.ok(guide.includes(name), `guide should document ${name}`);
    }
    for (const [source, methods] of [
        [entity, ["AddComponent", "GetComponent", "HasComponent", "RemoveComponent", "AddChild", "AddChildren", "GetChildren", "GetParent", "GetComponentsInChildren", "serialize"]],
        [scene, ["OnSceneLoad", "OnSceneUnload", "serialize"]],
        [sceneManager, ["LoadScene", "LoadSceneAdditive", "UnloadAllAdditiveScenes", "TransitionToScene"]],
        [application, ["start()", "pause()", "resume()", "loadScene(pathOrData)"]],
        [registry, ["register", "get", "has", "nameOf", "create"]]
    ]) {
        for (const method of methods) {
            assert.ok(source.includes(method), `implementation should contain ${method}`);
            assert.ok(guide.includes(method), `guide should document ${method}`);
        }
    }
    assert.match(guide, /clamped to at most 0\.1 seconds/);
    assert.match(guide, /continues rendering/);
});
