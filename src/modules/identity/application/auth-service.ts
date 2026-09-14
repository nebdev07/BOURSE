import { hashPassword, hashToken, newSessionToken, verifyPassword } from "@/infrastructure/security/password";
import { loadStore, persist, uid } from "@/infrastructure/persistence/file-store";
import { DEFAULT_RULESET, createRuleset, type RulesetParams } from "@/modules/recommendation/domain/ruleset";
import type { AuthSession, PublicUser, UserAccount } from "@/modules/shared-kernel/types";
import { err, ok, type Result } from "@/shared/result";

const SESSION_DAYS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAdminEmail(email: string): boolean {
  const configured = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  return Boolean(configured) && configured === email;
}

export function toPublicUser(user: UserAccount): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function findUserByEmail(email: string): UserAccount | null {
  const normalized = email.trim().toLowerCase();
  return loadStore().users.find((u) => u.email === normalized) ?? null;
}

export function findUserById(id: string): UserAccount | null {
  return loadStore().users.find((u) => u.id === id) ?? null;
}

export function registerUser(input: {
  email: string;
  password: string;
  name: string;
}): Result<{ user: PublicUser; token: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!EMAIL_RE.test(email)) return err("Email invalide");
  if (input.password.length < 8) return err("Mot de passe : 8 caractères minimum");
  if (name.length < 2) return err("Nom trop court");
  if (findUserByEmail(email)) return err("Un compte existe déjà avec cet email");

  const { hash, salt } = hashPassword(input.password);
  const token = newSessionToken();
  const user = persist((store) => {
    const account: UserAccount = {
      id: uid(),
      email,
      name,
      role: isAdminEmail(email) || store.users.length === 0 ? "admin" : "user",
      passwordHash: hash,
      passwordSalt: salt,
      ruleset: { ...DEFAULT_RULESET },
      createdAt: new Date().toISOString(),
    };
    store.users.push(account);
    store.sessions.push(sessionOf(account.id, token));
    return account;
  });
  return ok({ user: toPublicUser(user), token });
}

export function loginUser(email: string, password: string): Result<{ user: PublicUser; token: string }> {
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    return err("Email ou mot de passe incorrect");
  }
  const token = newSessionToken();
  const refreshed = persist((store) => {
    const account = store.users.find((u) => u.id === user.id);
    if (account && isAdminEmail(account.email) && account.role !== "admin") {
      account.role = "admin";
    }
    store.sessions.push(sessionOf(user.id, token));
    return account ?? user;
  });
  return ok({ user: toPublicUser(refreshed), token });
}

export function logoutUser(token: string | null): void {
  if (!token) return;
  const hashed = hashToken(token);
  persist((store) => {
    store.sessions = store.sessions.filter((s) => s.tokenHash !== hashed);
  });
}

export function userFromToken(token: string | null): UserAccount | null {
  if (!token) return null;
  const hashed = hashToken(token);
  const now = Date.now();
  const session = loadStore().sessions.find((s) => s.tokenHash === hashed && new Date(s.expiresAt).getTime() > now);
  if (!session) return null;
  const user = findUserById(session.userId);
  if (!user) return null;
  if (isAdminEmail(user.email) && user.role !== "admin") {
    return persist((store) => {
      const account = store.users.find((u) => u.id === user.id);
      if (account) account.role = "admin";
      return account ?? user;
    });
  }
  return user;
}

export function saveUserRuleset(userId: string, params: Partial<RulesetParams>): RulesetParams {
  return persist((store) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) throw new Error("Utilisateur introuvable");
    const version = `u-${userId.slice(0, 6)}-v${Date.now()}`;
    user.ruleset = createRuleset({ ...user.ruleset, ...params, version });
    return user.ruleset;
  });
}

function sessionOf(userId: string, token: string): AuthSession {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  return {
    id: uid(),
    userId,
    tokenHash: hashToken(token),
    expiresAt: expires.toISOString(),
  };
}
