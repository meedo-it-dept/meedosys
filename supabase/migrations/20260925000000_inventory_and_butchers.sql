-- =============================================================================
-- MEEDOSys v2.0 - Migration: Inventory & Supplies and Butchers Schema
-- Adds municipal supply catalog, transaction audit ledger, and accredited butchers
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. MUNICIPAL INVENTORY & SUPPLIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  item TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(12,2) NOT NULL DEFAULT 5,
  date_received DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id TEXT PRIMARY KEY,
  inventory_item_id TEXT REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  department_section TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Stock In', 'Release', 'Adjustment', 'Return')),
  quantity NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,
  received_by TEXT,
  released_by TEXT NOT NULL,
  transaction_date TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_inv_tx_item_id ON public.inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_type ON public.inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inv_tx_created ON public.inventory_transactions(created_at DESC);

-- -----------------------------------------------------------------------------
-- 2. ACCREDITED SLAUGHTERHOUSE BUTCHERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.butchers (
  id TEXT PRIMARY KEY,
  butcher_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_no TEXT,
  address_barangay TEXT,
  specialization TEXT NOT NULL DEFAULT 'General',
  health_card_no TEXT,
  health_card_expiry DATE,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  date_registered DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_butchers_code ON public.butchers(butcher_code);
CREATE INDEX IF NOT EXISTS idx_butchers_status ON public.butchers(status);

-- -----------------------------------------------------------------------------
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.butchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public inventory_items access" ON public.inventory_items FOR ALL USING (true);
CREATE POLICY "Public inventory_transactions access" ON public.inventory_transactions FOR ALL USING (true);
CREATE POLICY "Public butchers access" ON public.butchers FOR ALL USING (true);
