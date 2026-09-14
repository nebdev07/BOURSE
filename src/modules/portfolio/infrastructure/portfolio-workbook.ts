import ExcelJS from "exceljs";
import { portfolioTemplateCsv, PORTFOLIO_CSV_HEADER } from "@/modules/portfolio/domain/import-csv";
import { rebuildPositionsFromTransactions } from "@/modules/portfolio/domain/ledger";
import { BROKER_EXTRACT_OPS } from "@/modules/portfolio/seed/broker-extract-example";
import { BRVM_LISTED } from "@/infrastructure/seed/brvm-listed-companies";

const C = {
  ink: "FF1A1A1A",
  ivory: "FFF7F3E8",
  gold: "FFC4A35A",
  goldDark: "FF8B6914",
  headerBg: "FF1F2A24",
  headerFg: "FFF7F3E8",
  rowAlt: "FFF3EEE0",
  row: "FFFFFFFF",
  accent: "FF2F5D50",
  muted: "FF5C5C5C",
  border: "FFD4CBB2",
  success: "FF1F6F54",
  sell: "FF9B2C2C",
  buy: "FF1F6F54",
};

export type PortfolioWorkbookKind = "modele" | "exemple";

const SYMBOL_NAMES: Record<string, string> = Object.fromEntries(BRVM_LISTED.map((c) => [c.symbol, c.name]));

function styleTitle(cell: ExcelJS.Cell, size = 18) {
  cell.font = { name: "Calibri", size, bold: true, color: { argb: C.ivory } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
}

function applyHeaderRow(row: ExcelJS.Row, colCount: number) {
  row.height = 28;
  for (let c = 1; c <= colCount; c += 1) {
    const cell = row.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } };
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: C.headerFg } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: C.gold } },
      left: { style: "thin", color: { argb: C.gold } },
      bottom: { style: "thin", color: { argb: C.gold } },
      right: { style: "thin", color: { argb: C.gold } },
    };
  }
}

function paintDataRow(row: ExcelJS.Row, colCount: number, alt: boolean) {
  row.height = 22;
  for (let c = 1; c <= colCount; c += 1) {
    const cell = row.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: alt ? C.rowAlt : C.row } };
    cell.font = { name: "Calibri", size: 11, color: { argb: C.ink } };
    cell.border = {
      top: { style: "hair", color: { argb: C.border } },
      left: { style: "hair", color: { argb: C.border } },
      bottom: { style: "hair", color: { argb: C.border } },
      right: { style: "hair", color: { argb: C.border } },
    };
    cell.alignment = { vertical: "middle" };
  }
}

