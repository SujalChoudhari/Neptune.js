import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const docsDirectory = join(projectRoot, "docs");
const productContractPath = join(docsDirectory, "PRODUCT-CONTRACT.md");
const jsdocBinary = join(projectRoot, "node_modules", ".bin", "jsdoc");
const productContract = existsSync(productContractPath) ? readFileSync(productContractPath) : null;

// Remove stale pages so deleted or renamed source files cannot remain in the site.
rmSync(docsDirectory, { recursive: true, force: true });
mkdirSync(docsDirectory, { recursive: true });

let result;
try {
  result = spawnSync(
    jsdocBinary,
    ["--configure", "jsdoc.json", "--destination", "docs", "--pedantic"],
    { cwd: projectRoot, stdio: "inherit" },
  );
} finally {
  // PRODUCT-CONTRACT.md is hand-authored and must survive generated API refreshes.
  if (productContract !== null) {
    writeFileSync(productContractPath, productContract);
  }
}

if (result.error) {
  console.error(`Unable to generate documentation: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
