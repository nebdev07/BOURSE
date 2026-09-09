import { NextResponse } from "next/server";
import { listUserReports, scheduleReport } from "@/modules/application/workspace";
import { isUser, requireUser } from "@/app/api/_lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!isUser(user)) return user;
  return NextResponse.json({ reports: listUserReports(user.id) });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!isUser(user)) return user;
  const body = await request.json();
  const report = scheduleReport(user.id, body.runAt, user.email, body.type);
  return NextResponse.json(report);
}
