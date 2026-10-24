#!/usr/bin/env node
/*
 * 本地预览服务器（零依赖）/ Zero-dependency local preview server
 * 用法 Usage:  node tools/serve.mjs [port]
 */
import { createServer } from "node:http";
import { stat, readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const START_PORT = Number(process.argv[2] || process.env.PORT || 5173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2"
};

async function resolveFile(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]); }
  catch { return null; }
  const target = normalize(join(ROOT, decoded));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null; // 防止目录穿越 / no path traversal
  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      const index = join(target, "index.html");
      await stat(index);
      return index;
    }
    return target;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url || "/");
  if (!file) {
    const notFound = await resolveFile("/404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(notFound ? await readFile(notFound) : "404 Not Found");
    return;
  }
  const body = await readFile(file);
  res.writeHead(200, {
    "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-cache"
  });
  res.end(req.method === "HEAD" ? undefined : body);
});

function listen(port, attemptsLeft) {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && attemptsLeft > 0) listen(port + 1, attemptsLeft - 1);
    else { console.error(err); process.exit(1); }
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Preview ready → http://127.0.0.1:${port}/  (use 127.0.0.1: "localhost" may resolve to ::1, where another dev server can answer)`);
  });
}

listen(START_PORT, 20);
