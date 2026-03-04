#!/usr/bin/env bash
# Restore PulseBoard database from a backup file.
# Usage: ./scripts/restore-db.sh backups/pulseboard_YYYYMMDD_HHMMSS.sql
# Run from project root. Container must be running.

set -e
if [ -z "$1" ] || [ ! -f "$1" ]; then
  echo "Usage: $0 <backup-file.sql>"
  echo "Example: $0 backups/pulseboard_20260221_120000.sql"
  exit 1
fi
echo "Restoring from $1 ..."
docker exec -i timescaledb psql -U postgres -d pulseboard < "$1"
echo "Done."
