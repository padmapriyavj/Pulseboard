#!/bin/bash

VOLUME_NAME="pulseboard_timescaledb-data"
BACKUP_NAME="timescaledb_backup_$(date +%F_%H-%M-%S).tar.gz"
BACKUP_DIR="./backups"

mkdir -p "$BACKUP_DIR"

docker run --rm \
  -v ${VOLUME_NAME}:/volume \
  -v $(pwd)/$BACKUP_DIR:/backup \
  alpine \
  tar czf /backup/${BACKUP_NAME} -C /volume .

echo "✅ Backup created at ${BACKUP_DIR}/${BACKUP_NAME}"
