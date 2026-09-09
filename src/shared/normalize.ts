/**
 * Normalisation des données externes (FCFA, dates, symboles, pourcentages).
 * Le domaine ne stocke que des formes canoniques.
 */

export function normalizeSymbol(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const symbol = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return symbol.length >= 2 && symbol.length <= 12 ? symbol : null;
}

export function normalizeAmount(input: unknown): number | null {
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : null;
  }
  if (typeof input !== "string") return null;

  let raw = input.trim();
  if (!raw) return null;
  raw = raw.replace(/FCFA|XOF|CFA\s*F?|EUR|USD/gi, "").trim();
  raw = raw.replace(/\u00a0/g, " ").replace(/\s/g, "");
  if (!raw) return null;

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else {
      raw = raw.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    const decimals = raw.length - lastComma - 1;
    raw = decimals <= 2 ? raw.replace(",", ".") : raw.replace(/,/g, "");
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function normalizePercent(input: unknown): number | null {
  if (typeof input === "string" && input.includes("%")) {
    const n = normalizeAmount(input.replace("%", ""));
    return n;
  }
  const n = normalizeAmount(input);
  if (n === null) return null;
  if (Math.abs(n) <= 1 && String(input).includes(".") && !String(input).includes("%")) {
    return n * 100;
  }
  return n;
}

export function normalizeDate(input: unknown): string | null {
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input.toISOString().slice(0, 10);
  }
  if (typeof input !== "string") return null;
  const s = input.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const fr = /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/.exec(s);
  if (fr) {
    const dd = fr[1].padStart(2, "0");
    const mm = fr[2].padStart(2, "0");
    const yyyy = fr[3];
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
