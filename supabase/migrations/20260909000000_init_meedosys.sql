-- =============================================================================
-- MEEDOSys v2.0 - Municipal Economic Enterprise Development Office
-- Complete PostgreSQL Schema with Row-Level Security (RLS) & Seed Data
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. USER PROFILES & RBAC (Linked to Supabase auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff' CHECK (role IN ('Admin', 'Staff')),
  section TEXT NOT NULL DEFAULT 'A' CHECK (section IN ('ALL', 'A', 'B', 'C', 'D', 'E', 'F')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. SECTION A: MARKET STALLS & TENANCY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stalls (
  stall_no TEXT PRIMARY KEY,
  zone TEXT NOT NULL CHECK (zone IN ('wet', 'dry', 'old', 'triangular')),
  status TEXT NOT NULL DEFAULT 'Vacant' CHECK (status IN ('Occupied', 'Vacant')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stall_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_no TEXT REFERENCES public.stalls(stall_no) ON DELETE CASCADE,
  stall_owner TEXT NOT NULL,
  operator TEXT,
  line_of_business TEXT,
  period_index INT DEFAULT 1,
  year INT DEFAULT EXTRACT(YEAR FROM NOW()),
  compliance_status TEXT DEFAULT 'Non-Compliant' CHECK (compliance_status IN ('Compliant', 'Non-Compliant')),
  photo_url TEXT,
  lease_doc_url TEXT,
  permit_doc_url TEXT,
  additional_info TEXT,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. SECTION A: MONTHLY MONITORING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monitoring_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_no TEXT REFERENCES public.stalls(stall_no) ON DELETE CASCADE,
  monitoring_date DATE NOT NULL DEFAULT CURRENT_DATE,
  goodwill NUMERIC(12,2) DEFAULT 0.00,
  operational_status TEXT DEFAULT 'Operational' CHECK (operational_status IN ('Operational', 'Non-Operational')),
  permit_date DATE,
  permit_submitted BOOLEAN DEFAULT FALSE,
  lease_date DATE,
  lease_submitted BOOLEAN DEFAULT FALSE,
  rental_or TEXT,
  rental_paid BOOLEAN DEFAULT FALSE,
  claygo_compliant TEXT DEFAULT 'No' CHECK (claygo_compliant IN ('Yes', 'No', '')),
  cctv_available TEXT DEFAULT 'No' CHECK (cctv_available IN ('Yes', 'No', '')),
  palengqr_implemented TEXT DEFAULT 'No' CHECK (palengqr_implemented IN ('Yes', 'No', '')),
  seminars_attended TEXT[] DEFAULT '{}',
  electric_bill_amount NUMERIC(12,2) DEFAULT 0.00,
  electric_bill_status TEXT DEFAULT 'Unpaid' CHECK (electric_bill_status IN ('Fully Paid', 'Partial', 'Unpaid', '')),
  electric_bill_due_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. SECTION A: ELECTRIC BILLING LEDGER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.electric_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_no TEXT REFERENCES public.stalls(stall_no) ON DELETE CASCADE,
  owner_name TEXT,
  due_date DATE NOT NULL,
  disconnection_date DATE,
  prev_reading NUMERIC(10,2) NOT NULL,
  curr_reading NUMERIC(10,2) NOT NULL,
  consumption NUMERIC(10,2) GENERATED ALWAYS AS (GREATEST(curr_reading - prev_reading, 0)) STORED,
  rate_per_kwh NUMERIC(8,2) NOT NULL DEFAULT 15.00,
  arrears NUMERIC(12,2) DEFAULT 0.00,
  bill_amount NUMERIC(12,2) NOT NULL,
  meter_reset BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partial', 'Fully Paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. SECTION B: SLAUGHTERHOUSE RECORDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.slaughter_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  contact_no TEXT,
  or_number TEXT,
  status TEXT NOT NULL DEFAULT 'Private' CHECK (status IN ('Private', 'Public')),
  livestock_type TEXT NOT NULL CHECK (livestock_type IN ('Hogs', 'Chicken', 'Goat', 'Cow')),
  head_count INT NOT NULL CHECK (head_count > 0),
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. SECTION C: CEMETERY BURIAL BOOKINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cemetery_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deceased_name TEXT NOT NULL,
  address_barangay TEXT NOT NULL,
  phone_number TEXT,
  burial_date DATE NOT NULL,
  burial_time TIME,
  burial_type TEXT NOT NULL CHECK (burial_type IN (
    'Apartment', 'Bone Vault', 'Ground', 'Mausoleum', 
    'Transfer of Cadaver', 'Exhumation/Removal', 'Renewal'
  )),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. SECTION D: TRANSPORT TERMINAL (TODA & MEMBERS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.todas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  president TEXT NOT NULL,
  contact_no TEXT,
  total_members INT DEFAULT 0,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.toda_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toda_id UUID REFERENCES public.todas(id) ON DELETE CASCADE,
  toda_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  ext_name TEXT,
  sex TEXT NOT NULL CHECK (sex IN ('Male', 'Female')),
  barangay TEXT NOT NULL,
  municipality TEXT DEFAULT 'Malungon',
  contact_no TEXT,
  id_type TEXT,
  id_number TEXT,
  id_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. SECTION E: OPIF PERFORMANCE INDICATOR SCORECARD
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opif_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F')),
  major_final_output TEXT NOT NULL,
  performance_indicator TEXT NOT NULL,
  annual_target TEXT NOT NULL,
  actual_annual TEXT,
  semi_annual_target TEXT,
  q1_target TEXT, q1_actual TEXT, q1_percent TEXT,
  q2_target TEXT, q2_actual TEXT, q2_percent TEXT,
  q3_target TEXT, q3_actual TEXT, q3_percent TEXT,
  q4_target TEXT, q4_actual TEXT, q4_percent TEXT,
  year INT DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. SECTION F: PEACE & ORDER (CSU) DESK
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.csu_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_of_week TEXT NOT NULL,
  shift TEXT NOT NULL,
  area_covered TEXT NOT NULL,
  summary_activities TEXT,
  turnover_notes TEXT,
  prep_name TEXT,
  prep_title TEXT DEFAULT 'Duty Guard / Prepared By',
  ver_name TEXT,
  ver_title TEXT DEFAULT 'Team Leader on Duty',
  app_name TEXT,
  app_title TEXT DEFAULT 'Market Administrator',
  personnel_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  incident_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  violations_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  lost_found_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. SYSTEM AUDIT LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stall_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electric_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slaughter_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cemetery_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toda_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opif_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csu_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write during initialization / authenticated users
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public stalls access" ON public.stalls FOR ALL USING (true);
CREATE POLICY "Public tenants access" ON public.stall_tenants FOR ALL USING (true);
CREATE POLICY "Public monitoring access" ON public.monitoring_records FOR ALL USING (true);
CREATE POLICY "Public bills access" ON public.electric_bills FOR ALL USING (true);
CREATE POLICY "Public slaughter access" ON public.slaughter_records FOR ALL USING (true);
CREATE POLICY "Public cemetery access" ON public.cemetery_bookings FOR ALL USING (true);
CREATE POLICY "Public todas access" ON public.todas FOR ALL USING (true);
CREATE POLICY "Public members access" ON public.toda_members FOR ALL USING (true);
CREATE POLICY "Public opif access" ON public.opif_indicators FOR ALL USING (true);
CREATE POLICY "Public csu access" ON public.csu_daily_reports FOR ALL USING (true);
CREATE POLICY "Public audit access" ON public.audit_logs FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- SEED DATA: CORE STALLS & SAMPLE TENANTS
-- -----------------------------------------------------------------------------
INSERT INTO public.stalls (stall_no, zone, status) VALUES
  ('G-01-A', 'wet', 'Occupied'),
  ('G-02-A', 'wet', 'Occupied'),
  ('G-03-A', 'wet', 'Vacant'),
  ('G-04-A', 'wet', 'Occupied'),
  ('D-01', 'dry', 'Occupied'),
  ('D-02', 'dry', 'Vacant'),
  ('OB-01', 'old', 'Occupied'),
  ('TR-01', 'triangular', 'Occupied')
ON CONFLICT (stall_no) DO NOTHING;

INSERT INTO public.stall_tenants (stall_no, stall_owner, operator, line_of_business, period_index, year, compliance_status) VALUES
  ('G-01-A', 'Maria Clara Santos', 'Jose Rizal', 'Meat & Poultry', 2, 2024, 'Compliant'),
  ('G-02-A', 'Juan Dela Cruz', 'Juan Dela Cruz', 'Fresh Fish & Seafood', 1, 2024, 'Compliant'),
  ('G-04-A', 'Andres Bonifacio', 'Procuro', 'Native Vegetables', 1, 2024, 'Non-Compliant'),
  ('D-01', 'Emilio Aguinaldo', 'Emilio Aguinaldo', 'Dry Goods & Textiles', 1, 2024, 'Compliant'),
  ('OB-01', 'Gabriela Silang', 'Gabriela Silang', 'General Merchandise', 1, 2024, 'Compliant'),
  ('TR-01', 'Apolinario Mabini', 'Apolinario Mabini', 'Eatery / Carenderia', 1, 2024, 'Compliant')
ON CONFLICT DO NOTHING;

-- SEED DATA: SAMPLE TODA
INSERT INTO public.todas (reg_no, name, president, contact_no, total_members, address) VALUES
  ('TODA-001', 'Poblacion Central Drivers TODA', 'Rodrigo Mendoza', '0917-123-4567', 45, 'Poblacion, Malungon'),
  ('TODA-002', 'Malandag Express TODA', 'Bernardo Carpio', '0928-987-6543', 38, 'Malandag, Malungon')
ON CONFLICT DO NOTHING;
