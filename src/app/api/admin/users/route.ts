import { NextResponse } from "next/server";
import { isUser, requireAdmin } from "@/app/api/_lib/session";
import { listAdminUsers, permissionsForRole } from "@/modules/identity/application/admin-users";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!isUser(admin)) return admin;
  return NextResponse.json({
    users: listAdminUsers(),
    me: { id: admin.id, email: admin.email, role: admin.role, permissions: permissionsForRole(admin.role) },
  });
}
