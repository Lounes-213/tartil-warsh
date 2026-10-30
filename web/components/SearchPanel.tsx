"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeArabic, highlightMatch } from "@/lib/normalize";
import { toArabicDigits } from "@/lib/format";
import type { SurahMeta } from "@/lib/types";

type Entry = { s: number; a: number; t: string };
type IndexedEntry = Entry & { nt: string };

let cache: IndexedEntry[] | null = null;
let loading: Promise<IndexedEntry[]> | null = null;

function loadIndex(): Promise<IndexedEntry[]> {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = fetch("/data/search.json")
      .then((r) => r.json())
      .then((rows: Entry[]) => {
        cache = rows.map((r) => ({ ...r, nt: normalizeArabic(r.t) }));
        return cache;
      });
  }
  return loading;
}

export default function SearchPanel({ surahs }: { surahs: SurahMeta[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<IndexedEntry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const bySurah = useMemo(() => new Map(surahs.map((s) => [s.id, s])), [surahs]);

  const openPanel = useCallback(() => {
    setOpen(true);
    setBusy(true);
    loadIndex()
      .then(setRows)
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open ? setOpen(false) : openPanel();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openPanel]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const results = useMemo(() => {
    const q = normalizeArabic(query);
    if (!rows || q.length < 2) return [];
    const out: IndexedEntry[] = [];
    for (const row of rows) {
      if (row.nt.includes(q)) {
        out.push(row);
        if (out.length >= 40) break;
      }
    }
    return out;
  }, [rows, query]);

  function go(s: number, a: number) {
    setOpen(false);
    router.push(`/surah/${s}#ayah-${a}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface/80 px-4 py-3.5 text-start text-muted shadow-sm transition hover:border-gold/40 hover:bg-surface"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-gold">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-sm">ابحث في آيات المصحف…</span>
        <kbd className="latin hidden rounded-md border border-line bg-bg-soft px-2 py-0.5 text-[10px] text-muted sm:block">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-3 pt-[8vh] backdrop-blur-sm sm:pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="البحث في المصحف"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[80dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-gold">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اكتب كلمة أو جزءاً من آية…"
                className="h-14 flex-1 bg-transparent font-arabic text-lg text-ink outline-none placeholder:text-muted/70"
                aria-label="نص البحث"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-line px-2 py-1 text-xs text-muted transition hover:text-ink"
              >
                إغلاق
              </button>
            </div>

            <div className="min-h-24 flex-1 overflow-y-auto p-2">
              {busy && <p className="p-4 text-center text-sm text-muted">جارٍ تحميل فهرس البحث…</p>}
              {!busy && query.trim().length < 2 && (
                <p className="p-6 text-center text-sm text-muted">
                  ابحث في ٦٢١٤ آية برواية ورش. مثال: <span className="font-arabic text-ink">الرحمن</span>،{" "}
                  <span className="font-arabic text-ink">الصلاة</span>
                </p>
              )}
              {!busy && query.trim().length >= 2 && results.length === 0 && (
                <p className="p-6 text-center text-sm text-muted">لا توجد نتائج مطابقة.</p>
              )}
              {results.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {results.map((r) => {
                    const meta = bySurah.get(r.s);
                    const parts = highlightMatch(r.t, query);
                    return (
                      <li key={`${r.s}-${r.a}`}>
                        <button
                          type="button"
                          onClick={() => go(r.s, r.a)}
                          className="w-full rounded-xl px-3 py-2.5 text-start transition hover:bg-bg-soft"
                        >
                          <span className="mb-1 flex items-center gap-2 text-[11px] text-muted">
                            <span className="font-arabic text-gold">{meta?.name}</span>
                            <span>·</span>
                            <span>الآية {toArabicDigits(r.a)}</span>
                          </span>
                          <span className="mushaf block !text-[19px] !leading-[1.9] !text-start text-ink">
                            {parts ? (
                              <>
                                …{parts.before}
                                <mark className="rounded bg-gold/30 px-0.5 text-ink">{parts.match}</mark>
                                {parts.after}…
                              </>
                            ) : (
                              r.t
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
