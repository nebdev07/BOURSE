import { NextResponse } from "next/server";
import { ingestCsv } from "@/infrastructure/jobs/tick";
import { runAnalysis } from "@/modules/application/catalog";
import { currentUser } from "@/app/api/_lib/session";
import { requireJobSecret } from "@/app/api/_lib/jobs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await currentUser();
  const jobDenied = requireJobSecret(request);
  if (user?.role !== "admin" && jobDenied) return jobDenied;
  const body = await request.json();
  const result = ingestCsv(body.kind, body.csv);
  runAnalysis();
  return NextResponse.json(result);
}
