"use client";

import { useState } from "react";
import { useAdminConsole, type AdminUser } from "@/frontend/admin/useAdminConsole";

export default function AdminUsersPage() {
  const { ready, users, message, setMessage, load } = useAdminConsole();
  const [selected, setSelected] = useState<AdminUser | null>(null);

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

  if (!ready) return <p className="text-muted">Chargement…</p>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-serif text-3xl text-emerald-50">Utilisateurs & rôles</h2>
        <p className="mt-1 text-sm text-emerald-100/55">
          Permissions admin : manage_users, manage_roles, manage_user_data, view_support, manage_jobs, import_data.
        </p>
      </header>
      {message && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</p>
      )}
      <section className="card overflow-hidden">
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
    </div>
  );
}
