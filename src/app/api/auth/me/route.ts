import { NextResponse } from "next/server";
import { currentUser } from "@/app/api/_lib/session";
import { toPublicUser } from "@/modules/identity/application/auth-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: toPublicUser(user) });
}
