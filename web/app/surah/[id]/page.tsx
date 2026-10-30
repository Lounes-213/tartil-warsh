import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSurahIds, getMeta, getSurah } from "@/lib/data";
import { toArabicDigits } from "@/lib/format";
import Reader from "@/components/Reader";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSurahIds().map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const n = Number(id);
  const s = getMeta().surahs.find((x) => x.id === n);
  if (!s) return {};
  return {
    title: `سورة ${s.name}`,
    description: `قراءة سورة ${s.name} برواية ورش عن نافع — ${toArabicDigits(s.ayahs)} آية، مع التلاوة وتتبّع الآيات.`,
  };
}

export default async function SurahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  const meta = getMeta();
  const s = meta.surahs.find((x) => x.id === n);
  if (!s) notFound();

  return <Reader surah={getSurah(n)} meta={s} basmala={meta.basmala} />;
}
