import { NextResponse } from "next/server";
import { isUser, requireAdmin } from "@/app/api/_lib/session";
import {
  clearUserData,
  deleteUserAccount,
  getAdminUserDetail,
  setUserRole,
} from "@/modules/identity/application/admin-users";
import type { UserRole } from "@/modules/shared-kernel/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!isUser(admin)) return admin;
  const { id } = await ctx.params;
  const detail = getAdminUserDetail(id);
  if (!detail) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  return NextResponse.json({ user: detail });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!isUser(admin)) return admin;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { role?: UserRole; clearData?: boolean };
  if (body.clearData) {
    const cleared = clearUserData(admin.id, id);
    if (!cleared.ok) return NextResponse.json({ error: cleared.error }, { status: 400 });
    return NextResponse.json({ ok: true, cleared: cleared.value.cleared });
  }
  if (!body.role) return NextResponse.json({ error: "Indique role ou clearData" }, { status: 400 });
  const result = setUserRole(admin.id, id, body.role);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, user: result.value });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!isUser(admin)) return admin;
  const { id } = await ctx.params;
  const result = deleteUserAccount(admin.id, id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, deleted: result.value.deleted });
}
