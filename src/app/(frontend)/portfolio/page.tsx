"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { Tip } from "@/frontend/components/Tip";
import { GHelp, GTerm } from "@/frontend/components/GTerm";
import { useI18n } from "@/frontend/i18n/provider";
import { pct, xof } from "@/frontend/lib/format";

type CompanyOpt = { symbol: string; name: string; price: number | null };

type Lot = { quantity: number; unitPrice: number; tradedAt: string | null; note: string | null };
type Tx = { side: string; quantity: number; unitPrice: number; tradedAt: string | null; note: string | null };

type Line = {
  holding: { id: string; symbol: string; quantity: number; avgCost: number; purchasedAt: string | null };
  name: string;
  currentPrice: number | null;
  marketValue: number | null;
  costBasis: number;
  unrealizedPnL: number | null;
  unrealizedPnLPct: number | null;
  dayPnL: number | null;
  dayPnLPct: number | null;
  weightPct: number | null;
  status: string | null;
  reinforce: "BUY_MORE" | "HOLD_NO_BUY" | "AVOID_ADD";
  reasons: string[];
  risks: string[];
  lots: Lot[];
  realizedPnL: number;
  transactions: Tx[];
};

type PortfolioPayload = {
  lines: Line[];
  totals: { marketValue: number; costBasis: number; unrealizedPnL: number; dayPnL: number; realizedPnL?: number };
  contributors: { gainers: Line[]; losers: Line[] };
  closed?: Array<{ symbol: string; name: string; realizedPnL: number; transactions: Tx[] }>;
};

function pnlClass(value: number | null | undefined): string {
  if (value == null || value === 0) return "text-muted";
  return value > 0 ? "text-emerald-400" : "text-rose-400";
}

