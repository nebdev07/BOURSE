import { NextResponse } from "next/server";

/** Ingestion / analyse : secret opérateur, pas de rôle utilisateur. */
export function requireJobSecret(request: Request): NextResponse | null {
  const secret = process.env.JOB_SECRET;
  const header = request.headers.get("x-job-secret");
  if (process.env.NODE_ENV === "production") {
    if (!secret || header !== secret) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  } else if (secret && header !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return null;
}
