import { NextResponse } from "next/server";
import { isUser, requireAdmin } from "@/app/api/_lib/session";
import { loadStore } from "@/infrastructure/persistence/file-store";
import { setSourceActive, testSource } from "@/modules/application/workspace";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!isUser(admin)) return admin;
  ensureSeeded();
  return NextResponse.json({ sources: loadStore().sources });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!isUser(admin)) return admin;
  const body = (await request.json()) as { id?: string; active?: boolean; test?: boolean };
  if (body.test && body.id) return NextResponse.json(testSource(body.id));
  if (body.id) setSourceActive(body.id, Boolean(body.active));
  return NextResponse.json({ ok: true });
}
