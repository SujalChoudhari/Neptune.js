import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { preserveAuthoredDocs } from "../scripts/preserve-authored-docs.js";

test("docs generation preserves authored tutorials in its replacement output", t => {
    const root = mkdtempSync(join(tmpdir(), "neptune-docs-preservation-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const source = join(root, "docs");
    const generated = join(root, "generated");
    mkdirSync(join(source, "tutorials"), { recursive: true });
    mkdirSync(generated);
    writeFileSync(join(source, "tutorials", "first-game.md"), "# First game\n");
    writeFileSync(join(source, "PRODUCT-CONTRACT.md"), "contract stays separately handled\n");

    preserveAuthoredDocs(source, generated);

    assert.equal(readFileSync(join(generated, "tutorials", "first-game.md"), "utf8"), "# First game\n");
});
