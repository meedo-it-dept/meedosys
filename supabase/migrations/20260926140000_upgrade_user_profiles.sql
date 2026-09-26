-- =============================================================================
-- MEEDOSys v2.0 - Upgrade public.profiles for Standalone RBAC & Direct Management
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Ensure table exists with UUID primary key
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff' CHECK (role IN ('Admin', 'Staff')),
  section TEXT NOT NULL DEFAULT 'A' CHECK (section IN ('ALL', 'A', 'B', 'C', 'D', 'E', 'F')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop auth.users foreign key constraint if it exists (allows direct admin creation of users)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
      AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- 3. Ensure id has default gen_random_uuid()
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Add additional user management columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guard_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank_title TEXT;

-- 5. Row-Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;
CREATE POLICY "Public profiles access" ON public.profiles 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 6. Ensure default Administrator account exists (explicitly providing UUID)
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  role,
  section,
  status,
  password
) VALUES (
  COALESCE((SELECT id FROM public.profiles WHERE username = 'admin'), gen_random_uuid()),
  'admin',
  'Municipal Administrator',
  'Admin',
  'ALL',
  'Approved',
  'password123'
)
ON CONFLICT (username) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    section = EXCLUDED.section,
    status = EXCLUDED.status,
    password = COALESCE(public.profiles.password, EXCLUDED.password),
    updated_at = NOW();

-- 7. Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_guard_id ON public.profiles (guard_id);
