import { normalizeAmount, normalizeDate, normalizeSymbol } from "@/shared/normalize";
import type { Result } from "@/shared/result";
import { err, ok } from "@/shared/result";

export interface NormalizedQuoteRow {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuoteValidationError {
  row: number;
  reason: string;
  raw: string;
}

export function parseCsv(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => splitCsvLine(line));
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseQuoteCsv(text: string): Result<{ rows: NormalizedQuoteRow[]; rejected: QuoteValidationError[] }> {
  const table = parseCsv(text);
  if (table.length < 2) return err("CSV vide ou sans en-tête");
  const header = table[0].map((h) => h.toLowerCase());
  const idx = {
    symbol: header.indexOf("symbol"),
    date: header.indexOf("date"),
    open: header.indexOf("open"),
    high: header.indexOf("high"),
    low: header.indexOf("low"),
    close: header.indexOf("close"),
    volume: header.indexOf("volume"),
  };
  if (idx.symbol < 0 || idx.date < 0 || idx.close < 0) {
    return err("En-tête CSV invalide (symbol,date,close obligatoires)");
  }

  const rows: NormalizedQuoteRow[] = [];
  const rejected: QuoteValidationError[] = [];

  table.slice(1).forEach((cols, i) => {
    const rowNum = i + 2;
    const raw = cols.join(",");
    const symbol = normalizeSymbol(cols[idx.symbol]);
    const date = normalizeDate(cols[idx.date]);
    const close = normalizeAmount(cols[idx.close]);
    const open = idx.open >= 0 ? normalizeAmount(cols[idx.open]) : close;
    const high = idx.high >= 0 ? normalizeAmount(cols[idx.high]) : close;
    const low = idx.low >= 0 ? normalizeAmount(cols[idx.low]) : close;
    const volume = idx.volume >= 0 ? normalizeAmount(cols[idx.volume]) ?? 0 : 0;

    if (!symbol) {
      rejected.push({ row: rowNum, reason: "symbol invalide", raw });
      return;
    }
    if (!date) {
      rejected.push({ row: rowNum, reason: "date invalide", raw });
      return;
    }
    if (close === null || close <= 0) {
      rejected.push({ row: rowNum, reason: "price > 0 requis", raw });
      return;
    }
    if ((open ?? 0) < 0 || (high ?? 0) < 0 || (low ?? 0) < 0 || volume < 0) {
      rejected.push({ row: rowNum, reason: "valeurs négatives", raw });
      return;
    }
    rows.push({
      symbol,
      date,
      open: open ?? close,
      high: high ?? close,
      low: low ?? close,
      close,
      volume,
    });
  });

  return ok({ rows, rejected });
}

export function parseDividendCsv(text: string): Result<{
  rows: Array<{
    symbol: string;
    exerciseYear: number;
    grossAmount: number;
    netAmount: number;
    announcementDate: string | null;
    paymentDate: string | null;
  }>;
  rejected: QuoteValidationError[];
}> {
  const table = parseCsv(text);
  if (table.length < 2) return err("CSV vide ou sans en-tête");
  const header = table[0].map((h) => h.toLowerCase());
  const idx = {
    symbol: header.indexOf("symbol"),
    year: header.indexOf("year") >= 0 ? header.indexOf("year") : header.indexOf("exerciseyear"),
    gross: header.indexOf("gross") >= 0 ? header.indexOf("gross") : header.indexOf("grossamount"),
    net: header.indexOf("net") >= 0 ? header.indexOf("net") : header.indexOf("netamount"),
    announcement: header.indexOf("announcementdate"),
    payment: header.indexOf("paymentdate"),
  };
  if (idx.symbol < 0 || idx.year < 0 || idx.gross < 0) return err("En-tête dividende invalide");

  const rows: Array<{
    symbol: string;
    exerciseYear: number;
    grossAmount: number;
    netAmount: number;
    announcementDate: string | null;
    paymentDate: string | null;
  }> = [];
  const rejected: QuoteValidationError[] = [];
  table.slice(1).forEach((cols, i) => {
    const raw = cols.join(",");
    const symbol = normalizeSymbol(cols[idx.symbol]);
    const year = Number(cols[idx.year]);
    const gross = normalizeAmount(cols[idx.gross]);
    const net = idx.net >= 0 ? normalizeAmount(cols[idx.net]) : gross;
    if (!symbol || !Number.isInteger(year) || year < 1990) {
      rejected.push({ row: i + 2, reason: "symbol/année invalides", raw });
      return;
    }
    if (gross === null || gross < 0) {
      rejected.push({ row: i + 2, reason: "dividend >= 0 requis", raw });
      return;
    }
    rows.push({
      symbol,
      exerciseYear: year,
      grossAmount: gross,
      netAmount: net ?? gross,
      announcementDate: idx.announcement >= 0 ? normalizeDate(cols[idx.announcement]) : null,
      paymentDate: idx.payment >= 0 ? normalizeDate(cols[idx.payment]) : null,
    });
  });
  return ok({ rows, rejected });
}

export function parseFinancialCsv(text: string): Result<{
  rows: Array<{
    symbol: string;
    fiscalYear: number;
    revenue: number | null;
    netIncome: number | null;
    eps: number | null;
    roe: number | null;
    debt: number | null;
    equity: number | null;
    cashFlow: number | null;
    sharesOutstanding: number | null;
  }>;
  rejected: QuoteValidationError[];
}> {
  const table = parseCsv(text);
  if (table.length < 2) return err("CSV vide ou sans en-tête");
  const header = table[0].map((h) => h.toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    symbol: col("symbol"),
    year: col("year") >= 0 ? col("year") : col("fiscalyear"),
    revenue: col("revenue"),
    netIncome: col("netincome"),
    eps: col("eps"),
    roe: col("roe"),
    debt: col("debt"),
    equity: col("equity"),
    cashFlow: col("cashflow"),
    shares: col("shares"),
  };
  if (idx.symbol < 0 || idx.year < 0) return err("En-tête financier invalide");

  const rows: Array<{
    symbol: string;
    fiscalYear: number;
    revenue: number | null;
    netIncome: number | null;
    eps: number | null;
    roe: number | null;
    debt: number | null;
    equity: number | null;
    cashFlow: number | null;
    sharesOutstanding: number | null;
  }> = [];
  const rejected: QuoteValidationError[] = [];
  table.slice(1).forEach((cols, i) => {
    const raw = cols.join(",");
    const symbol = normalizeSymbol(cols[idx.symbol]);
    const year = Number(cols[idx.year]);
    const eps = idx.eps >= 0 ? normalizeAmount(cols[idx.eps]) : null;
    if (!symbol || !Number.isInteger(year)) {
      rejected.push({ row: i + 2, reason: "symbol/année invalides", raw });
      return;
    }
    if (eps !== null && !Number.isFinite(eps)) {
      rejected.push({ row: i + 2, reason: "EPS invalide", raw });
      return;
    }
    rows.push({
      symbol,
      fiscalYear: year,
      revenue: opt(cols, idx.revenue),
      netIncome: opt(cols, idx.netIncome),
      eps,
      roe: opt(cols, idx.roe),
      debt: opt(cols, idx.debt),
      equity: opt(cols, idx.equity),
      cashFlow: opt(cols, idx.cashFlow),
      sharesOutstanding: opt(cols, idx.shares),
    });
  });
  return ok({ rows, rejected });
}

function opt(cols: string[], index: number): number | null {
  if (index < 0 || cols[index] === undefined || cols[index] === "") return null;
  return normalizeAmount(cols[index]);
}
