"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/frontend/components/StatusBadge";

type SupportAlert = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  symbol: string | null;
  type: string;
  threshold: number | null;
  recommendation: string | null;
  active: boolean;
  note: string | null;
};

type SupportUser = { id: string; email: string; name: string; role: string; alertCount: number };
type Listing = { id: string; asOf: string; retrievedAt: string; source: string; itemCount: number; changed: boolean };

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [postgres, setPostgres] = useState(false);
  const [users, setUsers] = useState<SupportUser[]>([]);
  const [alerts, setAlerts] = useState<SupportAlert[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sources, setSources] = useState<Array<{ id: string; name: string; type: string; active: boolean }>>([]);
  const [csvKind, setCsvKind] = useState<"quotes" | "dividends" | "financials">("quotes");
  const [csv, setCsv] = useState("symbol,date,open,high,low,close,volume\nSGBC,2026-08-27,38500,38600,38400,38500,1200");
  const [q, setQ] = useState("");

  async function load() {
    const [o, s] = await Promise.all([fetch("/api/admin/overview"), fetch("/api/admin/sources")]);
    if (o.status === 401 || o.status === 403) {
      router.replace("/login");
      return;
    }
    const overview = await o.json();
    setPostgres(Boolean(overview.postgres));
    setUsers(overview.users ?? []);
    setAlerts(overview.alerts ?? []);
    setListings(overview.listings ?? []);
    setSources((await s.json()).sources ?? []);
    setReady(true);
  }

  useEffect(() => {
    void load();
  }, []);

  async function syncListing() {
    const res = await fetch("/api/admin/listing", { method: "POST" });
    const json = await res.json();
    setMessage(
      json.ok
        ? `Liste officielle : ${json.count} titres (${json.changed ? "mise à jour" : "inchangée"}). +${json.added?.length ?? 0} / −${json.delisted?.length ?? 0}`
        : `Échec liste : ${json.error}`,
    );
    await load();
  }

  async function analyze() {
    const res = await fetch("/api/jobs/analyze", { method: "POST" });
    setMessage(`Analyse : ${(await res.json()).analyzed} titres`);
  }

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

  const filtered = alerts.filter((a) => {
    const hay = `${a.userEmail} ${a.userName} ${a.symbol ?? ""} ${a.type}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  if (!ready) return <p className="text-muted">Chargement…</p>;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-400">Administration</p>
        <h2 className="mt-1 font-serif text-3xl">Pilotage & support</h2>
        <p className="mt-2 text-sm text-muted">
          PostgreSQL : {postgres ? "connecté" : "non connecté (fichier local)"}. Les alertes ci-dessous sont visibles pour le support uniquement.
        </p>
      </div>
      {message && <p className="card border-brand-400/30 p-4 text-sm text-brand-500">{message}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => void syncListing()}>
          Mettre à jour la liste officielle
        </button>
        <button type="button" className="btn-primary" onClick={() => void analyze()}>
          Relancer l&apos;analyse
        </button>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="font-serif text-xl">Alertes des utilisateurs (support)</h3>
          <input
            className="field mt-3 max-w-md"
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

      <section className="card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="font-serif text-xl">Comptes</h3>
        </div>
        <div className="table-wrap">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="px-5 py-3">Nom</th>
                <th className="px-3 py-3">E-mail</th>
                <th className="px-3 py-3">Rôle</th>
                <th className="px-3 py-3">Alertes</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-5 py-3">{u.name}</td>
                  <td className="px-3 py-3">{u.email}</td>
                  <td className="px-3 py-3">{u.role}</td>
                  <td className="px-3 py-3 num">{u.alertCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="font-serif text-xl">Historique des listes officielles</h3>
        </div>
        <ul className="divide-y divide-white/5 text-sm">
          {listings.map((l) => (
            <li key={l.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
              <span>{String(l.asOf).slice(0, 10)} — {l.itemCount} titres — {l.source}</span>
              <span className="text-muted">{l.changed ? "changement" : "identique"}</span>
            </li>
          ))}
          {listings.length === 0 && <li className="px-5 py-4 text-muted">Aucun snapshot en base. Lancez une mise à jour de liste.</li>}
        </ul>
      </section>

      <section className="card p-5">
        <h3 className="font-serif text-xl">Sources</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {sources.map((s) => (
            <li key={s.id} className="flex justify-between border-b border-white/5 py-2">
              <span>{s.name} ({s.type})</span>
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
          <button className="btn-primary">Importer</button>
        </form>
      </section>
    </div>
  );
}
