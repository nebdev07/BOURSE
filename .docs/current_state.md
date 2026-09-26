# État actuel — BRVM Investment Analyzer

> Distinguer spécifié vs implémenté.  
> Dernière mise à jour : 2026-09-26

## Spécifié

Plateforme publique multi-comptes, admin restreint, **MySQL source de vérité**, alertes, guide, refresh horaire, portefeuille, prêt production (sécurité + ops).

## Implémenté

- Auth : scrypt, cookie httpOnly/SameSite, **rate-limit** login/register/import.
- **Backoffice** `/admin` : shell admin dédié (sidebar), utilisateurs, rôles, permissions, données (ADR-021). Accès via menu compte, pas dans la nav app.
- **Seed admin** au boot : `DEFAULT_ADMIN_EMAIL` (défaut `nebdev07@gmail.com`) — plus de promotion via `ADMIN_EMAIL`.
- Jobs : `JOB_SECRET` obligatoire en production.
- Exemple portefeuille admin : `ENABLE_ADMIN_PORTFOLIO_EXAMPLE` (off en prod par défaut).
- Disclaimer légal (footer + guide).
- MySQL : hydratation + sync marché (quotes, divs, fins, analyses, recos) + plateforme.
- Migration : `npm run db:migrate-from-store`.
- Health : `GET /api/health`.
- Runbook : `.docs/runbook-production.md` ; backups `scripts/backup-mysql.sh`.
- **Docker prod** : `Dockerfile` + entrypoint (`DB_*`→`DATABASE_URL`, schéma MySQL au boot, volume `/app/data`).
- Portefeuille, info-bulles, noms officiels BRVM, etc. (chantiers antérieurs).

## Runtime local

- `PERSISTENCE_DRIVER=mysql`
- `DATABASE_URL=mysql://root@127.0.0.1:3306/db_bourse` (Laragon)
- `ENABLE_ADMIN_PORTFOLIO_EXAMPLE=1` (dev)
- Prod : user `brvm_app`, `ENABLE_ADMIN_PORTFOLIO_EXAMPLE=0`, `NODE_ENV=production`, `npm run build && npm start` **ou** image Docker.

## Déploiement VPS (Autopilot)

- Image construite depuis le Dockerfile du dépôt (plus de scaffold Next requis).
- Env : `app.env` (`JOB_SECRET`) + `db.env` (`DATABASE_URL` / `DB_*`) injectés par le rôle `deploy-app`.
- Hostname public typique : `my-bourse.apps.nebdev.org` (port interne **3000**).
