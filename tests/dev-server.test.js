import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createPreviewServer } from "../scripts/serve.js";

test("preview serves modules and restricts files and methods to its root", async t => {
  const parent = await mkdtemp(join(tmpdir(), "neptune-preview-"));
  const root = join(parent, "project");
  await mkdir(root);
  await mkdir(join(root, ".git"));
  await writeFile(join(root, ".git", "config"), "private");
  await writeFile(join(root, "index.html"), "<h1>Neptune</h1>");
  await writeFile(join(root, "main.js"), "export const running = true;");
  await writeFile(join(parent, "outside.txt"), "outside");
  // A directory junction is available without Windows Developer Mode.
  await mkdir(join(parent, "assets-outside"));
  await writeFile(join(parent, "assets-outside", "index.html"), "outside");
  await symlink(join(parent, "assets-outside"), join(root, "linked"), process.platform === "win32" ? "junction" : "dir");
  const server = await createPreviewServer(root);
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(parent, { recursive: true, force: true }); });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  const get = (path, method = "GET") => new Promise((resolve, reject) => {
    const req = request({ hostname: "127.0.0.1", port, path, method }, res => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.end();
  });
  assert.equal((await get("/")).body, "<h1>Neptune</h1>");
  const module = await get("/main.js?v=1");
  assert.equal(module.status, 200);
  assert.match(module.headers["content-type"], /javascript/);
  assert.match(module.body, /export const/);
  assert.equal((await get("/main.js", "HEAD")).body, "");
  assert.equal((await get("/.git/config")).status, 403);
  assert.equal((await get("/..%2foutside.txt")).status, 403);
  assert.equal((await get("/linked/")).status, 403);
  assert.equal((await get("/missing")).status, 404);
  assert.equal((await get("/%zz")).status, 400);
  assert.equal((await get("/main.js", "POST")).status, 405);
});
