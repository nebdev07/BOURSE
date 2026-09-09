# État actuel — BRVM Investment Analyzer

> Distinguer spécifié vs implémenté.  
> Dernière mise à jour : 2026-08-30

## Spécifié

Plateforme publique multi-comptes, **admin support**, PostgreSQL, liste officielle historisée, thème sombre, FR/EN, PWA, 47 actions BRVM.

## Implémenté

- Moteur d’analyse + recommandations officielles.
- Inscription / connexion. **Premier compte = admin** (ou `ADMIN_EMAIL`).
- Alertes personnelles (prix ≤, prix ≥ hausse, score, reco). L’admin voit toutes les alertes pour le support.
- Page `/admin` : comptes, alertes support, historique des listes, import, analyse.
- Job `tick` : re-lit la liste officielle BRVM, enregistre un snapshot, met à jour le catalogue (sans effacer l’historique).
- Persistance SQL : PGlite (PostgreSQL WASM) — `postgres.exe` bloqué sur cette machine.
- Tests métier + isolation + support admin + parseur de liste.

## Runtime

- App : `PERSISTENCE_DRIVER=pglite` → `.postgres/pglite`
- Tests : fichier `data/test-store.json`
- Dev : `npx next dev -p 3000`
