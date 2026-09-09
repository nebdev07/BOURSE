"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { pct, xof } from "@/frontend/lib/format";
import { useI18n } from "@/frontend/i18n/provider";

type Rec = {
  symbol: string;
  status: string;
  price: number;
  intrinsicValue: number | null;
  score: number;
  confidence: number;
  dataQuality: number;
  marginOfSafety: number | null;
};

export function PersonalRecos() {
  const { t } = useI18n();
  const [recs, setRecs] = useState<Rec[] | null>(null);

  useEffect(() => {
    void fetch("/api/recommendations?personal=1").then(async (r) => {
      if (!r.ok) {
        setRecs([]);
        return;
      }
      const json = await r.json();
      setRecs(json.recs ?? []);
    });
  }, []);

  if (!recs || recs.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4">
        <h3 className="font-serif text-xl">{t.recos.personal}</h3>
      </div>
      <div className="table-wrap">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="px-5 py-3">{t.recos.colStock}</th>
              <th className="px-3 py-3">{t.recos.colStatus}</th>
              <th className="px-3 py-3">{t.recos.colPrice}</th>
              <th className="px-3 py-3">{t.recos.colScore}</th>
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
                <td className="px-3 py-3 num">{r.score}</td>
                <td className="px-3 py-3 num">{pct(r.marginOfSafety)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
