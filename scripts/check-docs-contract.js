import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = join(projectRoot, "docs", "PRODUCT-CONTRACT.md");

const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: projectRoot, stdio: "inherit" });
  if (result.error) {
    console.error(`Unable to run ${command}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

// API pages are generated in the committed docs/ tree; the generator deliberately
// refreshes them. PRODUCT-CONTRACT.md remains hand-authored and is restored.
run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "docs"]);

if (!existsSync(contractPath)) {
  console.error("Documentation generation removed docs/PRODUCT-CONTRACT.md");
  process.exit(1);
}

run(process.execPath, ["--test", "tests/product-contract.test.js", "tests/ui-rotation.test.js"]);
