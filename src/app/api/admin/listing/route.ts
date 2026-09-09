import { NextResponse } from "next/server";
import { isUser, requireAdmin } from "@/app/api/_lib/session";
import { syncOfficialListing } from "@/infrastructure/ingestion/listing-sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await requireAdmin();
  if (!isUser(admin)) return admin;
  const result = await syncOfficialListing({ allowNetwork: true });
  return NextResponse.json(result);
}
