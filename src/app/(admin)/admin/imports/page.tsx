"use client";

import { useState } from "react";
import { useAdminConsole } from "@/frontend/admin/useAdminConsole";

export default function AdminDataPage() {
  const { ready, listings, sources, message, setMessage } = useAdminConsole();
  const [csvKind, setCsvKind] = useState<"quotes" | "dividends" | "financials">("quotes");
  const [csv, setCsv] = useState("symbol,date,open,high,low,close,volume\nSGBC,2026-08-27,38500,38600,38400,38500,1200");

  async function importCsv(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: csvKind, csv }),
    });
    const json = await res.json();
    setMessage(`Import : ${json.inserted} insérés, ${json.rejected} rejetés`);
  }

  if (!ready) return <p className="text-muted">Chargement…</p>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-serif text-3xl text-emerald-50">Données</h2>
        <p className="mt-1 text-sm text-emerald-100/55">Snapshots de liste, sources et import CSV manuel.</p>
      </header>
      {message && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</p>
      )}

      <section className="card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="font-serif text-xl">Historique des listes officielles</h3>
        </div>
        <ul className="divide-y divide-white/5 text-sm">
          {listings.map((l) => (
            <li key={l.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
              <span>
                {String(l.asOf).slice(0, 10)} — {l.itemCount} titres — {l.source}
              </span>
              <span className="text-muted">{l.changed ? "changement" : "identique"}</span>
            </li>
          ))}
          {listings.length === 0 && (
            <li className="px-5 py-4 text-muted">Aucun snapshot en base. Lance une mise à jour depuis Opérations.</li>
          )}
        </ul>
      </section>

      <section className="card p-5">
        <h3 className="font-serif text-xl">Sources</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {sources.map((s) => (
            <li key={s.id} className="flex justify-between border-b border-white/5 py-2">
              <span>
                {s.name} ({s.type})
              </span>
              <span className="text-muted">{s.active ? "actif" : "inactif"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3 p-5">
        <h3 className="font-serif text-xl">Import CSV</h3>
        <form onSubmit={importCsv} className="space-y-3">
          <select className="field max-w-xs" value={csvKind} onChange={(e) => setCsvKind(e.target.value as typeof csvKind)}>
            <option value="quotes">Cours</option>
            <option value="dividends">Dividendes</option>
            <option value="financials">États financiers</option>
          </select>
          <textarea className="field h-32 font-mono text-xs" value={csv} onChange={(e) => setCsv(e.target.value)} />
          <button className="btn-primary !rounded-xl">Importer</button>
        </form>
      </section>
    </div>
  );
}
