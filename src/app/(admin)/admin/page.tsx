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

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
  alertCount: number;
  holdingCount: number;
  transactionCount: number;
  sessionCount: number;
  permissions: string[];
};

type Listing = { id: string; asOf: string; retrievedAt: string; source: string; itemCount: number; changed: boolean };

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [postgres, setPostgres] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [alerts, setAlerts] = useState<SupportAlert[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sources, setSources] = useState<Array<{ id: string; name: string; type: string; active: boolean }>>([]);
  const [csvKind, setCsvKind] = useState<"quotes" | "dividends" | "financials">("quotes");
  const [csv, setCsv] = useState("symbol,date,open,high,low,close,volume\nSGBC,2026-08-27,38500,38600,38400,38500,1200");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  async function load() {
    const [o, s, u] = await Promise.all([
      fetch("/api/admin/overview"),
      fetch("/api/admin/sources"),
      fetch("/api/admin/users"),
    ]);
    if (o.status === 401 || o.status === 403) {
      router.replace("/login");
      return;
    }
    const overview = await o.json();
    setPostgres(Boolean(overview.postgres));
    setAlerts(overview.alerts ?? []);
    setListings(overview.listings ?? []);
    setSources((await s.json()).sources ?? []);
    if (u.ok) {
      const uj = await u.json();
      setUsers(uj.users ?? []);
    }
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

  async function changeRole(user: AdminUser, role: "user" | "admin") {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    setMessage(res.ok ? `Rôle de ${user.email} → ${role}` : `Échec : ${json.error}`);
    await load();
  }

  async function clearData(user: AdminUser) {
    if (!window.confirm(`Effacer alertes / portefeuille / sessions de ${user.email} ?`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearData: true }),
    });
    const json = await res.json();
    setMessage(res.ok ? `Données effacées pour ${user.email}` : `Échec : ${json.error}`);
    await load();
  }

  async function removeUser(user: AdminUser) {
    if (!window.confirm(`Supprimer définitivement le compte ${user.email} et ses données ?`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const json = await res.json();
    setMessage(res.ok ? `Compte ${user.email} supprimé` : `Échec : ${json.error}`);
    setSelected(null);
    await load();
  }

  const filtered = alerts.filter((a) => {
    const hay = `${a.userEmail} ${a.userName} ${a.symbol ?? ""} ${a.type}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  if (!ready) return <p className="text-muted">Chargement…</p>;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#141924] to-[#0c0f16] p-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-brand-400">Console</p>
        <h2 className="mt-1 font-serif text-3xl">Pilotage plateforme</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Utilisateurs, rôles, support et opérations marché. SQL : {postgres ? "connecté" : "fichier local"}.
        </p>
      </div>
      {message && <p className="rounded-xl border border-brand-400/30 bg-brand-400/10 p-4 text-sm text-brand-400">{message}</p>}

      <section id="ops" className="scroll-mt-20 flex flex-wrap gap-3">
        <button type="button" className="btn-primary !rounded-xl" onClick={() => void syncListing()}>
          Mettre à jour la liste officielle
        </button>
        <button type="button" className="btn-primary !rounded-xl" onClick={() => void analyze()}>
          Relancer l&apos;analyse
        </button>
      </section>

      <section id="users" className="card scroll-mt-20 overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="font-serif text-xl">Utilisateurs & rôles</h3>
          <p className="mt-1 text-xs text-muted">
            Permissions admin : manage_users, manage_roles, manage_user_data, view_support, manage_jobs, import_data.
          </p>
        </div>
        <div className="table-wrap">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="px-5 py-3">Compte</th>
                <th className="px-3 py-3">Rôle</th>
                <th className="px-3 py-3">Alertes</th>
                <th className="px-3 py-3">Portefeuille</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-5 py-3">
                    <span className="block font-medium">{u.name}</span>
                    <span className="text-xs text-muted">{u.email}</span>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      className="field max-w-[8rem] py-1 text-xs"
                      value={u.role}
                      onChange={(e) => void changeRole(u, e.target.value as "user" | "admin")}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 num">{u.alertCount}</td>
                  <td className="px-3 py-3 num">
                    {u.holdingCount} pos. / {u.transactionCount} ops
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="text-xs text-brand-500 underline" onClick={() => setSelected(u)}>
                        Détail
                      </button>
                      <button type="button" className="text-xs text-muted underline" onClick={() => void clearData(u)}>
                        Effacer données
                      </button>
                      <button type="button" className="text-xs text-red-300 underline" onClick={() => void removeUser(u)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-muted" colSpan={5}>
                    Aucun utilisateur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {selected && (
          <div className="border-t border-white/10 bg-black/20 px-5 py-4 text-sm">
            <p className="font-medium">
              {selected.name} · {selected.email}
            </p>
            <p className="mt-1 text-xs text-muted">
              Créé {selected.createdAt.slice(0, 10)} · sessions {selected.sessionCount} · permissions :{" "}
              {selected.permissions.join(", ") || "aucune"}
            </p>
            <button type="button" className="mt-2 text-xs underline text-muted" onClick={() => setSelected(null)}>
              Fermer
            </button>
          </div>
        )}
      </section>

      <section id="alerts" className="card scroll-mt-20 overflow-hidden">
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

      <section id="data" className="card scroll-mt-20 overflow-hidden">
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
            <li className="px-5 py-4 text-muted">Aucun snapshot en base. Lancez une mise à jour de liste.</li>
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
          <button className="btn-primary">Importer</button>
        </form>
      </section>
    </div>
  );
}
