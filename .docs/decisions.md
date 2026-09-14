# Décisions d’architecture (ADR) — BRVM Investment Analyzer

> Mémoire permanente. **Ne jamais supprimer** une décision : la marquer `Superseded` et en ajouter une nouvelle.  
> Dernière mise à jour : 2026-08-27

---

## ADR-001 — Greenfield, un seul projet Next.js

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Un dépôt, Next.js App Router, frontend et API séparés (`(frontend)` vs `api`).
- **Conséquence** : Pas de monorepo multi-packages pour le MVP.

---

## ADR-002 — Hexagone + DDD

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Le domaine n’importe jamais Next, React, Prisma, HTTP, scraping, SMTP.
- **Conséquence** : Dépendances vers l’intérieur uniquement. Tests métier sans Next.js.

---

## ADR-003 — PostgreSQL officiel, fichier en local

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Schéma Prisma `provider = postgresql`. Runtime local `PERSISTENCE_DRIVER=file` tant que PostgreSQL n’est pas disponible. Prisma n’apparaît pas dans le domaine.
- **Conséquence** : Même modèle conceptuel ; deux adaptateurs. `docker-compose` fourni pour plus tard.

---

## ADR-004 — Sources interchangeables, officiel d’abord

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Ports `MarketDataProvider`, `FinancialDataProvider`, `DividendDataProvider`. Officiel → fiable → scraping fallback → CSV. Pas de source tierce imposée au hasard.
- **Conséquence** : CSV dès le jour 1. Scraping versionné, fixtures locales.

---

## ADR-005 — Provenance de chaque chiffre

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : `source`, `sourceUrl`, `retrievedAt`, `referenceDate`, `confidence` sur toute donnée de marché / dividende / financier.
- **Conséquence** : L’UI doit pouvoir afficher l’origine d’un cours, d’un dividende, d’un BPA.

---

## ADR-006 — BUY = triptyque (anti-FILTISAC)

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : BUY uniquement si qualité + valorisation/MoS + confiance data, seuils respectés, aucune alerte critique. Score élevé insuffisant.
- **Conséquence** : Tests de recommandation obligatoires sur ce cas.

---

## ADR-007 — `.docs/` source de vérité

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Documentation progressive, français, jamais d’effacement. ADR pour toute décision structurante.
- **Conséquence** : Une feature n’est pas done sans `changelog` + `current_state`.

---

## ADR-008 — Historisation, pas d’écrasement silencieux

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Toute correction de valeur crée une révision (ancienne, nouvelle, source, date).
- **Conséquence** : Les jobs d’ingestion dédupliquent ; ils n’UPDATE pas aveuglément.

---

## ADR-009 — Ruleset versionné

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Chaque changement de seuils crée `RULESET vN`. Les snapshots de recommandation portent `rulesVersion`.
- **Conséquence** : On peut expliquer un BUY passé avec les règles d’alors.

---

## ADR-010 — Portfolio et backtest secondaires

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Portfolio = squelette. Backtest = ports, pas d’implémentation MVP.
- **Conséquence** : Ne pas bloquer le MVP sur ces sujets.

---

## ADR-011 — Plateforme publique multi-comptes

- **Date** : 2026-08-27
- **Statut** : Accepted (admin : superseded by ADR-013)
- **Décision** : Inscription ouverte. Le marché (cours, analyse officielle) est public. Alertes, réglages de seuils et e-mails sont **par utilisateur**.
- **Conséquence** : Isolation stricte `userId`. Cookie de session httpOnly. Les seuils personnels n’écrasent pas le moteur officiel.

---

## ADR-012 — Identité visuelle vert clair / blanc

- **Date** : 2026-08-27
- **Statut** : Superseded by ADR-014
- **Décision** : Couleurs principales : blanc + vert clair (`brand-50` à `brand-600`).
- **Conséquence** : Thème sombre navy/or abandonné pour l’UI publique.

---

## ADR-013 — Pas d’administrateur de plateforme

- **Date** : 2026-08-27
- **Statut** : Superseded by ADR-019
- **Décision** : Tous les comptes sont des utilisateurs. Pas de rôle admin, pas de page `/admin`. L’ingestion et l’analyse batch passent par `JOB_SECRET` (opérateur / cron), pas par un utilisateur.
- **Conséquence** : ADR-011 partiellement remplacée : le premier inscrit n’est plus admin.
- **Statut** : Superseded by ADR-019

