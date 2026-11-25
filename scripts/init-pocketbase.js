// =============================================================================
// MEEDOSys v2.0 - PocketBase Turnkey Initialization & Migration Script (v0.23+)
// 1. Authenticates or registers PocketBase superadmin
// 2. Creates/updates all 17 municipal collections with public rules
// 3. Seeds the official LGU dataset into PocketBase collections
// =============================================================================

const fs = require('fs');
const path = require('path');
const PocketBase = require('pocketbase/cjs');
const { PROFILE_AUTH_CONFIG, getCollectionRules } = require('./pb-rules');

let pbUrl = process.env.POCKETBASE_LOCAL_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
let adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || '';
let adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || '';

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const k = trimmed.slice(0, eqIdx).trim();
    const v = trimmed.slice(eqIdx + 1).trim();
    if (k === 'NEXT_PUBLIC_POCKETBASE_URL' && v && !process.env.POCKETBASE_LOCAL_URL) pbUrl = v;
    if (k === 'POCKETBASE_ADMIN_EMAIL' && v && !adminEmail) adminEmail = v;
    if (k === 'POCKETBASE_ADMIN_PASSWORD' && v && !adminPassword) adminPassword = v;
  });
}

const pb = new PocketBase(pbUrl);
pb.autoCancellation(false);
pb.beforeSend = (url, options) => {
  options.headers = {
    ...options.headers,
    'ngrok-skip-browser-warning': 'true',
  };
  return { url, options };
};

