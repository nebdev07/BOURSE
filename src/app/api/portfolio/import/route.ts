import { NextResponse } from "next/server";
import { isUser, requireAdmin, requireUser } from "@/app/api/_lib/session";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";
import { importHoldingsCsv } from "@/modules/portfolio/application/portfolio-service";
import { portfolioExampleCsv, portfolioTemplateCsv } from "@/modules/portfolio/domain/import-csv";
import {
  buildPortfolioWorkbook,
  workbookToPortfolioCsv,
} from "@/modules/portfolio/infrastructure/portfolio-workbook";
import { adminPortfolioExampleEnabled } from "@/infrastructure/security/feature-flags";
import { limitPortfolioImport } from "@/infrastructure/security/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Téléchargement modèle.
 * - kind=modele (défaut) : vierge, tous utilisateurs
 * - kind=exemple : prérempli — admin + ENABLE_ADMIN_PORTFOLIO_EXAMPLE (off en prod par défaut)
 * ?format=xlsx|csv (défaut xlsx)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") ?? "xlsx").toLowerCase();
  const kindRaw = (url.searchParams.get("kind") ?? "modele").toLowerCase();
  const kind = kindRaw === "exemple" ? "exemple" : "modele";

  if (kind === "exemple") {
    if (!adminPortfolioExampleEnabled()) {
      return NextResponse.json({ error: "Exemple admin désactivé sur cet environnement" }, { status: 403 });
    }
    const admin = await requireAdmin();
    if (!isUser(admin)) return admin;

    if (format === "csv") {
      return new NextResponse(portfolioExampleCsv(), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="portefeuille-exemple-admin.csv"`,
        },
      });
    }

    const buffer = await buildPortfolioWorkbook("exemple");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="BRVM-Portefeuille-Exemple-Admin.xlsx"`,
      },
    });
  }

  if (format === "csv") {
    return new NextResponse(portfolioTemplateCsv(), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="portefeuille-modele.csv"`,
      },
    });
  }

  const buffer = await buildPortfolioWorkbook("modele");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="BRVM-Portefeuille-Modele.xlsx"`,
    },
  });
}

export async function POST(request: Request) {
  const limited = limitPortfolioImport(request);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop d’imports. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  ensureSeeded();
  const user = await requireUser();
  if (!isUser(user)) return user;

  let text = "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant (champ file)" }, { status: 400 });
    }
    const name = file.name.toLowerCase();
    const isXlsx = name.endsWith(".xlsx") || name.endsWith(".xlsm");
    const isCsv = name.endsWith(".csv") || file.type.includes("csv") || file.type.includes("text");
    if (isXlsx) {
      try {
        text = await workbookToPortfolioCsv(await file.arrayBuffer());
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Lecture Excel impossible" },
          { status: 400 },
        );
      }
    } else if (isCsv) {
      text = await file.text();
    } else {
      return NextResponse.json({ error: "Format non supporté (.xlsx ou .csv)" }, { status: 400 });
    }
  } else {
    text = await request.text();
  }

  const result = importHoldingsCsv(user.id, text);
  if (result.imported === 0 && result.errors.length > 0) {
    return NextResponse.json({ error: result.errors[0], errors: result.errors }, { status: 400 });
  }
  return NextResponse.json(result);
}
