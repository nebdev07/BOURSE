# Base de données — BRVM Investment Analyzer

> Dernière mise à jour : 2026-09-13

## Cible production

**MySQL 8** = source de vérité (`PERSISTENCE_DRIVER=mysql`).  
Schéma : `prisma/migrations/mysql/`.  
Utilisateur app dédié `brvm_app` (pas root) — `npm run db:create-app-user`.

```
PERSISTENCE_DRIVER=mysql
DATABASE_URL=mysql://brvm_app:***@127.0.0.1:3306/db_bourse
npm run db:setup:mysql
npm run db:migrate-from-store   # one-shot depuis data/store.json
```

Le file-store (`data/store.json`) reste un **cache / bootstrap** en runtime MySQL, et la vérité pour `PERSISTENCE_DRIVER=file` (tests).

## Dev local (Laragon)

```
DATABASE_URL=mysql://root@127.0.0.1:3306/db_bourse
ENABLE_ADMIN_PORTFOLIO_EXAMPLE=1
```

## PGlite (fallback)

```
PERSISTENCE_DRIVER=pglite
npm run db:setup
```

## Tests

`PERSISTENCE_DRIVER=file` forcé par `scripts/run-tests.mjs`.

## Entités SQL

- Plateforme : `user_account`, `auth_session`, `alert`, `portfolio_*`, `scheduled_report`, `company`, `listing_snapshot*`
- Marché : `market_quote`, `dividend`, `financial_statement`, `analysis_result`, `recommendation_snapshot`

## Ops

Voir [runbook-production.md](./runbook-production.md).
