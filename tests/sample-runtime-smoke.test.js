import "./setup_mocks.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SceneManager } from "../src/core/sceneManager.js";
import { PlayerController } from "../debug_project/scripts/playerController.js";

const sampleRoot = new URL("../debug_project/", import.meta.url);

test("debug sample boots its real scene and tilemap without console errors", async () => {
    const originalFetch = globalThis.fetch;
    const originalError = console.error;
    const errors = [];
    const fetched = [];
    globalThis.fetch = async resource => {
        const url = new URL(resource, sampleRoot);
        fetched.push(url.href);
        try {
            const text = await readFile(fileURLToPath(url), "utf8");
            return { ok: true, status: 200, json: async () => JSON.parse(text) };
        } catch {
            return { ok: false, status: 404, json: async () => null };
        }
    };
    console.error = (...args) => errors.push(args.map(String).join(" "));

    try {
        const project = JSON.parse(await readFile(new URL("project.npt", sampleRoot), "utf8"));
        assert.equal(
            new URL(project.mainScene, sampleRoot).href,
            new URL("scenes/demo.scn", sampleRoot).href,
            "project mainScene should resolve to the bundled sample scene from any checkout location"
        );
        await access(new URL("assets/player.png", sampleRoot));
        await access(new URL("assets/tileset.png", sampleRoot));
        const { ready } = await import("../debug_project/main.js");
        const scene = await ready;

        assert.ok(scene, "sample startup should return the loaded scene");
        assert.equal(scene.name, "Metroidvania Demo");
        assert.equal(SceneManager.GetActiveScene(), scene);
        const gameplay = scene.children.find(entity => entity.name === "Gameplay");
        const player = gameplay?.children.find(entity => entity.name === "Player");
        assert.ok(player, "sample scene should contain its player");
        assert.ok(player.components.some(component => component instanceof PlayerController));
        assert.ok(scene.children.filter(entity => entity.name.startsWith("Tile_")).length > 0,
            "sample tilemap should instantiate tile entities");
        assert.equal(fetched.length, 2, "startup should fetch the scene and its tilemap");
        assert.deepEqual(errors, [], `sample logged console errors: ${errors.join("; ")}`);
    } finally {
        globalThis.fetch = originalFetch;
        console.error = originalError;
        SceneManager.removeAllScenes();
    }
});
