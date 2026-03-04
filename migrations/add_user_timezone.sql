-- Add timezone column to users for Settings page (run once per database)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;
