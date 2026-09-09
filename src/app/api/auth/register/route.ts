import { NextResponse } from "next/server";
import { registerUser } from "@/modules/identity/application/auth-service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/app/api/_lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
