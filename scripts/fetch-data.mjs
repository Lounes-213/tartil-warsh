// Fetch Warsh Quran text (114 surahs) + QPC Warsh font.
// Usage: node scripts/fetch-data.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEXT_DIR = path.join(ROOT, "data", "warsh");
const FONT_DIR = path.join(ROOT, "data", "fonts");

const TEXT_BASE =
  "https://raw.githubusercontent.com/Yousr-Allah-Allouani/warsh-quran-audio/main/warsh_text";
const FONT_URL =
  "https://static-cdn.tarteel.ai/qul/fonts/quran_fonts/qpc/uthmanic-warsh-v21.ttf";

const pad3 = (n) => String(n).padStart(3, "0");

async function download(url, dest) {
  if (existsSync(dest)) return false;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return true;
}

async function main() {
  await mkdir(TEXT_DIR, { recursive: true });
  await mkdir(FONT_DIR, { recursive: true });

  let total = 0;
  const counts = [];
  const missing = [];

  // small pool to stay polite
  const jobs = Array.from({ length: 114 }, (_, i) => i + 1);
  const worker = async () => {
    while (jobs.length) {
      const n = jobs.shift();
      const dest = path.join(TEXT_DIR, `${pad3(n)}.json`);
      try {
        await download(`${TEXT_BASE}/${pad3(n)}.json`, dest);
        const data = JSON.parse(await import("node:fs/promises").then((fs) => fs.readFile(dest, "utf8")));
        counts[n] = data.number_of_ayahs;
        total += data.number_of_ayahs;
      } catch (e) {
        missing.push(`${pad3(n)}: ${e.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));

  await download(FONT_URL, path.join(FONT_DIR, "uthmanic-warsh-v21.ttf"));

  console.log("downloaded surahs:", counts.filter(Boolean).length, "/ 114");
  console.log("total ayahs:", total);
  console.log("per-surah:", counts.slice(1).join(","));
  if (missing.length) console.log("missing:\n" + missing.join("\n"));

  // sanity checks against known Hafs counts
  const hafs = { 1: 7, 2: 286, 9: 129, 36: 83, 114: 6 };
  for (const [s, c] of Object.entries(hafs)) {
    console.log(`surah ${s}: warsh=${counts[s]} hafs=${c} ${counts[s] === c ? "same" : "DIFF"}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
