import { NextResponse } from "next/server";
import { registerUser } from "@/modules/identity/application/auth-service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/app/api/_lib/session";
import { limitAuth } from "@/infrastructure/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = limitAuth(request, "register");
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  const body = await request.json();
  const result = registerUser({
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
    name: String(body.name ?? ""),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const res = NextResponse.json({ user: result.value.user });
  res.cookies.set(SESSION_COOKIE, result.value.token, sessionCookieOptions());
  return res;
}
