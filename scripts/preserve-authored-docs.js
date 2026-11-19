import { cpSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function preserveAuthoredDocs(sourceDirectory, generatedDirectory) {
  // Root Markdown guides and authored demo assets survive generated API refreshes.
  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (entry.isFile() && (entry.name.endsWith(".md") || (entry.name.endsWith(".html") && entry.name.startsWith("demo")))) {
      cpSync(join(sourceDirectory, entry.name), join(generatedDirectory, entry.name));
    }
  }
  const tutorials = join(sourceDirectory, "tutorials");
  if (existsSync(tutorials)) {
    cpSync(tutorials, join(generatedDirectory, "tutorials"), { recursive: true });
  }
  const demoDir = join(sourceDirectory, "demo");
  if (existsSync(demoDir)) {
    cpSync(demoDir, join(generatedDirectory, "demo"), { recursive: true });
  }
}
