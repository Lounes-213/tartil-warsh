import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { toArabicDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "عن رواية ورش",
  description: "رواية ورش عن نافع: تعريف، فروق العدّ، مصادر النص والتلاوات، وحالة الميزات.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">تعريف</p>
        <h1 className="mt-3 font-arabic text-4xl font-bold text-ink">رواية ورش عن نافع</h1>
        <p className="mt-4 text-[15px] leading-8 text-muted">
          رواية ورش هي إحدى الروايات المتواترة عن الإمام نافع المدني، يرويها عنه
          أبو سعيد عثمان بن سعيد الملقّب بـ«ورش». وهي الرواية المعتمدة في المصاحف
          في بلاد المغرب العربي وأجزاء من غرب أفريقيا، وتتميّز بأصولٍ في الأداء
          كالإمالة والتقليل والتحقيق وتسهيل الهمزة، وبرسمٍ مصحفيٍّ خاص.
        </p>

        <section className="mt-10">
          <h2 className="font-arabic text-2xl font-bold text-ink">العدّ الورشي</h2>
          <div className="mt-4 rounded-2xl border border-gold/30 bg-gold-soft/40 p-5">
            <p className="text-sm leading-7 text-ink">
              عدد آي المصحف برواية ورش <strong className="font-arabic text-lg">{toArabicDigits(6214)}</strong> آية،
              بينما هو <span className="font-arabic">{toArabicDigits(6236)}</span> في رواية حفص. الفرق ناتج عن
              اختلاف العدّ الكوفي عن العدّ المدني/المكّي في بعض السور.
            </p>
            <p className="mt-3 text-xs leading-6 text-muted">
              لذلك لا يمكن استخدام ترقيم حفص مباشرة: في هذا التطبيق ترقيم الآيات
              والملفات الصوتية كلاهما ورشيّ. مثال: سورة البقرة تنتهي عند الآية{" "}
              <span className="font-arabic text-ink">{toArabicDigits(285)}</span> (حفص: ٢٨٦)،
              وسورة يس عند <span className="font-arabic text-ink">{toArabicDigits(82)}</span> (حفص: ٨٣).
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-arabic text-2xl font-bold text-ink">مصادر المشروع</h2>
          <ul className="mt-4 space-y-3">
            <Source
              title="النص المصحفي والخط"
              body="خط KFGQPC Warsh Uthmanic Script من مجمع الملك فهد لطباعة المصحف الشريف، موزّع عبر Quranic Universal Library (Tarteel)."
              href="https://qul.tarteel.ai/resources/font/qpc-warsh-font"
              label="qul.tarteel.ai"
            />
            <Source
              title="التلاوات الصوتية"
              body="تلاوات آية بآية برواية ورش: إبراهيم الدوسري، ياسين الجزائري، وعبد الباسط عبد الصمد."
              href="https://everyayah.com"
              label="everyayah.com"
            />
            <Source
              title="صفحات المصحف (اختياري)"
              body="مصحف ورش بصيغة SVG مع إحداثيات الآيات، بترخيص CC BY 4.0، من مشروع Quran SVG."
              href="https://github.com/quran-ws/quran-svg"
              label="github.com/quran-ws"
            />
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-arabic text-2xl font-bold text-ink">حالة الميزات</h2>
          <ul className="mt-4 space-y-3">
            <Feature done title="مصحف ورش كامل" body="٦٢١٤ آية، ترقيم ورشي، خط مصحفي، أحجام خط، ثلاثة مظاهر (نهاري/ورقي/ليلي)." />
            <Feature done title="تلاوة آية بآية" body="ثلاثة قرّاء، تشغيل متتابع، تكرار الآية، سرعة التلاوة، تتبّع الآية الحالية، ودعم أزرار الوسائط." />
            <Feature done title="بحث في الآيات" body="بحث نصّي يتجاهل التشكيل وعلامات الوقف." />
            <Feature title="تتبّع الكلمة أثناء التلاوة" body="يتطلّب محاذاة صوتية (forced alignment) لكل قارئ — قيد التطوير." />
            <Feature title="كشف الرواية تلقائياً" body="تمييز ورش عن حفص من الصوت. لا يوجد نموذج جاهز لذلك؛ يتطلّب تدريب مصنّف على تسجيلات مصنّفة للروايتين. قيد البحث." />
            <Feature title="تصحيح التلاوة والتجويد" body="يحتاج نموذج تعرّف صوتي مدرَّب على ورش ومراجعة علمية قبل النشر." />
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-line bg-surface/60 p-5">
          <h2 className="font-arabic text-lg font-bold text-ink">تنبيه</h2>
          <p className="mt-2 text-xs leading-6 text-muted">
            هذا مشروع تقني مستقل غير مرتبط بأي جهة رسمية. النصّ المصحفي والخط
            مأخوذان من مصادر مفتوحة، ويُنصح بمراجعة علمية قبل الاعتماد التعليمي
            أو التجاري. إن لاحظت خطأً في النص أو الترقيم فأبلغنا.
          </p>
        </section>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm text-ink transition hover:border-gold/50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            العودة إلى الفهرس
          </Link>
        </div>
      </main>
    </div>
  );
}

function Source({ title, body, href, label }: { title: string; body: string; href: string; label: string }) {
  return (
    <li className="rounded-2xl border border-line bg-surface/60 p-4">
      <p className="font-arabic text-base font-bold text-ink">{title}</p>
      <p className="mt-1.5 text-xs leading-6 text-muted">{body}</p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="latin mt-2 inline-block text-[11px] text-accent underline-offset-4 hover:underline"
      >
        {label}
      </a>
    </li>
  );
}

function Feature({ title, body, done = false }: { title: string; body: string; done?: boolean }) {
  return (
    <li className="flex gap-3 rounded-xl border border-line/70 bg-surface/40 p-4">
      <span
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] ${
          done ? "bg-accent-soft text-accent" : "bg-gold-soft text-gold"
        }`}
        aria-hidden="true"
      >
        {done ? "✓" : "…"}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">
          {title}
          <span className="ms-2 text-[10px] font-normal text-muted">{done ? "متوفّر" : "قيد التطوير"}</span>
        </p>
        <p className="mt-1 text-xs leading-6 text-muted">{body}</p>
      </div>
    </li>
  );
}
