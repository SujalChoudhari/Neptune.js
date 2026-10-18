import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("Triton Tauri packaging is locked and configured for Linux bundles", async () => {
    const config = await readJson("triton/src-tauri/tauri.conf.json");
    const tauriPackage = await readJson("triton/package.json");
    const cargoManifest = await readFile(new URL("triton/src-tauri/Cargo.toml", root), "utf8");
    const cargoLock = await readFile(new URL("triton/src-tauri/Cargo.lock", root), "utf8");
    const workflow = await readFile(new URL(".github/workflows/triton-tauri-build.yml", root), "utf8");

    const cargoVersion = cargoManifest.match(/^version = "([^"]+)"/m)?.[1];
    const lockedCargoVersion = cargoLock.match(/\[\[package\]\]\nname = "app"\nversion = "([^"]+)"/)?.[1];
    assert.ok(cargoVersion, "Cargo manifest should declare the Tauri application version");
    assert.ok(lockedCargoVersion, "Cargo lockfile should pin the Tauri application version");
    assert.equal(tauriPackage.version, config.version);
    assert.equal(config.version, cargoVersion);
    assert.equal(cargoVersion, lockedCargoVersion);
    assert.equal(config.build.frontendDist, "../dist");
    assert.equal(config.build.beforeBuildCommand, "yarn build");
    assert.equal(config.bundle.active, true);
    assert.equal(config.bundle.targets, "all");
    assert.equal(tauriPackage.scripts.build, "tsc -b && vite build");
    assert.ok(tauriPackage.devDependencies["@tauri-apps/cli"]);
    await access(new URL("triton/yarn.lock", root));
    await access(new URL("triton/src-tauri/Cargo.lock", root));
    for (const icon of config.bundle.icon) {
        await access(new URL(`triton/src-tauri/${icon}`, root));
    }

    assert.match(workflow, /yarn install --frozen-lockfile/);
    assert.match(workflow, /yarn tauri build --bundles deb/);
    assert.match(workflow, /libwebkit2gtk-4\.1-dev/);
    assert.match(workflow, /dtolnay\/rust-toolchain@stable/);
});
