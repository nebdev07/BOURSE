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

