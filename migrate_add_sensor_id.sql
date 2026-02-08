-- Migration to add sensor_id column to sensor_metrics table
-- This allows linking metrics to individual sensors, not just sensor types

BEGIN;

-- Add sensor_id column (nullable initially to handle existing data)
ALTER TABLE sensor_metrics ADD COLUMN IF NOT EXISTS sensor_id INTEGER;

-- Create index for faster queries by sensor_id
CREATE INDEX IF NOT EXISTS idx_sensor_metrics_sensor_id ON sensor_metrics(sensor_id);

-- Add foreign key constraint (optional, can be added later if needed)
-- ALTER TABLE sensor_metrics ADD CONSTRAINT fk_sensor_metrics_sensor_id 
--   FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE;

COMMIT;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sensor_metrics' 
AND column_name = 'sensor_id';
