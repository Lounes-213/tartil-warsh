import Link from "next/link";
import { getMeta, getSurah } from "@/lib/data";
import { toArabicDigits } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import SearchPanel from "@/components/SearchPanel";
import ContinueReading from "@/components/ContinueReading";

export default function HomePage() {
  const meta = getMeta();
  const fatiha = getSurah(1);
  const sample = fatiha.ayahs[1]?.text ?? fatiha.ayahs[0]?.text ?? "";

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main" className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="animate-in">
                <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.32em] text-gold">
                  <span className="inline-block h-px w-8 bg-gold/60" />
                  المصحف الشريف
                </p>
                <h1 className="mt-4 font-arabic text-4xl font-bold leading-[1.3] text-ink sm:text-5xl">
                  رواية ورش <span className="text-gold">عن</span> نافع
                </h1>
                <p className="mt-5 max-w-xl text-[15px] leading-8 text-muted">
                  نصٌّ مصحفيٌّ كامل بخط مجمع الملك فهد لطباعة المصحف الشريف، مع تلاواتٍ
                  برواية ورش وتتبّعٍ للآيات أثناء الاستماع.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href="/surah/1"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:brightness-110"
                  >
                    ابدأ بالفاتحة
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <a
                    href="#surahs"
                    className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/70 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-gold/50"
                  >
                    تصفّح السور
                  </a>
                </div>

                <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-5">
                  {[
                    { k: "سورة", v: 114 },
                    { k: "آية", v: meta.totalAyahs },
                    { k: "قرّاء", v: 3 },
                  ].map((s) => (
                    <div key={s.k}>
                      <dt className="text-[11px] text-muted">{s.k}</dt>
                      <dd className="mt-1 font-arabic text-2xl font-bold text-ink">{toArabicDigits(s.v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="animate-in ornament-frame relative rounded-[28px] p-6 sm:p-8" style={{ animationDelay: "80ms" }}>
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                <p className="text-center text-[11px] tracking-[0.25em] text-gold">سُورَةُ الفَاتِحَة</p>
                <p className="mushaf mt-5 !text-[26px] !leading-[2.5] text-ink" style={{ ["--mushaf-size" as string]: "26px" }}>
                  {meta.basmala}
                </p>
                <div className="divider my-5 text-xs">
                  <span aria-hidden="true">۞</span>
                </div>
                <p className="mushaf !text-[24px] !leading-[2.4] text-ink">{sample}</p>
                <p className="mt-5 text-center text-[11px] text-muted">
                  برواية ورش عن نافع · بخط مجمع الملك فهد
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-[1fr_auto] sm:items-center">
              <SearchPanel surahs={meta.surahs} />
            </div>

            <div className="mt-3">
              <ContinueReading />
            </div>
          </div>
        </section>

        <section id="surahs" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-arabic text-2xl font-bold text-ink">فهرس السور</h2>
              <p className="mt-1 text-xs text-muted">
                ترقيم الآيات بحسب العدّ الورشي — {toArabicDigits(meta.totalAyahs)} آية في {toArabicDigits(114)} سورة
              </p>
            </div>
            <span className="hidden text-[11px] text-muted sm:block">اضغط على السورة للقراءة</span>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {meta.surahs.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/surah/${s.id}`}
                  className="group flex h-full items-center gap-3 rounded-2xl border border-line bg-surface/60 p-3 transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-surface hover:shadow-lg hover:shadow-black/5"
                >
                  <span className="relative grid size-11 shrink-0 place-items-center text-gold/70 transition group-hover:text-gold">
                    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                      <rect x="9" y="9" width="30" height="30" rx="5" transform="rotate(45 24 24)" stroke="currentColor" strokeWidth="1.1" />
                    </svg>
                    <span className="absolute font-arabic text-[13px] font-bold text-ink">
                      {toArabicDigits(s.id)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-arabic text-[17px] font-bold leading-tight text-ink">
                      {s.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted">
                      <span>{toArabicDigits(s.ayahs)} آية</span>
                      <span aria-hidden="true">·</span>
                      <span>{s.revelation === "makkah" ? "مكية" : s.revelation === "madinah" ? "مدنية" : "—"}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line/70 bg-surface/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <p className="font-arabic text-lg font-bold text-ink">مصحف ورش</p>
            <p className="mt-2 text-xs leading-6 text-muted">
              نص المصحف بخط KFGQPC Warsh Uthmanic. التلاوات من EveryAyah. المشروع مفتوح
              للقراءة والاستماع، وغير مرتبط بأي جهة رسمية.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" aria-label="روابط">
            <Link href="/about" className="transition hover:text-ink">عن الرواية</Link>
            <Link href="/surah/1" className="transition hover:text-ink">الفاتحة</Link>
            <a href="https://qul.tarteel.ai" target="_blank" rel="noreferrer" className="latin transition hover:text-ink">
              QUL
            </a>
            <a href="https://everyayah.com" target="_blank" rel="noreferrer" className="latin transition hover:text-ink">
              EveryAyah
            </a>
          </nav>
        </div>
        <p className="mt-6 border-t border-line/60 pt-4 text-[10.5px] text-muted">
          إن وجدت خطأً في النص أو الترقيم فأبلغنا — النصّ المصحفي يُراجع قبل النشر.
        </p>
      </div>
    </footer>
  );
}
