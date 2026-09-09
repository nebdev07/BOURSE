import { NextResponse } from "next/server";
import { isUser, requireUser } from "@/app/api/_lib/session";
import { savePersonalRuleset } from "@/modules/application/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!isUser(user)) return user;
  return NextResponse.json(user.ruleset);
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!isUser(user)) return user;
  const body = await request.json();
  const saved = savePersonalRuleset(user.id, body);
  return NextResponse.json(saved);
}
