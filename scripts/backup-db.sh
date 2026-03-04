#!/usr/bin/env bash
# Backup PulseBoard database (users, sensors, alerts, insights, etc.)
# Run from project root. Creates backups/ folder if missing.

set -e
BACKUP_DIR="$(dirname "$(dirname "$0")")/backups"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/pulseboard_$STAMP.sql"

echo "Backing up database to $FILE ..."
docker exec timescaledb pg_dump -U postgres -d pulseboard --no-owner --no-acl > "$FILE"
echo "Done. Backup: $FILE"
echo "To restore later: docker exec -i timescaledb psql -U postgres -d pulseboard < $FILE"
