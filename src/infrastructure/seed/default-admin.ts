import { hashPassword } from "@/infrastructure/security/password";
import { loadStore, persist, uid } from "@/infrastructure/persistence/file-store";
import { DEFAULT_RULESET } from "@/modules/recommendation/domain/ruleset";
import type { UserAccount } from "@/modules/shared-kernel/types";

/** Compte bootstrap — surchargeable via env. À changer après 1ère connexion. */
export const DEFAULT_ADMIN_EMAIL = (process.env.DEFAULT_ADMIN_EMAIL ?? "nebdev07@gmail.com").trim().toLowerCase();
export const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD ?? "Azerty@12345678";
export const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME ?? "NebDev Admin";

/**
 * Garantit un admin en base/store au démarrage.
 * - crée le compte s’il n’existe pas
 * - force le rôle admin s’il existe déjà
 * - ne réécrit le mot de passe que si DEFAULT_ADMIN_RESET_PASSWORD=1
 */
export function ensureDefaultAdmin(): UserAccount {
  const email = DEFAULT_ADMIN_EMAIL;
  const existing = loadStore().users.find((u) => u.email === email);
  const resetPassword = process.env.DEFAULT_ADMIN_RESET_PASSWORD === "1";

  if (existing) {
    return persist((store) => {
      const account = store.users.find((u) => u.id === existing.id)!;
      account.role = "admin";
      if (resetPassword) {
        const { hash, salt } = hashPassword(DEFAULT_ADMIN_PASSWORD);
        account.passwordHash = hash;
        account.passwordSalt = salt;
      }
      return account;
    });
  }

  const { hash, salt } = hashPassword(DEFAULT_ADMIN_PASSWORD);
  return persist((store) => {
    const account: UserAccount = {
      id: uid(),
      email,
      name: DEFAULT_ADMIN_NAME,
      role: "admin",
      passwordHash: hash,
      passwordSalt: salt,
      ruleset: { ...DEFAULT_RULESET },
      createdAt: new Date().toISOString(),
    };
    store.users.push(account);
    return account;
  });
}
