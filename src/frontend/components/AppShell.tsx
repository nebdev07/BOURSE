"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/frontend/i18n/LanguageSwitcher";
import { useI18n } from "@/frontend/i18n/provider";

type Me = { id: string; email: string; name: string; role: "user" | "admin" };

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((j) => setMe(j.user ?? null));
    setOpen(false);
  }, [path]);

  const links = [
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/stocks", label: t.nav.stocks },
    { href: "/recommendations", label: t.nav.recos },
    { href: "/alerts", label: t.nav.alerts, auth: true },
    { href: "/portfolio", label: t.nav.portfolio, auth: true },
    { href: "/settings", label: t.nav.settings, auth: true },
    { href: "/guide", label: t.nav.guide },
  ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
    router.refresh();
  }

  const navItems = (
    <>
      {links
        .filter((l) => !l.auth || me)
        .map((l) => {
          const active = path === l.href || (l.href !== "/dashboard" && path.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-2 text-sm min-h-11 inline-flex items-center ${active ? "bg-brand-200 text-brand-600" : "text-muted hover:text-ink"}`}
            >
              {l.label}
            </Link>
          );
        })}
      {me?.role === "admin" && (
        <Link
          href="/admin"
          className={`rounded-full px-3 py-2 text-sm min-h-11 inline-flex items-center ${path.startsWith("/admin") ? "bg-brand-200 text-brand-600" : "text-muted hover:text-ink"}`}
        >
          {t.nav.admin}
        </Link>
      )}
      {me ? (
        <>
          <span className="hidden max-w-[10rem] truncate px-2 text-xs text-muted sm:inline">{me.email}</span>
          <button onClick={() => void logout()} className="rounded-full px-3 py-2 text-sm min-h-11 text-muted hover:text-ink">
            {t.nav.logout}
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="rounded-full px-3 py-2 text-sm min-h-11 inline-flex items-center text-muted hover:text-ink">
            {t.nav.login}
          </Link>
          <Link href="/signup" className="btn-primary inline-flex min-h-11 items-center">
            {t.nav.signup}
          </Link>
        </>
      )}
      <LanguageSwitcher />
    </>
  );

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-brand-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-brand-400">{t.brand.kicker}</p>
            <h1 className="font-serif text-lg text-ink sm:text-xl">{t.brand.title}</h1>
          </Link>
          <nav className="hidden flex-wrap items-center gap-1 lg:flex">{navItems}</nav>
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-2 text-sm min-h-11 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {t.nav.menu}
          </button>
        </div>
        {open && <nav className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 lg:hidden">{navItems}</nav>}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <footer className="border-t border-white/10 bg-brand-100/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <p className="text-center text-xs leading-relaxed text-muted">{t.legal.disclaimerShort}</p>
        </div>
      </footer>
    </div>
  );
}
