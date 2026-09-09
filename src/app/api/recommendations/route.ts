import { NextResponse } from "next/server";
import { latestRecommendations } from "@/modules/application/catalog";
import { personalRecommendations } from "@/modules/application/workspace";
import { currentUser } from "@/app/api/_lib/session";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  ensureSeeded();
  const personal = new URL(request.url).searchParams.get("personal") === "1";
  if (!personal) return NextResponse.json({ recs: latestRecommendations(), view: "official" });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  return NextResponse.json({ recs: personalRecommendations(user.id), view: "personal" });
}
