"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { normalizeArabic } from "@/lib/normalize";
import { toArabicDigits } from "@/lib/format";
import type { Ayah, SurahMeta } from "@/lib/types";

export default function RecitationCheckerModal({
  isOpen,
  onClose,
  meta,
  ayahs,
  currentAyahIndex,
  onSelectAyah,
  onPlaySheikhAyah,
  sheikhPlaying,
}: {
  isOpen: boolean;
  onClose: () => void;
  meta: SurahMeta;
  ayahs: Ayah[];
  currentAyahIndex: number;
  onSelectAyah: (n: number) => void;
  onPlaySheikhAyah: (n: number) => void;
  sheikhPlaying: boolean;
}) {
  const [selectedAyahNum, setSelectedAyahNum] = useState<number>(ayahs[currentAyahIndex]?.n ?? 1);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognizedWords, setRecognizedWords] = useState<string[]>([]);
  const [supported, setSupported] = useState(true);
  const [feedback, setFeedback] = useState<string>("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSelectedAyahNum(ayahs[currentAyahIndex]?.n ?? 1);
  }, [currentAyahIndex, ayahs]);

  const targetAyah = ayahs.find((a) => a.n === selectedAyahNum) ?? ayahs[0];
  const targetWords = targetAyah ? targetAyah.text.trim().split(/\s+/).filter(Boolean) : [];
  const normalizedTargetWords = targetWords.map((w) => normalizeArabic(w));

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "ar-SA";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: any) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + " ";
      }
      const clean = fullTranscript.trim();
      setTranscript(clean);

      const spoken = clean
        .split(/\s+/)
        .map((w: string) => normalizeArabic(w))
        .filter(Boolean);
      setRecognizedWords(spoken);
    };

    rec.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        console.warn("Speech recognition error:", e.error);
      }
    };

    rec.onend = () => {
      // Don't auto-reset listening if user didn't stop it intentionally
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setRecognizedWords([]);
    setFeedback("");
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
          setIsListening(true);
        }, 200);
      } catch {}
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
  }, []);

  // Compute word matches
  // Matches spoken words against normalized target words sequentially
  const wordMatchStatuses = targetWords.map((word, idx) => {
    const targetNorm = normalizedTargetWords[idx];
    if (recognizedWords.length === 0) return "pending";

    // Check if word has been matched
    // Look around the current expected index
    const exists = recognizedWords.some((spoken, sIdx) => {
      return spoken === targetNorm || spoken.includes(targetNorm) || targetNorm.includes(spoken);
    });

    if (exists) return "correct";

    // If spoken words have progressed past this word index
    if (recognizedWords.length > idx) {
      return "mistake";
    }

    return "pending";
  });

  const correctCount = wordMatchStatuses.filter((s) => s === "correct").length;
  const mistakeCount = wordMatchStatuses.filter((s) => s === "mistake").length;
  const accuracy = targetWords.length > 0 ? Math.round((correctCount / targetWords.length) * 100) : 0;

  useEffect(() => {
    if (correctCount === targetWords.length && targetWords.length > 0) {
      setFeedback("ما شاء الله! قراءة متقونة وصحيحة بنسبة ١٠٠٪ 🎉");
    } else if (mistakeCount > 0) {
      setFeedback("انتبه للكلمات الملونة بالأحمر، واستمع لنطق الشيخ للتصحيح.");
    }
  }, [correctCount, mistakeCount, targetWords.length]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-md animate-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recitation-checker-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h2 id="recitation-checker-title" className="font-arabic text-lg font-bold text-ink">
                مصحح التلاوة والعرض
              </h2>
              <p className="text-[11px] text-muted">
                اختبر حفظك ونطقك لآيات سورة {meta.name} برواية ورش
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-bg-soft hover:text-ink"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Ayah Navigation */}
        <div className="flex items-center justify-between border-b border-line/50 bg-surface-2/60 px-5 py-2.5 text-xs">
          <button
            type="button"
            onClick={() => {
              const prev = Math.max(1, selectedAyahNum - 1);
              setSelectedAyahNum(prev);
              onSelectAyah(prev);
              setTranscript("");
              setRecognizedWords([]);
            }}
            disabled={selectedAyahNum <= 1}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-muted transition hover:bg-surface hover:text-ink disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            الآية السابقة
          </button>

          <span className="font-arabic text-sm font-bold text-ink">
            الآية {toArabicDigits(selectedAyahNum)} من {toArabicDigits(ayahs.length)}
          </span>

          <button
            type="button"
            onClick={() => {
              const next = Math.min(ayahs.length, selectedAyahNum + 1);
              setSelectedAyahNum(next);
              onSelectAyah(next);
              setTranscript("");
              setRecognizedWords([]);
            }}
            disabled={selectedAyahNum >= ayahs.length}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-muted transition hover:bg-surface hover:text-ink disabled:opacity-40"
          >
            الآية التالية
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Target Ayah Box */}
          <div className="ornament-frame rounded-2xl p-6 text-center">
            <p className="mushaf text-[28px] leading-[2.6] text-ink sm:text-[32px]">
              {targetWords.map((word, idx) => {
                const status = wordMatchStatuses[idx];
                return (
                  <span
                    key={idx}
                    className={`mushaf-word inline-block ${
                      status === "correct"
                        ? "is-correct"
                        : status === "mistake"
                        ? "is-mistake"
                        : ""
                    }`}
                    title={status === "correct" ? "نطق صحيح" : status === "mistake" ? "خطأ في النطق" : ""}
                  >
                    {word}{" "}
                  </span>
                );
              })}
            </p>
          </div>

          {/* Feedback & Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
              <span className="text-[11px] text-muted">نسبة الصواب</span>
              <p className="mt-1 font-arabic text-xl font-bold text-accent">
                %{toArabicDigits(accuracy)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
              <span className="text-[11px] text-muted">كلمات صحيحة</span>
              <p className="mt-1 font-arabic text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {toArabicDigits(correctCount)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
              <span className="text-[11px] text-muted">كلمات للمراجعة</span>
              <p className="mt-1 font-arabic text-xl font-bold text-rose-600 dark:text-rose-400">
                {toArabicDigits(mistakeCount)}
              </p>
            </div>
          </div>

          {feedback && (
            <div className="mt-4 rounded-xl border border-gold/40 bg-gold-soft/50 p-3 text-center text-xs font-medium text-ink">
              {feedback}
            </div>
          )}

          {/* Transcript Box */}
          <div className="mt-4 rounded-xl border border-line bg-bg-soft/70 p-3.5">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>ما التقطه الميكروفون:</span>
              {isListening && (
                <span className="flex items-center gap-1.5 text-rose-500">
                  <span className="inline-block size-2 animate-ping rounded-full bg-rose-500" />
                  جارٍ الاستماع...
                </span>
              )}
            </div>
            <p className="mt-1.5 min-h-[1.5rem] font-arabic text-sm text-ink">
              {transcript || (
                <span className="text-muted/60">
                  {supported
                    ? "اضغط على زر الميكروفون أدناه وابدأ بقراءة الآية بصوت واضح..."
                    : "خاصية التعرف على الصوت غير مدعومة في متصفحك الحالي (يُفضل استخدام Chrome أو Edge)."}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Controls Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-4">
          <button
            type="button"
            onClick={() => onPlaySheikhAyah(selectedAyahNum)}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-gold/50"
          >
            {sheikhPlaying ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
                إيقاف تلاوة الشيخ
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                </svg>
                استمع لنطق الشيخ الصحيح
              </>
            )}
          </button>

          {supported ? (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`inline-flex items-center gap-2.5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition active:scale-95 ${
                isListening
                  ? "pulse-mic bg-rose-600 shadow-rose-600/30 hover:bg-rose-700"
                  : "bg-accent shadow-accent/25 hover:brightness-110"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {isListening ? "إيقاف التسميع" : "ابدأ القراءة والتصحيح"}
            </button>
          ) : (
            <span className="text-xs text-muted">التصحيح الصوتي غير متاح</span>
          )}
        </div>
      </div>
    </div>
  );
}
