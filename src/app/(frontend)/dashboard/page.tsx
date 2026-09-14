import Link from "next/link";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { Tip } from "@/frontend/components/Tip";
import { TermLabel } from "@/frontend/components/InfoBubble";
import { pct, xof } from "@/frontend/lib/format";
import { getDashboard } from "@/modules/application/workspace";
import { copy } from "@/frontend/i18n/locale";

export default async function DashboardPage() {
  const t = await copy();
  const g = t.glossary;
  const levels = { beginner: g.beginner, expert: g.expert };
  const data = await getDashboard();
  const cards = [
    [t.dashboard.analyzed, String(data.total)],
    [t.status.BUY, String(data.counts.BUY), g.buy],
    [t.status.ACCUMULATE, String(data.counts.ACCUMULATE), g.accumulate],
    [t.status.WATCH, String(data.counts.WATCH), g.watch],
    [t.status.WAIT, String(data.counts.WAIT), g.wait],
    [t.status.AVOID, String(data.counts.AVOID), g.avoid],
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-400">{t.dashboard.kicker}</p>
        <h2 className="mt-1 font-serif text-3xl">{t.dashboard.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t.dashboard.lead}</p>
      </div>
      <Tip title={t.tips.label}>
        {t.tips.dashboard}{" "}
        <Link className="text-brand-500 underline" href="/guide">
          {t.nav.guide}
        </Link>
      </Tip>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {cards.map(([label, value, tip]) => (
          <div key={label} className="card px-4 py-4">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              {tip ? <TermLabel entry={{ ...tip, label }} levelLabels={levels} /> : label}
            </p>
            <p className="mt-1 font-serif text-3xl num text-ink">{value}</p>
          </div>
        ))}
      </div>
      <section className="card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="font-serif text-xl">{t.dashboard.top}</h3>
        </div>
        <div className="table-wrap">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">{t.dashboard.colStock}</th>
                <th className="px-3 py-3 font-medium">
                  <TermLabel entry={g.status} levelLabels={levels} />
                </th>
                <th className="px-3 py-3 font-medium">{t.dashboard.colPrice}</th>
                <th className="px-3 py-3 font-medium">
                  <TermLabel entry={g.score} levelLabels={levels} />
                </th>
                <th className="px-3 py-3 font-medium">
                  <TermLabel entry={g.confidence} levelLabels={levels} />
                </th>
                <th className="px-3 py-3 font-medium">
                  <TermLabel entry={g.mos} levelLabels={levels} />
                </th>
              </tr>
            </thead>
            <tbody>
              {data.opportunities.map((r) => (
                <tr key={r.symbol} className="border-t border-white/5 hover:bg-brand-200/40">
                  <td className="px-5 py-3">
                    <Link className="font-semibold text-brand-500 hover:underline" href={`/stocks/${r.symbol}`}>
                      {r.symbol}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-3 num">{xof(r.price)}</td>
                  <td className="px-3 py-3 num">{r.score}/100</td>
                  <td className="px-3 py-3 num">{r.confidence}/100</td>
                  <td className="px-3 py-3 num">{pct(r.marginOfSafety)}</td>
                </tr>
              ))}
              {data.opportunities.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-muted" colSpan={6}>
                    {t.dashboard.empty}
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
