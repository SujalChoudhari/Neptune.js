import "./setup_mocks.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { application, SceneManager, Shape, Transform } from "../src/neptune.js";

const exampleRoot = new URL("../examples/first-game/", import.meta.url);

test("first-game example loads its documented scene from a clean checkout", async () => {
    const html = await readFile(new URL("index.html", exampleRoot), "utf8");
    const tutorial = await readFile(new URL("../docs/tutorials/first-game.md", import.meta.url), "utf8");
    assert.match(html, /src="\.\/main\.js"/);
    assert.match(tutorial, /python3 -m http\.server 8000/);
    assert.match(tutorial, /examples\/first-game/);

    const { scene, player } = await import("../examples/first-game/main.js");
    assert.equal(scene.name, "First Game");
    assert.equal(SceneManager.GetSceneByName("First Game"), scene);
    assert.equal(application.clearColor.toString(), "rgba(23,33,43,1)");

    const floor = scene.children.find(entity => entity.name === "Floor");
    assert.ok(floor);
    assert.ok(floor.GetComponent(Transform));
    assert.ok(floor.GetComponent(Shape));
    assert.ok(player.GetComponent(Transform));
    assert.ok(player.GetComponent(Shape));
    assert.equal(player.parent, scene);

    SceneManager.removeAllScenes();
});
