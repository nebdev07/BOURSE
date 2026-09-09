import { NextResponse } from "next/server";
import { deleteAlert } from "@/modules/application/workspace";
import { isUser, requireUser } from "@/app/api/_lib/session";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!isUser(user)) return user;
  const { id } = await context.params;
  const ok = deleteAlert(user.id, id);
  return NextResponse.json({ ok });
}
