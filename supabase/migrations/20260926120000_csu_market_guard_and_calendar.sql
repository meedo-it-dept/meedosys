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
-- If table already exists with UUID primary key, convert id to TEXT to support 'csu_' prefixed IDs
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

-- -----------------------------------------------------------------------------
-- 6. INITIAL SEED DATA: OFFICIAL MARKET GUARDS ROSTER
-- -----------------------------------------------------------------------------
INSERT INTO public.market_guards (guard_id, guard_name, rank_title, default_area, contact_no, radio_call_sign, assigned_facility, current_shift, status)
VALUES
  ('G-101', 'Roberto Alcantara', 'Senior Market Guard', 'Wet Market Section', '0917-555-0101', 'EAGLE-1', 'Public Market Main', '1st Shift (06:00 - 14:00)', 'Active'),
  ('G-102', 'Melvin D. Sionosa', 'Market Security Guard I', 'Dry Goods & Perimeter', '0918-555-0102', 'HAWK-2', 'Public Market Main', '2nd Shift (14:00 - 22:00)', 'Active'),
  ('G-103', 'Rafjun Somosa', 'Market Guard-on-Duty', 'Whole Market / Main Hall', '0919-555-0103', 'FALCON-3', 'Public Market Main', '1st Shift (06:00 - 14:00)', 'Active'),
  ('G-104', 'Jomar L. Castillo', 'Market Security Guard I', 'Terminal & Unloading Bay', '0920-555-0104', 'SENTINEL-4', 'Public Market Main', '3rd Shift (22:00 - 06:00)', 'Active'),
  ('G-105', 'Danilo P. Ramos', 'Security Officer / Roving', 'Commercial Plaza & Gates', '0921-555-0105', 'GUARDIAN-5', 'Public Market Main', '1st Shift (06:00 - 14:00)', 'Active')
ON CONFLICT (guard_id) DO UPDATE SET
  guard_name = EXCLUDED.guard_name,
  rank_title = EXCLUDED.rank_title,
  default_area = EXCLUDED.default_area,
  contact_no = EXCLUDED.contact_no,
  radio_call_sign = EXCLUDED.radio_call_sign,
  assigned_facility = EXCLUDED.assigned_facility,
  current_shift = EXCLUDED.current_shift,
  status = EXCLUDED.status;

