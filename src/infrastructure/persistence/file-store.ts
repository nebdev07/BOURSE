import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  Alert,
  AnalysisResult,
  AuthSession,
  Company,
  DataSource,
  DataSourceFailure,
  Dividend,
  FinancialStatement,
  IngestionRun,
  MarketQuote,
  RawDocument,
  RecommendationSnapshot,
  ScheduledReport,
  PerformanceTracking,
  UserAccount,
} from "@/modules/shared-kernel/types";
import { DEFAULT_RULESET, type RulesetParams } from "@/modules/recommendation/domain/ruleset";

export interface AppStore {
  companies: Company[];
  quotes: MarketQuote[];
  quoteRevisions: unknown[];
  dividends: Dividend[];
  dividendRevisions: unknown[];
  financials: FinancialStatement[];
  financialRevisions: unknown[];
  sources: DataSource[];
  sourceFailures: DataSourceFailure[];
  ingestionRuns: IngestionRun[];
  rawDocuments: RawDocument[];
  analyses: AnalysisResult[];
  recommendations: RecommendationSnapshot[];
  alerts: Alert[];
  scheduledReports: ScheduledReport[];
  emailLogs: Array<{ id: string; sentAt: string; to: string; type: string; status: string; error?: string }>;
  performance: PerformanceTracking[];
  indexQuotes: Array<{ date: string; close: number; name: string }>;
  rulesets: RulesetParams[];
  activeRulesetVersion: string;
  users: UserAccount[];
  sessions: AuthSession[];
}

export function emptyStore(): AppStore {
  return {
    companies: [],
    quotes: [],
    quoteRevisions: [],
    dividends: [],
    dividendRevisions: [],
    financials: [],
    financialRevisions: [],
    sources: [
      {
        id: "src-official-brvm",
        name: "BRVM officielle",
        type: "OFFICIAL_BRVM",
        url: "https://www.brvm.org",
        priority: 1,
        active: true,
        lastSuccessfulSync: null,
        lastFailure: null,
        scraperVersion: "official-1",
      },
      {
        id: "src-official-docs",
        name: "Documents officiels sociétés",
        type: "OFFICIAL_DOC",
        url: null,
        priority: 1,
        active: true,
        lastSuccessfulSync: null,
        lastFailure: null,
        scraperVersion: null,
      },
      {
        id: "src-scraping",
        name: "Scraping fallback",
        type: "SCRAPING",
        url: null,
        priority: 3,
        active: false,
        lastSuccessfulSync: null,
        lastFailure: null,
        scraperVersion: "scraper-1",
      },
      {
        id: "src-manual",
        name: "Import manuel CSV",
        type: "MANUAL",
        url: null,
        priority: 4,
        active: true,
        lastSuccessfulSync: null,
        lastFailure: null,
        scraperVersion: null,
      },
    ],
    sourceFailures: [],
    ingestionRuns: [],
    rawDocuments: [],
    analyses: [],
    recommendations: [],
    alerts: [],
    scheduledReports: [],
    emailLogs: [],
    performance: [],
    indexQuotes: [],
    rulesets: [DEFAULT_RULESET],
    activeRulesetVersion: DEFAULT_RULESET.version,
    users: [],
    sessions: [],
  };
}

let memory: AppStore | null = null;
const defaultPath = join(process.cwd(), "data", "store.json");

export function storePath(): string {
  return process.env.BRVM_STORE_PATH ?? defaultPath;
}

export function loadStore(): AppStore {
  if (memory) return ensureShape(memory);
  const file = storePath();
  if (existsSync(file)) {
    memory = ensureShape(JSON.parse(readFileSync(file, "utf8")) as AppStore);
    return memory;
  }
  memory = emptyStore();
  return memory;
}

function ensureShape(store: AppStore): AppStore {
  if (!store.users) store.users = [];
  if (!store.sessions) store.sessions = [];
  if (!store.alerts) store.alerts = [];
  if (!store.scheduledReports) store.scheduledReports = [];
  return store;
}

export function saveStore(): void {
  if (!memory) return;
  const file = storePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(memory, null, 2), "utf8");
}

export function resetStore(next?: AppStore): AppStore {
  memory = next ?? emptyStore();
  return memory;
}

export function persist<T>(mutator: (store: AppStore) => T): T {
  const store = loadStore();
  const result = mutator(store);
  saveStore();
  if (process.env.BRVM_DISABLE_PG === "1" || process.env.PERSISTENCE_DRIVER === "file") {
    return result;
  }
  void import("@/infrastructure/persistence/postgres")
    .then((mod) => (mod.postgresEnabled() ? mod.syncPlatformToPostgres(store) : undefined))
    .catch((error) => {
      console.error("[postgres] sync échouée", error);
    });
  return result;
}

export function uid(): string {
  return randomUUID();
}
