import { NextResponse } from "next/server";
import { isUser, requireAdmin } from "@/app/api/_lib/session";
import { adminSnapshot } from "@/infrastructure/email/report";
import { listAllAlertsForSupport, listUsersForSupport } from "@/modules/application/workspace";
import { listListingSnapshots, postgresEnabled } from "@/infrastructure/persistence/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!isUser(admin)) return admin;
  const snap = await adminSnapshot();
  return NextResponse.json({
    ...snap,
    postgres: postgresEnabled(),
    users: listUsersForSupport(),
    alerts: listAllAlertsForSupport(),
    listings: await listListingSnapshots(15),
  });
}
