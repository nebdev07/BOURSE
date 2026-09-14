import { NextResponse } from "next/server";
import { isUser, requireUser } from "@/app/api/_lib/session";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";
import { createHolding, getPortfolioView } from "@/modules/portfolio/application/portfolio-service";

export const dynamic = "force-dynamic";

export async function GET() {
  ensureSeeded();
  const user = await requireUser();
  if (!isUser(user)) return user;
  return NextResponse.json(getPortfolioView(user.id));
}

export async function POST(request: Request) {
  ensureSeeded();
  const user = await requireUser();
  if (!isUser(user)) return user;
  try {
    const body = await request.json();
    const holding = createHolding(user.id, {
      symbol: String(body.symbol ?? ""),
      quantity: Number(body.quantity),
      avgCost: Number(body.avgCost),
      purchasedAt: body.purchasedAt ? String(body.purchasedAt).slice(0, 10) : null,
      note: body.note ? String(body.note) : null,
    });
    return NextResponse.json({ holding, portfolio: getPortfolioView(user.id) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Création impossible" },
      { status: 400 },
    );
  }
}
