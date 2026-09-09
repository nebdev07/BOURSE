/**
 * Univers actions BRVM — séance officielle du 2026-08-27
 * Source : https://www.brvm.org/fr/cours-actions/0
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
export const BRVM_LISTING_AS_OF = "2026-08-27";

export const BRVM_LISTED: ListedEquity[] = [
  { symbol: "ABJC", name: "Servair Abidjan", sector: "Services", country: "CI", lastClose: 3690 },
  { symbol: "BICB", name: "BIIC Bénin", sector: "Banque", country: "BJ", lastClose: 8510 },
  { symbol: "BICC", name: "BICI Côte d'Ivoire", sector: "Banque", country: "CI", lastClose: 29970 },
  { symbol: "BNBC", name: "Bernabé Côte d'Ivoire", sector: "Distribution", country: "CI", lastClose: 2295 },
  { symbol: "BOAB", name: "Bank of Africa Bénin", sector: "Banque", country: "BJ", lastClose: 10000 },
  { symbol: "BOABF", name: "Bank of Africa Burkina Faso", sector: "Banque", country: "BF", lastClose: 9090 },
  { symbol: "BOAC", name: "Bank of Africa Côte d'Ivoire", sector: "Banque", country: "CI", lastClose: 12700 },
  { symbol: "BOAM", name: "Bank of Africa Mali", sector: "Banque", country: "ML", lastClose: 6650 },
  { symbol: "BOAN", name: "Bank of Africa Niger", sector: "Banque", country: "NE", lastClose: 5645 },
  { symbol: "BOAS", name: "Bank of Africa Sénégal", sector: "Banque", country: "SN", lastClose: 8445 },
  { symbol: "CABC", name: "Sicable Côte d'Ivoire", sector: "Industrie", country: "CI", lastClose: 3500 },
  { symbol: "CBIBF", name: "Coris Bank International", sector: "Banque", country: "BF", lastClose: 29390 },
  { symbol: "CFAC", name: "CFAO Motors Côte d'Ivoire", sector: "Distribution", country: "CI", lastClose: 1745 },
  { symbol: "CIEC", name: "CIE Côte d'Ivoire", sector: "Services publics", country: "CI", lastClose: 6680 },
  { symbol: "ECOC", name: "Ecobank Côte d'Ivoire", sector: "Banque", country: "CI", lastClose: 16845 },
  { symbol: "ETIT", name: "Ecobank Transnational Incorporated", sector: "Banque", country: "TG", lastClose: 67 },
  { symbol: "FTSC", name: "Filtisac Côte d'Ivoire", sector: "Industrie", country: "CI", lastClose: 2155 },
  { symbol: "LNBB", name: "Loterie Nationale du Bénin", sector: "Services", country: "BJ", lastClose: 4005 },
  { symbol: "NEIC", name: "NEI-CEDA Côte d'Ivoire", sector: "Industrie", country: "CI", lastClose: 2800 },
  { symbol: "NSBC", name: "NSIA Banque Côte d'Ivoire", sector: "Banque", country: "CI", lastClose: 22500 },
  { symbol: "NTLC", name: "Nestlé Côte d'Ivoire", sector: "Agroalimentaire", country: "CI", lastClose: 16900 },
  { symbol: "ONTBF", name: "Onatel Burkina Faso", sector: "Télécoms", country: "BF", lastClose: 2900 },
  { symbol: "ORAC", name: "Orange Côte d'Ivoire", sector: "Télécoms", country: "CI", lastClose: 21200 },
  { symbol: "ORGT", name: "Oragroup Togo", sector: "Banque", country: "TG", lastClose: 3180 },
  { symbol: "PALC", name: "Palm Côte d'Ivoire", sector: "Agro-industrie", country: "CI", lastClose: 9100 },
  { symbol: "PRSC", name: "Tractafric Motors Côte d'Ivoire", sector: "Distribution", country: "CI", lastClose: 4545 },
  { symbol: "SAFC", name: "SAFCA Côte d'Ivoire", sector: "Finance", country: "CI", lastClose: 5850 },
  { symbol: "SCRC", name: "Sucrivoire Côte d'Ivoire", sector: "Agroalimentaire", country: "CI", lastClose: 3375 },
  { symbol: "SDCC", name: "SODECI Côte d'Ivoire", sector: "Services publics", country: "CI", lastClose: 12700 },
  { symbol: "SDSC", name: "Africa Global Logistics", sector: "Transport", country: "CI", lastClose: 2635 },
  { symbol: "SEMC", name: "Eviosys Packaging Siem", sector: "Industrie", country: "CI", lastClose: 1450 },
  { symbol: "SGBC", name: "Société Générale Côte d'Ivoire", sector: "Banque", country: "CI", lastClose: 38500 },
  { symbol: "SHEC", name: "Vivo Energy Côte d'Ivoire", sector: "Énergie", country: "CI", lastClose: 2450 },
  { symbol: "SIBC", name: "Société Ivoirienne de Banque", sector: "Banque", country: "CI", lastClose: 9200 },
  { symbol: "SICC", name: "Sicor Côte d'Ivoire", sector: "Agro-industrie", country: "CI", lastClose: 8010 },
  { symbol: "SIVC", name: "Erium Côte d'Ivoire", sector: "Industrie", country: "CI", lastClose: 2365 },
  { symbol: "SLBC", name: "Solibra Côte d'Ivoire", sector: "Agroalimentaire", country: "CI", lastClose: 37500 },
  { symbol: "SMBC", name: "SMB Côte d'Ivoire", sector: "Énergie", country: "CI", lastClose: 17100 },
  { symbol: "SNTS", name: "Sonatel Sénégal", sector: "Télécoms", country: "SN", lastClose: 36000 },
  { symbol: "SOGC", name: "SOGB Côte d'Ivoire", sector: "Agro-industrie", country: "CI", lastClose: 8200 },
  { symbol: "SPHC", name: "SAPH Côte d'Ivoire", sector: "Agro-industrie", country: "CI", lastClose: 9200 },
  { symbol: "STAC", name: "SETAO Côte d'Ivoire", sector: "Construction", country: "CI", lastClose: 2600 },
  { symbol: "STBC", name: "SITAB Côte d'Ivoire", sector: "Agroalimentaire", country: "CI", lastClose: 22690 },
  { symbol: "TTLC", name: "TotalEnergies Marketing Côte d'Ivoire", sector: "Énergie", country: "CI", lastClose: 3550 },
  { symbol: "TTLS", name: "TotalEnergies Marketing Sénégal", sector: "Énergie", country: "SN", lastClose: 3685 },
  { symbol: "UNLC", name: "Unilever Côte d'Ivoire", sector: "Agroalimentaire", country: "CI", lastClose: 52200 },
  { symbol: "UNXC", name: "Uniwax Côte d'Ivoire", sector: "Industrie", country: "CI", lastClose: 2415 },
];

export const BRVM_LISTED_COUNT = BRVM_LISTED.length;

export const CORE_RESEARCH_SYMBOLS = new Set(["SGBC", "SNTS", "PALC", "NTLC", "ETIT"]);

export const TICKER_ALIASES: Record<string, string> = {
  SGCI: "SGBC",
};
