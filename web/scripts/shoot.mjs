import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = "shots";

await mkdir(OUT, { recursive: true });

// Ensure server is running
let srv = null;
try {
  await fetch(BASE);
} catch {
  console.log("Starting static server on 3100...");
  srv = spawn("python", ["-m", "http.server", "3100", "-d", "out"], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 1500));
}

const browser = await chromium.launch({ channel: "msedge" });

async function shot(name, path, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport ?? { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    locale: "ar",
    colorScheme: opts.scheme ?? "light",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(900);
  if (opts.scroll) {
    await page.evaluate((y) => window.scrollTo(0, y), opts.scroll);
    await page.waitForTimeout(500);
  }
  if (opts.click) {
    await page.click(opts.click);
    await page.waitForTimeout(700);
  }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.fullPage ?? false });
  if (errors.length) console.log(`[${name}] console errors:`, errors.slice(0, 5));
  await ctx.close();
}

await shot("home", "/");
await shot("home-full", "/", { fullPage: true });
await shot("surah1", "/surah/1/");
await shot("surah2", "/surah/2/");
await shot("about", "/about/");
await shot("home-dark", "/", { scheme: "dark" });
await shot("surah1-dark", "/surah/1/", { scheme: "dark" });
await shot("home-mobile", "/", { viewport: { width: 390, height: 844 } });
await shot("surah1-mobile", "/surah/1/", { viewport: { width: 390, height: 844 } });
await shot("surah1-checker", "/surah/1/", { click: "#btn-recitation-checker" });
await shot("surah1-hifz", "/surah/1/", { click: "#btn-hifz-mode" });

await browser.close();
if (srv) srv.kill();
console.log("done");
