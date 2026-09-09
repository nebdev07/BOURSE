"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { useI18n } from "@/frontend/i18n/provider";

type AlertRow = {
  id: string;
  symbol: string | null;
  type: string;
  threshold: number | null;
  recommendation: string | null;
  active: boolean;
  note: string | null;
};

export default function AlertsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [hits, setHits] = useState<Array<{ message: string }>>([]);
  const [symbol, setSymbol] = useState("SGBC");
  const [type, setType] = useState("PRICE_LTE");
  const [threshold, setThreshold] = useState("35000");

  async function refresh() {
    const res = await fetch("/api/alerts");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const json = await res.json();
    setAlerts(json.alerts ?? []);
    setHits(json.hits ?? []);
    setReady(true);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        type,
        threshold: type === "RECOMMENDATION_EQ" ? null : Number(threshold),
        recommendation: type === "RECOMMENDATION_EQ" ? "BUY" : null,
      }),
    });
    await refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    await refresh();
  }

  if (!ready) return <p className="text-muted">{t.alerts.loading}</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-400">{t.alerts.kicker}</p>
        <h2 className="mt-1 font-serif text-3xl">{t.alerts.title}</h2>
        <p className="mt-2 text-sm text-muted">{t.alerts.lead}</p>
      </div>
      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-5">
        <label className="text-sm">
          {t.alerts.symbol}
          <input className="field" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </label>
        <label className="text-sm">
          {t.alerts.type}
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="PRICE_LTE">{t.alerts.priceLte}</option>
            <option value="PRICE_GTE">{t.alerts.priceGte}</option>
            <option value="SCORE_GTE">{t.alerts.scoreGte}</option>
            <option value="RECOMMENDATION_EQ">{t.alerts.recoBuy}</option>
          </select>
        </label>
        {type !== "RECOMMENDATION_EQ" && (
          <label className="text-sm">
            {t.alerts.threshold}
            <input className="field" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </label>
        )}
        <button className="btn-primary">{t.alerts.subscribe}</button>
      </form>
      {hits.length > 0 && (
        <div className="card border-brand-400/30 p-5 text-sm">
          <p className="font-semibold text-brand-500">{t.alerts.triggered}</p>
          <ul className="mt-2 list-disc pl-5">
            {hits.map((h) => (
              <li key={h.message}>{h.message}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="px-5 py-3">{t.alerts.colSymbol}</th>
                <th className="px-3 py-3">{t.alerts.colCondition}</th>
                <th className="px-3 py-3">{t.alerts.colActive}</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-t border-white/5">
                  <td className="px-5 py-3">{a.symbol ?? t.alerts.all}</td>
                  <td className="px-3 py-3">
                    {a.type} {a.threshold ?? a.recommendation ?? ""} {a.note ? `— ${a.note}` : ""}
                  </td>
                  <td className="px-3 py-3">{a.active ? <StatusBadge status="BUY" /> : t.alerts.off}</td>
                  <td className="px-3 py-3">
                    <button className="text-rose-400" onClick={() => void remove(a.id)}>
                      {t.alerts.delete}
                    </button>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-muted" colSpan={4}>
                    {t.alerts.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
