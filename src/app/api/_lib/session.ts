import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { userFromToken } from "@/modules/identity/application/auth-service";
import type { UserAccount } from "@/modules/shared-kernel/types";
import { bootPersistence } from "@/infrastructure/persistence/boot";

export const SESSION_COOKIE = "brvm_session";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function currentUser(): Promise<UserAccount | null> {
  await bootPersistence();
  const jar = await cookies();
  return userFromToken(jar.get(SESSION_COOKIE)?.value ?? null);
}

export async function requireUser(): Promise<UserAccount | NextResponse> {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  return user;
}

export async function requireAdmin(): Promise<UserAccount | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (user.role !== "admin") return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
  return user;
}

export function isUser(value: UserAccount | NextResponse): value is UserAccount {
  return !(value instanceof NextResponse);
}
