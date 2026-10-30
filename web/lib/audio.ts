import type { Reciter } from "./types";
import { pad3 } from "./format";

/**
 * Ayah-by-ayah Warsh recitations.
 * Files are numbered with the **Warsh** ayah count (6,214 total), not Hafs.
 * e.g. al-Baqarah ends at 002285 (Hafs: 002286).
 */
export const RECITERS: Reciter[] = [
  {
    id: "dosary",
    name: "Ibrahim Al-Dosary",
    arabicName: "إبراهيم الدوسري",
    folder: "warsh/warsh_ibrahim_aldosary_128kbps",
    bitrate: "128 kbps",
  },
  {
    id: "jazaery",
    name: "Yassin Al-Jazaery",
    arabicName: "ياسين الجزائري",
    folder: "warsh/warsh_yassin_al_jazaery_64kbps",
    bitrate: "64 kbps",
  },
  {
    id: "abdulbasit",
    name: "Abdul Basit",
    arabicName: "عبد الباسط عبد الصمد",
    folder: "warsh/warsh_Abdul_Basit_128kbps",
    bitrate: "128 kbps",
  },
];

export const DEFAULT_RECITER = RECITERS[0].id;

export function audioUrl(reciterId: string, surah: number, ayah: number): string {
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];
  return `https://everyayah.com/data/${reciter.folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
}

export const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
