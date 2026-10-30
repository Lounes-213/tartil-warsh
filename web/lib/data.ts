import fs from "node:fs";
import path from "node:path";
import type { Meta, Surah } from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

export function getMeta(): Meta {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, "meta.json"), "utf8")) as Meta;
}

export function getSurah(id: number): Surah {
  const file = path.join(DATA_DIR, "surah", `${String(id).padStart(3, "0")}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8")) as Surah;
}

export function getAllSurahIds(): number[] {
  return Array.from({ length: 114 }, (_, i) => i + 1);
}