---

## ADR-018 — PostgreSQL local via PGlite (WASM)

- **Date** : 2026-08-30
- **Statut** : Accepted
- **Décision** : Schéma SQL PostgreSQL officiel (`prisma/schema.prisma` + `0001_init.sql`). Sur cette machine, `postgres.exe` est bloqué par le contrôle d’application Windows. Runtime local : **PGlite** (PostgreSQL WASM) dans `.postgres/pglite`. Même SQL. Quand un serveur PostgreSQL sera autorisé, `DATABASE_URL` prendra le relais.
- **Conséquence** : Comptes, sessions, alertes, sociétés et snapshots de liste sont persistés en SQL. Les tests restent sur fichier.

---

## ADR-019 — Admin + support alertes

- **Date** : 2026-08-30
- **Statut** : Superseded by ADR-021 (mécanisme de promotion)
- **Décision** : Le premier compte créé (ou `ADMIN_EMAIL`) est administrateur. L’admin voit les alertes de tous les utilisateurs pour le support. Les utilisateurs voient uniquement les leurs.
- **Conséquence** : ADR-013 superseded. Page `/admin` : listes officielles, comptes, alertes support, import, analyse.

---

## ADR-014 — Thème sombre élégant

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Fond quasi noir (`#0b0d12`), surfaces `#141820`, accents champagne/or (`#c9a96e` / `#d4af77`), texte ivoire.
- **Conséquence** : ADR-012 superseded. PWA `theme_color` alignée.

---

## ADR-015 — Français par défaut, anglais optionnel

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : UI et docs en français. Langue anglaise disponible via cookie `brvm_locale`. Identifiants de code en anglais.
- **Conséquence** : Statuts affichés : Acheter / Accumuler / Surveiller / Attendre / Éviter. Codes internes BUY… inchangés.

---

## ADR-016 — PWA

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Manifest, service worker, icônes, viewport mobile, affichage `standalone`.
- **Conséquence** : Installable sur téléphone. Les API restent réseau-only (pas de cache des données métier).

---

## ADR-017 — Univers = 47 actions cotées BRVM

- **Date** : 2026-08-27
- **Statut** : Accepted
- **Décision** : Catalogue = séance officielle BRVM du 2026-08-27 (`brvm.org/fr/cours-actions/0`) : **47** titres. Ticker officiel SGBC (pas SGCI). BBGC non cotée (introduction à venir) : hors univers. Historique riche pour 5 titres de recherche ; les autres ont une série seed à qualité data limitée (pas de BUY sur fausse complétude).
- **Conséquence** : `ensureSeeded` ajoute les titres manquants sans effacer les comptes.

---

## ADR-020 — MySQL local (Laragon) comme runtime SQL

- **Date** : 2026-09-11
- **Statut** : Accepted
- **Décision** : Sur cette machine, le runtime SQL local est **MySQL 8** (Laragon) : base `db_bourse`, user `root`, mot de passe vide. Schéma dialecte dans `prisma/migrations/mysql/`. `PERSISTENCE_DRIVER=mysql` + `DATABASE_URL=mysql://root@127.0.0.1:3306/db_bourse`. PGlite reste disponible (`pglite`) ; ADR-018 n’est pas annulée mais n’est plus le défaut local.
- **Conséquence** : file-store reste source de vérité ; SQL = hydratation + miroir. `npm run db:setup:mysql` applique le schéma.

---

## ADR-021 — Backoffice admin (rôles en base) + seed bootstrap

- **Date** : 2026-09-14
- **Statut** : Accepted
- **Décision** : L’admin n’est plus lié à `ADMIN_EMAIL` ni au « premier inscrit ». Un compte bootstrap est créé au démarrage (`DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`, défauts documentés). La gestion utilisateurs / rôles / données se fait via `/admin` (backoffice). Rôles : `user` | `admin` ; permissions dérivées du rôle.
- **Conséquence** : ADR-019 partiellement superseded pour le mécanisme de promotion. Page `/admin` étendue : changer rôle, effacer données, supprimer compte. API `GET/PATCH/DELETE /api/admin/users`.