const collectionsDefinition = [
  {
    name: 'profiles',
    type: 'auth',
    fields: [
      { name: 'username', type: 'text', required: true },
      { name: 'username_lower', type: 'text' },
      { name: 'role', type: 'text' },
      { name: 'section', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'password', type: 'password', min: 4, required: true },
      { name: 'email', type: 'email', required: false },
      { name: 'guard_id', type: 'text' },
      { name: 'full_name', type: 'text' },
      { name: 'rank_title', type: 'text' },
      { name: 'radio_call_sign', type: 'text' },
      { name: 'default_area', type: 'text' },
      { name: 'firebase_uid', type: 'text' },
      { name: 'auth_provider', type: 'text' },
      { name: 'photo_url', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: [
      'CREATE UNIQUE INDEX `idx_profiles_username` ON `profiles` (`username`)',
      'CREATE UNIQUE INDEX `idx_profiles_username_lower` ON `profiles` (`username_lower`) WHERE `username_lower` != ""',
      'CREATE UNIQUE INDEX `idx_profiles_guard_id` ON `profiles` (`guard_id`) WHERE `guard_id` != ""',
      'CREATE UNIQUE INDEX `idx_profiles_firebase_uid` ON `profiles` (`firebase_uid`) WHERE `firebase_uid` != ""',
    ],
  },
  {
    name: 'stalls',
    fields: [
      { name: 'stall_no', type: 'text', required: true },
      { name: 'zone', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'created_at', type: 'text' },
    ],
    indexes: ['CREATE UNIQUE INDEX `idx_stalls_stall_no` ON `stalls` (`stall_no`)'],
  },
  {
    name: 'stall_tenants',
    fields: [
      { name: 'stall_no', type: 'text', required: true },
      { name: 'stall_owner', type: 'text', required: true },
      { name: 'operator', type: 'text' },
      { name: 'line_of_business', type: 'text' },
      { name: 'period_index', type: 'number' },
      { name: 'year', type: 'text' },
      { name: 'compliance_status', type: 'text' },
      { name: 'photo_url', type: 'text' },
      { name: 'lease_doc_url', type: 'text' },
      { name: 'permit_doc_url', type: 'text' },
      { name: 'lease_doc_name', type: 'text' },
      { name: 'permit_doc_name', type: 'text' },
      { name: 'additional_info', type: 'text' },
      { name: 'is_current', type: 'bool' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_tenants_stall_no` ON `stall_tenants` (`stall_no`)'],
  },
  {
    name: 'monitoring_records',
    fields: [
      { name: 'stall_no', type: 'text', required: true },
      { name: 'monitoring_date', type: 'text', required: true },
      { name: 'goodwill', type: 'number' },
      { name: 'operational_status', type: 'text' },
      { name: 'permit_date', type: 'text' },
      { name: 'permit_submitted', type: 'bool' },
      { name: 'lease_date', type: 'text' },
      { name: 'lease_submitted', type: 'bool' },
      { name: 'rental_or', type: 'text' },
      { name: 'rental_paid', type: 'bool' },
      { name: 'claygo_compliant', type: 'text' },
      { name: 'cctv_available', type: 'text' },
      { name: 'palengqr_implemented', type: 'text' },
      { name: 'seminars_attended', type: 'json' },
      { name: 'electric_bill_amount', type: 'number' },
      { name: 'electric_bill_status', type: 'text' },
      { name: 'electric_bill_due_date', type: 'text' },
      { name: 'remarks', type: 'text' },
      { name: 'created_by', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_mon_stall_date` ON `monitoring_records` (`stall_no`, `monitoring_date`)'],
  },
  {
    name: 'electric_bills',
    fields: [
      { name: 'stall_no', type: 'text', required: true },
      { name: 'owner_name', type: 'text' },
      { name: 'due_date', type: 'text' },
      { name: 'disconnection_date', type: 'text' },
      { name: 'prev_reading', type: 'number' },
      { name: 'curr_reading', type: 'number' },
      { name: 'consumption', type: 'number' },
      { name: 'rate_per_kwh', type: 'number' },
      { name: 'arrears', type: 'number' },
      { name: 'bill_amount', type: 'number' },
      { name: 'meter_reset', type: 'bool' },
      { name: 'status', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_elec_stall` ON `electric_bills` (`stall_no`)'],
  },
  {
    name: 'slaughter_records',
    fields: [
      { name: 'client_id', type: 'text' },
      { name: 'client_name', type: 'text' },
      { name: 'owner_name', type: 'text' },
      { name: 'livestock_type', type: 'text' },
      { name: 'head_count', type: 'number' },
      { name: 'total_weight_kg', type: 'number' },
      { name: 'ante_mortem_passed', type: 'bool' },
      { name: 'post_mortem_passed', type: 'bool' },
      { name: 'ante_mortem_fee', type: 'number' },
      { name: 'post_mortem_fee', type: 'number' },
      { name: 'slaughter_fee', type: 'number' },
      { name: 'corral_fee', type: 'number' },
      { name: 'total_amount', type: 'number' },
      { name: 'amount', type: 'number' },
      { name: 'payment_status', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'or_number', type: 'text' },
      { name: 'meat_inspector', type: 'text' },
      { name: 'date', type: 'text' },
      { name: 'destination', type: 'text' },
      { name: 'arrival_date', type: 'text' },
      { name: 'slaughter_date', type: 'text' },
      { name: 'sex', type: 'text' },
      { name: 'category', type: 'text' },
      { name: 'holding_pen_no', type: 'text' },
      { name: 'is_condemned', type: 'bool' },
      { name: 'condemnation_reason', type: 'text' },
      { name: 'condemned_weight_kg', type: 'number' },
      { name: 'butcher_name', type: 'text' },
      { name: 'butcher_id', type: 'text' },
      { name: 'address', type: 'text' },
      { name: 'contact_no', type: 'text' },
      { name: 'kilos', type: 'number' },
      { name: 'remarks', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_slaughter_date` ON `slaughter_records` (`date`)'],
  },
  {
    name: 'cemetery_bookings',
    fields: [
      { name: 'deceased_name', type: 'text', required: true },
      { name: 'address_barangay', type: 'text' },
      { name: 'phone_number', type: 'text' },
      { name: 'burial_date', type: 'text' },
      { name: 'burial_time', type: 'text' },
      { name: 'burial_type', type: 'text' },
      { name: 'amount', type: 'number' },
      { name: 'status', type: 'text' },
      { name: 'google_calendar_event_id', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_cem_date` ON `cemetery_bookings` (`burial_date`)'],
  },
  {
    name: 'todas',
    fields: [
      { name: 'reg_no', type: 'text', required: false },
      { name: 'name', type: 'text', required: true },
      { name: 'president', type: 'text' },
      { name: 'contact_no', type: 'text' },
      { name: 'total_members', type: 'number' },
      { name: 'address', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ["CREATE UNIQUE INDEX `idx_todas_reg_no` ON `todas` (`reg_no`) WHERE `reg_no` != ''"],
  },
  {
    name: 'toda_members',
    fields: [
      { name: 'toda_id', type: 'text' },
      { name: 'toda_name', type: 'text', required: true },
      { name: 'last_name', type: 'text', required: true },
      { name: 'first_name', type: 'text', required: true },
      { name: 'middle_name', type: 'text' },
      { name: 'ext_name', type: 'text' },
      { name: 'sex', type: 'text' },
      { name: 'barangay', type: 'text' },
      { name: 'municipality', type: 'text' },
      { name: 'contact_no', type: 'text' },
      { name: 'contact_number', type: 'text' },
      { name: 'id_type', type: 'text' },
      { name: 'id_number', type: 'text' },
      { name: 'id_expiry', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_toda_members_name` ON `toda_members` (`toda_name`)'],
  },
  {
    name: 'opif_indicators',
    fields: [
      { name: 'division', type: 'text' },
      { name: 'major_output', type: 'text' },
      { name: 'indicator_code', type: 'text' },
      { name: 'indicator_name', type: 'text' },
      { name: 'annual_target', type: 'number' },
      { name: 'q1_target', type: 'number' },
      { name: 'q1_actual', type: 'number' },
      { name: 'q2_target', type: 'number' },
      { name: 'q2_actual', type: 'number' },
      { name: 'q3_target', type: 'number' },
      { name: 'q3_actual', type: 'number' },
      { name: 'q4_target', type: 'number' },
      { name: 'q4_actual', type: 'number' },
      { name: 'year', type: 'number' },
      { name: 'year_label', type: 'text' },
      { name: 'remarks', type: 'text' },
      { name: 'section', type: 'text' },
      { name: 'col3', type: 'text' },
      { name: 'col4', type: 'text' },
      { name: 'col5', type: 'text' },
      { name: 'col6', type: 'text' },
      { name: 'col7', type: 'text' },
      { name: 'indicator', type: 'text' },
      { name: 'annual', type: 'text' },
      { name: 'actual', type: 'text' },
      { name: 'semi', type: 'text' },
      { name: 'q1t', type: 'text' },
      { name: 'q1a', type: 'text' },
      { name: 'q1p', type: 'text' },
      { name: 'q2t', type: 'text' },
      { name: 'q2a', type: 'text' },
      { name: 'q2p', type: 'text' },
      { name: 'q3t', type: 'text' },
      { name: 'q3a', type: 'text' },
      { name: 'q3p', type: 'text' },
      { name: 'q4t', type: 'text' },
      { name: 'q4a', type: 'text' },
      { name: 'q4p', type: 'text' },
      { name: 'specialSpan', type: 'number' },
      { name: 'specialText', type: 'text' },
      { name: 'spanCol3', type: 'number' },
      { name: 'spanCol4', type: 'number' },
      { name: 'spanCol5', type: 'number' },
      { name: 'sort_order', type: 'number' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_opif_div_year` ON `opif_indicators` (`division`, `year`)'],
  },
  {
    name: 'csu_daily_reports',
    fields: [
      { name: 'report_date', type: 'text', required: true },
      { name: 'day_of_week', type: 'text' },
      { name: 'shift', type: 'text' },
      { name: 'team_leader', type: 'text' },
      { name: 'prep_name', type: 'text' },
      { name: 'prep_title', type: 'text' },
      { name: 'ver_name', type: 'text' },
      { name: 'ver_title', type: 'text' },
      { name: 'app_name', type: 'text' },
      { name: 'app_title', type: 'text' },
      { name: 'area_covered', type: 'text' },
      { name: 'summary_activities', type: 'text' },
      { name: 'turnover_notes', type: 'text' },
      { name: 'remarks', type: 'text' },
      { name: 'incident_summary', type: 'text' },
      { name: 'personnel_data', type: 'json' },
      { name: 'incident_data', type: 'json' },
      { name: 'violations_data', type: 'json' },
      { name: 'lost_found_data', type: 'json' },
      { name: 'blotter_entries', type: 'json' },
      { name: 'equipment_inspections', type: 'json' },
      { name: 'gate_turnstile_counts', type: 'json' },
      { name: 'visitor_vehicles', type: 'json' },
      { name: 'is_locked', type: 'bool' },
      { name: 'locked_at', type: 'text' },
      { name: 'calendar_event_id', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_csu_date` ON `csu_daily_reports` (`report_date`)'],
  },
  {
    name: 'inventory_items',
    fields: [
      { name: 'item', type: 'text', required: true },
      { name: 'name', type: 'text' },
      { name: 'description', type: 'text' },
      { name: 'unit', type: 'text', required: true },
      { name: 'quantity', type: 'number' },
      { name: 'low_stock_threshold', type: 'number' },
      { name: 'min_level', type: 'number' },
      { name: 'unit_cost', type: 'number' },
      { name: 'category', type: 'text' },
      { name: 'sku', type: 'text' },
      { name: 'location', type: 'text' },
      { name: 'is_active', type: 'bool' },
      { name: 'date_received', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_inv_item` ON `inventory_items` (`item`)'],
  },
  {
    name: 'inventory_transactions',
    fields: [
      { name: 'inventory_item_id', type: 'text' },
      { name: 'item_id', type: 'text' },
      { name: 'item_name', type: 'text' },
      { name: 'description', type: 'text' },
      { name: 'department_section', type: 'text' },
      { name: 'department', type: 'text' },
      { name: 'transaction_type', type: 'text' },
      { name: 'quantity', type: 'number' },
      { name: 'previous_quantity', type: 'number' },
      { name: 'new_quantity', type: 'number' },
      { name: 'unit', type: 'text' },
      { name: 'received_by', type: 'text' },
      { name: 'released_by', type: 'text' },
      { name: 'requested_by', type: 'text' },
      { name: 'performed_by', type: 'text' },
      { name: 'transaction_date', type: 'text' },
      { name: 'reference_no', type: 'text' },
      { name: 'remarks', type: 'text' },
      { name: 'notes', type: 'text' },
      { name: 'created_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_inv_tx_item` ON `inventory_transactions` (`inventory_item_id`)'],
  },
  {
    name: 'butchers',
    fields: [
      { name: 'butcher_code', type: 'text', required: true },
      { name: 'name', type: 'text', required: true },
      { name: 'full_name', type: 'text' },
      { name: 'contact_no', type: 'text' },
      { name: 'address_barangay', type: 'text' },
      { name: 'address', type: 'text' },
      { name: 'specialization', type: 'text' },
      { name: 'specialty', type: 'text' },
      { name: 'health_card_no', type: 'text' },
      { name: 'health_card_expiry', type: 'text' },
      { name: 'daily_rate', type: 'number' },
      { name: 'total_slaughters', type: 'number' },
      { name: 'status', type: 'text' },
      { name: 'date_registered', type: 'text' },
      { name: 'remarks', type: 'text' },
      { name: 'notes', type: 'text' },
      { name: 'id_number', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE UNIQUE INDEX `idx_butchers_code` ON `butchers` (`butcher_code`)'],
  },
  {
    name: 'audit_logs',
    fields: [
      { name: 'user_id', type: 'text' },
      { name: 'username', type: 'text', required: true },
      { name: 'action', type: 'text', required: true },
      { name: 'details', type: 'text' },
      { name: 'created_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_audit_action` ON `audit_logs` (`action`)'],
  },
  {
    name: 'market_guards',
    fields: [
      { name: 'guard_id', type: 'text', required: true },
      { name: 'guard_name', type: 'text', required: true },
      { name: 'rank_title', type: 'text' },
      { name: 'default_area', type: 'text' },
      { name: 'contact_no', type: 'text' },
      { name: 'radio_call_sign', type: 'text' },
      { name: 'assigned_facility', type: 'text' },
      { name: 'current_shift', type: 'text' },
      { name: 'designation', type: 'text' },
      { name: 'area_assigned', type: 'text' },
      { name: 'remarks', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE UNIQUE INDEX `idx_guards_guard_id` ON `market_guards` (`guard_id`)'],
  },
  {
    name: 'market_calendar_events',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'category', type: 'text' },
      { name: 'date', type: 'text', required: true },
      { name: 'start_time', type: 'text' },
      { name: 'end_time', type: 'text' },
      { name: 'location', type: 'text' },
      { name: 'assigned_personnel', type: 'text' },
      { name: 'assigned_guard_id', type: 'text' },
      { name: 'supervisor', type: 'text' },
      { name: 'guards_assigned', type: 'json' },
      { name: 'shift_name', type: 'text' },
      { name: 'shift', type: 'text' },
      { name: 'area', type: 'text' },
      { name: 'call_sign', type: 'text' },
      { name: 'special_instructions', type: 'text' },
      { name: 'description', type: 'text' },
      { name: 'notes', type: 'text' },
      { name: 'priority', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'is_recurring', type: 'bool' },
      { name: 'recurrence_rule', type: 'text' },
      { name: 'blotter_report_id', type: 'text' },
      { name: 'is_locked', type: 'bool' },
      { name: 'created_by', type: 'text' },
      { name: 'created_at', type: 'text' },
      { name: 'updated_at', type: 'text' },
    ],
    indexes: ['CREATE INDEX `idx_cal_date` ON `market_calendar_events` (`date`)'],
  },
];

async function main() {
  console.log(`\n=============================================================`);
  console.log(`MEEDOSys v2.0 -> PocketBase Database Initializer & Seeder`);
  console.log(`Connecting to PocketBase at: ${pbUrl}`);
  console.log(`=============================================================\n`);

  // 1. Health check
  try {
    const health = await pb.health.check();
    console.log(`✓ PocketBase server is healthy (code: ${health.code})`);
  } catch (e) {
    console.error(`\n❌ Could not connect to PocketBase server at ${pbUrl}.`);
    console.error(`Please ensure PocketBase is running:`);
    console.error(`  cd pocketbase`);
    console.error(`  .\\pocketbase.exe serve --http="127.0.0.1:8090"\n`);
    process.exit(1);
  }

  // 2. Authenticate as Superuser / Admin
  if (!adminEmail || !adminPassword) {
    console.error('❌ Missing POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD in environment or .env.local.');
    process.exit(1);
  }
  try {
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
    console.log(`✓ Authenticated as PocketBase Superuser: ${adminEmail}`);
  } catch (err) {
    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log(`✓ Authenticated as PocketBase Admin: ${adminEmail}`);
    } catch (e2) {
      console.error(`❌ Authentication failed for ${adminEmail}: ${e2.message || err.message}`);
      process.exit(1);
    }
  }

  // 3. Create or Update Collections with authenticated role/section rules
  console.log('\nCreating / Updating municipal collections...');
  const existingCollections = await pb.collections.getFullList();
  const existingMap = new Map(existingCollections.map((c) => [c.name, c]));

  for (const def of collectionsDefinition) {
    try {
      const rules = getCollectionRules(def.name);
      const colType = def.type || 'base';
      const payload = {
        name: def.name,
        type: colType,
        fields: def.fields,
        indexes: def.indexes || [],
        ...rules,
        ...(colType === 'auth' ? PROFILE_AUTH_CONFIG : {}),
      };

      if (existingMap.has(def.name)) {
        const existing = existingMap.get(def.name);

        // Migrate legacy base `profiles` collection (plaintext passwords) -> PocketBase `auth` collection (bcrypt hashes)
        if (def.name === 'profiles' && existing.type !== 'auth') {
          console.log('  Migrating legacy base `profiles` collection -> PocketBase native `auth` collection...');
          const oldProfiles = await pb.collection('profiles').getFullList();
          for (const rec of oldProfiles) {
            if (!rec.username || String(rec.password || '').length < 4) {
              throw new Error(`Cannot migrate profile ${rec.id} (${rec.username}): password must be at least 4 characters.`);
            }
          }
          await pb.collections.delete(existing.id);
          await pb.collections.create(payload);
          let restored = 0;
          for (const rec of oldProfiles) {
            await pb.collection('profiles').create({
              id: rec.id,
              username: rec.username,
              username_lower: String(rec.username || '').trim().toLowerCase(),
              role: rec.role || 'Staff',
              section: rec.section || 'A',
              status: rec.status || 'Approved',
              guard_id: rec.guard_id || '',
              full_name: rec.full_name || '',
              rank_title: rec.rank_title || '',
              radio_call_sign: rec.radio_call_sign || '',
              default_area: rec.default_area || '',
              created_at: rec.created_at || new Date().toISOString(),
              updated_at: rec.updated_at || '',
              password: rec.password,
              passwordConfirm: rec.password,
            });
            restored++;
          }
          console.log(`  ✓ Migrated ${restored}/${oldProfiles.length} profiles to PocketBase auth (passwords hashed with bcrypt).`);
          continue;
        }

        const existingFieldsByName = new Map((existing.fields || []).map((f) => [f.name, f]));
        const mergedFields = [];
        for (const ef of existing.fields || []) {
          const defMatch = def.fields.find((df) => df.name === ef.name);
          mergedFields.push(
            defMatch
              ? { ...ef, ...defMatch, required: Boolean(defMatch.required), id: ef.id, system: ef.system }
              : ef
          );
        }
        for (const df of def.fields) {
          if (!existingFieldsByName.has(df.name)) {
            mergedFields.push(df);
          }
        }
        const existingSystemIndexes = (existing.indexes || []).filter((idx) =>
          /`idx_(tokenKey|email)_/.test(idx)
        );
        const mergedIndexes = Array.from(new Set([...(def.indexes || []), ...existingSystemIndexes]));
        await pb.collections.update(existing.id, {
          ...payload,
          indexes: mergedIndexes,
          fields: mergedFields,
        });
        console.log(`  ✓ Updated collection: ${def.name}`);

        if (def.name === 'profiles') {
          const allProfiles = await pb.collection('profiles').getFullList();
          for (const rec of allProfiles) {
            const expectedLower = String(rec.username || '').trim().toLowerCase();
            if (expectedLower && rec.username_lower !== expectedLower) {
              await pb.collection('profiles').update(rec.id, { username_lower: expectedLower });
            }
          }
        }
      } else {
        await pb.collections.create(payload);
        console.log(`  ✓ Created collection: ${def.name}`);
      }
    } catch (colErr) {
      console.warn(`  Notice for ${def.name}:`, colErr.response?.data?.message || colErr.response || colErr.message);
    }
  }

  // Lock down default PocketBase `users` collection so open public signups are disabled
  if (existingMap.has('users')) {
    try {
      const usersCol = existingMap.get('users');
      await pb.collections.update(usersCol.id, {
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        authRule: 'id = ""',
      });
      console.log('  ✓ Locked default `users` collection (open registration disabled).');
    } catch (uErr) {
      console.warn('  Notice locking `users` collection:', uErr.message);
    }
  }

  // Scrub any historical plaintext `"password"` fields stored in `audit_logs.details` (top-level or nested)
  const stripPasswordKeys = (val) => {
    if (!val || typeof val !== 'object') return { changed: false, value: val };
    if (Array.isArray(val)) {
      let anyChanged = false;
      const mapped = val.map((item) => {
        const res = stripPasswordKeys(item);
        if (res.changed) anyChanged = true;
        return res.value;
      });
      return { changed: anyChanged, value: mapped };
    }
    let anyChanged = false;
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (k.toLowerCase() === 'password') {
        anyChanged = true;
        continue;
      }
      const res = stripPasswordKeys(v);
      if (res.changed) anyChanged = true;
      out[k] = res.value;
    }
    return { changed: anyChanged, value: out };
  };

  try {
    const logs = await pb.collection('audit_logs').getFullList();
    let scrubbed = 0;
    for (const log of logs) {
      const wasString = typeof log.details === 'string';
      let parsed = log.details;
      if (wasString) {
        try { parsed = JSON.parse(log.details); } catch { parsed = null; }
      }
      const res = stripPasswordKeys(parsed);
      if (res.changed) {
        await pb.collection('audit_logs').update(log.id, {
          details: wasString ? JSON.stringify(res.value) : res.value,
        });
        scrubbed++;
      }
    }
    if (scrubbed > 0) {
      console.log(`  ✓ Scrubbed legacy password metadata from ${scrubbed} audit_logs records.`);
    }
  } catch (aErr) {
    console.warn('  Notice scrubbing audit_logs:', aErr.message);
  }

  if (process.argv.includes('--schema-only')) {
    console.log('\n✓ Schema synchronization complete (--schema-only).');
    return;
  }

  // 4. Seed Data from LGU Excel JSON
  const dataPath = path.join(__dirname, 'import-lgu-excel-data.json');
  if (!fs.existsSync(dataPath)) {
    console.log('\nNo import-lgu-excel-data.json found. Skipping dataset seeding.');
    return;
  }

  const {
    initialStalls,
    initialElectricBills,
    initialCemeteryBookings,
    initialTodas,
    initialTodaMembers,
  } = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log('\n--- SEEDING LGU MUNICIPAL DATASET TO POCKETBASE ---');

  // Seed Admin Profile only when MEEDO_DEFAULT_ADMIN_PASS is explicitly provided
  try {
    const existing = await pb.collection('profiles').getFirstListItem('username="admin"').catch(() => null);
    const seedAdminPass = process.env.MEEDO_DEFAULT_ADMIN_PASS;
    if (!existing && seedAdminPass) {
      await pb.collection('profiles').create({
        username: 'admin',
        username_lower: 'admin',
        full_name: 'Municipal Administrator',
        role: 'Admin',
        section: 'ALL',
        status: 'Approved',
        password: seedAdminPass,
        passwordConfirm: seedAdminPass,
        created_at: new Date().toISOString(),
      });
      console.log('✓ Default Administrator profile created (admin).');
    }
  } catch (e) {
    console.warn('Profile seed note:', e.message);
  }

  // Seed Stalls
  console.log(`Syncing ${initialStalls.length} stalls...`);
  let stallCount = 0;
  for (const s of initialStalls) {
    try {
      const existing = await pb.collection('stalls').getFirstListItem(`stall_no="${s.stall_no}"`).catch(() => null);
      if (!existing) {
        await pb.collection('stalls').create({
          stall_no: s.stall_no,
          zone: s.zone,
          status: s.status,
          created_at: new Date().toISOString(),
        });
        stallCount++;
      }
    } catch {}
  }
  console.log(`✓ Stalls synchronized (${stallCount} new).`);

  // Seed Stall Tenants
  console.log('Syncing stall tenants...');
  let tenantCount = 0;
  for (const s of initialStalls) {
    if (s.current_tenant) {
      try {
        const ct = s.current_tenant;
        const existing = await pb.collection('stall_tenants').getFirstListItem(`stall_no="${ct.stall_no}" && is_current=true`).catch(() => null);
        if (!existing) {
          await pb.collection('stall_tenants').create({
            stall_no: ct.stall_no,
            stall_owner: ct.stall_owner,
            operator: ct.operator || '',
            line_of_business: ct.line_of_business || '',
            period_index: ct.period_index || 1,
            year: String(ct.year || '2026'),
            compliance_status: ct.compliance_status || 'Compliant',
            additional_info: ct.additional_info || '',
            is_current: true,
            created_at: new Date().toISOString(),
          });
          tenantCount++;
        }
      } catch {}
    }
  }
  console.log(`✓ Stall tenants synchronized (${tenantCount} new).`);

  // Seed Electric Bills
  console.log(`Syncing ${initialElectricBills.length} electric bills...`);
  let billCount = 0;
  for (const b of initialElectricBills.slice(0, 100)) {
    try {
      await pb.collection('electric_bills').create({
        stall_no: b.stall_no,
        owner_name: b.owner_name || '',
        due_date: b.due_date || '',
        disconnection_date: b.disconnection_date || '',
        prev_reading: b.prev_reading || 0,
        curr_reading: b.curr_reading || 0,
        consumption: Math.max(0, (b.curr_reading || 0) - (b.prev_reading || 0)),
        rate_per_kwh: b.rate_per_kwh || 15,
        arrears: b.arrears || 0,
        bill_amount: b.bill_amount || 0,
        meter_reset: false,
        status: b.status || 'Unpaid',
        created_at: new Date().toISOString(),
      });
      billCount++;
    } catch {}
  }
  console.log(`✓ Electric bills synchronized (${billCount} added).`);

  // Seed TODAs
  console.log(`Syncing ${initialTodas.length} TODAs...`);
  for (const t of initialTodas) {
    try {
      const existing = await pb.collection('todas').getFirstListItem(`reg_no="${t.reg_no}"`).catch(() => null);
      if (!existing) {
        await pb.collection('todas').create({
          reg_no: t.reg_no,
          name: t.name,
          president: t.president || '',
          contact_no: t.contact_no || '',
          total_members: t.total_members || 0,
          address: t.address || '',
          created_at: new Date().toISOString(),
        });
      }
    } catch {}
  }
  console.log(`✓ TODAs synchronized.`);

  // Seed Cemetery Bookings
  console.log(`Syncing ${initialCemeteryBookings.length} cemetery bookings...`);
  let cemCount = 0;
  for (const c of initialCemeteryBookings.slice(0, 50)) {
    try {
      await pb.collection('cemetery_bookings').create({
        deceased_name: c.deceased_name,
        address_barangay: c.address_barangay || '',
        phone_number: c.phone_number || '',
        burial_date: c.burial_date,
        burial_time: '14:00',
        burial_type: c.burial_type || 'Above Ground Niche',
        amount: c.amount || 1500,
        status: 'Confirmed',
        created_at: new Date().toISOString(),
      });
      cemCount++;
    } catch {}
  }
  console.log(`✓ Cemetery bookings synchronized (${cemCount} records).`);

  console.log('\n=============================================================');
  console.log('✓ POCKETBASE DATABASE SETUP & SEEDING COMPLETE!');
  console.log('=============================================================\n');
}

main().catch(console.error);
