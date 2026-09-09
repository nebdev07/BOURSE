import { NextResponse } from "next/server";
import { runTick } from "@/infrastructure/jobs/tick";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";
import { requireJobSecret } from "@/app/api/_lib/jobs";
import { syncOfficialListing } from "@/infrastructure/ingestion/listing-sync";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = requireJobSecret(request);
  if (denied) return denied;
  ensureSeeded();
  const listing = await syncOfficialListing({ allowNetwork: true });
  const result = await runTick();
  return NextResponse.json({ ...result, listing });
}
