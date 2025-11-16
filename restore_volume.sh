#!/bin/bash

VOLUME_NAME="pulseboard_timescaledb-data"
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Please provide a backup file to restore."
  echo "Usage: ./restore_volume.sh backups/timescaledb_backup_YYYY-MM-DD_HH-MM-SS.tar.gz"
  exit 1
fi

docker volume create $VOLUME_NAME

docker run --rm \
  -v ${VOLUME_NAME}:/volume \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/${BACKUP_FILE} -C /volume

echo "✅ Volume '${VOLUME_NAME}' restored from ${BACKUP_FILE}"
