import { cpSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function preserveAuthoredDocs(sourceDirectory, generatedDirectory) {
  // Root Markdown guides are authored, unlike the replaceable JSDoc HTML.
  // Retain new guides without maintaining a lossy filename allowlist.
  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      cpSync(join(sourceDirectory, entry.name), join(generatedDirectory, entry.name));
    }
  }
  const tutorials = join(sourceDirectory, "tutorials");
  if (existsSync(tutorials)) {
    cpSync(tutorials, join(generatedDirectory, "tutorials"), { recursive: true });
  }
}
