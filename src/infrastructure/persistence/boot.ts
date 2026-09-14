import { loadStore, saveStore } from "./file-store";
import {
  overlayPlatformFromPostgres,
  postgresEnabled,
  sqlDialect,
  syncPlatformToPostgres,
} from "./postgres";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";

let boot: Promise<void> | null = null;

/** Charge plateforme + marché depuis SQL au premier appel ; seed + sync si MySQL vide. */
export function bootPersistence(): Promise<void> {
  if (!boot) {
    boot = (async () => {
      loadStore();
      if (!postgresEnabled()) return;
      const store = loadStore();
      await overlayPlatformFromPostgres(store);
      if (sqlDialect() === "mysql" && store.companies.length === 0) {
        ensureSeeded();
        await syncPlatformToPostgres(loadStore(), { includeCompanies: true, includeMarket: true });
      }
      saveStore();
    })().catch((error) => {
      console.error("[postgres] hydratation échouée", error);
    });
  }
  return boot;
}
