/**
 * Univers actions BRVM — libellés alignés sur la cote officielle
 * Source : https://www.brvm.org/fr/cours-actions/0
 * Noms = libellés « Nom » de la page (majuscules BRVM).
 * 47 sociétés cotées. BBGC (introduction à venir) n’est pas cotée.
 */
export interface ListedEquity {
  symbol: string;
  name: string;
  sector: string;
  country: string;
  lastClose: number;
}

export const BRVM_LISTING_SOURCE = "https://www.brvm.org/fr/cours-actions/0";
export const BRVM_LISTING_AS_OF = "2026-09-11";

/** Noms officiels BRVM (séance). Le suffixe pays (ex. COTE D'IVOIRE) fait partie du libellé officiel. */
export const BRVM_LISTED: ListedEquity[] = [
  { symbol: "ABJC", name: "SERVAIR ABIDJAN COTE D'IVOIRE", sector: "Services", country: "CI", lastClose: 4095 },
  { symbol: "BICB", name: "BANQUE INTERNATIONALE POUR L'INDUSTRIE ET LE COMMERCE DU BENIN", sector: "Banque", country: "BJ", lastClose: 10450 },
  { symbol: "BICC", name: "BICI COTE D'IVOIRE", sector: "Banque", country: "CI", lastClose: 33010 },
  { symbol: "BNBC", name: "BERNABE COTE D'IVOIRE", sector: "Distribution", country: "CI", lastClose: 2135 },
  { symbol: "BOAB", name: "BANK OF AFRICA BENIN", sector: "Banque", country: "BJ", lastClose: 10100 },
  { symbol: "BOABF", name: "BANK OF AFRICA BURKINA FASO", sector: "Banque", country: "BF", lastClose: 8990 },
  { symbol: "BOAC", name: "BANK OF AFRICA COTE D'IVOIRE", sector: "Banque", country: "CI", lastClose: 12400 },
  { symbol: "BOAM", name: "BANK OF AFRICA MALI", sector: "Banque", country: "ML", lastClose: 7150 },
  { symbol: "BOAN", name: "BANK OF AFRICA NIGER", sector: "Banque", country: "NE", lastClose: 5595 },
  { symbol: "BOAS", name: "BANK OF AFRICA SENEGAL", sector: "Banque", country: "SN", lastClose: 8200 },
  { symbol: "CABC", name: "SICABLE COTE D'IVOIRE", sector: "Industrie", country: "CI", lastClose: 3500 },
  { symbol: "CBIBF", name: "CORIS BANK INTERNATIONAL BURKINA FASO", sector: "Banque", country: "BF", lastClose: 34300 },
  { symbol: "CFAC", name: "CFAO MOTORS COTE D'IVOIRE", sector: "Distribution", country: "CI", lastClose: 1705 },
  { symbol: "CIEC", name: "CIE COTE D'IVOIRE", sector: "Services publics", country: "CI", lastClose: 7100 },
  { symbol: "ECOC", name: "ECOBANK COTE D'IVOIRE", sector: "Banque", country: "CI", lastClose: 17285 },
  { symbol: "ETIT", name: "Ecobank Transnational Incorporated TOGO", sector: "Banque", country: "TG", lastClose: 70 },
  { symbol: "FTSC", name: "FILTISAC COTE D'IVOIRE", sector: "Industrie", country: "CI", lastClose: 2120 },
  { symbol: "LNBB", name: "LOTERIE NATIONALE DU BENIN", sector: "Services", country: "BJ", lastClose: 4000 },
  { symbol: "NEIC", name: "NEI-CEDA COTE D'IVOIRE", sector: "Industrie", country: "CI", lastClose: 2750 },
  { symbol: "NSBC", name: "NSIA BANQUE COTE D'IVOIRE", sector: "Banque", country: "CI", lastClose: 24400 },
  { symbol: "NTLC", name: "NESTLE COTE D'IVOIRE", sector: "Agroalimentaire", country: "CI", lastClose: 16900 },
  { symbol: "ONTBF", name: "ONATEL BURKINA FASO", sector: "Télécoms", country: "BF", lastClose: 2870 },
  { symbol: "ORAC", name: "ORANGE COTE D'IVOIRE", sector: "Télécoms", country: "CI", lastClose: 22450 },
  { symbol: "ORGT", name: "ORAGROUP TOGO", sector: "Banque", country: "TG", lastClose: 3205 },
  { symbol: "PALC", name: "PALM COTE D'IVOIRE", sector: "Agro-industrie", country: "CI", lastClose: 8300 },
  { symbol: "PRSC", name: "TRACTAFRIC MOTORS COTE D'IVOIRE", sector: "Distribution", country: "CI", lastClose: 4385 },
  { symbol: "SAFC", name: "SAFCA COTE D'IVOIRE", sector: "Finance", country: "CI", lastClose: 5400 },
  { symbol: "SCRC", name: "SUCRIVOIRE COTE D'IVOIRE", sector: "Agroalimentaire", country: "CI", lastClose: 3290 },
  { symbol: "SDCC", name: "SODE COTE D'IVOIRE", sector: "Services publics", country: "CI", lastClose: 13400 },
  { symbol: "SDSC", name: "AFRICA GLOBAL LOGISTICS COTE D'IVOIRE", sector: "Transport", country: "CI", lastClose: 3030 },
  { symbol: "SEMC", name: "EVIOSYS PACKAGING SIEM COTE D'IVOIRE", sector: "Industrie", country: "CI", lastClose: 1560 },
  { symbol: "SGBC", name: "SOCIETE GENERALE COTE D'IVOIRE", sector: "Banque", country: "CI", lastClose: 38500 },
  { symbol: "SHEC", name: "VIVO ENERGY COTE D'IVOIRE", sector: "Énergie", country: "CI", lastClose: 2550 },
  { symbol: "SIBC", name: "SOCIETE IVOIRIENNE DE BANQUE COTE D'IVOIRE", sector: "Banque", country: "CI", lastClose: 9300 },
  { symbol: "SICC", name: "SICOR COTE D'IVOIRE", sector: "Agro-industrie", country: "CI", lastClose: 8495 },
  { symbol: "SIVC", name: "ERIUM COTE D'IVOIRE", sector: "Industrie", country: "CI", lastClose: 2400 },
  { symbol: "SLBC", name: "SOLIBRA COTE D'IVOIRE", sector: "Agroalimentaire", country: "CI", lastClose: 37905 },
  { symbol: "SMBC", name: "SMB COTE D'IVOIRE", sector: "Énergie", country: "CI", lastClose: 18300 },
  { symbol: "SNTS", name: "SONATEL SENEGAL", sector: "Télécoms", country: "SN", lastClose: 39275 },
  { symbol: "SOGC", name: "SOGB COTE D'IVOIRE", sector: "Agro-industrie", country: "CI", lastClose: 8100 },
  { symbol: "SPHC", name: "SAPH COTE D'IVOIRE", sector: "Agro-industrie", country: "CI", lastClose: 8300 },
  { symbol: "STAC", name: "SETAO COTE D'IVOIRE", sector: "Construction", country: "CI", lastClose: 2575 },
  { symbol: "STBC", name: "SITAB COTE D'IVOIRE", sector: "Agroalimentaire", country: "CI", lastClose: 22200 },
  { symbol: "TTLC", name: "TOTALENERGIES MARKETING COTE D'IVOIRE", sector: "Énergie", country: "CI", lastClose: 3280 },
  { symbol: "TTLS", name: "TOTALENERGIES MARKETING SENEGAL", sector: "Énergie", country: "SN", lastClose: 3890 },
  { symbol: "UNLC", name: "UNILEVER COTE D'IVOIRE", sector: "Agroalimentaire", country: "CI", lastClose: 54000 },
  { symbol: "UNXC", name: "UNIWAX COTE D'IVOIRE", sector: "Industrie", country: "CI", lastClose: 2400 },
];

export const BRVM_LISTED_COUNT = BRVM_LISTED.length;

export const CORE_RESEARCH_SYMBOLS = new Set(["SGBC", "SNTS", "PALC", "NTLC", "ETIT"]);

export const TICKER_ALIASES: Record<string, string> = {
  SGCI: "SGBC",
};

/** Normalise apostrophes typographiques → ASCII (affichage stable). */
export function normalizeOfficialName(name: string): string {
  return name.replace(/[\u2018\u2019\u02BC\u2032]/g, "'").replace(/\s+/g, " ").trim();
}
