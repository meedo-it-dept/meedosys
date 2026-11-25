// =============================================================================
// MEEDOSys v2.0 - PocketBase Collection Schema Generator
// Generates pocketbase/pb_schema.json matching all 17 municipal collections
// =============================================================================

const fs = require('fs');
const path = require('path');

function textField(name, required = false) {
  return {
    id: `fld_${name.slice(0, 10)}_${Math.random().toString(36).substr(2, 4)}`,
    name,
    type: 'text',
    system: false,
    required: !!required,
    presentable: false,
    unique: false,
    options: { min: null, max: null, pattern: '' }
  };
}

function numberField(name, required = false) {
  return {
    id: `fld_${name.slice(0, 10)}_${Math.random().toString(36).substr(2, 4)}`,
    name,
    type: 'number',
    system: false,
    required: !!required,
    presentable: false,
    unique: false,
    options: { min: null, max: null, noDecimal: false }
  };
}

function boolField(name) {
  return {
    id: `fld_${name.slice(0, 10)}_${Math.random().toString(36).substr(2, 4)}`,
    name,
    type: 'bool',
    system: false,
    required: false,
    presentable: false,
    unique: false,
    options: {}
  };
}

function jsonField(name) {
  return {
    id: `fld_${name.slice(0, 10)}_${Math.random().toString(36).substr(2, 4)}`,
    name,
    type: 'json',
    system: false,
    required: false,
    presentable: false,
    unique: false,
    options: { maxSize: 2000000 }
  };
}

