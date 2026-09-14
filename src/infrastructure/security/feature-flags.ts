/** Feature flags runtime (env). */
export function adminPortfolioExampleEnabled(): boolean {
  const raw = (process.env.ENABLE_ADMIN_PORTFOLIO_EXAMPLE ?? "").trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  if (raw === "0" || raw === "false" || raw === "no") return false;
  // Défaut : activé en dev, désactivé en production
  return process.env.NODE_ENV !== "production";
}
