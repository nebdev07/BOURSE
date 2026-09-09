import { NextResponse } from "next/server";
import { LOCALE_COOKIE } from "@/frontend/i18n/locale-cookie";
import { parseLocale } from "@/frontend/i18n/dictionary";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { locale?: string };
  const locale = parseLocale(body.locale);
  const res = NextResponse.json({ locale });
  res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
