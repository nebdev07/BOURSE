"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/frontend/i18n/provider";
import { ADMIN_SECTION_ANCHORS } from "@/frontend/navigation/routes";

type Me = { id: string; email: string; name: string; role: "user" | "admin" };

const SECTION_LABELS: Record<(typeof ADMIN_SECTION_ANCHORS)[number], { fr: string; en: string }> = {
  users: { fr: "Utilisateurs", en: "Users" },
  alerts: { fr: "Support alertes", en: "Alert support" },
  ops: { fr: "Opérations", en: "Operations" },
  data: { fr: "Données", en: "Data" },
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { locale, t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((j) => {
        const user = j.user as Me | null;
        setMe(user);
        if (!user) {
          router.replace("/login");
          return;
        }
        if (user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }
        setReady(true);
      });
  }, [path, router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06080d] text-sm text-muted" data-shell="admin-loading">
        Chargement backoffice…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080d] text-ink" data-shell="admin">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-emerald-500/20 bg-[#0a1210] lg:flex">
          <div className="border-b border-emerald-500/20 px-5 py-5">
            <p className="inline-flex rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Backoffice
            </p>
            <p className="mt-2 font-serif text-lg text-emerald-50">{t.brand.short}</p>
            <p className="mt-1 text-xs text-emerald-200/60">
              {locale === "en" ? "Admin space — not the user app" : "Espace admin — distinct de l’app utilisateur"}
            </p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin">
            <Link
              href="/admin"
              className="rounded-xl bg-emerald-500/20 px-3 py-2.5 text-sm font-medium text-emerald-200"
            >
              Console
            </Link>
            {ADMIN_SECTION_ANCHORS.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-xl px-3 py-2.5 text-sm text-emerald-100/55 hover:bg-emerald-500/10 hover:text-emerald-100"
              >
                {locale === "en" ? SECTION_LABELS[id].en : SECTION_LABELS[id].fr}
              </a>
            ))}
            <div className="mt-auto space-y-1 border-t border-emerald-500/20 pt-3">
              <Link
                href="/dashboard"
                className="block rounded-xl px-3 py-2.5 text-sm text-emerald-100/50 hover:bg-emerald-500/10 hover:text-emerald-100"
              >
                {locale === "en" ? "Open user app view" : "Ouvrir la vue app utilisateur"}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-emerald-100/50 hover:bg-emerald-500/10 hover:text-emerald-100"
              >
                {t.nav.logout}
              </button>
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-emerald-500/20 bg-[#0a1210]/95 px-4 backdrop-blur lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-emerald-50">
                {locale === "en" ? "Platform administration" : "Administration plateforme"}
              </p>
              <p className="truncate text-xs text-emerald-200/55">{me?.email}</p>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <Link href="/dashboard" className="rounded-lg border border-emerald-500/25 px-3 py-1.5 text-xs text-emerald-200/80">
                App
              </Link>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
