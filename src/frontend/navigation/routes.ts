/**
 * Carte de navigation plateforme — source unique pour UI + tests de cohérence.
 * Les shells admin et utilisateur ne partagent pas les mêmes liens.
 */

export type NavLinkDef = {
  href: string;
  auth?: boolean;
  /** Affiché dans la barre app utilisateur */
  userChrome: boolean;
  /** Réservé au shell backoffice */
  adminChrome: boolean;
};

/** Routes de l’espace utilisateur (AppShell). Pas de /admin ici. */
export const USER_APP_LINKS: NavLinkDef[] = [
  { href: "/dashboard", userChrome: true, adminChrome: false },
  { href: "/stocks", userChrome: true, adminChrome: false },
  { href: "/recommendations", userChrome: true, adminChrome: false },
  { href: "/alerts", auth: true, userChrome: true, adminChrome: false },
  { href: "/portfolio", auth: true, userChrome: true, adminChrome: false },
  { href: "/guide", userChrome: true, adminChrome: false },
];

/** Destinations menu compte (hors barre principale). */
export const USER_ACCOUNT_LINKS: NavLinkDef[] = [
  { href: "/settings", auth: true, userChrome: false, adminChrome: false },
];

/** Menu backoffice — vraies routes (pas d’ancres). */
export const ADMIN_NAV = [
  { href: "/admin", labelFr: "Console", labelEn: "Console", exact: true },
  { href: "/admin/users", labelFr: "Utilisateurs", labelEn: "Users", exact: false },
  { href: "/admin/alerts", labelFr: "Support alertes", labelEn: "Alert support", exact: false },
  { href: "/admin/ops", labelFr: "Opérations", labelEn: "Operations", exact: false },
  { href: "/admin/data", labelFr: "Données", labelEn: "Data", exact: false },
] as const;

/** @deprecated utiliser ADMIN_NAV */
export const ADMIN_SECTION_ANCHORS = ["users", "alerts", "ops", "data"] as const;

export const ADMIN_APP_LINKS: NavLinkDef[] = ADMIN_NAV.map((n) => ({
  href: n.href,
  auth: true,
  userChrome: false,
  adminChrome: true,
}));

export function userChromeHrefs(): string[] {
  return USER_APP_LINKS.filter((l) => l.userChrome).map((l) => l.href);
}

export function assertAdminNotInUserChrome(): boolean {
  return !userChromeHrefs().includes("/admin") && !USER_ACCOUNT_LINKS.some((l) => l.href === "/admin");
}

export function homeAfterLogin(role: "user" | "admin"): string {
  return role === "admin" ? "/admin" : "/dashboard";
}

export function isAdminNavActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