-- -----------------------------------------------------------------------------
-- 7. INITIAL SEED DATA: MARKET OPERATIONS CALENDAR SCHEDULE
-- -----------------------------------------------------------------------------
INSERT INTO public.market_calendar_events (
  id, title, category, date, start_time, end_time, location, 
  assigned_personnel, assigned_guard_id, shift_name, call_sign, 
  special_instructions, description, priority, status, created_by
)
VALUES
  (
    'evt_shift_01', 
    'Guard Duty: 1st Shift - Whole Market', 
    'Guard Duty', 
    CURRENT_DATE, 
    '06:00', 
    '14:00', 
    'Public Market Main - Whole Market', 
    'Rafjun Somosa', 
    'G-103', 
    '1st Shift', 
    'FALCON-3', 
    'Conduct hourly roving across wet market and triangular section. Ensure passageways remain unobstructed.', 
    'Daily morning guard duty and vendor crowd control.', 
    'Normal', 
    'Ongoing', 
    'Municipal Administrator'
  ),
  (
    'evt_shift_02', 
    'Guard Duty: 2nd Shift - Dry Goods & Gates', 
    'Guard Duty', 
    CURRENT_DATE, 
    '14:00', 
    '22:00', 
    'Public Market Main - Dry Goods & Gate 1', 
    'Melvin D. Sionosa', 
    'G-102', 
    '2nd Shift', 
    'HAWK-2', 
    'Monitor closing hours, ensure stall shutter security, and assist afternoon terminal rush.', 
    'Afternoon shift security coverage.', 
    'Normal', 
    'Scheduled', 
    'Municipal Administrator'
  ),
  (
    'evt_shift_03', 
    'Guard Duty: 3rd Shift - Night Watch & Terminal', 
    'Guard Duty', 
    CURRENT_DATE, 
    '22:00', 
    '06:00', 
    'Public Market Main - Terminal & Unloading Bay', 
    'Jomar L. Castillo', 
    'G-104', 
    '3rd Shift', 
    'SENTINEL-4', 
    'Strict monitoring of incoming midnight cargo, verify delivery receipts, check perimeter locks every 2 hours.', 
    'Graveyard shift facility and delivery surveillance.', 
    'Normal', 
    'Scheduled', 
    'Municipal Administrator'
  ),
  (
    'evt_insp_01', 
    'Comprehensive Food Safety & Meat Inspection', 
    'Market Inspection', 
    CURRENT_DATE, 
    '09:00', 
    '11:30', 
    'Meat Section & Fish Section', 
    'Dr. LGU Meat Inspector / Sanitation Team', 
    NULL, 
    NULL, 
    NULL, 
    'Inspect ante-mortem and post-mortem meat clearance tags, check cold storage temperature logs, verify vendor health certificates.', 
    'Routine municipal health and sanitation compliance audit.', 
    'Important', 
    'Scheduled', 
    'Municipal Administrator'
  ),
  (
    'evt_clean_01', 
    'General Flushing & Wet Section Disinfection', 
    'Cleaning', 
    CURRENT_DATE, 
    '18:30', 
    '20:30', 
    'Wet Market Section & Drainage Grates', 
    'Market Sanitation Crew & BFP Water Assistance', 
    NULL, 
    NULL, 
    NULL, 
    'High pressure hose down of fish/meat cutting tables, degrease floor drains, chlorine disinfection.', 
    'Bi-weekly scheduled wet section deep decontamination.', 
    'Normal', 
    'Scheduled', 
    'Municipal Administrator'
  ),
  (
    'evt_meet_01', 
    'Market Vendor Association Monthly Coordination', 
    'Meeting', 
    CURRENT_DATE + INTERVAL '2 day', 
    '10:00', 
    '12:00', 
    'MEEDO Conference Hall - 2nd Floor', 
    'MEEDO Department Head & Market Supervisor', 
    NULL, 
    NULL, 
    NULL, 
    'Agenda: Holiday market hours, Paleng-QR adoption rates, electrical utility billing reconciliations.', 
    'Quarterly alignment between stallholders and local government enterprise management.', 
    'Important', 
    'Scheduled', 
    'Municipal Administrator'
  ),
  (
    'evt_maint_01', 
    'Backup Generator & Electrical Panel PM Check', 
    'Maintenance', 
    CURRENT_DATE + INTERVAL '3 day', 
    '13:00', 
    '16:00', 
    'Power Generator Room & Main Distribution Board', 
    'Municipal Engineering Electrical Team', 
    NULL, 
    NULL, 
    NULL, 
    'Test automatic transfer switch (ATS), load bank test, inspect sub-meters across Zone Dry and Wet.', 
    'Preventive maintenance on high-capacity emergency power backup system.', 
    'Normal', 
    'Scheduled', 
    'Municipal Administrator'
  ),
  (
    'evt_dead_01', 
    'Monthly Stall Rental & Utility Clearance Cutoff', 
    'Administrative Deadline', 
    CURRENT_DATE + INTERVAL '4 day', 
    '08:00', 
    '17:00', 
    'MEEDO Treasury Cashier Windows 1 & 2', 
    'Treasury Revenue Collectors', 
    NULL, 
    NULL, 
    NULL, 
    'Final cutoff for monthly rental and electrical bills prior to statutory 25% surcharge assessment.', 
    'Statutory payment deadline for municipal enterprise tenants.', 
    'Urgent', 
    'Scheduled', 
    'Municipal Administrator'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  date = EXCLUDED.date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  assigned_personnel = EXCLUDED.assigned_personnel,
  assigned_guard_id = EXCLUDED.assigned_guard_id,
  shift_name = EXCLUDED.shift_name,
  call_sign = EXCLUDED.call_sign,
  special_instructions = EXCLUDED.special_instructions,
  description = EXCLUDED.description,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status;
