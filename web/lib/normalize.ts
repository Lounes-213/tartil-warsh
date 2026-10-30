/**
 * Normalises Arabic text for search: removes Quranic marks/diacritics and
 * unifies letter variants so "الرحمن" matches "اِ۬لرَّحْمَٰنِ".
 */
const MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u08D3-\u08FF]/g;

export function normalizeArabic(input: string): string {
  return input
    .replace(MARKS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function highlightMatch(text: string, query: string): { before: string; match: string; after: string } | null {
  const normalizedQuery = normalizeArabic(query);
  if (!normalizedQuery) return null;

  // Map normalized indices back to original by walking the string.
  const chars: { ch: string; idx: number }[] = [];
  let normalized = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const part = normalizeArabic(ch);
    if (!part) continue;
    for (const p of part) {
      normalized += p;
      chars.push({ ch: p, idx: i });
    }
  }

  const pos = normalized.indexOf(normalizedQuery);
  if (pos === -1) return null;

  const startIdx = chars[pos]?.idx ?? 0;
  const endEntry = chars[pos + normalizedQuery.length - 1];
  const endIdx = endEntry ? endEntry.idx + 1 : text.length;

  return { before: text.slice(0, startIdx), match: text.slice(startIdx, endIdx), after: text.slice(endIdx) };
}
