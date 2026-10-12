import { rmSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const docsDirectory = join(projectRoot, "docs");
const jsdocBinary = join(projectRoot, "node_modules", ".bin", "jsdoc");

// Remove stale pages so deleted or renamed source files cannot remain in the site.
rmSync(docsDirectory, { recursive: true, force: true });
mkdirSync(docsDirectory, { recursive: true });

const result = spawnSync(
  jsdocBinary,
  ["--configure", "jsdoc.json", "--destination", "docs", "--pedantic"],
  { cwd: projectRoot, stdio: "inherit" },
);

if (result.error) {
  console.error(`Unable to generate documentation: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
