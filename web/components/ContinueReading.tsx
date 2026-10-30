"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toArabicDigits } from "@/lib/format";

type Last = { s: number; a: number; name: string; at: number };

export default function ContinueReading() {
  const [last, setLast] = useState<Last | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("warsh:last");
      if (raw) setLast(JSON.parse(raw) as Last);
    } catch {}
  }, []);

  if (!last) return null;

  return (
    <Link
      href={`/surah/${last.s}#ayah-${last.a}`}
      className="group flex items-center gap-4 rounded-2xl border border-gold/30 bg-gold-soft/40 p-4 transition hover:border-gold/60 hover:bg-gold-soft/60"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-surface text-gold">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 4.5h9.5L20 9v10.5H6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M15 4.5V9h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-gold">متابعة القراءة</span>
        <span className="mt-0.5 block truncate font-arabic text-lg font-bold text-ink">
          سورة {last.name} — الآية {toArabicDigits(last.a)}
        </span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-muted transition group-hover:-translate-x-0.5">
        <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
