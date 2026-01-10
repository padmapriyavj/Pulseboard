-- Migration script to fix org_id column type in all tables
-- Run this in pgAdmin or psql to fix the schema mismatch issue
-- This fixes: users, sensors, sensor_metrics, and sensor_access_log tables

BEGIN;

-- First, drop any foreign key constraints on org_id columns
DO $$ 
DECLARE
  constraint_record RECORD;
  constraint_name TEXT;
  table_name TEXT;
BEGIN
  -- Find and drop foreign key constraints involving org_id
  FOR constraint_record IN
    SELECT 
      tc.table_name, 
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'org_id'
      AND tc.table_schema = 'public'
  LOOP
    constraint_name := constraint_record.constraint_name;
    table_name := constraint_record.table_name;
    EXECUTE 'ALTER TABLE ' || quote_ident(table_name) || 
            ' DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name) || ' CASCADE';
    RAISE NOTICE 'Dropped foreign key constraint % from table %', constraint_name, table_name;
  END LOOP;
END $$;

-- Fix users table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'org_id' 
    AND data_type != 'text'
  ) THEN
    ALTER TABLE users ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT;
    RAISE NOTICE 'Fixed users.org_id column type to TEXT';
  ELSE
    RAISE NOTICE 'users.org_id is already TEXT or does not exist';
  END IF;
END $$;

-- Fix sensors table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensors' 
    AND column_name = 'org_id' 
    AND data_type NOT IN ('text', 'character varying')
  ) THEN
    ALTER TABLE sensors ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT;
    RAISE NOTICE 'Fixed sensors.org_id column type to TEXT';
  ELSE
    RAISE NOTICE 'sensors.org_id is already TEXT/VARCHAR or does not exist';
  END IF;
END $$;

-- Fix sensor_metrics table (check if it's a hypertable)
DO $$ 
DECLARE
  is_hypertable BOOLEAN := FALSE;
  current_type TEXT;
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'sensor_metrics'
  ) THEN
    -- Check if it's a hypertable
    BEGIN
      SELECT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = 'sensor_metrics'
      ) INTO is_hypertable;
    EXCEPTION WHEN OTHERS THEN
      is_hypertable := FALSE;
    END;
    
    -- Check current column type
    SELECT data_type INTO current_type
    FROM information_schema.columns 
    WHERE table_name = 'sensor_metrics' 
    AND column_name = 'org_id';
    
    IF current_type IS NOT NULL AND current_type != 'text' THEN
      IF is_hypertable THEN
        RAISE NOTICE 'sensor_metrics is a hypertable. Dropping and recreating...';
        DROP TABLE IF EXISTS sensor_metrics CASCADE;
        CREATE TABLE sensor_metrics (
          device_id TEXT NOT NULL,
          sensor_type TEXT,
          org_id TEXT,
          value DOUBLE PRECISION,
          unit TEXT,
          status TEXT,
          timestamp TIMESTAMPTZ NOT NULL
        );
        PERFORM create_hypertable('sensor_metrics', 'timestamp', if_not_exists => TRUE);
        CREATE UNIQUE INDEX sensor_metrics_unique ON sensor_metrics (device_id, timestamp);
        RAISE NOTICE 'Recreated sensor_metrics hypertable with correct schema';
      ELSE
        ALTER TABLE sensor_metrics ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT;
        RAISE NOTICE 'Fixed sensor_metrics.org_id column type to TEXT';
      END IF;
    ELSE
      RAISE NOTICE 'sensor_metrics.org_id is already TEXT or does not exist';
    END IF;
  ELSE
    RAISE NOTICE 'sensor_metrics table does not exist';
  END IF;
END $$;

-- Fix sensor_access_log table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensor_access_log' 
    AND column_name = 'org_id' 
    AND data_type NOT IN ('text', 'character varying')
  ) THEN
    ALTER TABLE sensor_access_log ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT;
    RAISE NOTICE 'Fixed sensor_access_log.org_id column type to TEXT';
  ELSE
    RAISE NOTICE 'sensor_access_log.org_id is already TEXT/VARCHAR or does not exist';
  END IF;
END $$;

COMMIT;

-- Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE column_name = 'org_id' 
AND table_schema = 'public'
ORDER BY table_name;

