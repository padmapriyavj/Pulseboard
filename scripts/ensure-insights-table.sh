#!/usr/bin/env bash
# Creates the insights table if it doesn't exist (run once per database).
# Run from project root. Requires: docker and timescaledb container running.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "Creating insights table if not exists..."
docker exec -i timescaledb psql -U postgres -d pulseboard <<'SQL'
CREATE TABLE IF NOT EXISTS insights (
  id SERIAL PRIMARY KEY,
  org_id TEXT NOT NULL,
  sensor_id INTEGER REFERENCES sensors(id) ON DELETE SET NULL,
  insight_type VARCHAR(50) NOT NULL,
  insight_text TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_insights_org_id ON insights(org_id);
CREATE INDEX IF NOT EXISTS idx_insights_sensor_id ON insights(sensor_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_insight_type ON insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_severity ON insights(severity);
SQL
echo "Done. Insights table is ready."
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT COUNT(*) AS insights_count FROM insights;"
