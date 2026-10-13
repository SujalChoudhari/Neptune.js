import {
  existsSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const docsDirectory = join(projectRoot, "docs");
const productContractPath = join(docsDirectory, "PRODUCT-CONTRACT.md");
const jsdocBinary = join(projectRoot, "node_modules", ".bin", "jsdoc");
const productContract = existsSync(productContractPath) ? readFileSync(productContractPath) : null;
const temporaryDirectory = mkdtempSync(join(projectRoot, ".docs-generation-"));

let replacedDocumentation = false;
try {
  // Generate outside docs/ so a failed run cannot leave the committed site partial.
  const result = spawnSync(
    jsdocBinary,
    ["--configure", "jsdoc.json", "--destination", temporaryDirectory, "--pedantic"],
    { cwd: projectRoot, stdio: "inherit" },
  );

  if (result.error) {
    throw new Error(`Unable to generate documentation: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`Documentation generation failed with exit code ${result.status ?? 1}`);
  }

  // PRODUCT-CONTRACT.md is hand-authored and must survive generated API refreshes.
  if (productContract !== null) {
    writeFileSync(join(temporaryDirectory, "PRODUCT-CONTRACT.md"), productContract);
  }

  // Replace the old tree only after JSDoc has produced a complete result.
  rmSync(docsDirectory, { recursive: true, force: true });
  renameSync(temporaryDirectory, docsDirectory);
  replacedDocumentation = true;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (!replacedDocumentation) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