export async function buildPortfolioWorkbook(kind: PortfolioWorkbookKind = "modele"): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "BRVM Investment Analyzer";
  wb.created = new Date();
  const filled = kind === "exemple";

  const ops = filled
    ? BROKER_EXTRACT_OPS.map((o) => ({
        symbol: o.symbol,
        side: o.side,
        tradedAt: o.tradedAt,
        unitPrice: o.unitPrice,
        quantity: o.quantity,
        note: o.note,
        title: o.title,
      }))
    : [];

  const ledger = rebuildPositionsFromTransactions(
    ops.map((o, i) => ({
      id: `seed-${i}`,
      symbol: o.symbol,
      side: o.side,
      quantity: o.quantity,
      unitPrice: o.unitPrice,
      tradedAt: o.tradedAt,
      note: o.note,
    })),
  );

  // ——— Accueil ———
  const cover = wb.addWorksheet("Accueil", {
    properties: { tabColor: { argb: C.gold } },
    views: [{ showGridLines: false }],
  });
  cover.columns = [{ width: 4 }, { width: 78 }, { width: 4 }];
  cover.getRow(3).height = 42;
  const banner = cover.getCell("B3");
  banner.value = "BRVM Investment Analyzer";
  banner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } };
  styleTitle(banner, 20);
  banner.alignment = { vertical: "middle", horizontal: "center" };

  cover.getRow(4).height = 28;
  const subtitle = cover.getCell("B4");
  subtitle.value = filled
    ? "Exemple admin — Historique d'opérations (extrait courtier)"
    : "Modèle vierge — Historique d'opérations portefeuille";
  subtitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.gold } };
  subtitle.font = { name: "Calibri", size: 13, bold: true, color: { argb: C.ink } };
  subtitle.alignment = { vertical: "middle", horizontal: "center" };

  cover.getCell("B6").value = "Principe";
  cover.getCell("B6").font = { name: "Calibri", size: 14, bold: true, color: { argb: C.accent } };
  const principles = filled
    ? [
        "• Fichier prérempli avec l'historique d'opérations de référence (admin uniquement).",
        "• Chaque ligne = une opération (BUY = acquisition/souscription, SELL = cession).",
        "• Une même action peut être achetée plusieurs fois à des prix et dates différents.",
        "• note = commentaire libre — optionnel, non utilisé dans l'analyse marché.",
        "• Sert au suivi de portefeuille (lots, P&L) — pas au signal Acheter/Attendre des fiches actions.",
        "• Importez ce fichier (.xlsx) depuis Mon portefeuille pour charger les positions.",
      ]
    : [
        "• Fichier vierge : ajoutez vos propres lignes dans l'onglet Historique (aucune donnée préremplie).",
        "• Chaque ligne = une opération (BUY = acquisition/souscription, SELL = cession).",
        "• Une même action peut être achetée plusieurs fois à des prix et dates différents.",
        "• note = commentaire libre (ex. « Acquisition SGI », n° d'ordre) — optionnel, non utilisé dans l'analyse marché.",
        "• Votre historique sert au suivi de portefeuille (lots, P&L) — pas au signal Acheter/Attendre des fiches actions.",
        "• Importez ce fichier (.xlsx) depuis Mon portefeuille une fois rempli.",
      ];
  principles.forEach((t, i) => {
    cover.getCell(`B${8 + i}`).value = t;
    cover.getCell(`B${8 + i}`).font = { name: "Calibri", size: 11, color: { argb: C.muted } };
  });
  cover.getCell("B15").value = filled
    ? `${ops.length} opérations préchargées — téléchargement réservé à l'administrateur.`
    : "Aucune opération préchargée — modèle destiné à tous les utilisateurs.";
  cover.getCell("B15").font = { name: "Calibri", size: 10, italic: true, color: { argb: C.goldDark } };

  // ——— Historique ———
  const hist = wb.addWorksheet("Historique", {
    properties: { tabColor: { argb: C.accent } },
    views: [{ state: "frozen", ySplit: 5 }],
  });
  hist.columns = [
    { width: 12 },
    { width: 10 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 42 },
  ];
  hist.mergeCells("A1:G1");
  hist.getRow(1).height = 34;
  hist.getCell("A1").value = "Historique des opérations";
  hist.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } };
  styleTitle(hist.getCell("A1"), 16);
  hist.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

  hist.mergeCells("A2:G2");
  hist.getRow(2).height = 22;
  hist.getCell("A2").value =
    "Colonnes d'import : symbol · side (BUY|SELL) · quantity · unit_price · traded_at · note";
  hist.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.gold } };
  hist.getCell("A2").font = { name: "Calibri", size: 10, bold: true, color: { argb: C.ink } };
  hist.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

  const hHeaders = ["symbol", "side", "quantity", "unit_price", "traded_at", "montant", "note"];
  const hRow = hist.getRow(5);
  hHeaders.forEach((h, i) => {
    hRow.getCell(i + 1).value = h;
  });
  applyHeaderRow(hRow, 7);

  ops.forEach((op, idx) => {
    const row = hist.getRow(6 + idx);
    const montant = op.quantity * op.unitPrice;
    row.getCell(1).value = op.symbol;
    row.getCell(2).value = op.side;
    row.getCell(3).value = op.quantity;
    row.getCell(4).value = op.unitPrice;
    row.getCell(5).value = op.tradedAt;
    row.getCell(6).value = montant;
    row.getCell(7).value = op.note;
    paintDataRow(row, 7, idx % 2 === 1);
    row.getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: C.accent } };
    row.getCell(2).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: op.side === "SELL" ? C.sell : C.buy },
    };
    row.getCell(4).numFmt = "#,##0";
    row.getCell(6).numFmt = '#,##0 "FCFA"';
    row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
    row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
    row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
  });

  // ——— Positions (reconstituées) ———
  const sheet = wb.addWorksheet("Positions", {
    properties: { tabColor: { argb: C.goldDark } },
    views: [{ state: "frozen", ySplit: 5 }],
  });
  sheet.columns = [
    { width: 12 },
    { width: 34 },
    { width: 12 },
    { width: 16 },
    { width: 14 },
    { width: 16 },
    { width: 12 },
  ];
  sheet.mergeCells("A1:G1");
  sheet.getRow(1).height = 34;
  sheet.getCell("A1").value = "Positions restantes (après cessions, FIFO)";
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } };
  styleTitle(sheet.getCell("A1"), 16);
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

  sheet.mergeCells("A2:G2");
  sheet.getRow(2).height = 22;
  sheet.getCell("A2").value = "Calculées automatiquement depuis l'onglet Historique — ne pas importer cette feuille seule";
  sheet.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.gold } };
  sheet.getCell("A2").font = { name: "Calibri", size: 10, bold: true, color: { argb: C.ink } };
  sheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

  const pHeaders = ["symbol", "Société", "quantity", "avg_cost", "1er achat", "Coût total", "lots"];
  const pHeader = sheet.getRow(5);
  pHeaders.forEach((h, i) => {
    pHeader.getCell(i + 1).value = h;
  });
  applyHeaderRow(pHeader, 7);

  let totalCost = 0;
  ledger.positions.forEach((pos, idx) => {
    const row = sheet.getRow(6 + idx);
    totalCost += pos.costBasis;
    row.getCell(1).value = pos.symbol;
    row.getCell(2).value = SYMBOL_NAMES[pos.symbol] ?? pos.symbol;
    row.getCell(3).value = pos.quantity;
    row.getCell(4).value = Math.round(pos.avgCost * 100) / 100;
    row.getCell(5).value = pos.firstPurchaseAt;
    row.getCell(6).value = Math.round(pos.costBasis);
    row.getCell(7).value = pos.lots.length;
    paintDataRow(row, 7, idx % 2 === 1);
    row.getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: C.accent } };
    row.getCell(4).numFmt = "#,##0.00";
    row.getCell(6).numFmt = '#,##0 "FCFA"';
  });

  const totalRowIdx = 6 + ledger.positions.length;
  const totalRow = sheet.getRow(totalRowIdx);
  sheet.mergeCells(`A${totalRowIdx}:E${totalRowIdx}`);
  totalRow.getCell(1).value = "TOTAL COÛT D'ACHAT (positions ouvertes)";
  totalRow.getCell(6).value = Math.round(totalCost);
  totalRow.getCell(6).numFmt = '#,##0 "FCFA"';
  totalRow.height = 26;
  for (let c = 1; c <= 7; c += 1) {
    const cell = totalRow.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.accent } };
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: C.ivory } };
  }

  // ——— Guide ———
  const guide = wb.addWorksheet("Guide", { properties: { tabColor: { argb: C.border } } });
  guide.columns = [{ width: 16 }, { width: 14 }, { width: 58 }];
  guide.mergeCells("A1:C1");
  guide.getRow(1).height = 28;
  guide.getCell("A1").value = "Dictionnaire";
  guide.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } };
  styleTitle(guide.getCell("A1"), 14);
  guide.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  const gHeader = guide.getRow(3);
  ["Colonne", "Obligatoire", "Description"].forEach((h, i) => {
    gHeader.getCell(i + 1).value = h;
  });
  applyHeaderRow(gHeader, 3);
  const guideRows: Array<[string, string, string]> = [
    ["symbol", "Oui", "Ticker BRVM (BOAC, ORAC…)."],
    ["side", "Oui", "BUY = achat/souscription · SELL = cession/vente."],
    ["quantity", "Oui", "Nombre de titres de l'opération."],
    ["unit_price", "Oui", "Prix unitaire FCFA de cette opération (pas le prix moyen)."],
    ["traded_at", "Oui", "Date AAAA-MM-JJ de l'opération."],
    ["note", "Non", "Commentaire libre (libellé courtier, n° d'ordre…). Non utilisé dans l'analyse marché."],
  ];
  guideRows.forEach((vals, idx) => {
    const row = guide.getRow(4 + idx);
    vals.forEach((v, i) => {
      row.getCell(i + 1).value = v;
    });
    paintDataRow(row, 3, idx % 2 === 1);
  });

  // Exemple admin : ouvrir directement l'onglet Historique (données visibles)
  wb.views = [
    {
      x: 0,
      y: 0,
      width: 12000,
      height: 20000,
      firstSheet: 0,
      activeTab: filled ? 1 : 0,
      visibility: "visible",
    },
  ];

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Prefer Historique sheet → CSV plateforme étendu. */
export async function workbookToPortfolioCsv(data: ArrayBuffer | Buffer): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const payload = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await wb.xlsx.load(payload as unknown as ExcelJS.Buffer);
  const sheet =
    wb.getWorksheet("Historique") ??
    wb.worksheets.find((s) => /histor/i.test(s.name)) ??
    wb.getWorksheet("Positions") ??
    wb.worksheets[0];
  if (!sheet) throw new Error("Classeur Excel sans feuille utilisable");

  let headerRowIdx = 1;
  sheet.eachRow((row, rowNumber) => {
    const a = String(row.getCell(1).value ?? "")
      .toLowerCase()
      .trim();
    const b = String(row.getCell(2).value ?? "")
      .toLowerCase()
      .trim();
    if (a === "symbol" && (b === "side" || b === "quantity" || b.startsWith("soci"))) {
      headerRowIdx = rowNumber;
    }
  });

  const header = sheet.getRow(headerRowIdx);
  const headers: string[] = [];
  header.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = String(cell.value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  });

  const findCol = (...names: string[]) => {
    for (let i = 0; i < headers.length; i += 1) {
      const h = headers[i] ?? "";
      if (names.some((n) => h === n || h.startsWith(n))) return i;
    }
    return -1;
  };

  const cSymbol = findCol("symbol", "symbole");
  const cSide = findCol("side", "sens");
  const cQty = findCol("quantity", "quantite");
  const cCost = findCol("unit_price", "avg_cost", "prix");
  const cDate = findCol("traded_at", "purchased_at", "date");
  const cNote = findCol("note");
  if (cSymbol < 0 || cQty < 0 || cCost < 0) {
    throw new Error("Colonnes symbol / quantity / unit_price introuvables");
  }

  const lines = [PORTFOLIO_CSV_HEADER];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIdx) return;
    const symbol = String(row.getCell(cSymbol).text || row.getCell(cSymbol).value || "").trim();
    if (!symbol || /total/i.test(symbol)) return;
    const quantity = String(row.getCell(cQty).value ?? "").trim();
    const unitPrice = String(row.getCell(cCost).value ?? "").trim();
    if (!quantity || !unitPrice) return;
    const sideRaw = cSide > 0 ? String(row.getCell(cSide).value ?? "BUY").trim().toUpperCase() : "BUY";
    const side = sideRaw === "SELL" || sideRaw === "VENTE" || sideRaw === "CESSION" ? "SELL" : "BUY";
    const tradedAt = cDate > 0 ? String(row.getCell(cDate).text || row.getCell(cDate).value || "").trim() : "";
    const note = cNote > 0 ? String(row.getCell(cNote).text || row.getCell(cNote).value || "").replace(/,/g, " ") : "";
    lines.push(`${symbol},${side},${quantity},${unitPrice},${tradedAt},${note}`);
  });

  if (lines.length < 2) throw new Error("Aucune opération lisible dans le fichier Excel");
  return lines.join("\n");
}

// keep CSV helper reachable for API format=csv
export { portfolioTemplateCsv };
