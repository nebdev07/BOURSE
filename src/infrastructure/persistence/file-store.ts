import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
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
  PortfolioHolding,
  PortfolioTransaction,
  RawDocument,
  RecommendationSnapshot,
  ScheduledReport,
  PerformanceTracking,
  UserAccount,
} from "@/modules/shared-kernel/types";
import { DEFAULT_RULESET, type RulesetParams } from "@/modules/recommendation/domain/ruleset";

function randomUUID(): string {
  return globalThis.crypto.randomUUID();
}

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
  holdings: PortfolioHolding[];
  transactions: PortfolioTransaction[];
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
    holdings: [],
    transactions: [],
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
  if (!store.holdings) store.holdings = [];
  if (!store.transactions) store.transactions = [];
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
  scheduleSqlSync(store);
  return result;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;
let pendingSync: AppStore | null = null;

/** Debounce + file d'attente : évite les sync MySQL lourdes à chaque clic. */
function scheduleSqlSync(store: AppStore): void {
  pendingSync = store;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void flushSqlSync();
  }, 1200);
}

async function flushSqlSync(): Promise<void> {
  if (syncing) return;
  const snapshot = pendingSync;
  pendingSync = null;
  if (!snapshot) return;
  syncing = true;
  try {
    const mod = await import("@/infrastructure/persistence/postgres");
    if (mod.postgresEnabled()) {
      const driver = (process.env.PERSISTENCE_DRIVER ?? "").trim().toLowerCase();
      // MySQL = production source of truth: sync companies + market on every debounced persist.
      if (driver === "mysql") {
        await mod.syncPlatformToPostgres(snapshot, { includeCompanies: true, includeMarket: true });
      } else {
        // PGlite / other: skip re-syncing the full company universe on every UI mutation.
        await mod.syncPlatformToPostgres(snapshot, { includeCompanies: false, includeMarket: true });
      }
    }
  } catch (error) {
    console.error("[postgres] sync échouée", error);
  } finally {
    syncing = false;
    if (pendingSync) scheduleSqlSync(pendingSync);
  }
}

export function uid(): string {
  return randomUUID();
}
