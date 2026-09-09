import Link from "next/link";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { PersonalRecos } from "@/frontend/components/PersonalRecos";
import { pct, xof } from "@/frontend/lib/format";
import { latestRecommendations } from "@/modules/application/catalog";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";
import { copy } from "@/frontend/i18n/locale";

export default async function RecommendationsPage() {
  const t = await copy();
  ensureSeeded();
  const recs = latestRecommendations();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-400">{t.recos.kicker}</p>
        <h2 className="mt-1 font-serif text-3xl">{t.recos.title}</h2>
        <p className="mt-2 text-sm text-muted">{t.recos.lead}</p>
      </div>
      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="px-5 py-3">{t.recos.colStock}</th>
                <th className="px-3 py-3">{t.recos.colStatus}</th>
                <th className="px-3 py-3">{t.recos.colPrice}</th>
                <th className="px-3 py-3">{t.recos.colIntrinsic}</th>
                <th className="px-3 py-3">{t.recos.colScore}</th>
                <th className="px-3 py-3">{t.recos.colConfidence}</th>
                <th className="px-3 py-3">{t.recos.colData}</th>
                <th className="px-3 py-3">{t.recos.colMos}</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r) => (
                <tr key={r.symbol} className="border-t border-white/5">
                  <td className="px-5 py-3">
                    <Link className="font-semibold text-brand-500" href={`/stocks/${r.symbol}`}>
                      {r.symbol}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-3 num">{xof(r.price)}</td>
                  <td className="px-3 py-3 num">{xof(r.intrinsicValue)}</td>
                  <td className="px-3 py-3 num">{r.score}</td>
                  <td className="px-3 py-3 num">{r.confidence}</td>
                  <td className="px-3 py-3 num">{r.dataQuality}</td>
                  <td className="px-3 py-3 num">{pct(r.marginOfSafety)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <PersonalRecos />
    </div>
  );
}
