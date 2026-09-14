import { NextResponse } from "next/server";
import { isUser, requireUser } from "@/app/api/_lib/session";
import { deleteHolding, getPortfolioView } from "@/modules/portfolio/application/portfolio-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!isUser(user)) return user;
  const { id } = await ctx.params;
  const ok = deleteHolding(user.id, id);
  if (!ok) return NextResponse.json({ error: "Position introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, portfolio: getPortfolioView(user.id) });
}
