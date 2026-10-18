import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const guideUrl = new URL("../docs/tutorials/save-load.md", import.meta.url);

test("save/load guide documents the implemented persistence APIs and behavior", async () => {
    const guide = await readFile(guideUrl, "utf8");
    const saveManager = await readFile(new URL("../src/core/saveManager.js", import.meta.url), "utf8");
    const storage = await readFile(new URL("../src/core/storage.js", import.meta.url), "utf8");
    const sceneManager = await readFile(new URL("../src/core/sceneManager.js", import.meta.url), "utf8");

    for (const method of ["save", "load", "slots", "remove", "enableAutosave", "autosaveNow", "recover", "disableAutosave"]) {
        assert.ok(saveManager.includes(`${method}(`), `SaveManager should implement ${method}`);
        assert.ok(guide.includes(`${method}(`), `guide should document ${method}`);
    }
    for (const method of ["SaveScene", "LoadScene", "SaveProject", "LoadProject"]) {
        assert.ok(storage.includes(`${method}(`), `Storage should implement ${method}`);
        assert.ok(guide.includes(`${method}(`), `guide should document ${method}`);
    }
    for (const method of ["SerializeProject", "SaveProject", "CloseProject", "OpenProject"]) {
        assert.ok(sceneManager.includes(`${method}(`), `SceneManager should implement ${method}`);
        assert.ok(guide.includes(`${method}(`), `guide should document ${method}`);
    }
    assert.match(guide, /returns `null` when a slot is absent/);
    assert.match(guide, /exactly one/);
    assert.match(guide, /session storage/);
});
