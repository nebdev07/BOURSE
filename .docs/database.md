# Base de données — BRVM Investment Analyzer

> Dernière mise à jour : 2026-08-30

## Cible

PostgreSQL. Schéma : `prisma/schema.prisma` + `prisma/migrations/0001_init.sql`.  
Prisma documente le modèle ; l’adaptateur runtime n’importe pas Prisma dans le domaine.

## Runtime local (cette machine)

`postgres.exe` (installateur EDB 16 présent dans `C:\Program Files\PostgreSQL\16`) est **bloqué** par le contrôle d’application Windows.  
À la place : **PGlite** (`@electric-sql/pglite`) — PostgreSQL compatible, fichiers dans `.postgres/pglite`.

```
PERSISTENCE_DRIVER=pglite
npm run db:setup
```

Quand le service PostgreSQL sera autorisé :

```
DATABASE_URL=postgresql://postgres:brvm_local@127.0.0.1:5432/brvm_analyzer
```

## Tests

`PERSISTENCE_DRIVER=file` + `data/test-store.json` (isolé).

## Entités

- `company`, `data_source`, `data_source_failure`, `ruleset`
- `market_quote` + `market_quote_revision`
- `dividend` + `dividend_revision`
- `financial_statement` + `financial_revision`
- `raw_document`, `ingestion_run`, `email_log`
- `analysis_result`, `recommendation_snapshot`, `performance_tracking`
- `alert`, `scheduled_report`
- `user_account`, `auth_session`
- `index_quote`
- **`listing_snapshot` + `listing_snapshot_item`** : chaque version de la liste officielle (jamais écrasée)

## Règles

- Pas d’écrasement silencieux → révisions + snapshots de liste.
- Provenance obligatoire sur quotes / dividends / financials.
- Radiation : `company.status = DELISTED`, historique conservé.
