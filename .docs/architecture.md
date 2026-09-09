# Architecture — BRVM Investment Analyzer

> Mémoire permanente. Enrichir, ne jamais effacer.  
> Dernière mise à jour : 2026-08-27  
> Statut code : en construction (voir `current_state.md`)

## 1. Vue d’ensemble

```
FRONTEND (Next.js / React)     ← src/app/(frontend)
        │ HTTP / Server Components
        ▼
API / Controllers              ← src/app/api  (driving adapters)
        ▼
APPLICATION (use cases)        ← src/modules/*/application
        ▼
DOMAIN                         ← src/modules/*/domain
  (aucune dépendance Next / Prisma / HTTP / SMTP / scraping)
        │ Ports
        ▼
INFRASTRUCTURE                 ← src/infrastructure
  FileStore | Prisma/PostgreSQL
  Data providers (officiel, scraping fallback, CSV)
  Email / Scheduler
```

## 2. Organisation du dépôt

```
.docs/                 vérité officielle
.cursor/               règles agent
prisma/                schéma PostgreSQL (Prisma = adaptateur)
src/app/(frontend)/    UI
src/app/api/           driving adapters HTTP
src/modules/           bounded contexts (domain + application + ports)
src/infrastructure/    adapters
src/shared/            kernel (normalisation, provenance)
src/config/            configuration runtime
tests/                 Vitest (finance, scoring, reco, parsers)
fixtures/              HTML/CSV locaux — zéro Internet en CI
```

## 3. Bounded contexts MVP

Company, Market, Dividend, Financial, Analysis, Recommendation, Alert, Notification.  
Portfolio : squelette (YOC / total return). Backtest : ports seulement.

## 4. Providers de données (interchangeables)

```
CompositeDataProvider (priorité des sources actives)
  1. OfficialBRVMProvider / OfficialCompanyProvider
  2. ReliableFinancialProvider (désactivé tant que non documenté)
  3. WebScrapingProvider (fallback)
  4. ManualImportProvider (CSV — toujours disponible)
```

Le scraping n’est **pas** le cœur. Chaque valeur stockée porte sa provenance.

## 5. Pipeline d’ingestion

SOURCE → FETCH → PARSE → NORMALIZE → VALIDATE → DEDUPLICATE → STORE → CALCULATE

Échec d’une source : **ne pas** supprimer les anciennes données. Émettre `DATA_SOURCE_FAILURE`.

## 6. Persistance

- **Cible** : PostgreSQL via Prisma (jamais Prisma dans le domaine).
- **MVP local** : `FileSystemStore` (`data/store.json`) pour les tests ; **PGlite** (PostgreSQL WASM) pour l’app.
- Bascule : `PERSISTENCE_DRIVER=file|pglite|prisma`.

## 7. Scheduler

Port `SchedulerPort`. En production : cron OS / job cloud qui appelle `POST /api/jobs/tick`.  
Interdit de s’appuyer sur `setInterval` comme mécanisme de prod.
