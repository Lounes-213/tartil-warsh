"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { audioUrl, DEFAULT_RECITER, RECITERS, SPEEDS } from "@/lib/audio";
import { clamp, formatTime, toArabicDigits } from "@/lib/format";
import type { Surah, SurahMeta } from "@/lib/types";
import ThemeToggle from "./ThemeToggle";
import RecitationCheckerModal from "./RecitationCheckerModal";

type Repeat = "off" | "one";
type HifzMode = "off" | "hidden" | "first-word";

// Computes phonetic duration weight for Arabic Quran words
function getWordWeight(word: string): number {
  let weight = 2.0;
  for (let i = 0; i < word.length; i++) {
    const code = word.charCodeAt(i);
    if (code >= 0x0621 && code <= 0x064a) weight += 1.0;
    if (code === 0x0670 || code === 0x0653 || code === 0x06e5 || code === 0x06e6) weight += 2.2;
    if (code === 0x0651) weight += 1.6;
    if (code >= 0x06ea && code <= 0x06ed) weight += 1.5;
    if (code >= 0x06d6 && code <= 0x06dc) weight += 2.0;
  }
  return weight;
}

export default function Reader({
  surah,
  meta,
  basmala,
}: {
  surah: Surah;
  meta: SurahMeta;
  basmala: string;
}) {
  const [fontSize, setFontSize] = useState(30);
  const [reciter, setReciter] = useState(DEFAULT_RECITER);
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState<Repeat>("off");
  const [current, setCurrent] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // New Features: Hifz / Memorization Mode & AI Recitation Checker
  const [hifzMode, setHifzMode] = useState<HifzMode>("off");
  const [revealedWords, setRevealedWords] = useState<Record<string, boolean>>({});
  const [checkerOpen, setCheckerOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentRef = useRef<number | null>(null);
  const repeatRef = useRef<Repeat>("off");

  currentRef.current = current;
  repeatRef.current = repeat;

  // Restore prefs
  useEffect(() => {
    try {
      const f = Number(localStorage.getItem("warsh:font"));
      if (f >= 20 && f <= 56) setFontSize(f);
      const r = localStorage.getItem("warsh:reciter");
      if (r && RECITERS.some((x) => x.id === r)) setReciter(r);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("warsh:font", String(fontSize));
    } catch {}
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem("warsh:reciter", reciter);
    } catch {}
  }, [reciter]);

  const play = useCallback(
    (n: number, startSeconds?: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      setError(null);
      audio.src = audioUrl(reciter, surah.id, n);
      audio.playbackRate = speed;
      setCurrent(n);
      setTime(startSeconds ?? 0);
      setDuration(0);
      if (startSeconds && startSeconds > 0) {
        audio.currentTime = startSeconds;
      }
      audio.play().catch(() => {
        setPlaying(false);
      });
    },
    [reciter, surah.id, speed],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentRef.current) {
      play(1);
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [play]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const base = currentRef.current ?? 0;
      const next = clamp(base + dir, 1, surah.ayahs.length);
      if (next !== base) play(next);
    },
    [play, surah.ayahs.length],
  );

  // Persist position
  useEffect(() => {
    if (!current) return;
    try {
      localStorage.setItem(
        "warsh:last",
        JSON.stringify({ s: surah.id, a: current, name: meta.name, at: Date.now() }),
      );
    } catch {}
  }, [current, surah.id, meta.name]);

  // Deep-link + restore
  useEffect(() => {
    const hash = window.location.hash.match(/^#ayah-(\d+)$/);
    if (hash) {
      const n = Number(hash[1]);
      const el = document.getElementById(`ayah-${n}`);
      if (el) {
        el.scrollIntoView({ block: "center" });
        setCurrent(n);
      }
    }
  }, []);

  // Auto-scroll while playing
  useEffect(() => {
    if (!current || !playing) return;
    const el = document.getElementById(`ayah-${current}`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [current, playing]);

  // Media session
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession as unknown as {
      metadata: unknown;
      setActionHandler: (a: string, cb: (() => void) | null) => void;
    };
    try {
      ms.metadata = new (window as unknown as { MediaMetadata: new (i: object) => unknown }).MediaMetadata({
        title: `سورة ${meta.name} — الآية ${current ?? 1}`,
        artist: RECITERS.find((r) => r.id === reciter)?.arabicName ?? "",
        album: "مصحف ورش",
      });
      ms.setActionHandler("play", () => toggle());
      ms.setActionHandler("pause", () => toggle());
      ms.setActionHandler("previoustrack", () => step(-1));
      ms.setActionHandler("nexttrack", () => step(1));
    } catch {}
  }, [current, meta.name, reciter, step, toggle]);

  const speedIndex = useMemo(() => SPEEDS.indexOf(speed as (typeof SPEEDS)[number]), [speed]);

  function cycleSpeed() {
    const next = SPEEDS[(speedIndex + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  // Precompute word metadata for each ayah
  const ayahWordsData = useMemo(() => {
    return surah.ayahs.map((a) => {
      const words = a.text.trim().split(/\s+/).filter(Boolean);
      const weights = words.map(getWordWeight);
      const totalWeight = weights.reduce((acc, w) => acc + w, 0);
      let cumulative = 0;
      const intervals = weights.map((w) => {
        const start = cumulative / totalWeight;
        cumulative += w;
        const end = cumulative / totalWeight;
        return { start, end };
      });
      return { words, intervals };
    });
  }, [surah.ayahs]);

  // Basmala words data for header
  const basmalaWords = useMemo(() => {
    return basmala.trim().split(/\s+/).filter(Boolean);
  }, [basmala]);

  // In surahs != 1 and != 9, ayah 1 audio begins with the basmala
  const hasBasmalaPrefix = surah.id !== 1 && surah.id !== 9;
  const basmalaDuration = Math.min(3.9, Math.max(2.4, duration * 0.32));

  // Determine active word
  const activeWordInfo = useMemo(() => {
    if (!current || !playing || duration <= 0) return null;

    if (hasBasmalaPrefix && current === 1) {
      if (time < basmalaDuration) {
        // Highlighting in Basmala header
        const frac = time / basmalaDuration;
        const wordIdx = Math.min(
          basmalaWords.length - 1,
          Math.floor(frac * basmalaWords.length)
        );
        return { isBasmala: true, ayahNum: 1, wordIdx };
      } else {
        // Highlighting in Ayah 1 text
        const remTime = time - basmalaDuration;
        const remDuration = Math.max(0.1, duration - basmalaDuration);
        const frac = clamp(remTime / remDuration, 0, 0.999);
        const intervals = ayahWordsData[0]?.intervals ?? [];
        const wordIdx = intervals.findIndex((it) => frac >= it.start && frac < it.end);
        return { isBasmala: false, ayahNum: 1, wordIdx: wordIdx >= 0 ? wordIdx : 0 };
      }
    }

    // Standard ayah highlighting
    const ayahData = ayahWordsData[current - 1];
    if (!ayahData) return null;
    const frac = clamp(time / duration, 0, 0.999);
    const wordIdx = ayahData.intervals.findIndex((it) => frac >= it.start && frac < it.end);
    return { isBasmala: false, ayahNum: current, wordIdx: wordIdx >= 0 ? wordIdx : 0 };
  }, [current, playing, duration, time, hasBasmalaPrefix, basmalaDuration, basmalaWords.length, ayahWordsData]);

  // Word clicking to seek directly
  const handleWordClick = (ayahNum: number, wordIdx: number) => {
    const ayahData = ayahWordsData[ayahNum - 1];
    if (!ayahData) return;

    if (hifzMode !== "off") {
      // In memorization mode, clicking reveals/hides the word
      const key = `${ayahNum}:${wordIdx}`;
      setRevealedWords((prev) => ({ ...prev, [key]: !prev[key] }));
      return;
    }

    const interval = ayahData.intervals[wordIdx];
    if (!interval) return;

    if (current === ayahNum && audioRef.current && duration > 0) {
      let targetTime: number;
      if (hasBasmalaPrefix && ayahNum === 1) {
        targetTime = basmalaDuration + interval.start * (duration - basmalaDuration);
      } else {
        targetTime = interval.start * duration;
      }
      audioRef.current.currentTime = Math.max(0, targetTime);
      if (audioRef.current.paused) audioRef.current.play().catch(() => {});
    } else {
      play(ayahNum);
    }
  };

  const handleBasmalaWordClick = (wIdx: number) => {
    if (current === 1 && audioRef.current && duration > 0 && hasBasmalaPrefix) {
      const targetTime = (wIdx / basmalaWords.length) * basmalaDuration;
      audioRef.current.currentTime = targetTime;
      if (audioRef.current.paused) audioRef.current.play().catch(() => {});
    } else {
      play(1);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center gap-2 px-3 sm:px-5">
          <Link
            href="/"
            className="grid size-10 place-items-center rounded-full border border-line bg-surface/70 text-muted transition hover:text-ink"
            aria-label="رجوع إلى فهرس السور"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate font-arabic text-lg font-bold leading-tight text-ink">
              سورة {meta.name}
            </p>
            <p className="text-[10.5px] text-muted">
              {toArabicDigits(surah.ayahs.length)} آية · {meta.revelation === "makkah" ? "مكية" : "مدنية"} · رواية ورش
            </p>
          </div>

          {/* Recitation Checker Button */}
          <button
            id="btn-recitation-checker"
            type="button"
            onClick={() => setCheckerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft/70 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white"
            title="مصحح القراءة بالصوت والتسميع"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">مصحح القراءة</span>
          </button>

          {/* Memorization Mode Toggle */}
          <button
            id="btn-hifz-mode"
            type="button"
            onClick={() => {
              setHifzMode((m) => (m === "off" ? "hidden" : m === "hidden" ? "first-word" : "off"));
              setRevealedWords({});
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              hifzMode !== "off"
                ? "border-gold bg-gold-soft text-gold"
                : "border-line bg-surface/70 text-muted hover:text-ink"
            }`}
            title="تبديل وضع التسميع والحفظ"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span className="hidden sm:inline">
              {hifzMode === "off" ? "التسميع" : hifzMode === "hidden" ? "إخفاء" : "رؤوس الآيات"}
            </span>
          </button>

          {/* Font Resizer */}
          <div className="flex items-center gap-1 rounded-full border border-line bg-surface/70 p-1">
            <button
              type="button"
              onClick={() => setFontSize((s) => clamp(s - 2, 20, 56))}
              className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-bg-soft hover:text-ink"
              aria-label="تصغير الخط"
            >
              <span className="text-xs font-bold">أ−</span>
            </button>
            <button
              type="button"
              onClick={() => setFontSize((s) => clamp(s + 2, 20, 56))}
              className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-bg-soft hover:text-ink"
              aria-label="تكبير الخط"
            >
              <span className="text-sm font-bold">أ+</span>
            </button>
          </div>

          <ThemeToggle className="sm:inline-flex" />
        </div>
      </header>

      {/* Memorization Banner (when active) */}
      {hifzMode !== "off" && (
        <div className="border-b border-gold/30 bg-gold-soft/40 px-4 py-2 text-center text-xs text-ink">
          <span>
            {hifzMode === "hidden"
              ? "وضع التسميع مفعّل (الكلمات مخفية). اضغط على أي كلمة لكشفها أو إخفائها."
              : "وضع رؤوس الآيات مفعّل (تظهر بداية كل آية فقط لتثبيت الحفظ)."}
          </span>
          <button
            type="button"
            onClick={() => setRevealedWords({})}
            className="ms-3 font-semibold text-gold underline hover:opacity-80"
          >
            إخفاء كل الكلمات
          </button>
        </div>
      )}

      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-3 pb-40 pt-6 sm:px-6">
        <div className="ornament-frame rounded-[26px] px-4 py-8 sm:px-10 sm:py-12">
          <div className="mb-7 text-center">
            <p className="font-arabic text-3xl font-bold text-ink sm:text-4xl">سُورَةُ {meta.name}</p>
            <p className="latin mt-1 text-[10px] uppercase tracking-[0.28em] text-muted">
              {meta.nameSimple} · {toArabicDigits(surah.ayahs.length)} ayat
            </p>
            <div className="divider mx-auto mt-5 max-w-xs text-sm">
              <span aria-hidden="true">۞</span>
            </div>
          </div>

          {/* Basmala Header: for surahs != 1 and != 9 */}
          {surah.id !== 1 && surah.id !== 9 && (
            <div className="mb-8 text-center">
              <p
                className="mushaf !text-[0.85em] text-gold"
                style={{ ["--mushaf-size" as string]: `${fontSize}px` }}
              >
                {basmalaWords.map((w, wIdx) => {
                  const isActive =
                    activeWordInfo?.isBasmala && activeWordInfo.wordIdx === wIdx;
                  return (
                    <span
                      key={wIdx}
                      onClick={() => handleBasmalaWordClick(wIdx)}
                      className={`mushaf-word ${isActive ? "is-word-active" : ""}`}
                      title="اضغط للاستماع للبسملة"
                    >
                      {w}{" "}
                    </span>
                  );
                })}
              </p>
            </div>
          )}

          <article
            className="mushaf"
            style={{ ["--mushaf-size" as string]: `${fontSize}px` }}
            aria-label={`نص سورة ${meta.name} برواية ورش`}
          >
            {ayahWordsData.map((data, aIdx) => {
              const ayahNum = aIdx + 1;
              const isAyahPlaying = current === ayahNum;

              return (
                <span
                  key={ayahNum}
                  id={`ayah-${ayahNum}`}
                  className={`ayah scroll-mt-28 ${isAyahPlaying ? "is-current" : ""}`}
                >
                  {data.words.map((w, wIdx) => {
                    const isWordActive =
                      !activeWordInfo?.isBasmala &&
                      activeWordInfo?.ayahNum === ayahNum &&
                      activeWordInfo?.wordIdx === wIdx;

                    const wordKey = `${ayahNum}:${wIdx}`;
                    const isHidden =
                      hifzMode === "hidden"
                        ? !revealedWords[wordKey]
                        : hifzMode === "first-word"
                        ? wIdx > 0 && !revealedWords[wordKey]
                        : false;

                    return (
                      <span
                        key={wIdx}
                        onClick={() => handleWordClick(ayahNum, wIdx)}
                        className={`mushaf-word ${isWordActive ? "is-word-active" : ""} ${
                          isHidden ? "is-hidden" : ""
                        }`}
                        title="اضغط للاستماع من هذه الكلمة"
                      >
                        {w}{" "}
                      </span>
                    );
                  })}
                  <button
                    type="button"
                    className={`ayah-num ${isAyahPlaying ? "is-current" : ""}`}
                    onClick={() => play(ayahNum)}
                    aria-label={`تشغيل الآية ${ayahNum}`}
                    title={`الآية ${ayahNum}`}
                  >
                    {toArabicDigits(ayahNum)}
                  </button>{" "}
                </span>
              );
            })}
          </article>
        </div>

        <nav className="mt-6 flex items-center justify-between gap-3" aria-label="التنقل بين السور">
          {surah.id > 1 ? (
            <Link
              href={`/surah/${surah.id - 1}`}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-xs text-muted transition hover:border-gold/50 hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              السورة السابقة
            </Link>
          ) : (
            <span />
          )}
          {surah.id < 114 ? (
            <Link
              href={`/surah/${surah.id + 1}`}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-xs text-muted transition hover:border-gold/50 hover:text-ink"
            >
              السورة التالية
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>

      {/* Floating Audio Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-2 pb-2 sm:px-4 sm:pb-4">
        <div className="glass mx-auto w-full max-w-3xl rounded-2xl px-3 py-2.5 shadow-2xl sm:px-4">
          {error && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-gold-soft/70 px-3 py-1.5 text-[11px] text-ink">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="rounded px-1.5 text-muted hover:text-ink"
                aria-label="إغلاق التنبيه"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-bg-soft hover:text-ink disabled:opacity-40"
              aria-label="الآية السابقة"
              disabled={!current || current <= 1}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              type="button"
              onClick={toggle}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white shadow-lg shadow-accent/25 transition hover:brightness-110 active:scale-95"
              aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" />
                  <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => step(1)}
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-bg-soft hover:text-ink disabled:opacity-40"
              aria-label="الآية التالية"
              disabled={!current || current >= surah.ayahs.length}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="min-w-0 flex-1 px-1">
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span className="font-arabic font-medium">
                  {current
                    ? activeWordInfo?.isBasmala
                      ? "البسملة الشريفة"
                      : `الآية ${toArabicDigits(current)}`
                    : "اختر آية للتلاوة"}
                </span>
                <span className="latin tabular-nums">
                  {formatTime(time)} / {duration ? formatTime(duration) : "—"}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={time}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTime(v);
                  if (audioRef.current) audioRef.current.currentTime = v;
                }}
                className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-[var(--accent)]"
                aria-label="موضع التلاوة"
              />
            </div>

            <button
              type="button"
              onClick={cycleSpeed}
              className="hidden h-9 min-w-9 items-center justify-center rounded-full border border-line px-2 text-[11px] font-semibold text-muted transition hover:text-ink sm:flex"
              aria-label={`سرعة التلاوة ${speed}`}
              title="سرعة التلاوة"
            >
              {speed}×
            </button>

            <button
              type="button"
              onClick={() => setRepeat((r) => (r === "off" ? "one" : "off"))}
              className={`grid size-9 shrink-0 place-items-center rounded-full border transition ${
                repeat === "one"
                  ? "border-gold/60 bg-gold-soft/60 text-gold"
                  : "border-line text-muted hover:text-ink"
              }`}
              aria-label="تكرار الآية"
              aria-pressed={repeat === "one"}
              title="تكرار الآية"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M17 3l3 3-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 6H8a4 4 0 0 0-4 4v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M7 21l-3-3 3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 18h12a4 4 0 0 0 4-4v-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>

            {/* Mobile Settings Button */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:text-ink sm:hidden"
              aria-label="إعدادات التلاوة والقارئ"
              title="إعدادات التلاوة"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>

            {/* Desktop Reciter Selector */}
            <label className="relative hidden shrink-0 sm:block">
              <span className="sr-only">القارئ</span>
              <select
                value={reciter}
                onChange={(e) => {
                  const next = e.target.value;
                  setReciter(next);
                  const n = currentRef.current;
                  if (n && audioRef.current) {
                    const wasPlaying = !audioRef.current.paused;
                    audioRef.current.src = audioUrl(next, surah.id, n);
                    audioRef.current.playbackRate = speed;
                    if (wasPlaying) audioRef.current.play().catch(() => setPlaying(false));
                  }
                }}
                className="h-9 max-w-[9.5rem] cursor-pointer appearance-none rounded-full border border-line bg-surface py-0 ps-3 pe-7 text-[11px] text-ink outline-none"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.arabicName}
                  </option>
                ))}
              </select>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-muted"
              >
                <path d="M6 9l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </label>
          </div>
        </div>
      </div>

      {/* Mobile Settings Drawer */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-settings-title"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-line bg-surface p-5 shadow-2xl animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 id="reader-settings-title" className="font-arabic text-base font-bold text-ink">
                إعدادات التلاوة
              </h3>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="grid size-8 place-items-center rounded-full text-muted hover:bg-bg hover:text-ink"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="mb-2 block font-medium text-muted">القارئ</label>
                <div className="space-y-1.5">
                  {RECITERS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setReciter(r.id);
                        const n = currentRef.current;
                        if (n && audioRef.current) {
                          const wasPlaying = !audioRef.current.paused;
                          audioRef.current.src = audioUrl(r.id, surah.id, n);
                          audioRef.current.playbackRate = speed;
                          if (wasPlaying) audioRef.current.play().catch(() => setPlaying(false));
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-right transition ${
                        reciter === r.id
                          ? "border-accent bg-accent-soft/40 font-semibold text-accent"
                          : "border-line bg-surface-2 text-ink hover:border-gold/50"
                      }`}
                    >
                      <span className="font-arabic">{r.arabicName}</span>
                      <span className="latin text-[10px] text-muted">{r.bitrate}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium text-muted">سرعة التلاوة</label>
                <div className="grid grid-cols-4 gap-2">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSpeed(s);
                        if (audioRef.current) audioRef.current.playbackRate = s;
                      }}
                      className={`rounded-xl border py-2 text-center font-semibold transition ${
                        speed === s
                          ? "border-accent bg-accent text-white"
                          : "border-line bg-surface-2 text-ink hover:border-gold/50"
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-medium text-muted">المظهر</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recitation Checker Modal */}
      <RecitationCheckerModal
        isOpen={checkerOpen}
        onClose={() => setCheckerOpen(false)}
        meta={meta}
        ayahs={surah.ayahs}
        currentAyahIndex={current ? current - 1 : 0}
        onSelectAyah={(n) => setCurrent(n)}
        onPlaySheikhAyah={(n) => {
          if (playing && current === n) {
            audioRef.current?.pause();
          } else {
            play(n);
          }
        }}
        sheikhPlaying={playing}
      />

      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          const n = currentRef.current;
          if (!n) return;
          if (repeatRef.current === "one") {
            const audio = audioRef.current;
            if (audio) {
              audio.currentTime = 0;
              audio.play().catch(() => setPlaying(false));
            }
          } else if (n < surah.ayahs.length) {
            play(n + 1);
          } else {
            setPlaying(false);
          }
        }}
        onError={() => {
          const n = currentRef.current;
          setError(
            n
              ? `تعذّر تشغيل الآية ${toArabicDigits(n)} بهذا القارئ، يُرجى تجربة قارئ آخر.`
              : "تعذّر تشغيل التلاوة.",
          );
          setPlaying(false);
        }}
      />
    </div>
  );
}