const collections = [
  // 1. profiles (PocketBase native auth collection)
  {
    name: 'profiles',
    type: 'auth',
    schema: [
      textField('username', true),
      textField('username_lower'),
      textField('role'),
      textField('section'),
      textField('status'),
      {
        id: 'pb_fld_password',
        name: 'password',
        type: 'password',
        system: false,
        required: true,
        presentable: false,
        unique: false,
        options: { min: 4, max: 0, pattern: '' }
      },
      {
        id: 'pb_fld_email',
        name: 'email',
        type: 'email',
        system: false,
        required: false,
        presentable: false,
        unique: false,
        options: { exceptDomains: null, onlyDomains: null }
      },
      textField('guard_id'),
      textField('full_name'),
      textField('rank_title'),
      textField('radio_call_sign'),
      textField('default_area'),
      textField('firebase_uid'),
      textField('auth_provider'),
      textField('photo_url'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: [
      'CREATE UNIQUE INDEX `idx_profiles_username` ON `profiles` (`username`)',
      'CREATE UNIQUE INDEX `idx_profiles_username_lower` ON `profiles` (`username_lower`) WHERE `username_lower` != ""',
      'CREATE UNIQUE INDEX `idx_profiles_guard_id` ON `profiles` (`guard_id`) WHERE `guard_id` != ""',
      'CREATE UNIQUE INDEX `idx_profiles_firebase_uid` ON `profiles` (`firebase_uid`) WHERE `firebase_uid` != ""'
    ],
    options: {
      authRule: 'status = "Approved"',
      manageRule: null,
      passwordAuth: {
        enabled: true,
        identityFields: ['username', 'guard_id', 'username_lower']
      }
    }
  },

  // 2. stalls
  {
    name: 'stalls',
    type: 'base',
    schema: [
      textField('stall_no', true),
      textField('zone'),
      textField('status'),
      textField('created_at')
    ],
    indexes: ['CREATE UNIQUE INDEX `idx_stalls_stall_no` ON `stalls` (`stall_no`)']
  },

  // 3. stall_tenants
  {
    name: 'stall_tenants',
    type: 'base',
    schema: [
      textField('stall_no', true),
      textField('stall_owner', true),
      textField('operator'),
      textField('line_of_business'),
      numberField('period_index'),
      textField('year'),
      textField('compliance_status'),
      textField('photo_url'),
      textField('lease_doc_url'),
      textField('permit_doc_url'),
      textField('lease_doc_name'),
      textField('permit_doc_name'),
      textField('additional_info'),
      boolField('is_current'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE INDEX `idx_tenants_stall_no` ON `stall_tenants` (`stall_no`)']
  },

  // 4. monitoring_records
  {
    name: 'monitoring_records',
    type: 'base',
    schema: [
      textField('stall_no', true),
      textField('monitoring_date', true),
      numberField('goodwill'),
      textField('operational_status'),
      textField('permit_date'),
      boolField('permit_submitted'),
      textField('lease_date'),
      boolField('lease_submitted'),
      textField('rental_or'),
      boolField('rental_paid'),
      textField('claygo_compliant'),
      textField('cctv_available'),
      textField('palengqr_implemented'),
      jsonField('seminars_attended'),
      numberField('electric_bill_amount'),
      textField('electric_bill_status'),
      textField('electric_bill_due_date'),
      textField('remarks'),
      textField('created_by'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE INDEX `idx_monitoring_stall_date` ON `monitoring_records` (`stall_no`, `monitoring_date`)']
  },

  // 5. electric_bills
  {
    name: 'electric_bills',
    type: 'base',
    schema: [
      textField('stall_no', true),
      textField('owner_name'),
      textField('due_date'),
      textField('disconnection_date'),
      numberField('prev_reading'),
      numberField('curr_reading'),
      numberField('consumption'),
      numberField('rate_per_kwh'),
      numberField('arrears'),
      numberField('bill_amount'),
      boolField('meter_reset'),
      textField('status'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE INDEX `idx_electric_stall_no` ON `electric_bills` (`stall_no`)']
  },

  // 6. slaughter_records
  {
    name: 'slaughter_records',
    type: 'base',
    schema: [
      textField('client_id'),
      textField('client_name'),
      textField('owner_name'),
      textField('livestock_type'),
      numberField('head_count'),
      numberField('total_weight_kg'),
      boolField('ante_mortem_passed'),
      boolField('post_mortem_passed'),
      numberField('ante_mortem_fee'),
      numberField('post_mortem_fee'),
      numberField('slaughter_fee'),
      numberField('corral_fee'),
      numberField('total_amount'),
      numberField('amount'),
      textField('payment_status'),
      textField('status'),
      textField('or_number'),
      textField('meat_inspector'),
      textField('date'),
      textField('destination'),
      textField('arrival_date'),
      textField('slaughter_date'),
      textField('sex'),
      textField('category'),
      textField('holding_pen_no'),
      boolField('is_condemned'),
      textField('condemnation_reason'),
      numberField('condemned_weight_kg'),
      textField('butcher_name'),
      textField('butcher_id'),
      textField('address'),
      textField('contact_no'),
      numberField('kilos'),
      textField('remarks'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE INDEX `idx_slaughter_date` ON `slaughter_records` (`date`)']
  },

  // 7. cemetery_bookings
  {
    name: 'cemetery_bookings',
    type: 'base',
    schema: [
      textField('deceased_name', true),
      textField('address_barangay'),
      textField('phone_number'),
      textField('burial_date'),
      textField('burial_time'),
      textField('burial_type'),
      numberField('amount'),
      textField('status'),
      textField('google_calendar_event_id'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE INDEX `idx_cem_date` ON `cemetery_bookings` (`burial_date`)']
  },

  // 8. todas
  {
    name: 'todas',
    type: 'base',
    schema: [
      textField('reg_no', false),
      textField('name', true),
      textField('president'),
      textField('contact_no'),
      numberField('total_members'),
      textField('address'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ["CREATE UNIQUE INDEX `idx_todas_reg_no` ON `todas` (`reg_no`) WHERE `reg_no` != ''"]
  },

  // 9. toda_members
  {
    name: 'toda_members',
    type: 'base',
    schema: [
      textField('toda_id'),
      textField('toda_name', true),
      textField('last_name', true),
      textField('first_name', true),
      textField('middle_name'),
      textField('ext_name'),
      textField('sex'),
      textField('barangay'),
      textField('municipality'),
      textField('contact_no'),
      textField('contact_number'),
      textField('id_type'),
      textField('id_number'),
      textField('id_expiry'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE INDEX `idx_members_toda` ON `toda_members` (`toda_name`)']
  },

  // 10. opif_indicators
  {
    name: 'opif_indicators',
    type: 'base',
    schema: [
      textField('division'),
      textField('major_output'),
      textField('indicator_code'),
      textField('indicator_name'),
      numberField('annual_target'),
      numberField('q1_target'),
      numberField('q1_actual'),
      numberField('q2_target'),
      numberField('q2_actual'),
      numberField('q3_target'),
      numberField('q3_actual'),
      numberField('q4_target'),
      numberField('q4_actual'),
      numberField('year'),
      textField('year_label'),
      textField('remarks'),
      textField('section'),
      textField('col3'),
      textField('col4'),
      textField('col5'),
      textField('col6'),
      textField('col7'),
      textField('indicator'),
      textField('annual'),
      textField('actual'),
      textField('semi'),
      textField('q1t'),
      textField('q1a'),
      textField('q1p'),
      textField('q2t'),
      textField('q2a'),
      textField('q2p'),
      textField('q3t'),
      textField('q3a'),
      textField('q3p'),
      textField('q4t'),
      textField('q4a'),
      textField('q4p'),
      numberField('specialSpan'),
      textField('specialText'),
      numberField('spanCol3'),
      numberField('spanCol4'),
      numberField('spanCol5'),
      numberField('sort_order'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE INDEX `idx_opif_div_year` ON `opif_indicators` (`division`, `year`)']
  },

  // 11. csu_daily_reports
  {
    name: 'csu_daily_reports',
    type: 'base',
    schema: [
      textField('report_date', true),
      textField('day_of_week'),
      textField('shift'),
      textField('team_leader'),
      textField('prep_name'),
      textField('prep_title'),
      textField('ver_name'),
      textField('ver_title'),
      textField('app_name'),
      textField('app_title'),
      textField('area_covered'),
      textField('summary_activities'),
      textField('turnover_notes'),
      textField('remarks'),
      textField('incident_summary'),
      jsonField('personnel_data'),
      jsonField('incident_data'),
      jsonField('violations_data'),
      jsonField('lost_found_data'),
      jsonField('blotter_entries'),
      jsonField('equipment_inspections'),
      jsonField('gate_turnstile_counts'),
      jsonField('visitor_vehicles'),
      boolField('is_locked'),
      textField('locked_at'),
      textField('calendar_event_id'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE INDEX `idx_csu_date` ON `csu_daily_reports` (`report_date`)']
  },

  // 12. inventory_items
  {
    name: 'inventory_items',
    type: 'base',
    schema: [
      textField('item', true),
      textField('name'),
      textField('description'),
      textField('unit', true),
      numberField('quantity'),
      numberField('low_stock_threshold'),
      numberField('min_level'),
      numberField('unit_cost'),
      textField('category'),
      textField('sku'),
      textField('location'),
      boolField('is_active'),
      textField('date_received'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE INDEX `idx_inv_item` ON `inventory_items` (`item`)']
  },

  // 13. inventory_transactions
  {
    name: 'inventory_transactions',
    type: 'base',
    schema: [
      textField('inventory_item_id'),
      textField('item_id'),
      textField('item_name'),
      textField('description'),
      textField('department_section'),
      textField('department'),
      textField('transaction_type'),
      numberField('quantity'),
      numberField('previous_quantity'),
      numberField('new_quantity'),
      textField('unit'),
      textField('received_by'),
      textField('released_by'),
      textField('requested_by'),
      textField('performed_by'),
      textField('transaction_date'),
      textField('reference_no'),
      textField('remarks'),
      textField('notes'),
      textField('created_at')
    ],
    indexes: ['CREATE INDEX `idx_inv_tx_item` ON `inventory_transactions` (`inventory_item_id`)']
  },

  // 14. butchers
  {
    name: 'butchers',
    type: 'base',
    schema: [
      textField('butcher_code', true),
      textField('name', true),
      textField('full_name'),
      textField('contact_no'),
      textField('address_barangay'),
      textField('address'),
      textField('specialization'),
      textField('specialty'),
      textField('health_card_no'),
      textField('health_card_expiry'),
      numberField('daily_rate'),
      numberField('total_slaughters'),
      textField('status'),
      textField('date_registered'),
      textField('remarks'),
      textField('notes'),
      textField('id_number'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE UNIQUE INDEX `idx_butcher_code` ON `butchers` (`butcher_code`)']
  },

  // 15. audit_logs
  {
    name: 'audit_logs',
    type: 'base',
    schema: [
      textField('user_id'),
      textField('username', true),
      textField('action', true),
      textField('details'),
      textField('created_at')
    ],
    indexes: ['CREATE INDEX `idx_audit_action` ON `audit_logs` (`action`)']
  },

  // 16. market_guards
  {
    name: 'market_guards',
    type: 'base',
    schema: [
      textField('guard_id', true),
      textField('guard_name', true),
      textField('rank_title'),
      textField('default_area'),
      textField('contact_no'),
      textField('radio_call_sign'),
      textField('assigned_facility'),
      textField('current_shift'),
      textField('designation'),
      textField('area_assigned'),
      textField('remarks'),
      textField('status'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE UNIQUE INDEX `idx_guard_id` ON `market_guards` (`guard_id`)']
  },

  // 17. market_calendar_events
  {
    name: 'market_calendar_events',
    type: 'base',
    schema: [
      textField('title', true),
      textField('category'),
      textField('date', true),
      textField('start_time'),
      textField('end_time'),
      textField('location'),
      textField('assigned_personnel'),
      textField('assigned_guard_id'),
      textField('supervisor'),
      jsonField('guards_assigned'),
      textField('shift_name'),
      textField('shift'),
      textField('area'),
      textField('call_sign'),
      textField('special_instructions'),
      textField('description'),
      textField('notes'),
      textField('priority'),
      textField('status'),
      boolField('is_recurring'),
      textField('recurrence_rule'),
      textField('blotter_report_id'),
      boolField('is_locked'),
      textField('created_by'),
      textField('created_at'),
      textField('updated_at')
    ],
    indexes: ['CREATE INDEX `idx_calendar_date` ON `market_calendar_events` (`date`)']
  }
];

const { PROFILE_AUTH_CONFIG, getCollectionRules } = require('./pb-rules');

// Configure authenticated role- and section-scoped access rules
const formattedCollections = collections.map((col, idx) => ({
  id: `pbcol_${col.name.slice(0, 9)}_${String(idx + 1).padStart(2, '0')}`,
  name: col.name,
  type: col.type || 'base',
  system: false,
  schema: col.schema,
  indexes: col.indexes || [],
  ...getCollectionRules(col.name),
  options: col.type === 'auth' ? PROFILE_AUTH_CONFIG : {}
}));

const outPath = path.join(__dirname, '..', 'pocketbase', 'pb_schema.json');
fs.writeFileSync(outPath, JSON.stringify(formattedCollections, null, 2), 'utf8');
console.log(`✓ Successfully generated PocketBase schema with ${formattedCollections.length} collections:`, outPath);
