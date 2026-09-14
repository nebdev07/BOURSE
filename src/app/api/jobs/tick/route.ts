import { NextResponse } from "next/server";
import { requireJobSecret } from "@/app/api/_lib/jobs";
import { refreshMarketPrices } from "@/infrastructure/jobs/market-refresh";
import { sendDueReports, createLogMailer } from "@/infrastructure/email/report";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = requireJobSecret(request);
  if (denied) return denied;
  const market = await refreshMarketPrices({ allowNetwork: true });
  const emails = await sendDueReports(createLogMailer());
  return NextResponse.json({ ...market, emails });
}
