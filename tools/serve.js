// Tiny local web server for testing (no packages needed).
// Run from the repo folder:   node tools/serve.js        then open http://localhost:5173
// Optional port:              node tools/serve.js 8080
// (ES modules don't work from file://, so always use a server.)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json"
};

// Exported so the browser tests (tools/e2e.js) can reuse it; `extra` handles test-only URLs.
export function startServer(port, extra) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      if (extra && extra(req, res)) return;
      let rel = decodeURIComponent(req.url.split("?")[0]);
      if (rel.endsWith("/")) rel += "index.html";
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end("forbidden"); } // stay inside the repo
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("not found"); }
        res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
        res.end(data);
      });
    });
    server.listen(port, () => resolve(server));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = +process.argv[2] || 5173;
  startServer(port).then(() => console.log("Gym Tracker running at http://localhost:" + port));
}
