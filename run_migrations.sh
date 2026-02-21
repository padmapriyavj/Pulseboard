#!/bin/bash
# Run all DB migrations (sensor_id on sensor_metrics, alerts table).
# Usage: ./run_migrations.sh
# Requires: Docker running with container named "timescaledb"

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Running migrations on pulseboard database..."
echo ""

echo "1. Adding sensor_id to sensor_metrics (if missing)..."
docker exec -i timescaledb psql -U postgres -d pulseboard -f - < migrate_add_sensor_id.sql
echo ""

echo "2. Creating alerts table (if missing)..."
docker exec -i timescaledb psql -U postgres -d pulseboard -f - < migrate_create_alerts_table.sql
echo ""

echo "Done. Restart graphql-api and kafka-processor if they were running."
