"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axis = { fill: "#9a9388", fontSize: 11 };
const tip = {
  background: "#141820",
  border: "1px solid rgba(201,169,110,0.25)",
  borderRadius: 12,
  color: "#e8e4dc",
};

/** Recharts mesure mal au SSR / avant layout → garder un rendu client après mount. */
function useChartReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return ready;
}

function ChartShell({
  heightClass,
  empty,
  children,
}: {
  heightClass: string;
  empty?: boolean;
  children: ReactNode;
}) {
  const ready = useChartReady();
  if (empty) {
    return (
      <div className={`${heightClass} mt-3 flex w-full items-center justify-center rounded-xl border border-white/10 bg-brand-100/40 text-sm text-muted`}>
        Pas encore de série à afficher
      </div>
    );
  }
  if (!ready) {
    return <div className={`${heightClass} mt-3 w-full rounded-xl border border-white/5 bg-brand-100/20`} aria-hidden />;
  }
  return <div className={`${heightClass} mt-3 w-full min-w-0`}>{children}</div>;
}

/** Limite les points pour garder le SVG lisible (historique seed long). */
function thinSeries<T>(rows: T[], max = 180): T[] {
  if (rows.length <= max) return rows;
  const step = Math.ceil(rows.length / max);
  const out: T[] = [];
  for (let i = 0; i < rows.length; i += step) out.push(rows[i]!);
  const last = rows[rows.length - 1]!;
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

export function PriceChart({ data }: { data: Array<{ date: string; close: number }> }) {
  const series = thinSeries(data);
  return (
    <ChartShell heightClass="h-72" empty={series.length === 0}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af77" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#d4af77" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e2430" vertical={false} />
          <XAxis dataKey="date" tick={axis} minTickGap={28} />
          <YAxis tick={axis} width={72} domain={["auto", "auto"]} />
          <Tooltip contentStyle={tip} />
          <Area type="monotone" dataKey="close" stroke="#d4af77" fill="url(#px)" strokeWidth={2} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function DividendChart({ data }: { data: Array<{ year: number; dividend: number; growth: number | null }> }) {
  return (
    <ChartShell heightClass="h-64" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1e2430" vertical={false} />
          <XAxis dataKey="year" tick={axis} />
          <YAxis tick={axis} width={64} domain={["auto", "auto"]} />
          <Tooltip contentStyle={tip} />
          <Area type="monotone" dataKey="dividend" stroke="#c9a96e" fill="#c9a96e33" strokeWidth={2} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
