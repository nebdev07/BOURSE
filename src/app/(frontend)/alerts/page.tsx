"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { Tip } from "@/frontend/components/Tip";
import { useI18n } from "@/frontend/i18n/provider";
import { xof } from "@/frontend/lib/format";

type AlertRow = {
  id: string;
  symbol: string | null;
  type: string;
  threshold: number | null;
  recommendation: string | null;
  active: boolean;
  note: string | null;
};

type CompanyOpt = { symbol: string; name: string; price: number | null };

export default function AlertsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [hits, setHits] = useState<Array<{ message: string }>>([]);
  const [companies, setCompanies] = useState<CompanyOpt[]>([]);
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState("PRICE_LTE");
  const [threshold, setThreshold] = useState("");

  async function refresh() {
    const [aRes, cRes] = await Promise.all([fetch("/api/alerts"), fetch("/api/companies")]);
    if (aRes.status === 401) {
      router.replace("/login");
      return;
    }
    const json = await aRes.json();
    setAlerts(json.alerts ?? []);
    setHits(json.hits ?? []);
    const list = ((await cRes.json()).companies ?? []) as CompanyOpt[];
    setCompanies(list);
    if (!symbol && list[0]) {
      setSymbol(list[0].symbol);
      if (list[0].price != null) setThreshold(String(Math.round(list[0].price)));
    }
    setReady(true);
  }

  useEffect(() => {
    void refresh();
  }, []);

  function onPickSymbol(next: string) {
    setSymbol(next);
    const c = companies.find((x) => x.symbol === next);
    if (c?.price != null && (type === "PRICE_LTE" || type === "PRICE_GTE")) {
      setThreshold(String(Math.round(c.price)));
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol) return;
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

  const selected = companies.find((c) => c.symbol === symbol);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-400">{t.alerts.kicker}</p>
        <h2 className="mt-1 font-serif text-3xl">{t.alerts.title}</h2>
        <p className="mt-2 text-sm text-muted">{t.alerts.lead}</p>
      </div>

      <Tip title={t.tips.label}>{t.tips.alerts}</Tip>

      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-5">
        <label className="min-w-[16rem] flex-1 text-sm">
          {t.alerts.symbol}
          <select className="field" value={symbol} onChange={(e) => onPickSymbol(e.target.value)} required>
            <option value="" disabled>
              {t.alerts.pickStock}
            </option>
            {companies.map((c) => (
              <option key={c.symbol} value={c.symbol}>
                {c.symbol} — {c.name}
                {c.price != null ? ` (${xof(c.price)})` : ""}
              </option>
            ))}
          </select>
          {selected && (
            <span className="mt-1 block text-xs text-muted">
              {selected.name}
              {selected.price != null ? ` · cours actuel ${xof(selected.price)}` : ""}
            </span>
          )}
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
            <input className="field" value={threshold} onChange={(e) => setThreshold(e.target.value)} required />
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
                    {a.type} {a.threshold ?? a.recommendation ?? ""}
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
