import { loadStore, persist, uid } from "@/infrastructure/persistence/file-store";
import { latestRecommendations, listCompanies } from "@/modules/application/catalog";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";
import { DEFAULT_RULESET, type RulesetParams } from "@/modules/recommendation/domain/ruleset";
import { recommend } from "@/modules/recommendation/domain/recommend";
import { findUserById, saveUserRuleset } from "@/modules/identity/application/auth-service";
import type { Alert, RecommendationSnapshot, RecommendationStatus } from "@/modules/shared-kernel/types";

export async function getDashboard() {
  const { bootPersistence } = await import("@/infrastructure/persistence/boot");
  await bootPersistence();
  ensureSeeded();
  const recs = latestRecommendations();
  const counts = { BUY: 0, ACCUMULATE: 0, WATCH: 0, WAIT: 0, AVOID: 0 };
  for (const r of recs) counts[r.status] += 1;
  const opportunities = recs.filter((r) => r.status === "BUY" || r.status === "ACCUMULATE");
  const store = loadStore();
  return {
    total: recs.length,
    counts,
    opportunities,
    recs,
    companies: listCompanies(),
    lastSync: store.sources.map((s) => ({ ...s })),
    lastIngestion: store.ingestionRuns.at(-1) ?? null,
    lastAnalysis: store.analyses.at(-1)?.asOf ?? null,
    emailsSent: store.emailLogs.filter((e) => e.status === "SENT").length,
    sourceFailures: store.sourceFailures.slice(-10),
  };
}

export function personalRecommendations(userId: string): RecommendationSnapshot[] {
  ensureSeeded();
  const user = findUserById(userId);
  const rules = user?.ruleset ?? DEFAULT_RULESET;
  const store = loadStore();
  const bySymbol = new Map<string, (typeof store.analyses)[number]>();
  for (const analysis of store.analyses) {
    const prev = bySymbol.get(analysis.symbol);
    if (!prev || analysis.asOf >= prev.asOf) bySymbol.set(analysis.symbol, analysis);
  }
  return [...bySymbol.values()]
    .map((analysis) => {
      const decision = recommend(analysis, rules);
      const snapshot: RecommendationSnapshot = { id: `personal-${userId}-${analysis.symbol}`, ...decision.snapshot };
      return snapshot;
    })
    .sort((a, b) => b.score - a.score);
}

export function listAlerts(userId: string): Alert[] {
  return loadStore().alerts.filter((a) => a.userId === userId);
}

export function listAllAlertsForSupport(): Array<Alert & { userEmail: string; userName: string }> {
  const store = loadStore();
  const users = new Map(store.users.map((u) => [u.id, u]));
  return store.alerts.map((a) => {
    const owner = users.get(a.userId);
    return { ...a, userEmail: owner?.email ?? "inconnu", userName: owner?.name ?? "—" };
  });
}

export function listUsersForSupport(): Array<{ id: string; email: string; name: string; role: string; createdAt: string; alertCount: number }> {
  const store = loadStore();
  return store.users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    alertCount: store.alerts.filter((a) => a.userId === u.id).length,
  }));
}

export function createAlert(
  userId: string,
  input: {
    symbol: string | null;
    type: Alert["type"];
    threshold?: number | null;
    recommendation?: RecommendationStatus | null;
    note?: string;
  },
): Alert {
  return persist((store) => {
    const alert: Alert = {
      id: uid(),
      userId,
      symbol: input.symbol ? input.symbol.toUpperCase() : null,
      type: input.type,
      threshold: input.threshold ?? null,
      recommendation: input.recommendation ?? null,
      active: true,
      note: input.note ?? null,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    store.alerts.push(alert);
    return alert;
  });
}

export function deleteAlert(userId: string, id: string): boolean {
  return persist((store) => {
    const before = store.alerts.length;
    store.alerts = store.alerts.filter((a) => !(a.id === id && a.userId === userId));
    return store.alerts.length < before;
  });
}

export function toggleAlert(userId: string, id: string, active: boolean): void {
  persist((store) => {
    const a = store.alerts.find((x) => x.id === id && x.userId === userId);
    if (a) a.active = active;
  });
}

export function triggeredAlerts(userId: string) {
  const recs = personalRecommendations(userId);
  const hits: Array<{ alert: Alert; message: string }> = [];
  for (const alert of listAlerts(userId).filter((a) => a.active)) {
    const pool = alert.symbol ? recs.filter((r) => r.symbol === alert.symbol) : recs;
    for (const rec of pool) {
      if (alert.type === "PRICE_LTE" && alert.threshold !== null && rec.price <= alert.threshold) {
        hits.push({ alert, message: `${rec.symbol} à ${rec.price} ≤ ${alert.threshold}` });
      }
      if (alert.type === "PRICE_GTE" && alert.threshold !== null && rec.price >= alert.threshold) {
        hits.push({ alert, message: `${rec.symbol} à ${rec.price} ≥ ${alert.threshold}` });
      }
      if (alert.type === "SCORE_GTE" && alert.threshold !== null && rec.score >= alert.threshold) {
        hits.push({ alert, message: `${rec.symbol} score ${rec.score} ≥ ${alert.threshold}` });
      }
      if (alert.type === "RECOMMENDATION_EQ" && alert.recommendation && rec.status === alert.recommendation) {
        hits.push({ alert, message: `${rec.symbol} est ${rec.status}` });
      }
    }
  }
  return hits;
}

export function savePersonalRuleset(userId: string, params: Partial<RulesetParams>): RulesetParams {
  return saveUserRuleset(userId, params);
}

export function setSourceActive(id: string, active: boolean): void {
  persist((store) => {
    const s = store.sources.find((x) => x.id === id);
    if (s) s.active = active;
  });
}

export function testSource(id: string): { ok: boolean; message: string } {
  const store = loadStore();
  const s = store.sources.find((x) => x.id === id);
  if (!s) return { ok: false, message: "Source inconnue" };
  if (!s.active) return { ok: false, message: "Source inactive" };
  if (s.type === "SCRAPING") {
    return { ok: true, message: "OK (fixture locale). Scraping distant non utilisé par défaut." };
  }
  return { ok: true, message: `Source ${s.name} prête (priorité ${s.priority})` };
}

export function scheduleReport(
  userId: string,
  runAt: string,
  email: string,
  type: "MONTHLY_ANALYSIS" | "CUSTOM" = "MONTHLY_ANALYSIS",
) {
  return persist((store) => {
    const item = {
      id: uid(),
      userId,
      runAt,
      type,
      email,
      sentAt: null,
      status: "PENDING" as const,
    };
    store.scheduledReports.push(item);
    return item;
  });
}

export function listUserReports(userId: string) {
  return loadStore().scheduledReports.filter((r) => r.userId === userId);
}
