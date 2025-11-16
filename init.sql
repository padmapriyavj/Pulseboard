-- init.sql
-- Users table required by auth-service
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  org_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensors (
  id SERIAL PRIMARY KEY,
  org_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  min NUMERIC,
  max NUMERIC,
  unit VARCHAR,
  status VARCHAR
);

DROP TABLE IF EXISTS sensor_metrics;

CREATE TABLE sensor_metrics (
  device_id TEXT NOT NULL,
  sensor_type TEXT,
  org_id TEXT,
  value DOUBLE PRECISION,
  unit TEXT,
  status TEXT,
  timestamp TIMESTAMPTZ NOT NULL
);

SELECT create_hypertable('sensor_metrics', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE);

CREATE UNIQUE INDEX IF NOT EXISTS sensor_metrics_unique ON sensor_metrics (device_id, timestamp);





