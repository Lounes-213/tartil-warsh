"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "sepia" | "dark";

const ORDER: Theme[] = ["light", "sepia", "dark"];

const LABEL: Record<Theme, string> = {
  light: "نهاري",
  sepia: "ورقي",
  dark: "ليلي",
};

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("warsh-theme", theme);
  } catch {}
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "light";
    setTheme(ORDER.includes(current) ? current : "light");
    setMounted(true);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    apply(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`المظهر: ${LABEL[theme]}. اضغط للتبديل`}
      title={`المظهر: ${LABEL[theme]}`}
      className={`inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface/70 px-3 text-sm text-muted transition hover:text-ink hover:border-gold/50 ${className}`}
    >
      <ThemeIcon theme={theme} />
      <span className="hidden sm:inline">{mounted ? LABEL[theme] : "المظهر"}</span>
    </button>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "dark") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (theme === "sepia") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 17.5h16" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
