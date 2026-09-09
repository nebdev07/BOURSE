import { notFound } from "next/navigation";
import { DividendChart, PriceChart } from "@/frontend/components/Charts";
import { ScoreBreakdownPanel } from "@/frontend/components/ScoreBreakdownPanel";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { frDate, num, pct, xof } from "@/frontend/lib/format";
import {
  dividendsOf,
  financialsOf,
  getCompany,
  latestAnalysis,
  quotesOf,
  recommendationHistory,
} from "@/modules/application/catalog";
import { loadStore } from "@/infrastructure/persistence/file-store";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";
import { periodGrowth } from "@/modules/analysis/domain/finance-math";
import { copy, readLocale } from "@/frontend/i18n/locale";
import { statusLabel } from "@/frontend/i18n/dictionary";

export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const t = await copy();
  const locale = await readLocale();
  ensureSeeded();
  const { symbol } = await params;
  const company = getCompany(symbol);
  if (!company) notFound();
  const quotes = quotesOf(company.symbol);
  const divs = dividendsOf(company.symbol);
  const fins = financialsOf(company.symbol);
  const analysis = latestAnalysis(company.symbol);
  const history = recommendationHistory(company.symbol).slice(-12).reverse();
  const rec = history[0];
  const perf = loadStore().performance.filter((p) => p.symbol === company.symbol);

  const divChart = divs.map((d, i) => ({
    year: d.exerciseYear,
    dividend: d.grossAmount,
    growth: i === 0 ? null : periodGrowth(d.grossAmount, divs[i - 1].grossAmount),
  }));

  const lastQuote = quotes.at(-1);
  const lastDiv = divs.at(-1);
  const lastFin = fins.at(-1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-400">{company.sector}</p>
          <h2 className="mt-1 font-serif text-4xl">{company.symbol}</h2>
          <p className="text-muted">{company.name}</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-3xl num">{xof(analysis?.currentPrice ?? lastQuote?.close)}</p>
          {rec && <StatusBadge status={rec.status} />}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          [t.stock.score, analysis ? `${analysis.investmentScore}/100` : "—"],
          [t.stock.confidence, analysis ? `${analysis.confidenceScore}/100` : "—"],
          [t.stock.dataQuality, analysis ? `${analysis.dataQualityScore}/100` : "—"],
          [t.stock.mos, pct(analysis?.marginOfSafety)],
        ].map(([k, v]) => (
          <div key={k} className="card px-4 py-4">
            <p className="text-[11px] uppercase tracking-wider text-muted">{k}</p>
            <p className="mt-1 font-serif text-2xl num">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-serif text-lg">{t.stock.priceHistory}</h3>
          <PriceChart data={quotes.map((q) => ({ date: q.date, close: q.close }))} />
        </div>
        {analysis && <ScoreBreakdownPanel breakdown={analysis.breakdown} total={analysis.investmentScore} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-serif text-lg">{t.stock.dividends}</h3>
          <DividendChart data={divChart} />
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-2">{t.stock.year}</th>
                <th>{t.stock.dividend}</th>
                <th>{t.stock.growth}</th>
              </tr>
            </thead>
            <tbody>
              {divChart.map((d) => (
                <tr key={d.year} className="border-t border-white/5">
                  <td className="py-2">{d.year}</td>
                  <td className="num">{xof(d.dividend)}</td>
                  <td className="num">{pct(d.growth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card p-5 space-y-3 text-sm">
          <h3 className="font-serif text-lg">{t.stock.fundamentals}</h3>
          <Row label={t.stock.eps} value={num(analysis?.eps, 2)} source={lastFin?.provenance.source} />
          <Row label={t.stock.per} value={num(analysis?.per, 2)} />
          <Row label={t.stock.roe} value={pct(analysis?.roe)} />
          <Row label={t.stock.yield} value={pct(analysis?.dividendYield)} source={lastDiv?.provenance.source} />
          <Row label={t.stock.divCagr} value={pct(analysis?.dividendCagr5y)} />
          <Row label={t.stock.epsCagr} value={pct(analysis?.epsCagr5y)} />
          <Row label={t.stock.iv} value={xof(analysis?.intrinsicValue)} />
          <Row label={t.stock.methods} value={analysis?.intrinsicMethods.join(", ") ?? "—"} />
          <Row label={t.stock.ideal} value={xof(rec?.idealEntryPrice)} />
          <Row label={t.stock.maxEntry} value={xof(rec?.maximumEntryPrice)} />
          <Row label={t.stock.source} value={lastQuote?.provenance.source ?? "—"} />
          <Row label={t.stock.retrieved} value={frDate(lastQuote?.provenance.retrievedAt)} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-serif text-lg">
            {t.stock.why} {rec ? statusLabel(locale, rec.status) : ""} ?
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-emerald-200">
            {(analysis?.reasons ?? []).map((r) => (
              <li key={r}>✓ {r}</li>
            ))}
          </ul>
          <ul className="mt-3 space-y-1 text-sm text-amber-200">
            {(analysis?.risks ?? []).map((r) => (
              <li key={r}>⚠ {r}</li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="font-serif text-lg">{t.stock.history}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between border-b border-white/5 py-2">
                <span className="text-muted">{frDate(h.date)}</span>
                <StatusBadge status={h.status} />
                <span className="num">Score {h.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {perf.length > 0 && (
        <div className="card p-5">
          <h3 className="font-serif text-lg">{t.stock.vsIndex}</h3>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-2">{t.stock.horizon}</th>
                <th>{t.stock.price}</th>
                <th>{t.stock.dividend}</th>
                <th>{t.stock.total}</th>
                <th>BRVM-C</th>
              </tr>
            </thead>
            <tbody>
              {perf.map((p) => (
                <tr key={`${p.snapshotDate}-${p.horizonDays}`} className="border-t border-white/5">
                  <td className="py-2">+{p.horizonDays} j</td>
                  <td className="num">{pct(p.priceReturn)}</td>
                  <td className="num">{pct(p.dividendReturn)}</td>
                  <td className="num">{pct(p.totalReturn)}</td>
                  <td className="num">{pct(p.indexReturn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, source }: { label: string; value: string; source?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-1.5">
      <span className="text-muted">{label}</span>
      <span className="text-right">
        <span className="num">{value}</span>
        {source && <span className="mt-0.5 block text-[11px] text-muted">{source}</span>}
      </span>
    </div>
  );
}
