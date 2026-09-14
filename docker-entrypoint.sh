#!/bin/sh
set -eu

# Mappe les variables cargo VPS Autopilot (DB_*) vers DATABASE_URL attendu par l’app.
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_HOST:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_NAME:-}" ]; then
  port="${DB_PORT:-3306}"
  # Encodage minimal du mot de passe pour URL (caractères fréquents openssl hex : pas de quote).
  pw_enc=$(printf '%s' "${DB_PASSWORD:-}" | sed 's/%/%25/g; s/@/%40/g; s/:/%3A/g; s/\//%2F/g')
  export DATABASE_URL="mysql://${DB_USER}:${pw_enc}@${DB_HOST}:${port}/${DB_NAME}"
  echo "entrypoint: DATABASE_URL construit depuis DB_* (${DB_HOST}/${DB_NAME})"
fi

if [ -z "${PERSISTENCE_DRIVER:-}" ]; then
  export PERSISTENCE_DRIVER=mysql
fi

export NODE_ENV="${NODE_ENV:-production}"
mkdir -p /app/data

if [ -z "${JOB_SECRET:-}" ]; then
  if [ -f /app/data/job.secret ]; then
    JOB_SECRET=$(cat /app/data/job.secret)
  else
    JOB_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    printf '%s' "$JOB_SECRET" > /app/data/job.secret
    chmod 600 /app/data/job.secret
    echo "entrypoint: JOB_SECRET généré et persisté dans /app/data/job.secret"
  fi
  export JOB_SECRET
fi

export ENABLE_ADMIN_PORTFOLIO_EXAMPLE="${ENABLE_ADMIN_PORTFOLIO_EXAMPLE:-0}"

if [ "${SKIP_DB_MIGRATE:-0}" != "1" ] && [ -n "${DATABASE_URL:-}" ]; then
  node /app/scripts/docker-apply-mysql-schema.mjs || {
    echo "entrypoint: avertissement — schéma MySQL non appliqué (l’app démarre quand même)"
  }
fi

exec "$@"
