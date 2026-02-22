-- Insights table for AI-generated alert analysis
-- Matches project convention: org_id TEXT (no organizations table)
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

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_insights_org_id ON insights(org_id);
CREATE INDEX IF NOT EXISTS idx_insights_sensor_id ON insights(sensor_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_insight_type ON insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_severity ON insights(severity);

-- =============================================================================
-- Verification (run after migration against pulseboard database)
-- =============================================================================
-- 1. Show table structure:
--    \d insights
--
-- 2. Show columns and types:
--    SELECT column_name, data_type, is_nullable
--    FROM information_schema.columns
--    WHERE table_name = 'insights'
--    ORDER BY ordinal_position;
--
-- 3. Confirm indexes:
--    SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'insights';
