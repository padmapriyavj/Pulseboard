-- Migration script to fix org_id column type in sensor_metrics table
-- This fixes the issue where org_id was INTEGER but should be TEXT

-- First, check if the table exists and the column type is wrong
DO $$ 
BEGIN
  -- Check if sensor_metrics table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'sensor_metrics'
  ) THEN
    -- Check if org_id exists and is not TEXT
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'sensor_metrics' 
      AND column_name = 'org_id' 
      AND data_type NOT IN ('text', 'character varying')
    ) THEN
      -- For TimescaleDB hypertables, we need to be careful with ALTER TABLE
      -- First, let's try to alter the column type
      BEGIN
        ALTER TABLE sensor_metrics ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT;
        RAISE NOTICE 'Successfully altered org_id column to TEXT type';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not alter column directly. Column might need manual migration. Error: %', SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'org_id column is already TEXT type or does not exist';
    END IF;
  ELSE
    RAISE NOTICE 'sensor_metrics table does not exist';
  END IF;
END $$;

