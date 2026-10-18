import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

export function preserveAuthoredDocs(sourceDirectory, generatedDirectory) {
  const tutorials = join(sourceDirectory, "tutorials");
  if (existsSync(tutorials)) {
    cpSync(tutorials, join(generatedDirectory, "tutorials"), { recursive: true });
  }
}
