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
  created_at?: string;
  updated_at?: string;
}

// -----------------------------------------------------------------------------
// SECTION A: MARKET STALLS & TENANTS
// -----------------------------------------------------------------------------
export type StallZone = 'wet' | 'dry' | 'old' | 'triangular';
export type StallStatus = 'Occupied' | 'Vacant';
export type ComplianceStatus = 'Compliant' | 'Non-Compliant';

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
  contact_no?: string;
  or_number?: string;
  status: SlaughterStatus;
  livestock_type: LivestockType;
  head_count: number;
  amount: number;
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
  major_final_output: string;
  performance_indicator: string;
  annual_target: string;
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
// SECTION F: CSU DIGITAL LOGBOOK
// -----------------------------------------------------------------------------
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
