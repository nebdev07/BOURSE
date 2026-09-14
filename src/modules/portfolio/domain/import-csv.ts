import { normalizeAmount, normalizeDate, normalizeSymbol } from "@/shared/normalize";
import { BRVM_LISTED } from "@/infrastructure/seed/brvm-listed-companies";
import { err, ok, type Result } from "@/shared/result";
import { brokerExtractHistoryCsv } from "@/modules/portfolio/seed/broker-extract-example";

export interface PortfolioImportRow {
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  unitPrice: number;
  tradedAt: string | null;
  note: string | null;
  sourceRow: number;
}

export interface PortfolioImportError {
  row: number;
  reason: string;
  raw: string;
}

const NAME_ALIASES: Array<{ match: RegExp; symbol: string }> = [
  { match: /\bbank\s*of\s*africa\s*(ci|côte|cote)?\b|\bboa\s*ci\b/i, symbol: "BOAC" },
  { match: /\bbic\s*b[ée]nin\b|\bbiic\s*b[ée]nin\b/i, symbol: "BICB" },
  { match: /\bcie\b/i, symbol: "CIEC" },
  { match: /\bfiltisac\b/i, symbol: "FTSC" },
  { match: /\bonatel\b/i, symbol: "ONTBF" },
  { match: /\borange\b/i, symbol: "ORAC" },
  { match: /\bsib\b|soci[eé]t[eé]\s*ivoirienne\s*de\s*banque/i, symbol: "SIBC" },
  { match: /\buniwax\b/i, symbol: "UNXC" },
  { match: /\bvivo\s*energy\b/i, symbol: "SHEC" },
];

export function resolveListedSymbol(raw: string): string | null {
  const asSymbol = normalizeSymbol(raw);
  if (asSymbol && BRVM_LISTED.some((c) => c.symbol === asSymbol)) return asSymbol;

  const compact = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  for (const alias of NAME_ALIASES) {
    if (alias.match.test(raw) || alias.match.test(compact)) return alias.symbol;
  }

  const listed = BRVM_LISTED.find((c) => {
    const name = c.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return compact.includes(name) || name.includes(compact);
  });
  return listed?.symbol ?? null;
}

