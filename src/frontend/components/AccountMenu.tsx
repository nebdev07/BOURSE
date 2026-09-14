"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/frontend/i18n/provider";

type Me = { id: string; email: string; name: string; role: "user" | "admin" };

function ProfileIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 19.5c1.8-3.2 4.2-4.8 7-4.8s5.2 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AccountMenu({ me }: { me: Me }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const initial = (me.name || me.email).trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-brand-50 text-brand-400 transition hover:border-brand-400/50 hover:bg-brand-100"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.nav.account}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sr-only">{t.nav.account}</span>
        <span className="flex h-full w-full items-center justify-center font-semibold text-sm">{initial}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#12151c] shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-medium text-ink">{me.name}</p>
            <p className="truncate text-xs text-muted">{me.email}</p>
          </div>
          <div className="p-1.5">
            <Link
              role="menuitem"
              href="/settings"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <ProfileIcon className="h-4 w-4 text-brand-400" />
              {t.nav.accountSettings}
            </Link>
            {me.role === "admin" && (
              <Link
                role="menuitem"
                href="/admin"
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-brand-400 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {t.nav.backoffice}
              </Link>
            )}
            <button
              role="menuitem"
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-muted hover:bg-white/5 hover:text-ink"
              onClick={() => void logout()}
            >
              {t.nav.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
