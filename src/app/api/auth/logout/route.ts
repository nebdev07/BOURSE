import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logoutUser } from "@/modules/identity/application/auth-service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/app/api/_lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const jar = await cookies();
  logoutUser(jar.get(SESSION_COOKIE)?.value ?? null);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