function detectDelimiter(headerLine: string): "," | ";" {
  const semi = (headerLine.match(/;/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  return semi > comma ? ";" : ",";
}

function splitLine(line: string, delimiter: "," | ";"): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === delimiter && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function normHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function col(header: string[], ...names: string[]): number {
  for (const name of names) {
    const i = header.indexOf(name);
    if (i >= 0) return i;
  }
  return -1;
}

function parseSide(raw: string | undefined): "BUY" | "SELL" | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase();
  if (s === "BUY" || s === "ACHAT" || s === "ACQUISITION" || s === "SOUSCRIPTION") return "BUY";
  if (s === "SELL" || s === "VENTE" || s === "CESSION") return "SELL";
  return null;
}

/** Parse CSV historique (plateforme) ou extrait courtier. */
export function parsePortfolioCsv(text: string): Result<{
  rows: PortfolioImportRow[];
  rejected: PortfolioImportError[];
  format: "platform" | "broker";
}> {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return err("CSV vide ou sans données (en-tête + au moins 1 ligne)");

  const delimiter = detectDelimiter(lines[0]!);
  const table = lines.map((l) => splitLine(l, delimiter));
  const header = table[0]!.map(normHeader);

  const platform = {
    symbol: col(header, "symbol", "symbole", "ticker"),
    side: col(header, "side", "sens", "type", "operation"),
    quantity: col(header, "quantity", "quantite", "qty", "qte"),
    unitPrice: col(header, "unit_price", "unitprice", "avg_cost", "avgcost", "prix_achat", "prix", "valeur_unitaire"),
    tradedAt: col(header, "traded_at", "purchased_at", "date", "date_achat", "date_operation"),
    note: col(header, "note", "libelle", "commentaire"),
  };

  const broker = {
    titre: col(header, "titre", "valeur", "instrument"),
    date: col(header, "date"),
    libelle: col(header, "libelle", "label", "operation"),
    unit: col(header, "valeur_unitaire", "cours", "prix", "pu"),
    debit: col(header, "debit"),
    credit: col(header, "credit"),
  };

  const isBroker =
    broker.titre >= 0 &&
    (broker.credit >= 0 || broker.debit >= 0) &&
    platform.symbol < 0;

  if (!isBroker && (platform.symbol < 0 || platform.quantity < 0 || platform.unitPrice < 0)) {
    return err(
      "En-tête invalide. Format : symbol,side,quantity,unit_price,traded_at,note — ou extrait courtier (Titre,Date,Libellé,Valeur Unitaire,Débit,Crédit,Solde).",
    );
  }

  const rows: PortfolioImportRow[] = [];
  const rejected: PortfolioImportError[] = [];
  let currentTitre = "";

  table.slice(1).forEach((cols, i) => {
    const rowNum = i + 2;
    const raw = cols.join(delimiter);

    if (isBroker) {
      const titreCell = broker.titre >= 0 ? (cols[broker.titre] ?? "").trim() : "";
      if (titreCell) currentTitre = titreCell;
      const libelle = broker.libelle >= 0 ? (cols[broker.libelle] ?? "") : "";
      if (/solde\s+au/i.test(libelle)) return;

      const credit = broker.credit >= 0 ? normalizeAmount(cols[broker.credit]) : null;
      const debit = broker.debit >= 0 ? normalizeAmount(cols[broker.debit]) : null;
      const unit = broker.unit >= 0 ? normalizeAmount(cols[broker.unit]) : null;

      let side: "BUY" | "SELL" | null = null;
      let quantity: number | null = null;
      if (/cession|vente/i.test(libelle) || (debit != null && debit > 0 && (credit == null || credit === 0))) {
        side = "SELL";
        quantity = debit;
      } else if (
        /acquisition|souscription/i.test(libelle) ||
        (credit != null && credit > 0 && (debit == null || debit === 0))
      ) {
        side = "BUY";
        quantity = credit;
      }
      if (!side || quantity == null || quantity <= 0) return;
      if (unit == null || unit <= 0) {
        rejected.push({ row: rowNum, reason: "valeur unitaire manquante", raw });
        return;
      }
      const symbol = resolveListedSymbol(currentTitre || libelle);
      if (!symbol) {
        rejected.push({ row: rowNum, reason: `titre non reconnu : ${currentTitre || libelle}`, raw });
        return;
      }
      rows.push({
        symbol,
        side,
        quantity,
        unitPrice: unit,
        tradedAt: broker.date >= 0 ? normalizeDate(cols[broker.date]) : null,
        note: libelle || `${side} ${currentTitre}`,
        sourceRow: rowNum,
      });
      return;
    }

    const symbolRaw = cols[platform.symbol] ?? "";
    const symbol = resolveListedSymbol(symbolRaw) ?? normalizeSymbol(symbolRaw);
    const quantity = normalizeAmount(cols[platform.quantity]);
    const unitPrice = normalizeAmount(cols[platform.unitPrice]);
    const tradedAt = platform.tradedAt >= 0 ? normalizeDate(cols[platform.tradedAt]) : null;
    const note = platform.note >= 0 ? cols[platform.note] || null : null;
    const side =
      platform.side >= 0 ? parseSide(cols[platform.side]) : "BUY";

    if (!symbol) {
      rejected.push({ row: rowNum, reason: `symbole inconnu : ${symbolRaw}`, raw });
      return;
    }
    if (!side) {
      rejected.push({ row: rowNum, reason: "side invalide (BUY|SELL)", raw });
      return;
    }
    if (quantity == null || quantity <= 0) {
      rejected.push({ row: rowNum, reason: "quantité invalide", raw });
      return;
    }
    if (unitPrice == null || unitPrice <= 0) {
      rejected.push({ row: rowNum, reason: "prix unitaire invalide", raw });
      return;
    }
    rows.push({ symbol, side, quantity, unitPrice, tradedAt, note, sourceRow: rowNum });
  });

  if (rows.length === 0) {
    return err(rejected[0]?.reason ?? "Aucune opération exploitable");
  }
  return ok({ rows, rejected, format: isBroker ? "broker" : "platform" });
}

export const PORTFOLIO_CSV_HEADER = "symbol,side,quantity,unit_price,traded_at,note";

/** Modèle vierge destiné à tous les utilisateurs (en-tête seul). */
export function portfolioTemplateCsv(): string {
  return `${PORTFOLIO_CSV_HEADER}\n`;
}

/** Extrait courtier prérempli — téléchargement réservé à l’admin (`kind=exemple`). */
export function portfolioExampleCsv(): string {
  return brokerExtractHistoryCsv();
}
