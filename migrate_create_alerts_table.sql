-- Create alerts table for threshold breaches and anomalies
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  org_id TEXT NOT NULL,
  sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
  sensor_name TEXT,
  sensor_type TEXT,
  alert_type TEXT NOT NULL, -- 'threshold_breach' or 'anomaly'
  severity TEXT NOT NULL, -- 'Critical', 'Warning'
  message TEXT NOT NULL,
  value DOUBLE PRECISION,
  threshold_min NUMERIC,
  threshold_max NUMERIC,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_alerts_org_id ON alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_alerts_sensor_id ON alerts(sensor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- Verify the table was created
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'alerts'
ORDER BY ordinal_position;
