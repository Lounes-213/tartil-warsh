import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-gold transition hover:opacity-80" aria-label="مصحف ورش — الرئيسية">
          <Logo />
          <span className="flex flex-col leading-none">
            <span className="font-arabic text-lg font-bold text-ink">مصحف ورش</span>
            <span className="latin mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">Warsh &apos;an Nafi&apos;</span>
          </span>
        </Link>

        <span className="mx-1 hidden h-6 w-px bg-line sm:block" />

        <nav className="flex items-center gap-1 text-xs sm:text-sm" aria-label="التنقل الرئيسي">
          <Link href="/" className="hidden rounded-lg px-3 py-1.5 text-muted transition hover:bg-surface hover:text-ink sm:inline-block">
            السور
          </Link>
          <Link href="/about" className="rounded-lg px-2.5 py-1 text-muted transition hover:bg-surface hover:text-ink sm:px-3 sm:py-1.5">
            عن الرواية
          </Link>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {!compact && (
            <span className="hidden items-center gap-1.5 rounded-full border border-gold/30 bg-gold-soft/50 px-3 py-1 text-[11px] font-medium text-gold md:inline-flex">
              <span className="inline-block size-1.5 rounded-full bg-gold" />
              رواية ورش عن نافع
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
