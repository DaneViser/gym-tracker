// Browser tests: opens the real app in headless Chrome and clicks through it like a (careless) user.
// Run:  node tools/e2e.js            (needs Google Chrome, Chromium or Edge installed; set CHROME=path to override)
// The scenarios live in tools/e2e/tests.js (they run inside the browser). Exit code 1 = a test failed.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { startServer } from "./serve.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5199, TIMEOUT_MS = 240000;

function findChrome() {
  const candidates = [
    process.env.CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  for (const bin of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try { return execSync("command -v " + bin, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) {}
  }
  return null;
}

const chrome = findChrome();
if (!chrome) { console.error("No Chrome/Chromium/Edge found. Set CHROME=/path/to/chrome"); process.exit(1); }

let passed = 0, failed = 0, finish;
const done = new Promise(r => { finish = r; });
const server = await startServer(PORT, (req, res) => {
  if (req.url.startsWith("/sw.js")) { res.writeHead(404); res.end(); return true; } // no service worker in tests
  if (req.url.startsWith("/__e2e/")) {
    const f = path.join(HERE, "e2e", path.basename(req.url.split("?")[0]));
    res.writeHead(200, { "Content-Type": f.endsWith(".js") ? "text/javascript" : "text/html; charset=utf-8" });
    res.end(fs.readFileSync(f)); return true;
  }
  if (req.url === "/__report" && req.method === "POST") {
    let body = ""; req.on("data", c => (body += c));
    req.on("end", () => {
      res.writeHead(204); res.end();
      const m = JSON.parse(body);
      if (m.type === "pass") { passed++; console.log("  ✓ " + m.name + (m.ms > 1500 ? "  (" + m.ms + " ms)" : "")); }
      if (m.type === "fail") { failed++; console.log("  ✗ " + m.name + "\n      " + String(m.error).split("\n").join("\n      ")); }
      if (m.type === "log") console.log("    " + m.text);
      if (m.type === "done") finish();
    });
    return true;
  }
  return false;
});

if (process.argv.includes("--watch")) { // open the URL yourself to watch the tests run (and see errors)
  console.log("Watch mode: open http://localhost:" + PORT + "/__e2e/runner.html");
  await done; console.log("\n" + (failed ? "✗ " + failed + " failed, " : "✓ all good, ") + passed + " passed.");
  server.close(); process.exit(failed ? 1 : 0);
}
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "gym-e2e-"));
console.log("Browser tests (" + path.basename(chrome) + ", phone size 375×812)");
const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--disable-extensions", "--user-data-dir=" + profile, "--window-size=500,1000", "http://localhost:" + PORT + "/__e2e/runner.html"],
  { stdio: "ignore" });

const timer = setTimeout(() => { console.log("  ✗ timed out after " + TIMEOUT_MS / 1000 + " s"); failed++; finish(); }, TIMEOUT_MS);
await done;
clearTimeout(timer);
proc.kill();
server.close();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
console.log("\n" + (failed ? "✗ " + failed + " failed, " : "✓ all good, ") + passed + " passed.");
process.exit(failed || !passed ? 1 : 0);
