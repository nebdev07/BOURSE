"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axis = { fill: "#9a9388", fontSize: 11 };
const tip = { background: "#141820", border: "1px solid rgba(201,169,110,0.25)", borderRadius: 12, color: "#e8e4dc" };

export function PriceChart({ data }: { data: Array<{ date: string; close: number }> }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af77" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#d4af77" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e2430" vertical={false} />
          <XAxis dataKey="date" tick={axis} minTickGap={24} />
          <YAxis tick={axis} width={72} />
          <Tooltip contentStyle={tip} />
          <Area type="monotone" dataKey="close" stroke="#d4af77" fill="url(#px)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DividendChart({ data }: { data: Array<{ year: number; dividend: number; growth: number | null }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid stroke="#1e2430" vertical={false} />
          <XAxis dataKey="year" tick={axis} />
          <YAxis tick={axis} width={64} />
          <Tooltip contentStyle={tip} />
          <Area type="monotone" dataKey="dividend" stroke="#c9a96e" fill="#c9a96e33" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
