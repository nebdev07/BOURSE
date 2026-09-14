/**
 * Historique d’opérations extrait du relevé courtier (édition ~10/09/2026).
 * Chaque ligne = une acquisition, souscription ou cession.
 * Les prix sont en FCFA (valeur unitaire du relevé).
 */
export interface BrokerOpSeed {
  title: string;
  symbol: string;
  side: "BUY" | "SELL";
  tradedAt: string;
  unitPrice: number;
  quantity: number;
  note: string;
}

export const BROKER_EXTRACT_OPS: BrokerOpSeed[] = [
  // —— BANK OF AFRICA CI (BOAC) ——
  { title: "BANK OF AFRICA CI", symbol: "BOAC", side: "BUY", tradedAt: "2025-01-28", unitPrice: 6750, quantity: 10, note: "Acquisitions BANK OF AFRICA CI" },
  { title: "BANK OF AFRICA CI", symbol: "BOAC", side: "BUY", tradedAt: "2025-02-21", unitPrice: 6050, quantity: 2, note: "Acquisitions BANK OF AFRICA CI" },
  { title: "BANK OF AFRICA CI", symbol: "BOAC", side: "BUY", tradedAt: "2025-03-05", unitPrice: 5150, quantity: 5, note: "Acquisitions BANK OF AFRICA CI" },
  { title: "BANK OF AFRICA CI", symbol: "BOAC", side: "BUY", tradedAt: "2025-07-03", unitPrice: 5475, quantity: 10, note: "Acquisitions BANK OF AFRICA CI" },
  { title: "BANK OF AFRICA CI", symbol: "BOAC", side: "BUY", tradedAt: "2025-07-09", unitPrice: 5450, quantity: 10, note: "Acquisitions BANK OF AFRICA CI" },
  { title: "BANK OF AFRICA CI", symbol: "BOAC", side: "BUY", tradedAt: "2025-08-11", unitPrice: 7100, quantity: 5, note: "Acquisitions BANK OF AFRICA CI" },
  { title: "BANK OF AFRICA CI", symbol: "BOAC", side: "BUY", tradedAt: "2025-08-11", unitPrice: 6800, quantity: 5, note: "Acquisitions BANK OF AFRICA CI" },

  // —— BIC BENIN (BICB) ——
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2025-02-21", unitPrice: 6250, quantity: 9, note: "Souscription BIC BENIN" },
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2025-02-28", unitPrice: 5550, quantity: 5, note: "Acquisitions BIC BENIN" },
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2025-03-27", unitPrice: 5225, quantity: 9, note: "Acquisitions BIC BENIN" },
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2025-05-05", unitPrice: 5550, quantity: 3, note: "Acquisitions BIC BENIN" },
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2025-07-04", unitPrice: 6250, quantity: 10, note: "Acquisitions BIC BENIN" },
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2025-08-19", unitPrice: 5000, quantity: 10, note: "Acquisitions BIC BENIN" },
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2025-10-05", unitPrice: 6100, quantity: 3, note: "Acquisitions BIC BENIN" },
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2025-10-20", unitPrice: 5290, quantity: 10, note: "Acquisitions BIC BENIN" },
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2025-12-05", unitPrice: 6295, quantity: 10, note: "Acquisitions BIC BENIN" },
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2025-12-08", unitPrice: 6000, quantity: 4, note: "Acquisitions BIC BENIN" },
  { title: "BIC BENIN", symbol: "BICB", side: "BUY", tradedAt: "2026-08-11", unitPrice: 5620, quantity: 10, note: "Acquisitions BIC BENIN" },

  // —— CIE CI (CIEC) ——
  { title: "CIE CI", symbol: "CIEC", side: "BUY", tradedAt: "2025-01-28", unitPrice: 2281, quantity: 20, note: "Acquisitions CIE CI" },
  { title: "CIE CI", symbol: "CIEC", side: "BUY", tradedAt: "2025-06-16", unitPrice: 2300, quantity: 10, note: "Acquisitions CIE CI" },
  { title: "CIE CI", symbol: "CIEC", side: "BUY", tradedAt: "2025-07-04", unitPrice: 2320, quantity: 5, note: "Acquisitions CIE CI" },
  { title: "CIE CI", symbol: "CIEC", side: "BUY", tradedAt: "2025-07-16", unitPrice: 2400, quantity: 10, note: "Acquisitions CIE CI" },
  { title: "CIE CI", symbol: "CIEC", side: "BUY", tradedAt: "2025-07-18", unitPrice: 2281, quantity: 8, note: "Acquisitions CIE CI" },
  { title: "CIE CI", symbol: "CIEC", side: "BUY", tradedAt: "2025-08-08", unitPrice: 2290, quantity: 10, note: "Acquisitions CIE CI" },

  // —— FILTISAC CI (FTSC) ——
  { title: "FILTISAC CI", symbol: "FTSC", side: "BUY", tradedAt: "2025-07-04", unitPrice: 4801, quantity: 1, note: "Acquisitions FILTISAC CI" },
  { title: "FILTISAC CI", symbol: "FTSC", side: "BUY", tradedAt: "2025-08-04", unitPrice: 4901, quantity: 5, note: "Acquisitions FILTISAC CI" },
  { title: "FILTISAC CI", symbol: "FTSC", side: "BUY", tradedAt: "2025-08-10", unitPrice: 4750, quantity: 2, note: "Acquisitions FILTISAC CI" },
  { title: "FILTISAC CI", symbol: "FTSC", side: "BUY", tradedAt: "2025-08-13", unitPrice: 4700, quantity: 10, note: "Acquisitions FILTISAC CI" },
  { title: "FILTISAC CI", symbol: "FTSC", side: "BUY", tradedAt: "2025-08-18", unitPrice: 4631, quantity: 10, note: "Acquisitions FILTISAC CI" },
  { title: "FILTISAC CI", symbol: "FTSC", side: "BUY", tradedAt: "2025-10-06", unitPrice: 3350, quantity: 22, note: "Acquisitions FILTISAC CI" },
  { title: "FILTISAC CI", symbol: "FTSC", side: "BUY", tradedAt: "2025-10-21", unitPrice: 3500, quantity: 20, note: "Acquisitions FILTISAC CI" },
  { title: "FILTISAC CI", symbol: "FTSC", side: "BUY", tradedAt: "2025-11-03", unitPrice: 3225, quantity: 10, note: "Acquisitions FILTISAC CI" },

  // —— ONATEL BF (ONTBF) ——
  { title: "ONATEL BF", symbol: "ONTBF", side: "BUY", tradedAt: "2025-08-11", unitPrice: 3700, quantity: 10, note: "Acquisitions ONATEL BF" },
  { title: "ONATEL BF", symbol: "ONTBF", side: "BUY", tradedAt: "2026-04-22", unitPrice: 3710, quantity: 20, note: "Acquisitions ONATEL BF" },
  { title: "ONATEL BF", symbol: "ONTBF", side: "BUY", tradedAt: "2026-07-09", unitPrice: 3781, quantity: 10, note: "Acquisitions ONATEL BF" },
  { title: "ONATEL BF", symbol: "ONTBF", side: "BUY", tradedAt: "2026-08-12", unitPrice: 3801, quantity: 5, note: "Acquisitions ONATEL BF" },
  { title: "ONATEL BF", symbol: "ONTBF", side: "BUY", tradedAt: "2026-08-12", unitPrice: 3801, quantity: 5, note: "Acquisitions ONATEL BF" },

  // —— ORANGE CI (ORAC) ——
  { title: "ORANGE COTE D IVOIRE", symbol: "ORAC", side: "BUY", tradedAt: "2026-04-22", unitPrice: 14900, quantity: 5, note: "Acquisitions ORANGE CÔTE D'IVOIRE" },
  { title: "ORANGE COTE D IVOIRE", symbol: "ORAC", side: "BUY", tradedAt: "2026-05-29", unitPrice: 15000, quantity: 2, note: "Acquisitions ORANGE CÔTE D'IVOIRE" },
  { title: "ORANGE COTE D IVOIRE", symbol: "ORAC", side: "BUY", tradedAt: "2026-06-18", unitPrice: 15800, quantity: 1, note: "Acquisitions ORANGE CÔTE D'IVOIRE" },
  { title: "ORANGE COTE D IVOIRE", symbol: "ORAC", side: "BUY", tradedAt: "2026-07-09", unitPrice: 16390, quantity: 10, note: "Acquisitions ORANGE CÔTE D'IVOIRE" },

  // —— SIB (SIBC) ——
  { title: "SIB", symbol: "SIBC", side: "BUY", tradedAt: "2025-04-14", unitPrice: 4800, quantity: 10, note: "Acquisitions SIB" },
  { title: "SIB", symbol: "SIBC", side: "BUY", tradedAt: "2025-05-27", unitPrice: 4750, quantity: 10, note: "Acquisitions SIB" },
  { title: "SIB", symbol: "SIBC", side: "BUY", tradedAt: "2025-06-16", unitPrice: 4800, quantity: 10, note: "Acquisitions SIB" },
  { title: "SIB", symbol: "SIBC", side: "BUY", tradedAt: "2025-07-04", unitPrice: 4795, quantity: 5, note: "Acquisitions SIB" },
  { title: "SIB", symbol: "SIBC", side: "BUY", tradedAt: "2025-07-16", unitPrice: 4930, quantity: 4, note: "Acquisitions SIB" },
  { title: "SIB", symbol: "SIBC", side: "BUY", tradedAt: "2026-06-23", unitPrice: 8845, quantity: 10, note: "Acquisitions SIB" },
  { title: "SIB", symbol: "SIBC", side: "BUY", tradedAt: "2026-07-09", unitPrice: 9000, quantity: 10, note: "Acquisitions SIB" },
  { title: "SIB", symbol: "SIBC", side: "BUY", tradedAt: "2026-08-11", unitPrice: 9150, quantity: 10, note: "Acquisitions SIB" },

  // —— UNIWAX CI (UNXC) — acheté puis entièrement cédé ——
  { title: "UNIWAX CI", symbol: "UNXC", side: "BUY", tradedAt: "2025-02-21", unitPrice: 750, quantity: 5, note: "Acquisitions UNIWAX CI" },
  { title: "UNIWAX CI", symbol: "UNXC", side: "BUY", tradedAt: "2025-07-04", unitPrice: 585, quantity: 10, note: "Acquisitions UNIWAX CI" },
  { title: "UNIWAX CI", symbol: "UNXC", side: "SELL", tradedAt: "2025-08-11", unitPrice: 806, quantity: 15, note: "Cessions UNIWAX CI" },

  // —— VIVO ENERGY CI (SHEC) ——
  { title: "VIVO ENERGY CI", symbol: "SHEC", side: "BUY", tradedAt: "2025-02-21", unitPrice: 1970, quantity: 11, note: "Acquisitions VIVO ENERGY CI" },
  { title: "VIVO ENERGY CI", symbol: "SHEC", side: "BUY", tradedAt: "2025-02-28", unitPrice: 1810, quantity: 8, note: "Acquisitions VIVO ENERGY CI" },
  { title: "VIVO ENERGY CI", symbol: "SHEC", side: "BUY", tradedAt: "2026-06-23", unitPrice: 2150, quantity: 20, note: "Acquisitions VIVO ENERGY CI" },
  { title: "VIVO ENERGY CI", symbol: "SHEC", side: "BUY", tradedAt: "2026-07-09", unitPrice: 2250, quantity: 15, note: "Acquisitions VIVO ENERGY CI" },
  { title: "VIVO ENERGY CI", symbol: "SHEC", side: "BUY", tradedAt: "2026-08-11", unitPrice: 2100, quantity: 10, note: "Acquisitions VIVO ENERGY CI" },
];

/** CSV historique (format plateforme étendu). */
export function brokerExtractHistoryCsv(): string {
  const header = "symbol,side,quantity,unit_price,traded_at,note";
  const lines = BROKER_EXTRACT_OPS.map(
    (o) => `${o.symbol},${o.side},${o.quantity},${o.unitPrice},${o.tradedAt},${o.note.replace(/,/g, " ")}`,
  );
  return [header, ...lines].join("\n") + "\n";
}
