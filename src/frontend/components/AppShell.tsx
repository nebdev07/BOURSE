"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/frontend/i18n/LanguageSwitcher";
import { useI18n } from "@/frontend/i18n/provider";
import { AccountMenu } from "@/frontend/components/AccountMenu";
import { USER_APP_LINKS } from "@/frontend/navigation/routes";

type Me = { id: string; email: string; name: string; role: "user" | "admin" };

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { t, locale } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((j) => setMe(j.user ?? null));
    setOpen(false);
  }, [path]);

  const labelByHref: Record<string, string> = {
    "/dashboard": t.nav.dashboard,
    "/stocks": t.nav.stocks,
    "/recommendations": t.nav.recos,
    "/alerts": t.nav.alerts,
    "/portfolio": t.nav.portfolio,
    "/guide": t.nav.guide,
  };

  const visible = USER_APP_LINKS.filter((l) => l.userChrome && (!l.auth || me));

  function NavLink({ href, label }: { href: string; label: string }) {
    const active = path === href || (href !== "/dashboard" && path.startsWith(href));
    return (
      <Link
        href={href}
        className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
          active ? "bg-white/10 text-ink" : "text-muted hover:bg-white/5 hover:text-ink"
        }`}
      >
        {label}
      </Link>
    );
  }

  const isAdminOnUserChrome = me?.role === "admin";

  return (
    <div className="min-h-screen bg-brand-50" data-shell="user">
      {isAdminOnUserChrome && (
        <div className="border-b border-amber-500/30 bg-amber-500/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
            <p className="text-xs text-amber-100/90">
              {locale === "en"
                ? "User app view — admin backoffice is a separate interface."
                : "Vue application utilisateur — le backoffice admin est une interface séparée."}
            </p>
            <Link
              href="/admin"
              className="rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/30"
            >
              {t.nav.backoffice}
            </Link>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d1017]/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="min-w-0 shrink-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-brand-400">{t.brand.kicker}</p>
            <h1 className="truncate font-serif text-base leading-tight text-ink sm:text-lg">{t.brand.short}</h1>
          </Link>

          <nav className="ml-2 hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex" aria-label="User">
            {visible.map((l) => (
              <NavLink key={l.href} href={l.href} label={labelByHref[l.href] ?? l.href} />
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {me ? (
              <AccountMenu me={me} />
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/login" className="rounded-lg px-3 py-2 text-sm text-muted hover:text-ink">
                  {t.nav.login}
                </Link>
                <Link href="/signup" className="btn-primary !rounded-lg !py-2">
                  {t.nav.signup}
                </Link>
              </div>
            )}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-sm md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={t.nav.menu}
            >
              <span aria-hidden>{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        {open && (
          <nav className="flex flex-col gap-0.5 border-t border-white/10 px-3 py-3 md:hidden" aria-label="User mobile">
            {visible.map((l) => (
              <NavLink key={l.href} href={l.href} label={labelByHref[l.href] ?? l.href} />
            ))}
            {!me && (
              <>
                <Link href="/login" className="rounded-lg px-3 py-2 text-sm text-muted">
                  {t.nav.login}
                </Link>
                <Link href="/signup" className="rounded-lg px-3 py-2 text-sm text-brand-400">
                  {t.nav.signup}
                </Link>
              </>
            )}
            {me && (
              <Link href="/settings" className="rounded-lg px-3 py-2 text-sm text-muted">
                {t.nav.accountSettings}
              </Link>
            )}
            {me?.role === "admin" && (
              <Link href="/admin" className="rounded-lg px-3 py-2 text-sm text-brand-400">
                {t.nav.backoffice}
              </Link>
            )}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <footer className="border-t border-white/10 bg-brand-100/40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <p className="text-center text-xs leading-relaxed text-muted">{t.legal.disclaimerShort}</p>
        </div>
      </footer>
    </div>
  );
}
