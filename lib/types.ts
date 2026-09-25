// =============================================================================
// MEEDOSys v2.0 - Core TypeScript Type Definitions
// =============================================================================

export type UserRole = 'Admin' | 'Staff';
export type UserSection = 'ALL' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type UserStatus = 'Pending' | 'Approved' | 'Blocked';

export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  section: UserSection;
  status: UserStatus;
  guard_id?: string;
  full_name?: string;
  rank_title?: string;
  created_at?: string;
  updated_at?: string;
}

// -----------------------------------------------------------------------------
// SECTION A: MARKET STALLS & TENANTS
// -----------------------------------------------------------------------------
export type StallZone = 'wet' | 'dry' | 'old' | 'triangular';
export type StallStatus = 'Occupied' | 'Vacant';
export type ComplianceStatus = 'Compliant' | 'Lacking' | 'Non-Compliant';

export interface StallTenant {
  id?: string;
  stall_no: string;
  stall_owner: string;
  operator: string;
  line_of_business: string;
  period_index: number;
  year: number | string;
  compliance_status: ComplianceStatus;
  photo_url?: string | null;
  lease_doc_url?: string | null;
  permit_doc_url?: string | null;
  additional_info?: string | null;
  is_current?: boolean;
}

export interface Stall {
  stall_no: string;
  zone: StallZone;
  status: StallStatus;
  current_tenant?: StallTenant | null;
  tenant_history?: StallTenant[];
}

export interface MonitoringRecord {
  id?: string;
  stall_no: string;
  monitoring_date: string;
  goodwill: number;
  operational_status: 'Operational' | 'Non-Operational';
  permit_date?: string;
  permit_submitted: boolean;
  lease_date?: string;
  lease_submitted: boolean;
  rental_or?: string;
  rental_paid: boolean;
  claygo_compliant: 'Yes' | 'No' | '';
  cctv_available: 'Yes' | 'No' | '';
  palengqr_implemented: 'Yes' | 'No' | '';
  seminars_attended: string[];
  electric_bill_amount: number;
  electric_bill_status: 'Fully Paid' | 'Partial' | 'Unpaid' | '';
  electric_bill_due_date?: string;
  created_at?: string;
}

export interface ElectricBill {
  id?: string;
  stall_no: string;
  owner_name?: string;
  due_date: string;
  disconnection_date?: string;
  prev_reading: number;
  curr_reading: number;
  consumption: number;
  rate_per_kwh: number;
  arrears: number;
  bill_amount: number;
  meter_reset?: boolean;
  status: 'Unpaid' | 'Partial' | 'Fully Paid';
  created_at?: string;
}

// -----------------------------------------------------------------------------
// SECTION B: SLAUGHTERHOUSE
// -----------------------------------------------------------------------------
export type LivestockType = 'Hogs' | 'Chicken' | 'Goat' | 'Cow';
export type SlaughterStatus = 'Private' | 'Public';

export interface SlaughterRecord {
  id?: string;
  client_id: string;
  client_name: string;
  address?: string;
  contact_no?: string;
  or_number?: string;
  status: SlaughterStatus;
  livestock_type: LivestockType;
  head_count: number;
  kilos?: number;
  amount: number;
  butcher_id?: string;
  butcher_name?: string;
  created_at?: string;
}

export interface ButcherProfile {
  id: string;
  butcher_code: string;
  name: string;
  contact_no?: string;
  address_barangay?: string;
  specialization: 'General' | 'Hogs / Swine' | 'Cattle / Large Animals' | 'Small Ruminants' | 'Poultry';
  health_card_no?: string;
  health_card_expiry?: string;
  status: 'Active' | 'Inactive';
  date_registered: string;
  remarks?: string;
  created_at?: string;
}

// -----------------------------------------------------------------------------
// SECTION C: CEMETERY MANAGEMENT
// -----------------------------------------------------------------------------
export type BurialType =
  | 'Apartment'
  | 'Bone Vault'
  | 'Ground'
  | 'Mausoleum'
  | 'Transfer of Cadaver'
  | 'Exhumation/Removal'
  | 'Renewal';

export interface CemeteryBooking {
  id?: string;
  deceased_name: string;
  address_barangay: string;
  phone_number?: string;
  burial_date: string;
  burial_time?: string;
  burial_type: BurialType;
  amount: number;
  google_calendar_event_id?: string;
  created_at?: string;
}

// -----------------------------------------------------------------------------
// SECTION D: TRANSPORT TERMINAL (TODA & MEMBERS)
// -----------------------------------------------------------------------------
export interface Toda {
  id?: string;
  reg_no: string;
  name: string;
  president: string;
  contact_no?: string;
  total_members: number;
  address?: string;
  created_at?: string;
}

