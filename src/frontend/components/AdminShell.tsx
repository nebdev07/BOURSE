"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/frontend/i18n/provider";

type Me = { id: string; email: string; name: string; role: "user" | "admin" };

const SECTIONS = [
  { id: "users", labelFr: "Utilisateurs", labelEn: "Users" },
  { id: "alerts", labelFr: "Support alertes", labelEn: "Alert support" },
  { id: "ops", labelFr: "Opérations", labelEn: "Operations" },
  { id: "data", labelFr: "Données", labelEn: "Data" },
] as const;

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
      <div className="flex min-h-screen items-center justify-center bg-[#080a0f] text-sm text-muted">
        Chargement backoffice…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#0c0f16] lg:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-400">Backoffice</p>
            <p className="mt-1 font-serif text-lg">{t.brand.short}</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            <Link
              href="/admin"
              className="rounded-xl bg-brand-400/15 px-3 py-2.5 text-sm font-medium text-brand-400"
            >
              {locale === "en" ? "Console" : "Console"}
            </Link>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-ink"
              >
                {locale === "en" ? s.labelEn : s.labelFr}
              </a>
            ))}
            <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
              <Link href="/dashboard" className="block rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-ink">
                {locale === "en" ? "← Back to app" : "← Retour à l’app"}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-muted hover:bg-white/5 hover:text-ink"
              >
                {t.nav.logout}
              </button>
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-white/10 bg-[#0c0f16]/95 px-4 backdrop-blur lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{locale === "en" ? "Platform admin" : "Administration plateforme"}</p>
              <p className="truncate text-xs text-muted">{me?.email}</p>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <Link href="/dashboard" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-muted">
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
