import { NextResponse } from "next/server";
import { adminPortfolioExampleEnabled } from "@/infrastructure/security/feature-flags";

export const dynamic = "force-dynamic";

/** Flags publics non secrets (UI). */
export async function GET() {
  return NextResponse.json({
    adminPortfolioExample: adminPortfolioExampleEnabled(),
    persistenceDriver: process.env.PERSISTENCE_DRIVER ?? "file",
  });
}