export default function PortfolioPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [companies, setCompanies] = useState<CompanyOpt[]>([]);
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [avgCost, setAvgCost] = useState("");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminExample, setAdminExample] = useState(false);

  async function refresh() {
    const [pRes, cRes, meRes, cfgRes] = await Promise.all([
      fetch("/api/portfolio"),
      fetch("/api/companies"),
      fetch("/api/auth/me"),
      fetch("/api/config"),
    ]);
    if (pRes.status === 401) {
      router.replace("/login");
      return;
    }
    const json = (await pRes.json()) as PortfolioPayload;
    setData(json);
    const list = ((await cRes.json()).companies ?? []) as CompanyOpt[];
    setCompanies(list);
    if (meRes.ok) {
      const me = await meRes.json();
      setIsAdmin(me.user?.role === "admin");
    }
    if (cfgRes.ok) {
      const cfg = await cfgRes.json();
      setAdminExample(Boolean(cfg.adminPortfolioExample));
    }
    if (!symbol && list[0]) {
      setSymbol(list[0].symbol);
      if (list[0].price != null) setAvgCost(String(Math.round(list[0].price)));
    }
    setReady(true);
  }

  useEffect(() => {
    void refresh();
  }, []);

  function onPickSymbol(next: string) {
    setSymbol(next);
    const c = companies.find((x) => x.symbol === next);
    if (c?.price != null) setAvgCost(String(Math.round(c.price)));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        quantity: Number(quantity),
        avgCost: Number(avgCost),
        purchasedAt: purchasedAt || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? t.portfolio.saveFail);
      return;
    }
    setData(json.portfolio);
  }

  async function remove(id: string) {
    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) setData(json.portfolio);
  }

  async function runImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportMsg(null);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", importFile);
      const res = await fetch("/api/portfolio/import", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? json.errors?.[0] ?? t.portfolio.importFail);
        return;
      }
      setData(json.portfolio);
      setImportMsg(t.portfolio.importOk(json.imported ?? 0));
      setImportFile(null);
      if (json.errors?.length) setError(json.errors.slice(0, 3).join(" · "));
    } finally {
      setImporting(false);
    }
  }

  if (!ready || !data) return <p className="text-muted">{t.portfolio.loading}</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-400">{t.portfolio.kicker}</p>
        <h2 className="mt-1 font-serif text-3xl">{t.portfolio.title}</h2>
        <p className="mt-2 text-sm text-muted">{t.portfolio.lead}</p>
      </div>

      <Tip title={t.tips.label}>{t.tips.portfolio}</Tip>

      <section className="card space-y-4 p-5">
        <div>
          <h3 className="font-serif text-xl">{t.portfolio.importTitle}</h3>
          <p className="mt-1 text-sm text-muted">{t.portfolio.importLead}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* API file downloads — not App Router pages */}
          {/* eslint-disable @next/next/no-html-link-for-pages */}
          <a className="rounded-full border border-white/15 px-4 py-2 text-sm text-brand-500" href="/api/portfolio/import?format=xlsx">
            {t.portfolio.downloadModel}
          </a>
          <a className="rounded-full border border-white/15 px-4 py-2 text-sm text-muted" href="/api/portfolio/import?format=csv">
            {t.portfolio.downloadModelCsv}
          </a>
          {isAdmin && adminExample && (
            <>
              <a
                className="rounded-full border border-brand-500/40 px-4 py-2 text-sm text-brand-500"
                href="/api/portfolio/import?format=xlsx&kind=exemple"
              >
                {t.portfolio.downloadExample}
              </a>
              <a
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-muted"
                href="/api/portfolio/import?format=csv&kind=exemple"
              >
                {t.portfolio.downloadExampleCsv}
              </a>
            </>
          )}
          {/* eslint-enable @next/next/no-html-link-for-pages */}
        </div>
        <form onSubmit={runImport} className="flex flex-wrap items-end gap-3">
          <label className="min-w-[16rem] flex-1 text-sm">
            {t.portfolio.chooseFile}
            <input
              className="field"
              type="file"
              accept=".xlsx,.xlsm,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={!importFile || importing}>
            {importing ? "…" : t.portfolio.importAction}
          </button>
        </form>
        {importMsg && <p className="text-sm text-emerald-400">{importMsg}</p>}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: <GTerm id="marketValue" />, value: xof(data.totals.marketValue), pnl: null as number | null },
          { label: <GTerm id="costBasis" />, value: xof(data.totals.costBasis), pnl: null },
          { label: <GTerm id="unrealized" />, value: xof(data.totals.unrealizedPnL), pnl: data.totals.unrealizedPnL },
          { label: <GTerm id="dayMove" />, value: xof(data.totals.dayPnL), pnl: data.totals.dayPnL },
          { label: <GTerm id="realized" />, value: xof(data.totals.realizedPnL ?? 0), pnl: data.totals.realizedPnL ?? 0 },
        ].map((card, i) => (
          <div key={i} className="card px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-muted">{card.label}</p>
            <p className={`mt-1 font-serif text-2xl ${card.pnl != null ? pnlClass(card.pnl) : ""}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-5">
        <label className="min-w-[14rem] flex-1 text-sm">
          {t.portfolio.symbol}
          <select className="field" value={symbol} onChange={(e) => onPickSymbol(e.target.value)} required>
            {companies.map((c) => (
              <option key={c.symbol} value={c.symbol}>
                {c.symbol} — {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          {t.portfolio.quantity}
          <input className="field w-28" type="number" min="0.0001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </label>
        <label className="text-sm">
          <GTerm id="avgCost" />
          <input className="field w-36" type="number" min="1" step="any" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} required />
        </label>
        <label className="text-sm">
          {t.portfolio.purchasedAt}
          <input className="field w-40" type="date" value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)} />
        </label>
        <button type="submit" className="btn-primary">
          {t.portfolio.add}
        </button>
        {error && <p className="w-full text-sm text-rose-400">{error}</p>}
      </form>

      {(data.contributors.gainers.length > 0 || data.contributors.losers.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="card p-5">
            <h3 className="font-serif text-xl">{t.portfolio.gainers}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.contributors.gainers.map((l) => (
                <li key={l.holding.id} className="flex justify-between gap-2">
                  <span className="font-semibold text-brand-500">{l.holding.symbol}</span>
                  <span className={pnlClass(l.dayPnL)}>{xof(l.dayPnL)}</span>
                </li>
              ))}
              {data.contributors.gainers.length === 0 && <li className="text-muted">{t.portfolio.none}</li>}
            </ul>
          </section>
          <section className="card p-5">
            <h3 className="font-serif text-xl">{t.portfolio.losers}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.contributors.losers.map((l) => (
                <li key={l.holding.id} className="flex justify-between gap-2">
                  <span className="font-semibold text-brand-500">{l.holding.symbol}</span>
                  <span className={pnlClass(l.dayPnL)}>{xof(l.dayPnL)}</span>
                </li>
              ))}
              {data.contributors.losers.length === 0 && <li className="text-muted">{t.portfolio.none}</li>}
            </ul>
          </section>
        </div>
      )}

      <section className="card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t.portfolio.colStock}
                  <GHelp id="officialName" />
                </span>
              </th>
              <th className="px-4 py-3">{t.portfolio.colQty}</th>
              <th className="px-4 py-3">
                <GTerm id="weight" />
              </th>
              <th className="px-4 py-3">
                <GTerm id="marketValue" />
              </th>
              <th className="px-4 py-3">
                <GTerm id="unrealized" />
              </th>
              <th className="px-4 py-3">
                <GTerm id="dayMove" />
              </th>
              <th className="px-4 py-3">
                <GTerm id="reinforce" />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.lines.map((line) => (
              <Fragment key={line.holding.id}>
                <tr>
                  <td className="px-4 py-3 align-top">
                    <Link className="font-semibold text-brand-500" href={`/stocks/${line.holding.symbol}`}>
                      {line.holding.symbol}
                    </Link>
                    <p className="mt-0.5 max-w-[18rem] break-words text-xs leading-snug text-muted" title={line.name}>
                      {line.name}
                    </p>
                    {line.status && (
                      <div className="mt-1">
                        <StatusBadge status={line.status} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 num">
                    {line.holding.quantity}
                    <p className="text-xs text-muted">{xof(line.holding.avgCost)}</p>
                  </td>
                  <td className="px-4 py-3 num">{pct(line.weightPct, 1)}</td>
                  <td className="px-4 py-3 num">{xof(line.marketValue)}</td>
                  <td className={`px-4 py-3 num ${pnlClass(line.unrealizedPnL)}`}>
                    {xof(line.unrealizedPnL)}
                    <p className="text-xs">{pct(line.unrealizedPnLPct, 1)}</p>
                  </td>
                  <td className={`px-4 py-3 num ${pnlClass(line.dayPnL)}`}>
                    {xof(line.dayPnL)}
                    <p className="text-xs">{pct(line.dayPnLPct, 2)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{t.portfolio.stance[line.reinforce]}</p>
                    <button
                      type="button"
                      className="mt-1 text-xs text-brand-500 underline"
                      onClick={() => setOpenId(openId === line.holding.id ? null : line.holding.id)}
                    >
                      {t.portfolio.detail}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="text-xs text-rose-400" onClick={() => void remove(line.holding.id)}>
                      {t.portfolio.remove}
                    </button>
                  </td>
                </tr>
                {openId === line.holding.id && (
                  <tr>
                    <td colSpan={8} className="bg-brand-100/40 px-4 py-3 text-sm text-muted">
                      <p className="mb-2 font-semibold text-ink">
                        <GTerm id="lot" />
                      </p>
                      <ul className="mb-3 space-y-1">
                        {(line.lots ?? []).map((lot, i) => (
                          <li key={`${line.holding.id}-lot-${i}`}>
                            {lot.quantity} × {xof(lot.unitPrice)}
                            {lot.tradedAt ? ` · ${lot.tradedAt}` : ""}
                            {lot.note ? ` — ${lot.note}` : ""}
                          </li>
                        ))}
                        {(line.lots ?? []).length === 0 && <li>{t.portfolio.none}</li>}
                      </ul>
                      <p className="mb-2 font-semibold text-ink">{t.portfolio.historyTitle}</p>
                      <ul className="mb-3 space-y-1">
                        {(line.transactions ?? []).map((tx, i) => (
                          <li key={`${line.holding.id}-tx-${i}`}>
                            <span className={tx.side === "SELL" ? "text-rose-400" : "text-emerald-400"}>{tx.side}</span>
                            {` ${tx.quantity} @ ${xof(tx.unitPrice)}`}
                            {tx.tradedAt ? ` · ${tx.tradedAt}` : ""}
                            {tx.note ? ` — ${tx.note}` : ""}
                          </li>
                        ))}
                      </ul>
                      <p className="mb-1 font-semibold text-ink">{t.portfolio.reasons}</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {line.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {data.lines.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  {t.portfolio.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {(data.closed?.length ?? 0) > 0 && (
        <section className="card space-y-3 p-5">
          <h3 className="font-serif text-xl">{t.portfolio.closedTitle}</h3>
          <p className="text-sm text-muted">
            {t.portfolio.closedLead} <GTerm id="fifo" />
          </p>
          <ul className="space-y-2 text-sm">
            {data.closed!.map((c) => (
              <li key={c.symbol} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 py-2">
                <span>
                  <span className="font-semibold text-brand-500">{c.symbol}</span>
                  <span className="text-muted"> — {c.name}</span>
                </span>
                <span className={pnlClass(c.realizedPnL)}>
                  {t.portfolio.realized}: {xof(c.realizedPnL)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
