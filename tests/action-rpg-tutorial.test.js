import { test } from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const tutorialUrl = new URL("../docs/tutorials/action-rpg.md", import.meta.url);
const projectRoot = new URL("../debug_project/", import.meta.url);

test("action-RPG tutorial points to the playable sample and its real controls", async () => {
    const tutorial = await readFile(tutorialUrl, "utf8");
    const sampleReadme = await readFile(new URL("README.md", projectRoot), "utf8");
    const controller = await readFile(new URL("scripts/playerController.js", projectRoot), "utf8");
    const encounter = await readFile(new URL("scripts/dungeonEncounter.js", projectRoot), "utf8");
    const guide = await readFile(new URL("scripts/townGuide.js", projectRoot), "utf8");
    const portal = await readFile(new URL("scripts/scenePortal.js", projectRoot), "utf8");

    assert.match(tutorial, /debug_project\/README\.md/);
    assert.match(tutorial, /first-game\.md/);
    assert.match(tutorial, /npm test/);
    assert.match(sampleReadme, /debug_project/);
    for (const path of [
        "index.html", "main.js", "scenes/demo.scn", "scenes/demo2.scn",
        "scenes/level1.map", "scenes/level2.map", "assets/player.png", "assets/tileset.png"
    ]) {
        await access(new URL(path, projectRoot));
        assert.ok(tutorial.includes(path), `tutorial should identify ${path}`);
    }
    for (const [code, source] of [
        ["A", controller], ["D", controller], ["SPACE", controller],
        ["E", guide], ["E", portal], ["J", encounter], ["K", encounter],
        ["U", encounter], ["P", encounter], ["S", encounter], ["L", encounter]
    ]) {
        assert.ok(source.includes(`KEY_CODE.${code}`), `sample should implement ${code} control`);
    }
    assert.match(encounter, /new EnemyAI/);
    assert.match(encounter, /new BossAI/);
    assert.match(encounter, /SaveManager/);
});
