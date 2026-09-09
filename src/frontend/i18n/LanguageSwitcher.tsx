"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE } from "./locale-cookie";
import { useI18n } from "./provider";
import type { Locale } from "./dictionary";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();

  function setLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="inline-flex rounded-full border border-white/10 p-0.5 text-[11px] uppercase tracking-wider">
      {(["fr", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded-full px-2.5 py-1 ${locale === code ? "bg-brand-400 text-brand-50" : "text-muted"}`}
          aria-pressed={locale === code}
        >
          {code === "fr" ? t.lang.fr : t.lang.en}
        </button>
      ))}
    </div>
  );
}
