# Runbook production — BRVM Investment Analyzer

> Dernière mise à jour : 2026-09-14

## Prérequis

- Node.js 20+ **ou** Docker
- MySQL 8 / MariaDB 11
- Reverse-proxy HTTPS (Caddy, Nginx, **ou Traefik** via VPS Autopilot)
- Domaine + certificats

## Secrets

```bash
openssl rand -hex 32   # → JOB_SECRET
# Mot de passe MySQL app ≥ 12 caractères → BRVM_APP_PASSWORD
```

Créer l’utilisateur app (une fois, en root MySQL) :

```bash
export BRVM_APP_PASSWORD='…'
node scripts/create-mysql-app-user.mjs
npm run db:setup:mysql
npm run db:migrate-from-store   # si migration depuis data/store.json
```

Fichier env **hors git** : `.env.production` ou `/etc/brvm/env` :

- `NODE_ENV=production`
- `PERSISTENCE_DRIVER=mysql`
- `DATABASE_URL=mysql://brvm_app:***@127.0.0.1:3306/db_bourse`
- `JOB_SECRET=…`
- `ADMIN_EMAIL=…`
- `ENABLE_ADMIN_PORTFOLIO_EXAMPLE=0`

## Démarrage (process Node)

```bash
npm ci
npm run build
NODE_ENV=production npm start   # écoute :3000
```

Process manager (exemple systemd) : `WorkingDirectory` = repo, `EnvironmentFile` = secrets, `ExecStart=npm start`.

PM2 : `pm2 start npm --name brvm -- start`.

## Démarrage (Docker / VPS Autopilot)

```bash
docker build -t brvm-analyzer .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL='mysql://…' \
  -e JOB_SECRET='…' \
  -e PERSISTENCE_DRIVER=mysql \
  -v brvm_data:/app/data \
  brvm-analyzer
```

Sur VPS Autopilot : rôle `deploy-app` → `app.env` + `db.env` (`DB_*` / `DATABASE_URL`), volume `/app/data`, schéma MySQL appliqué au boot par l’entrypoint.

## Reverse-proxy (Caddy)

```
brvm.example.com {
  encode gzip
  reverse_proxy 127.0.0.1:3000
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options nosniff
    Referrer-Policy strict-origin-when-cross-origin
  }
}
```

## Health & jobs

- Health : `GET /api/health` → `status=ok`
- Tick marché (cron secours, toutes les heures) :

```bash
curl -sS -X POST https://brvm.example.com/api/jobs/tick \
  -H "x-job-secret: $JOB_SECRET"
```

Sans secret en production → **401**.

## Backups

```bash
export MYSQL_PASSWORD='…'
bash scripts/backup-mysql.sh
```

Restore test (staging) :

```bash
gunzip -c backup.sql.gz | mysql -u brvm_app -p db_bourse
```

## Incidents

| Symptôme | Action |
|---|---|
| 503 health / sql.ok=false | Vérifier MySQL, `DATABASE_URL`, logs |
| Login 429 | Rate-limit auth — attendre 15 min ou redémarrer process |
| Cours figés | Relancer `/api/jobs/tick` + vérifier réseau BRVM |
| Exemple portefeuille admin visible | Forcer `ENABLE_ADMIN_PORTFOLIO_EXAMPLE=0` |

## Rotation secrets

1. Générer nouveau `JOB_SECRET`
2. Mettre à jour env + cron
3. Redémarrer l’app
4. (Optionnel) changer mdp `brvm_app` + `DATABASE_URL`
