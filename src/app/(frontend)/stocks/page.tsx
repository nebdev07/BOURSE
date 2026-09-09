import Link from "next/link";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { xof } from "@/frontend/lib/format";
import { latestRecommendations, listCompanies } from "@/modules/application/catalog";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";
import { copy } from "@/frontend/i18n/locale";

export default async function StocksPage() {
  const t = await copy();
  ensureSeeded();
  const companies = listCompanies();
  const recs = new Map(latestRecommendations().map((r) => [r.symbol, r]));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-400">{t.stocks.kicker}</p>
        <h2 className="mt-1 font-serif text-3xl">{t.stocks.title}</h2>
        <p className="mt-2 text-sm text-muted">{t.stocks.count(companies.length)}</p>
      </div>
      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="px-5 py-3">{t.stocks.colSymbol}</th>
                <th className="px-3 py-3">{t.stocks.colName}</th>
                <th className="px-3 py-3">{t.stocks.colSector}</th>
                <th className="px-3 py-3">{t.stocks.colPrice}</th>
                <th className="px-3 py-3">{t.stocks.colScore}</th>
                <th className="px-3 py-3">{t.stocks.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const r = recs.get(c.symbol);
                return (
                  <tr key={c.symbol} className="border-t border-white/5 hover:bg-brand-200/40">
                    <td className="px-5 py-3">
                      <Link className="font-semibold text-brand-500" href={`/stocks/${c.symbol}`}>
                        {c.symbol}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{c.name}</td>
                    <td className="px-3 py-3 text-muted">{c.sector}</td>
                    <td className="px-3 py-3 num">{xof(r?.price)}</td>
                    <td className="px-3 py-3 num">{r ? `${r.score}/100` : "—"}</td>
                    <td className="px-3 py-3">{r ? <StatusBadge status={r.status} /> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
