import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { emptyStore, resetStore, persist, loadStore } from "@/infrastructure/persistence/file-store.ts";
import { ensureDefaultAdmin, DEFAULT_ADMIN_EMAIL } from "@/infrastructure/seed/default-admin.ts";
import { loginUser, registerUser } from "@/modules/identity/application/auth-service.ts";
import { setUserRole, deleteUserAccount, listAdminUsers } from "@/modules/identity/application/admin-users.ts";

describe("Admin backoffice + seed", () => {
  it("crée l’admin bootstrap et permet le login", () => {
    resetStore(emptyStore());
    persist(() => undefined);
    const admin = ensureDefaultAdmin();
    assert.equal(admin.email, DEFAULT_ADMIN_EMAIL);
    assert.equal(admin.role, "admin");
    const login = loginUser(DEFAULT_ADMIN_EMAIL, "Azerty@12345678");
    assert.equal(login.ok, true);
  });

  it("n’auto-promouvoit pas le premier inscrit", () => {
    resetStore(emptyStore());
    persist(() => undefined);
    ensureDefaultAdmin();
    const reg = registerUser({ email: "user@example.com", password: "Password1!", name: "User" });
    assert.equal(reg.ok, true);
    if (reg.ok) assert.equal(reg.value.user.role, "user");
  });

  it("gère les rôles et refuse de supprimer le dernier admin via auto-suppression", () => {
    resetStore(emptyStore());
    persist(() => undefined);
    const admin = ensureDefaultAdmin();
    const reg = registerUser({ email: "user2@example.com", password: "Password1!", name: "User Two" });
    assert.equal(reg.ok, true);
    if (!reg.ok) return;
    assert.equal(setUserRole(admin.id, reg.value.user.id, "admin").ok, true);
    assert.equal(setUserRole(admin.id, admin.id, "user").ok, true);
    assert.equal(listAdminUsers().filter((u) => u.role === "admin").length, 1);
    assert.equal(deleteUserAccount(reg.value.user.id, reg.value.user.id).ok, false);
    const otherAdmin = loadStore().users.find((u) => u.role === "admin");
    assert.ok(otherAdmin);
    assert.equal(deleteUserAccount(otherAdmin.id, admin.id).ok, true);
  });
});
