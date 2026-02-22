-- Users table required by auth-service
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  org_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure users.org_id is TEXT type (fixes schema mismatch issue)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'org_id' 
    AND data_type != 'text'
  ) THEN
    -- Alter column type if it's not TEXT
    ALTER TABLE users ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT;
  END IF;
END $$;

-- Sensor configuration table
CREATE TABLE IF NOT EXISTS sensors (
  id SERIAL PRIMARY KEY,
  org_id VARCHAR NOT NULL,
  name VARCHAR,
  type VARCHAR NOT NULL,
  min NUMERIC,
  max NUMERIC,
  unit VARCHAR,
  status VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  delete_status BOOLEAN DEFAULT FALSE
);

-- Ensure sensors table is fully up to date
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensors' AND column_name = 'name'
  ) THEN
    ALTER TABLE sensors ADD COLUMN name VARCHAR;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensors' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE sensors ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensors' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE sensors ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensors' AND column_name = 'delete_status'
  ) THEN
    ALTER TABLE sensors ADD COLUMN delete_status BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Drop and recreate metrics table
DROP TABLE IF EXISTS sensor_metrics;

CREATE TABLE sensor_metrics (
  device_id TEXT NOT NULL,
  sensor_type TEXT,
  org_id TEXT,
  sensor_id INTEGER,
  value DOUBLE PRECISION,
  unit TEXT,
  status TEXT,
  timestamp TIMESTAMPTZ NOT NULL
);

SELECT create_hypertable('sensor_metrics', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE);

-- Ensure org_id column is TEXT type (fixes schema mismatch issue)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensor_metrics' 
    AND column_name = 'org_id' 
    AND data_type != 'text'
  ) THEN
    -- Alter column type if it's not TEXT
    ALTER TABLE sensor_metrics ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS sensor_metrics_unique ON sensor_metrics (device_id, timestamp);

CREATE TABLE IF NOT EXISTS sensor_access_log (
  id SERIAL PRIMARY KEY,
  sensor_id INT NOT NULL REFERENCES sensors(id),
  org_id VARCHAR NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure sensor_access_log.org_id is TEXT/VARCHAR type (fixes schema mismatch issue)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensor_access_log' 
    AND column_name = 'org_id' 
    AND data_type NOT IN ('text', 'character varying')
  ) THEN
    -- Alter column type if it's not TEXT/VARCHAR
    ALTER TABLE sensor_access_log ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT;
  END IF;
END $$;

-- Optional: Index for faster recent access lookup
CREATE INDEX IF NOT EXISTS idx_sensor_access_log_org ON sensor_access_log (org_id, accessed_at DESC);

-- Alerts table for threshold breaches and anomalies (required by GraphQL getAlerts)
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  org_id TEXT NOT NULL,
  sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
  sensor_name TEXT,
  sensor_type TEXT,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  value DOUBLE PRECISION,
  threshold_min NUMERIC,
  threshold_max NUMERIC,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_org_id ON alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_alerts_sensor_id ON alerts(sensor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
