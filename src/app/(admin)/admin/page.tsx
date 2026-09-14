"use client";

import Link from "next/link";
import { useAdminConsole } from "@/frontend/admin/useAdminConsole";
import { ADMIN_NAV } from "@/frontend/navigation/routes";

export default function AdminConsolePage() {
  const { ready, postgres, users, alerts, listings, message } = useAdminConsole();

  if (!ready) return <p className="text-muted">Chargement…</p>;

  const cards = [
    { href: "/admin/users", label: "Utilisateurs", value: String(users.length), hint: "Comptes & rôles" },
    { href: "/admin/alerts", label: "Alertes support", value: String(alerts.length), hint: "Toutes les alertes" },
    { href: "/admin/ops", label: "Opérations", value: "2", hint: "Liste + analyse" },
    { href: "/admin/imports", label: "Données", value: String(listings.length), hint: "Snapshots & import" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#12201a] to-[#0a1210] p-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-300">Console</p>
        <h2 className="mt-1 font-serif text-3xl text-emerald-50">Pilotage plateforme</h2>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/60">
          Choisis une section dans le menu. SQL : {postgres ? "connecté" : "fichier local"}.
        </p>
      </div>
      {message && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-emerald-500/20 bg-[#0c1512] p-5 transition hover:border-emerald-400/40 hover:bg-emerald-500/5"
          >
            <p className="text-xs uppercase tracking-wider text-emerald-300/70">{c.label}</p>
            <p className="mt-2 font-serif text-3xl text-emerald-50">{c.value}</p>
            <p className="mt-1 text-xs text-emerald-100/50">{c.hint}</p>
          </Link>
        ))}
      </div>
      <ul className="space-y-2 text-sm text-emerald-100/55">
        {ADMIN_NAV.filter((n) => n.href !== "/admin").map((n) => (
          <li key={n.href}>
            <Link href={n.href} className="text-emerald-300 underline-offset-2 hover:underline">
              → {n.labelFr}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