export interface TodaMember {
  id?: string;
  toda_id?: string;
  toda_name: string;
  last_name: string;
  first_name: string;
  middle_name?: string;
  ext_name?: string;
  sex: 'Male' | 'Female';
  barangay: string;
  municipality: string;
  contact_no?: string;
  id_type?: string;
  id_number?: string;
  id_expiry?: string;
  created_at?: string;
}

// -----------------------------------------------------------------------------
// SECTION E: OPIF INDICATORS
// -----------------------------------------------------------------------------
export interface OpifIndicator {
  id?: string;
  section: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  col3?: string; // Strategic Priorities/Core & Support Functions (5)
  col4?: string; // Major Final Output (6)
  col5?: string; // Programs/Projects/Activities (7)
  col6?: string; // Performance Indicator (8)
  col7?: string; // Annual Target (9)
  actual?: string; // Actual (latest data)
  semi?: string; // Semi-Annual Physical Targets
  q1t?: string; // 1st QTR Target
  q1a?: string; // 1st QTR Accomp
  q1p?: string; // 1st QTR % Accomp
  q2t?: string; // 2nd QTR Target
  q2a?: string; // 2nd QTR Accomp
  q2p?: string; // 2nd QTR % Accomp
  q3t?: string; // 3rd QTR Target
  q3a?: string; // 3rd QTR Accomp
  q3p?: string; // 3rd QTR % Accomp
  q4t?: string; // 4th QTR Target
  q4a?: string; // 4th QTR Accomp
  q4p?: string; // 4th QTR % Accomp
  specialSpan?: number;
  specialText?: string;
  spanCol3?: number;
  spanCol4?: number;
  spanCol5?: number;
  // Compatibility aliases
  major_final_output?: string;
  performance_indicator?: string;
  annual_target?: string;
  actual_annual?: string;
  semi_annual_target?: string;
  q1_target?: string;
  q1_actual?: string;
  q1_percent?: string;
  q2_target?: string;
  q2_actual?: string;
  q2_percent?: string;
  q3_target?: string;
  q3_actual?: string;
  q3_percent?: string;
  q4_target?: string;
  q4_actual?: string;
  q4_percent?: string;
  year?: number;
}

// -----------------------------------------------------------------------------
// SECTION F: MARKET GUARD DIGITAL LOGBOOK & IDENTITY
// -----------------------------------------------------------------------------
export interface MarketGuard {
  guard_id: string;
  guard_name: string;
  rank_title?: string;
  default_area?: string;
  contact_no?: string;
  radio_call_sign?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface CsuPersonnelItem {
  id?: string;
  guard_id: string;
  guard_name: string;
  assigned_area: string;
  time_in: string;
  time_out: string;
  remarks?: string;
}

export interface CsuIncidentItem {
  id?: string;
  time: string;
  location: string;
  type: string;
  description: string;
  status: string;
}

export interface CsuViolationItem {
  id?: string;
  identifier: string;
  violation: string;
  action_taken: string;
  remarks?: string;
}

export interface CsuLostFoundItem {
  id?: string;
  description: string;
  found_by: string;
  claimed_by?: string;
  status: 'In Custody' | 'Claimed' | 'Disposed';
}

export interface CsuDailyReport {
  id?: string;
  report_date: string;
  day_of_week: string;
  shift: string;
  area_covered: string;
  summary_activities?: string;
  turnover_notes?: string;
  prep_name: string;
  prep_title: string;
  ver_name: string;
  ver_title: string;
  app_name: string;
  app_title: string;
  personnel_data: CsuPersonnelItem[];
  incident_data: CsuIncidentItem[];
  violations_data: CsuViolationItem[];
  lost_found_data: CsuLostFoundItem[];
  created_at?: string;
}

// -----------------------------------------------------------------------------
// AUDIT LOG
// -----------------------------------------------------------------------------
export interface AuditLog {
  id?: string;
  username: string;
  action: string;
  details?: string;
  created_at?: string;
}

// -----------------------------------------------------------------------------
// INVENTORY MANAGEMENT MODULE
// -----------------------------------------------------------------------------
export type InventoryDepartment =
  | 'Market Office'
  | 'Slaughterhouse'
  | 'Cemetery'
  | 'TODA'
  | 'MEEDO'
  | "Mayor's Office"
  | 'Other Offices';

export type InventoryTransactionType = 'Stock In' | 'Release' | 'Adjustment' | 'Return';

export interface InventoryItem {
  id: string;
  item: string;
  description: string;
  unit: string;
  quantity: number;
  low_stock_threshold: number;
  date_received: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  item_name: string;
  description?: string;
  department_section: string;
  transaction_type: InventoryTransactionType;
  quantity: number;
  unit: string;
  received_by?: string;
  released_by: string;
  transaction_date: string;
  remarks?: string;
  created_at: string;
}

