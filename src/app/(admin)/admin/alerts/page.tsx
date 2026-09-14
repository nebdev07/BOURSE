"use client";

import { useState } from "react";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { useAdminConsole } from "@/frontend/admin/useAdminConsole";

export default function AdminAlertsPage() {
  const { ready, alerts, message } = useAdminConsole();
  const [q, setQ] = useState("");

  if (!ready) return <p className="text-muted">Chargement…</p>;

  const filtered = alerts.filter((a) => {
    const hay = `${a.userEmail} ${a.userName} ${a.symbol ?? ""} ${a.type}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-serif text-3xl text-emerald-50">Support alertes</h2>
        <p className="mt-1 text-sm text-emerald-100/55">Vue transverse de toutes les alertes utilisateurs.</p>
      </header>
      {message && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</p>
      )}
      <section className="card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <input
            className="field max-w-md"
            placeholder="Filtrer par e-mail, nom, symbole…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="px-5 py-3">Utilisateur</th>
                <th className="px-3 py-3">Symbole</th>
                <th className="px-3 py-3">Condition</th>
                <th className="px-3 py-3">Actif</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-white/5">
                  <td className="px-5 py-3">
                    <span className="block font-medium">{a.userName}</span>
                    <span className="text-xs text-muted">{a.userEmail}</span>
                  </td>
                  <td className="px-3 py-3">{a.symbol ?? "Toutes"}</td>
                  <td className="px-3 py-3">
                    {a.type} {a.threshold ?? a.recommendation ?? ""}
                  </td>
                  <td className="px-3 py-3">{a.active ? <StatusBadge status="BUY" /> : "off"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-muted" colSpan={4}>
                    Aucune alerte.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
