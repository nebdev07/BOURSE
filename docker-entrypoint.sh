#!/bin/sh
set -eu

mkdir -p /app/data
# Volume Docker souvent root-owned au 1er montage — corriger avant drop privileges.
if [ "$(id -u)" = "0" ]; then
  chown -R nextjs:nodejs /app/data || true
fi

# Mappe les variables cargo VPS Autopilot (DB_*) vers DATABASE_URL attendu par l’app.
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_HOST:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_NAME:-}" ]; then
  port="${DB_PORT:-3306}"
  pw_enc=$(printf '%s' "${DB_PASSWORD:-}" | sed 's/%/%25/g; s/@/%40/g; s/:/%3A/g; s/\//%2F/g')
  export DATABASE_URL="mysql://${DB_USER}:${pw_enc}@${DB_HOST}:${port}/${DB_NAME}"
  echo "entrypoint: DATABASE_URL construit depuis DB_* (${DB_HOST}/${DB_NAME})"
fi

if [ -z "${PERSISTENCE_DRIVER:-}" ]; then
  export PERSISTENCE_DRIVER=mysql
fi

export NODE_ENV="${NODE_ENV:-production}"

if [ -z "${JOB_SECRET:-}" ]; then
  if [ -f /app/data/job.secret ]; then
    JOB_SECRET=$(cat /app/data/job.secret)
  else
    JOB_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    printf '%s' "$JOB_SECRET" > /app/data/job.secret
    chmod 600 /app/data/job.secret
    if [ "$(id -u)" = "0" ]; then chown nextjs:nodejs /app/data/job.secret || true; fi
    echo "entrypoint: JOB_SECRET généré et persisté dans /app/data/job.secret"
  fi
  export JOB_SECRET
fi

export ENABLE_ADMIN_PORTFOLIO_EXAMPLE="${ENABLE_ADMIN_PORTFOLIO_EXAMPLE:-0}"

run_as_app() {
  if [ "$(id -u)" = "0" ] && command -v runuser >/dev/null 2>&1; then
    runuser -u nextjs -- "$@"
  elif [ "$(id -u)" = "0" ]; then
    su -s /bin/sh nextjs -c "$*"
  else
    "$@"
  fi
}

if [ "${SKIP_DB_MIGRATE:-0}" != "1" ] && [ -n "${DATABASE_URL:-}" ]; then
  run_as_app node /app/scripts/docker-apply-mysql-schema.mjs || {
    echo "entrypoint: avertissement — schéma MySQL non appliqué (l’app démarre quand même)"
  }
fi

if [ "$(id -u)" = "0" ] && command -v runuser >/dev/null 2>&1; then
  exec runuser -u nextjs -- "$@"
fi
if [ "$(id -u)" = "0" ]; then
  exec su -s /bin/sh nextjs -c "exec $*"
fi
exec "$@"
