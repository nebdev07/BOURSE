import { NextResponse } from "next/server";
import { loginUser } from "@/modules/identity/application/auth-service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/app/api/_lib/session";
import { limitAuth } from "@/infrastructure/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = limitAuth(request, "login");
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  const body = await request.json();
  const result = loginUser(String(body.email ?? ""), String(body.password ?? ""));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  const res = NextResponse.json({ user: result.value.user });
  res.cookies.set(SESSION_COOKIE, result.value.token, sessionCookieOptions());
  return res;
}
