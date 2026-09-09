import { NextResponse } from "next/server";
import { runAnalysis } from "@/modules/application/catalog";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";
import { currentUser } from "@/app/api/_lib/session";
import { requireJobSecret } from "@/app/api/_lib/jobs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await currentUser();
  const jobDenied = requireJobSecret(request);
  if (user?.role !== "admin" && jobDenied) return jobDenied;
  ensureSeeded();
  const analyzed = runAnalysis().length;
  return NextResponse.json({ analyzed });
}
