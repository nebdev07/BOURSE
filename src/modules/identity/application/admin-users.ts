import { loadStore, persist } from "@/infrastructure/persistence/file-store";
import type { UserRole } from "@/modules/shared-kernel/types";
import { err, ok, type Result } from "@/shared/result";

export type PlatformPermission =
  | "manage_users"
  | "manage_roles"
  | "manage_user_data"
  | "view_support"
  | "manage_jobs"
  | "import_data";

const ADMIN_PERMISSIONS: PlatformPermission[] = [
  "manage_users",
  "manage_roles",
  "manage_user_data",
  "view_support",
  "manage_jobs",
  "import_data",
];

export function permissionsForRole(role: UserRole): PlatformPermission[] {
  return role === "admin" ? [...ADMIN_PERMISSIONS] : [];
}

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  alertCount: number;
  holdingCount: number;
  transactionCount: number;
  sessionCount: number;
  permissions: PlatformPermission[];
};

export function listAdminUsers(): AdminUserRow[] {
  const store = loadStore();
  return store.users
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      alertCount: store.alerts.filter((a) => a.userId === u.id).length,
      holdingCount: store.holdings.filter((h) => h.userId === u.id).length,
      transactionCount: store.transactions.filter((t) => t.userId === u.id).length,
      sessionCount: store.sessions.filter((s) => s.userId === u.id).length,
      permissions: permissionsForRole(u.role),
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

export function getAdminUserDetail(userId: string) {
  const store = loadStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  return {
    ...listAdminUsers().find((u) => u.id === userId)!,
    alerts: store.alerts.filter((a) => a.userId === userId),
    holdings: store.holdings.filter((h) => h.userId === userId),
    transactions: store.transactions.filter((t) => t.userId === userId).slice(-50),
  };
}

export function setUserRole(actorId: string, targetId: string, role: UserRole): Result<{ id: string; role: UserRole }> {
  if (role !== "admin" && role !== "user") return err("Rôle invalide");
  const store = loadStore();
  const target = store.users.find((u) => u.id === targetId);
  if (!target) return err("Utilisateur introuvable");

  if (target.role === "admin" && role === "user") {
    const admins = store.users.filter((u) => u.role === "admin");
    if (admins.length <= 1) return err("Impossible : dernier administrateur");
  }

  const updated = persist((s) => {
    const account = s.users.find((u) => u.id === targetId);
    if (!account) throw new Error("Utilisateur introuvable");
    account.role = role;
    return account;
  });
  void actorId;
  return ok({ id: updated.id, role: updated.role });
}

export function deleteUserAccount(actorId: string, targetId: string): Result<{ deleted: string }> {
  if (actorId === targetId) return err("Tu ne peux pas supprimer ton propre compte depuis le backoffice");
  const store = loadStore();
  const target = store.users.find((u) => u.id === targetId);
  if (!target) return err("Utilisateur introuvable");
  if (target.role === "admin") {
    const admins = store.users.filter((u) => u.role === "admin");
    if (admins.length <= 1) return err("Impossible : dernier administrateur");
  }

  persist((s) => {
    s.users = s.users.filter((u) => u.id !== targetId);
    s.sessions = s.sessions.filter((sess) => sess.userId !== targetId);
    s.alerts = s.alerts.filter((a) => a.userId !== targetId);
    s.holdings = s.holdings.filter((h) => h.userId !== targetId);
    s.transactions = s.transactions.filter((t) => t.userId !== targetId);
    s.scheduledReports = s.scheduledReports.filter((r) => r.userId !== targetId);
  });
  return ok({ deleted: targetId });
}

export function clearUserData(actorId: string, targetId: string): Result<{ cleared: string }> {
  void actorId;
  const store = loadStore();
  if (!store.users.some((u) => u.id === targetId)) return err("Utilisateur introuvable");
  persist((s) => {
    s.alerts = s.alerts.filter((a) => a.userId !== targetId);
    s.holdings = s.holdings.filter((h) => h.userId !== targetId);
    s.transactions = s.transactions.filter((t) => t.userId !== targetId);
    s.sessions = s.sessions.filter((sess) => sess.userId !== targetId);
    s.scheduledReports = s.scheduledReports.filter((r) => r.userId !== targetId);
  });
  return ok({ cleared: targetId });
}
