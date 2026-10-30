// Build the static data bundle served by the app.
// Usage: node scripts/build-data.mjs
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "data", "warsh");
const OUT = path.join(ROOT, "web", "public", "data");

const stripMarks = (s) =>
  s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").trim();

async function fetchChapters() {
  try {
    const res = await fetch("https://api.quran.com/api/v4/chapters?language=en");
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    return new Map(json.chapters.map((c) => [c.id, c]));
  } catch {
    return new Map();
  }
}

async function main() {
  await mkdir(path.join(OUT, "surah"), { recursive: true });
  const chapters = await fetchChapters();

  const files = (await readdir(SRC)).filter((f) => f.endsWith(".json")).sort();
  const surahs = [];
  const search = [];
  let total = 0;
  let basmala = "";

  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(SRC, file), "utf8"));
    const n = raw.surah_number;
    const meta = chapters.get(n) ?? {};
    const ayahs = raw.ayahs.map((a) => ({ n: a.ayah_number, text: a.text.trim() }));
    total += ayahs.length;

    if (n === 27) {
      // 27:30 contains the basmala verbatim in Warsh orthography.
      const v = ayahs.find((a) => a.text.includes("بِسْمِ"));
      if (v) basmala = v.text.slice(v.text.indexOf("بِسْمِ")).replace(/ۖ?\s*$/, "");
    }

    for (const a of ayahs) search.push({ s: n, a: a.n, t: a.text });

    const displayName = meta.name_arabic || stripMarks(raw.name);

    surahs.push({
      id: n,
      name: displayName,
      nameArabic: displayName,
      nameSimple: meta.name_simple ?? "",
      english: meta.translated_name?.name ?? "",
      revelation: meta.revelation_place ?? "",
      ayahs: ayahs.length,
    });

    await writeFile(
      path.join(OUT, "surah", `${String(n).padStart(3, "0")}.json`),
      JSON.stringify({ id: n, name: displayName, ayahs }),
    );
  }

  await writeFile(
    path.join(OUT, "meta.json"),
    JSON.stringify({ riwaya: "Warsh 'an Nafi'", totalAyahs: total, basmala, surahs }, null, 0),
  );

  await writeFile(path.join(OUT, "search.json"), JSON.stringify(search));

  console.log(`wrote ${surahs.length} surahs, ${total} ayahs`);
  console.log("basmala:", basmala);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
