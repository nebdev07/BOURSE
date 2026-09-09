import { loadStore, saveStore } from "./file-store";
import { overlayPlatformFromPostgres, postgresEnabled } from "./postgres";

let boot: Promise<void> | null = null;

/** Charge les comptes / alertes / sociétés depuis PostgreSQL au premier appel. */
export function bootPersistence(): Promise<void> {
  if (!boot) {
    boot = (async () => {
      loadStore();
      if (!postgresEnabled()) return;
      await overlayPlatformFromPostgres(loadStore());
      saveStore();
    })().catch((error) => {
      console.error("[postgres] hydratation échouée", error);
    });
  }
  return boot;
}
