#!/usr/bin/env bash
# Backup MySQL db_bourse — rétention 14 jours
# Cron exemple: 0 3 * * * /opt/brvm/scripts/backup-mysql.sh
set -euo pipefail
ROOT="${BACKUP_ROOT:-/var/backups/brvm}"
DB="${MYSQL_DATABASE:-db_bourse}"
USER="${MYSQL_USER:-brvm_app}"
HOST="${MYSQL_HOST:-127.0.0.1}"
STAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$ROOT"
FILE="$ROOT/${DB}_${STAMP}.sql.gz"
mysqldump -h "$HOST" -u "$USER" -p"${MYSQL_PASSWORD:?MYSQL_PASSWORD required}" --single-transaction --routines "$DB" | gzip > "$FILE"
find "$ROOT" -name "${DB}_*.sql.gz" -mtime +14 -delete
echo "Backup OK: $FILE"
