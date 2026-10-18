import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { SCENE_SCHEMA_VERSION } from "../src/core/scene.js";
import { PROJECT_SCHEMA_VERSION } from "../src/core/storage.js";
import { SaveManager } from "../src/core/saveManager.js";

const root = new URL("../", import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("Unreleased notes document versions and migration requirements", async () => {
    const changelog = await readFile(new URL("CHANGELOG.md", root), "utf8");
    const enginePackage = await readJson("package.json");
    const tritonPackage = await readJson("triton/package.json");

    assert.match(changelog, /^## \[Unreleased\]$/m);
    assert.match(changelog, /^### Release notes$/m);
    assert.match(changelog, /^### Versioning$/m);
    assert.match(changelog, /^### Migration$/m);
    assert.ok(changelog.includes(`engine npm package version remains \`${enginePackage.version}\``));
    assert.ok(changelog.includes(`Triton is a separately versioned desktop app at \`${tritonPackage.version}\``));
    assert.ok(changelog.includes(`Project payloads remain at schema version ${PROJECT_SCHEMA_VERSION}`));
    assert.ok(changelog.includes(`scene payloads remain at schema version ${SCENE_SCHEMA_VERSION}`));
    assert.ok(changelog.includes(`game-save records remain at schema version ${SaveManager.SCHEMA_VERSION}`));
    assert.ok(changelog.includes("No migration is required for these M17 changes."));
    assert.ok(changelog.includes("does not create a tag, publish a package, or assign a release date"));
});
