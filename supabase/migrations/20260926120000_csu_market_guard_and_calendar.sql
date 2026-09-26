-- =============================================================================
-- MEEDOSys v2.0 - Municipal Economic Enterprise Development Office
-- Migration: Market Guard Roster, Market Operations Calendar, & Blotter Locking
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. MARKET GUARDS ROSTER & CALL SIGNS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_guards (
  guard_id TEXT PRIMARY KEY,
  guard_name TEXT NOT NULL,
  rank_title TEXT DEFAULT 'Market Guard',
  default_area TEXT DEFAULT 'General Public Market',
  contact_no TEXT,
  radio_call_sign TEXT,
  assigned_facility TEXT DEFAULT 'Public Market Main',
  current_shift TEXT DEFAULT '1st Shift (06:00 - 14:00)',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Suspended', 'Off Duty')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. MARKET OPERATIONS CALENDAR & GUARD SCHEDULING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_calendar_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Guard Duty',
    'Market Inspection',
    'Cleaning',
    'Maintenance',
    'Meeting',
    'Administrative Deadline',
    'Special Event',
    'Emergency / Security Drill'
  )),
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  assigned_personnel TEXT,
  assigned_guard_id TEXT REFERENCES public.market_guards(guard_id) ON DELETE SET NULL,
  shift_name TEXT,
  call_sign TEXT,
  special_instructions TEXT,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Important', 'Urgent')),
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Ongoing', 'Completed', 'Cancelled', 'Rescheduled')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  blotter_report_id TEXT,
  created_by TEXT DEFAULT 'Municipal Administrator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. ENHANCE CSU DAILY BLOTTER REPORTS (Locking & Calendar Linkage)
-- -----------------------------------------------------------------------------
-- Ensure ID column accepts text keys (e.g. 'csu_...' or standard UUIDs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'csu_daily_reports' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.csu_daily_reports ALTER COLUMN id TYPE TEXT USING id::text;
  END IF;
END $$;

ALTER TABLE public.csu_daily_reports 
  ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- -----------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.market_guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public market_guards access" ON public.market_guards;
CREATE POLICY "Public market_guards access" ON public.market_guards FOR ALL USING (true);

DROP POLICY IF EXISTS "Public market_calendar_events access" ON public.market_calendar_events;
CREATE POLICY "Public market_calendar_events access" ON public.market_calendar_events FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_market_guards_status ON public.market_guards(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.market_calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_guard_id ON public.market_calendar_events(assigned_guard_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_category ON public.market_calendar_events(category);
CREATE INDEX IF NOT EXISTS idx_csu_reports_date ON public.csu_daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_csu_reports_locked ON public.csu_daily_reports(is_locked);
