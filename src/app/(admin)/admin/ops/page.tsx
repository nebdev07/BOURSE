"use client";

import { useAdminConsole } from "@/frontend/admin/useAdminConsole";

export default function AdminOpsPage() {
  const { ready, message, setMessage, load } = useAdminConsole();

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

  if (!ready) return <p className="text-muted">Chargement…</p>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-serif text-3xl text-emerald-50">Opérations</h2>
        <p className="mt-1 text-sm text-emerald-100/55">Actions marché : liste officielle BRVM et relance d’analyse.</p>
      </header>
      {message && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary !rounded-xl" onClick={() => void syncListing()}>
          Mettre à jour la liste officielle
        </button>
        <button type="button" className="btn-primary !rounded-xl" onClick={() => void analyze()}>
          Relancer l&apos;analyse
        </button>
      </div>
    </div>
  );
}
