import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const contractPath = fileURLToPath(new URL("../docs/PRODUCT-CONTRACT.md", import.meta.url));
const readContract = () => {
    assert.ok(existsSync(contractPath), "M01 product contract must be committed");
    return readFileSync(contractPath, "utf8");
};

test("product contract defines the supported 2D action-RPG scope and exclusions", () => {
    const contract = readContract();
    assert.match(contract, /2D action-RPG/i);
    assert.match(contract, /3D.{0,40}(?:excluded|out of scope)/is);
    assert.match(contract, /multiplayer.{0,40}(?:excluded|out of scope)/is);
    for (const capability of ["maps", "enemies", "combat", "progression", "HTML UI", "save/load"]) {
        assert.ok(contract.toLowerCase().includes(capability.toLowerCase()), `missing capability: ${capability}`);
    }
});

test("movement combines tile-aware navigation and collision with optional real-time play", () => {
    const contract = readContract();
    assert.match(contract, /navigation and collision are tile-aware/i);
    assert.match(contract, /real-time movement and combat are optional/i);
});

test("runtime, editor, and project-data responsibilities are explicit", () => {
    const contract = readContract();
    assert.match(contract, /runtime.{0,80}executes the game/is);
    assert.match(contract, /Triton.{0,100}authoring/is);
    assert.match(contract, /stable (?:serialized )?identifiers/i);
    assert.match(contract, /explicitly versioned project and scene data/i);
});

test("vertical-slice checklist provides observable pass conditions for all six areas", () => {
    const contract = readContract();
    const checklist = contract.split("## First action-RPG vertical-slice checklist")[1] ?? "";
    for (const area of ["maps", "enemies", "combat", "progression", "HTML UI", "save/load"]) {
        assert.ok(checklist.toLowerCase().includes(`- [ ] **${area.toLowerCase()}:**`), `missing checklist item: ${area}`);
    }
    assert.match(checklist, /each item passes only when/i);
});

test("README points readers to the M01 product contract", () => {
    const readmePath = fileURLToPath(new URL("../README.md", import.meta.url));
    const readme = readFileSync(readmePath, "utf8");
    assert.match(readme, /PRODUCT-CONTRACT\.md/i);
});
