import { NextResponse } from "next/server";
import { listCompanies, latestRecommendations } from "@/modules/application/catalog";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";
import { bootPersistence } from "@/infrastructure/persistence/boot";

export const dynamic = "force-dynamic";

export async function GET() {
  await bootPersistence();
  ensureSeeded();
  const recs = new Map(latestRecommendations().map((r) => [r.symbol, r]));
  const companies = listCompanies().map((c) => ({
    symbol: c.symbol,
    name: c.name,
    sector: c.sector,
    price: recs.get(c.symbol)?.price ?? null,
  }));
  return NextResponse.json({ companies });
}
