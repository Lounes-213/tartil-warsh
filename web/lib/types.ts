export type SurahMeta = {
  id: number;
  name: string;
  nameArabic: string;
  nameSimple: string;
  english: string;
  revelation: string;
  ayahs: number;
};

export type Meta = {
  riwaya: string;
  totalAyahs: number;
  basmala: string;
  surahs: SurahMeta[];
};

export type Ayah = { n: number; text: string };

export type Surah = {
  id: number;
  name: string;
  ayahs: Ayah[];
};

export type Reciter = {
  id: string;
  name: string;
  arabicName: string;
  folder: string;
  bitrate: string;
};
