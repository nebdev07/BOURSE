# Changelog — BRVM Investment Analyzer

> Enrichir, ne jamais effacer.

## 2026-08-27

- Création du dépôt greenfield.
- Phase 0 : mémoire `.docs/` et règles Cursor.
- ADR-001 → ADR-010 acceptées.
- Phases 1 à 13 : fondation, company, ingestion CSV, marché, dividendes, financiers, analyse, scoring, recommandations, UI, alertes, e-mail, suivi de performance.
- ADR-011 plateforme publique multi-comptes ; ADR-012 thème vert clair / blanc.
- Inscription, session, alertes et réglages isolés par utilisateur.
- Thème sombre élégant ; landing, login, signup ; PWA.
- Correction DCF : cash-flow ramené par action (évite une IV hors échelle).
- Tests Vitest : normalisation, formules, reco anti-FILTISAC, CSV, scraping fixtures, révisions, e-mail.
- ADR-013 : plus d’admin de plateforme ; jobs via `JOB_SECRET`.
- ADR-014 : thème sombre élégant (or / ivoire).
- ADR-015 : français par défaut, anglais optionnel.
- ADR-016 : PWA installable (mobile).
- ADR-017 : 47 actions cotées BRVM (source officielle 2026-08-27) ; ticker SGBC.

## 2026-08-30

- Installateur PostgreSQL 16 posé ; `postgres.exe` bloqué par Windows → PGlite (PostgreSQL WASM) + schéma SQL complet.
- Snapshots `listing_snapshot` : chaque mise à jour officielle de la liste est enregistrée.
- Admin rétabli : premier compte / `ADMIN_EMAIL`. Vue support de toutes les alertes.
- Alerte `PRICE_GTE` (seuil de hausse).
- ADR-018, ADR-019.

## 2026-09-10

- Guide utilisateur : retrait des sections internes (fréquence des cours, rôle admin).
- Rafraîchissement automatique des cours **toutes les heures** (`instrumentation` + `MARKET_REFRESH_MS`).
- Import cours : les corrections du jour (même date) sont bien comptées (`updated`) pour le job horaire.
- Landing respectueuse de la session (CTAs connectés vs anonymes).
- Portefeuille personnel `/portfolio` : positions, poids, P&L, contribution journalière, conseil de renforcement + raisons ; table `portfolio_holding`.
- Import portefeuille CSV : téléchargement modèle + exemple (acquisitions extrait courtier), upload UI ; parseur format plateforme et extrait Titre/Acquisitions/Crédit.
- Modèles Excel (.xlsx) professionnels colorés (onglets Accueil / Positions / Guide) ; import .xlsx ou .csv.
- Portefeuille basé sur l’historique d’opérations (FIFO) : lots restants, cessions, P&L réalisé ; exemple = relevé complet (achats progressifs).
- Modèle d’import **vierge** pour tous les utilisateurs ; historique perso n’entre pas dans l’analyse marché.
- Guide utilisateur enrichi (portefeuille, import, champ note, analyse vs portefeuille) ; roadmap 2026-09-10 recalée.

## 2026-09-11

- Import portefeuille : modèle **vierge** pour tous ; modèle **prérempli** (données admin / extrait courtier) téléchargeable uniquement si `role=admin` (`kind=exemple`).
- Persistence **MySQL** (`db_bourse`, Laragon) : schéma `prisma/migrations/mysql/`, driver `mysql2`, `npm run db:setup:mysql` ; file-store reste source de vérité, SQL = miroir/hydratation.
- Admin : `ADMIN_EMAIL` promu aussi au login / lecture session (pas seulement à l’inscription).

## 2026-09-14

- ADR-021 : backoffice `/admin` (rôles, effacer données, supprimer compte) ; seed admin bootstrap `nebdev07@gmail.com` au démarrage ; fin de la promotion via `ADMIN_EMAIL` / premier inscrit.
- Packaging production : `Dockerfile` racine, `docker-entrypoint.sh` (map `DB_*` → `DATABASE_URL`, `JOB_SECRET` persisté, schéma MySQL au boot), `.dockerignore`.
- `next.config` : ignore ESLint/TS errors pendant le build image (déploiement fiable).
- Runbook : cible Docker + Traefik / MariaDB VPS Autopilot.

## 2026-09-13

- Info-bulles pédagogiques (Débutant / Expert) sur dashboard, recommandations, fiches, portefeuille, réglages et pastilles de statut.
- Perf : sync MySQL debounced + exclusion du miroir `company` sur le chemin `persist` hot.
- Noms titres alignés sur la cote officielle BRVM (`COTE D'IVOIRE`, etc.) ; seed + sync listing + info-bulle « Nom officiel ».



