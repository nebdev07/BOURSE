export type DataSourceType =
  | "OFFICIAL_BRVM"
  | "OFFICIAL_DOC"
  | "RELIABLE"
  | "SCRAPING"
  | "MANUAL"
  | "SEED";

export interface Provenance {
  source: string;
  sourceType: DataSourceType;
  sourceUrl: string | null;
  retrievedAt: string;
  referenceDate: string;
  confidence: number;
}

export function provenance(partial: Partial<Provenance> & Pick<Provenance, "source" | "sourceType">): Provenance {
  const now = new Date().toISOString();
  return {
    source: partial.source,
    sourceType: partial.sourceType,
    sourceUrl: partial.sourceUrl ?? null,
    retrievedAt: partial.retrievedAt ?? now,
    referenceDate: partial.referenceDate ?? now.slice(0, 10),
    confidence: partial.confidence ?? defaultConfidence(partial.sourceType),
  };
}

export function defaultConfidence(type: DataSourceType): number {
  switch (type) {
    case "OFFICIAL_BRVM":
    case "OFFICIAL_DOC":
      return 95;
    case "RELIABLE":
      return 80;
    case "MANUAL":
    case "SEED":
      return 75;
    case "SCRAPING":
      return 55;
    default:
      return 50;
  }
}
