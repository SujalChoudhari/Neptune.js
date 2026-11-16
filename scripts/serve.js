import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const contentTypes = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".npt": "application/json", ".scn": "application/json",
  ".scene": "application/json", ".map": "application/json", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg",
  ".wasm": "application/wasm", ".ico": "image/x-icon"
};
const isOutside = (root, target) => {
  const part = relative(root, target);
  return part === ".." || part.startsWith(".." + sep) || isAbsolute(part);
};
const isPrivate = (root, target) => relative(root, target).split(sep).some(part => part.startsWith("."));

/** Local development preview only; no directory listing or write operations. */
export async function createPreviewServer(directory) {
  const root = await realpath(directory);
  return createServer(async (request, response) => {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      let target = resolve(root, "." + pathname);
      if (isOutside(root, target) || isPrivate(root, target)) { response.writeHead(403).end(); return; }
      target = await realpath(target);
      if ((await stat(target)).isDirectory()) target = await realpath(resolve(target, "index.html"));
      if (isOutside(root, target) || isPrivate(root, target)) { response.writeHead(403).end(); return; }
      const body = await readFile(target);
      response.writeHead(200, {
        "Content-Type": contentTypes[extname(target).toLowerCase()] || "application/octet-stream",
        "Content-Length": body.length,
        "Cache-Control": "no-store"
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      response.writeHead(error instanceof URIError ? 400 : 404).end();
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { port: { type: "string", default: "8000" } } });
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("--port must be an integer from 0 to 65535");
  const server = await createPreviewServer(fileURLToPath(new URL("../", import.meta.url)));
  server.on("error", error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Neptune preview: http://127.0.0.1:${server.address().port}/debug_project/`);
  });
}
