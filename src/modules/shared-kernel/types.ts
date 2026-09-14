import type { Provenance } from "@/shared/provenance";

export type CompanyStatus = "LISTED" | "SUSPENDED" | "DELISTED";

export interface Company {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  country: string;
  listingDate: string | null;
  status: CompanyStatus;
}

export interface MarketQuote {
  id: string;
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number;
  provenance: Provenance;
}

export interface Dividend {
  id: string;
  companyId: string;
  symbol: string;
  exerciseYear: number;
  grossAmount: number;
  netAmount: number;
  currency: "XOF";
  announcementDate: string | null;
  paymentDate: string | null;
  provenance: Provenance;
}

export interface FinancialStatement {
  id: string;
  companyId: string;
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
  provenance: Provenance;
}

export interface Revision<T> {
  id: string;
  entityId: string;
  previous: T;
  next: T;
  changedAt: string;
  reason: string | null;
  source: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: Provenance["sourceType"];
  url: string | null;
  priority: number;
  active: boolean;
  lastSuccessfulSync: string | null;
  lastFailure: string | null;
  scraperVersion: string | null;
}

export interface DataSourceFailure {
  id: string;
  sourceId: string;
  timestamp: string;
  error: string;
  payload: string | null;
}

export interface IngestionRun {
  id: string;
  source: string;
  startedAt: string;
  finishedAt: string | null;
  recordsFetched: number;
  recordsInserted: number;
  recordsRejected: number;
  errors: string[];
}

export interface RawDocument {
  id: string;
  kind: "MARKET" | "DIVIDEND" | "FINANCIAL";
  source: string;
  fetchedAt: string;
  contentType: string;
  payload: string;
  parserVersion: string;
}

export type RecommendationStatus = "BUY" | "ACCUMULATE" | "WATCH" | "WAIT" | "AVOID";

export interface ScoreBreakdown {
  businessQuality: { score: number; max: 20 };
  growth: { score: number; max: 15 };
  dividendQuality: { score: number; max: 15 };
  valuation: { score: number; max: 20 };
  marginOfSafety: { score: number; max: 15 };
  priceFundamentals: { score: number; max: 10 };
  risk: { score: number; max: 5 };
}

export interface AnalysisResult {
  symbol: string;
  asOf: string;
  currentPrice: number;
  dividendYield: number | null;
  dividendGrowth1y: number | null;
  dividendGrowth3y: number | null;
  dividendGrowth5y: number | null;
  dividendGrowth10y: number | null;
  dividendCagr3y: number | null;
  dividendCagr5y: number | null;
  dividendCagr10y: number | null;
  eps: number | null;
  epsGrowth1y: number | null;
  epsCagr3y: number | null;
  epsCagr5y: number | null;
  epsCagr10y: number | null;
  per: number | null;
  historicalPerMedian: number | null;
  roe: number | null;
  payoutRatio: number | null;
  maxDrawdown: number | null;
  volatility: number | null;
  priceGrowth1y: number | null;
  priceGrowth3y: number | null;
  intrinsicValue: number | null;
  intrinsicReliability: number;
  intrinsicMethods: string[];
  marginOfSafety: number | null;
  investmentScore: number;
  confidenceScore: number;
  dataQualityScore: number;
  breakdown: ScoreBreakdown;
  flags: string[];
  reasons: string[];
  risks: string[];
}

export interface RecommendationSnapshot {
  id: string;
  date: string;
  symbol: string;
  price: number;
  score: number;
  confidence: number;
  dataQuality: number;
  intrinsicValue: number | null;
  marginOfSafety: number | null;
  status: RecommendationStatus;
  rulesVersion: string;
  reasons: string[];
  risks: string[];
  targetPrice: number | null;
  idealEntryPrice: number | null;
  maximumEntryPrice: number | null;
}

export interface Alert {
  id: string;
  userId: string;
  symbol: string | null;
  type: "PRICE_LTE" | "PRICE_GTE" | "SCORE_GTE" | "RECOMMENDATION_EQ";
  threshold: number | null;
  recommendation: RecommendationStatus | null;
  active: boolean;
  note: string | null;
  createdAt: string;
}

/** Position agrégée (vue) — reconstruite depuis les transactions. */
export interface PortfolioHolding {
  id: string;
  userId: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  purchasedAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Opération d’historique (achat ou cession). Source de vérité du portefeuille. */
export interface PortfolioTransaction {
  id: string;
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  unitPrice: number;
  tradedAt: string | null;
  note: string | null;
  createdAt: string;
}

export interface ScheduledReport {
  id: string;
  userId: string;
  runAt: string;
  type: "MONTHLY_ANALYSIS" | "CUSTOM";
  email: string;
  sentAt: string | null;
  status: "PENDING" | "SENT" | "FAILED";
}

export type UserRole = "user" | "admin";

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  passwordSalt: string;
  ruleset: import("@/modules/recommendation/domain/ruleset").RulesetParams;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface PerformanceTracking {
  symbol: string;
  snapshotDate: string;
  horizonDays: 30 | 90 | 180 | 365;
  priceReturn: number | null;
  dividendReturn: number | null;
  totalReturn: number | null;
  indexReturn: number | null;
}
