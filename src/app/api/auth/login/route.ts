import { NextResponse } from "next/server";
import { loginUser } from "@/modules/identity/application/auth-service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/app/api/_lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const result = loginUser(String(body.email ?? ""), String(body.password ?? ""));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  const res = NextResponse.json({ user: result.value.user });
  res.cookies.set(SESSION_COOKIE, result.value.token, sessionCookieOptions());
  return res;
}
