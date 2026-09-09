import { NextResponse } from "next/server";
import { createAlert, listAlerts, triggeredAlerts } from "@/modules/application/workspace";
import { isUser, requireUser } from "@/app/api/_lib/session";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  ensureSeeded();
  const user = await requireUser();
  if (!isUser(user)) return user;
  return NextResponse.json({ alerts: listAlerts(user.id), hits: triggeredAlerts(user.id) });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!isUser(user)) return user;
  const body = await request.json();
  const alert = createAlert(user.id, body);
  return NextResponse.json(alert);
}
