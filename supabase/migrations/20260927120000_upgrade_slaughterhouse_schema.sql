-- MEEDOSys v2.0 - Migration: Upgrade Slaughterhouse Schema & Realtime Replication
-- Adds extended fields to slaughter_records and enables Realtime replication

-- 1. Extend slaughter_records table with butcher and location metadata
ALTER TABLE public.slaughter_records 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS kilos NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS butcher_id TEXT,
  ADD COLUMN IF NOT EXISTS butcher_name TEXT;

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_slaughter_records_butcher_id ON public.slaughter_records(butcher_id);
CREATE INDEX IF NOT EXISTS idx_slaughter_records_created ON public.slaughter_records(created_at DESC);

-- 3. Enable Full Replica Identity so that real-time DELETE events include old record IDs
ALTER TABLE public.slaughter_records REPLICA IDENTITY FULL;
ALTER TABLE public.butchers REPLICA IDENTITY FULL;

-- 4. Enable Supabase Realtime publication for slaughter_records and butchers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'slaughter_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.slaughter_records;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'butchers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.butchers;
  END IF;
END $$;
