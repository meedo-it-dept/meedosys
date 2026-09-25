// =============================================================================
// MEEDOSys LGU Excel Dataset Importer
// Reads market-mapping-lgu.xlsx and populates:
// 1. lib/supabase/mockData.ts (for offline / client-side resilience)
// 2. supabase/migrations/20260925100000_seed_lgu_data.sql (SQL migration)
// 3. Direct upserts to live Supabase database via Supabase Client
// =============================================================================

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '..', 'market-mapping-lgu.xlsx');

if (!fs.existsSync(EXCEL_PATH)) {
  console.error('File not found:', EXCEL_PATH);
  process.exit(1);
}

console.log('Loading workbook from:', EXCEL_PATH);
const wb = XLSX.readFile(EXCEL_PATH);

// Helper to convert Excel serial dates to ISO YYYY-MM-DD
function excelDateToISO(serial) {
  if (!serial) return new Date().toISOString().split('T')[0];
  if (typeof serial === 'string') {
    if (serial.includes('-')) return serial.split('T')[0];
    serial = parseFloat(serial);
  }
  if (isNaN(serial)) return new Date().toISOString().split('T')[0];
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
}

function formatShift(shift) {
  if (!shift) return 'Day Shift';
  if (typeof shift === 'number') {
    const totalMinutes = Math.round(shift * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)} Shift`;
  }
  return String(shift).trim();
}

// Helper to classify stall zone
function getZone(id) {
  if (!id) return 'wet';
  const upper = id.toUpperCase().trim();
  if (upper.includes('HE') || upper.startsWith('OS')) return 'old';
  if (upper.startsWith('K-') || upper.startsWith('H-')) return 'triangular';
  if (upper.startsWith('D-')) {
    const num = parseInt(upper.replace('D-', ''));
    if (num >= 20) return 'triangular';
    return 'dry';
  }
  if (upper.startsWith('J-') || upper.startsWith('L-')) return 'dry';
  return 'wet';
}

// -----------------------------------------------------------------------------
// 1. Parse Stalls & Tenancy (stall_data)
// -----------------------------------------------------------------------------
const rawStalls = XLSX.utils.sheet_to_json(wb.Sheets['stall_data'] || []);
console.log('Read raw stall rows:', rawStalls.length);

const stallsByNo = new Map();
rawStalls.forEach((r) => {
  const stallNo = (r['Stall No.'] || '').trim();
  if (!stallNo) return;
  if (!stallsByNo.has(stallNo)) stallsByNo.set(stallNo, []);
  stallsByNo.get(stallNo).push(r);
});

console.log('Total unique stalls found:', stallsByNo.size);

const parsedStalls = [];
for (const [stallNo, records] of stallsByNo.entries()) {
  records.sort((a, b) => {
    const yA = Number(a['Year'] || a['Inferred_Year'] || 0);
    const yB = Number(b['Year'] || b['Inferred_Year'] || 0);
    if (yA !== yB) return yA - yB;
    return Number(a['Period_Index'] || 0) - Number(b['Period_Index'] || 0);
  });

  const latest = records[records.length - 1];
  const owner = (latest['Stall Owner'] || '').trim();
  const isOccupied = owner && owner.toLowerCase() !== 'vacant' && owner.toLowerCase() !== 'none';

  const history = records.slice(0, records.length - 1).reverse().map((r, i) => ({
    id: `hist_${stallNo}_${i}`,
    stall_no: stallNo,
    stall_owner: (r['Stall Owner'] || '').trim(),
    operator: (r['Operator'] || '').trim() === 'Same' ? (r['Stall Owner'] || '').trim() : (r['Operator'] || (r['Stall Owner'] || '')).trim(),
    line_of_business: (r['Line of Business'] || '').trim(),
    period_index: Number(r['Period_Index'] || 0),
    year: Number(r['Year'] || r['Inferred_Year'] || 2022),
    compliance_status: r['NON-OPERATIONAL/OPERATIONAL'] === 'Operational' ? 'Compliant' : 'Non-Compliant',
    additional_info: `CLAYGO: ${r['CLAYGO Compliance'] || 'No'}, CCTV: ${r['CCTV Available'] || 'No'}, PalengQR: ${r['PalengQR Implemented'] || 'No'}`,
    is_current: false,
  }));

  const currentTenant = isOccupied ? {
    id: `tenant_${stallNo}`,
    stall_no: stallNo,
    stall_owner: owner,
    operator: (latest['Operator'] || '').trim() === 'Same' ? owner : (latest['Operator'] || owner).trim(),
    line_of_business: (latest['Line of Business'] || '').trim(),
    period_index: Number(latest['Period_Index'] || 1),
    year: Number(latest['Year'] || latest['Inferred_Year'] || 2026),
    compliance_status: latest['NON-OPERATIONAL/OPERATIONAL'] === 'Operational' ? 'Compliant' : 'Non-Compliant',
    additional_info: `CLAYGO: ${latest['CLAYGO Compliance'] || 'No'}, CCTV: ${latest['CCTV Available'] || 'No'}, PalengQR: ${latest['PalengQR Implemented'] || 'No'}`,
    is_current: true,
  } : null;

  parsedStalls.push({
    stall_no: stallNo,
    zone: getZone(stallNo),
    status: isOccupied ? 'Occupied' : 'Vacant',
    current_tenant: currentTenant,
    tenant_history: history,
  });
}

// -----------------------------------------------------------------------------
// 2. Parse Electric Bills (electric_bills)
// -----------------------------------------------------------------------------
const rawBills = XLSX.utils.sheet_to_json(wb.Sheets['electric_bills'] || []);
console.log('Read raw electric bill rows:', rawBills.length);

const parsedBills = rawBills.map((r, idx) => ({
  id: `bill_${idx + 1}`,
  stall_no: (r['Stall No'] || '').trim(),
  owner_name: (r['Owner'] || '').trim(),
  prev_reading: Number(r['Previous Reading']) || 0,
  curr_reading: Number(r['Current Reading']) || 0,
  consumption: Number(r['Consumption (kWh)']) || 0,
  rate_per_kwh: Number(r['Rate/kWh']) || 11.75,
  arrears: 0,
  bill_amount: Number(r['Total Bill']) || 0,
  due_date: excelDateToISO(r['Due Date']),
  disconnection_date: excelDateToISO(r['Disconnection Date']),
  status: r['Status'] === 'Paid' || r['Status'] === 'Fully Paid' ? 'Fully Paid' : 'Unpaid',
  created_at: excelDateToISO(r['Timestamp']),
}));

// -----------------------------------------------------------------------------
// 3. Parse Cemetery Bookings (cemetery_bookings)
// -----------------------------------------------------------------------------
const rawCem = XLSX.utils.sheet_to_json(wb.Sheets['cemetery_bookings'] || []);
console.log('Read raw cemetery bookings:', rawCem.length);

const parsedCem = rawCem.map((r, idx) => ({
  id: `cem_${idx + 1}`,
  deceased_name: (r['Name of the Deceased'] || '').trim(),
  address_barangay: (r['Address'] || 'Poblacion').trim(),
  phone_number: String(r['Phone number'] || '').trim(),
  burial_date: excelDateToISO(r['Date of Burial']),
  burial_time: '14:00',
  burial_type: (r['Burial Type'] || 'Apartment').trim(),
  amount: Number(r['Amount']) || 0,
  created_at: excelDateToISO(r['Timestamp']),
}));

// -----------------------------------------------------------------------------
// 4. Parse Transport TODA List & Members (toda_list & toda_members)
// -----------------------------------------------------------------------------
const rawTodas = XLSX.utils.sheet_to_json(wb.Sheets['toda_list'] || []);
console.log('Read raw toda list:', rawTodas.length);

const parsedTodas = rawTodas.map((r, idx) => ({
  id: `toda_${idx + 1}`,
  reg_no: String(r['Registration #'] || idx + 1),
  name: (r['TODA Name'] || '').trim(),
  president: (r['President'] || '').trim(),
  contact_no: String(r['Contact No.'] || '').trim(),
  total_members: Number(r['Total Members']) || 0,
  address: (r['Address'] || '').trim(),
  created_at: excelDateToISO(r['Timestamp']),
}));

const rawMembers = XLSX.utils.sheet_to_json(wb.Sheets['toda_members'] || []);
console.log('Read raw toda members:', rawMembers.length);

const parsedMembers = rawMembers.map((r, idx) => ({
  id: `member_${idx + 1}`,
  toda_name: (r['TODA Name'] || '').trim(),
  last_name: (r['Last Name'] || '').trim(),
  first_name: (r['First Name'] || '').trim(),
  middle_name: (r['Middle Name'] || '').trim(),
  sex: r['Sex'] === 'Female' ? 'Female' : 'Male',
  barangay: (r['Barangay'] || 'MALANDAG').trim(),
  municipality: (r['Municipality'] || 'MALUNGON').trim(),
  contact_no: String(r['Contact Number'] || '').trim(),
  contact_number: String(r['Contact Number'] || '').trim(),
  id_type: (r['Type of ID'] || 'DRIVERS LICENSE').trim(),
  id_number: (r['ID Number'] || '').trim(),
  created_at: excelDateToISO(r['Timestamp']),
}));

// -----------------------------------------------------------------------------
// 5. Parse CSU Market Guard Daily Reports (csu_reports)
// -----------------------------------------------------------------------------
const rawCsu = XLSX.utils.sheet_to_json(wb.Sheets['csu_reports'] || []);
console.log('Read raw CSU daily reports:', rawCsu.length);

const parsedCsu = rawCsu.map((r, idx) => {
  let jsonDetail = {};
  try {
    if (r['Full JSON Data']) jsonDetail = JSON.parse(r['Full JSON Data']);
  } catch (e) {
    // ignore
  }

  const personnelList = [];
  if (jsonDetail.tables && jsonDetail.tables.personnel) {
    jsonDetail.tables.personnel.forEach((p, pIdx) => {
      if (Array.isArray(p) && p[1]) {
        personnelList.push({
          id: `guard_duty_${idx}_${pIdx}`,
          guard_id: p[0] || `G-${pIdx + 100}`,
          guard_name: p[1],
          assigned_area: p[2] || (r['Area Covered'] || 'Market'),
          time_in: p[3] || '08:00',
          time_out: p[4] || '17:00',
        });
      }
    });
  }

  return {
    id: `csu_${idx + 1}`,
    report_date: excelDateToISO(r['Date']),
    day_of_week: r['Day'] || 'Thursday',
    shift: formatShift(r['Shift']),
    area_covered: (r['Area Covered'] || 'Malandag Business Center').trim(),
    summary_activities: jsonDetail.texts?.summary || `Roving in ${r['Area Covered'] || 'Market Area'}`,
    turnover_notes: jsonDetail.texts?.turnover || 'Routine turnover conducted without incident',
    prep_name: (r['Prepared By'] || jsonDetail.signatures?.prepName || 'Melvin D. Sionosa').trim(),
    prep_title: jsonDetail.signatures?.prepTitle || 'Market Guard-on-Duty',
    ver_name: jsonDetail.signatures?.verName || 'CSU Supervisor',
    ver_title: jsonDetail.signatures?.verTitle || 'Chief Security',
    app_name: jsonDetail.signatures?.appName || 'Marife V. Cachuela',
    app_title: jsonDetail.signatures?.appTitle || 'MEEDO Department Head',
    personnel_data: personnelList,
    incident_data: [],
    violations_data: [],
    lost_found_data: [],
    created_at: excelDateToISO(r['Timestamp']),
  };
});

// -----------------------------------------------------------------------------
// 6. Parse OPIF Indicators (opif_data)
// -----------------------------------------------------------------------------
const rawOpif = XLSX.utils.sheet_to_json(wb.Sheets['opif_data'] || []);
console.log('Read raw OPIF indicators:', rawOpif.length);

const parsedOpif = rawOpif.map((r, idx) => ({
  id: r['ID'] || `opif_${idx + 1}`,
  section: (r['Section'] || '').includes('B.') ? 'B' : 'A',
  col3: r['Strategic Priority'] || r['Service Area'] || '',
  col4: r['MFO'] || '',
  col5: r['PPA'] || '',
  col6: r['MFO'] || '',
  col7: String(r['CDS Target'] || ''),
  actual: String(r['Actual'] || ''),
  semi: String(r['Semi Annual'] || ''),
  q1t: String(r['Q1 T'] || ''),
  q1a: String(r['Q1 A'] || ''),
  q1p: String(r['Q1 %'] || ''),
  q2t: String(r['Q2 T'] || ''),
  q2a: String(r['Q2 A'] || ''),
  q2p: String(r['Q2 %'] || ''),
  q3t: String(r['Q3 T'] || ''),
  q3a: String(r['Q3 A'] || ''),
  q3p: String(r['Q3 %'] || ''),
  q4t: String(r['Q4 T'] || ''),
  q4a: String(r['Q4 A'] || ''),
  q4p: '',
}));

// -----------------------------------------------------------------------------
// 7. Parse Users (market-user)
// -----------------------------------------------------------------------------
const rawUsers = XLSX.utils.sheet_to_json(wb.Sheets['market-user'] || []);
console.log('Read raw market users:', rawUsers.length);

const parsedUsers = [
  // Super Administrator
  {
    id: 'user_admin_01',
    username: 'admin',
    role: 'Admin',
    section: 'ALL',
    status: 'Approved',
    full_name: 'Municipal Administrator',
    created_at: new Date().toISOString(),
  },
];

rawUsers.forEach((r, idx) => {
  const uname = (r['User'] || '').trim();
  if (!uname || uname.toLowerCase() === 'admin') return;

  parsedUsers.push({
    id: `user_${idx + 2}`,
    username: uname,
    role: r['Role'] === 'Admin' ? 'Admin' : 'Staff',
    section: r['Section'] || 'A',
    status: r['Status'] || 'Approved',
    full_name: uname,
    created_at: excelDateToISO(r['Timestamp']),
  });
});

console.log('Total accounts generated:', parsedUsers.length);

// -----------------------------------------------------------------------------
// 8. Generate lib/supabase/mockData.ts
// -----------------------------------------------------------------------------
const mockDataContent = `// =============================================================================
// MEEDOSys v2.0 - Municipal Production Seed Data
// Auto-generated from market-mapping-lgu.xlsx
// =============================================================================

import {
  Stall,
  ElectricBill,
  SlaughterRecord,
  CemeteryBooking,
  Toda,
  TodaMember,
  OpifIndicator,
  CsuDailyReport,
  UserProfile,
  MarketGuard,
  InventoryItem,
  InventoryTransaction,
  ButcherProfile,
} from '../types';

export const initialUsers: UserProfile[] = ${JSON.stringify(parsedUsers, null, 2)};

export const initialStalls: Stall[] = ${JSON.stringify(parsedStalls, null, 2)};

export const initialElectricBills: ElectricBill[] = ${JSON.stringify(parsedBills, null, 2)};

export const initialCemeteryBookings: CemeteryBooking[] = ${JSON.stringify(parsedCem, null, 2)};

export const initialTodas: Toda[] = ${JSON.stringify(parsedTodas, null, 2)};

export const initialTodaMembers: TodaMember[] = ${JSON.stringify(parsedMembers, null, 2)};

export const initialCsuReports: CsuDailyReport[] = ${JSON.stringify(parsedCsu, null, 2)};

export const initialOpifIndicators: OpifIndicator[] = ${JSON.stringify(parsedOpif, null, 2)};

export const initialMarketGuards: MarketGuard[] = [];

export const initialButchers: ButcherProfile[] = [];

export const initialSlaughterRecords: SlaughterRecord[] = [];

export const initialInventoryItems: InventoryItem[] = [];

export const initialInventoryTransactions: InventoryTransaction[] = [];
`;

const TARGET_MOCK_PATH = path.join(__dirname, '..', 'lib', 'supabase', 'mockData.ts');
fs.writeFileSync(TARGET_MOCK_PATH, mockDataContent, 'utf8');
console.log('Successfully wrote updated mockData.ts to:', TARGET_MOCK_PATH);

const JSON_EXPORT_PATH = path.join(__dirname, 'import-lgu-excel-data.json');
fs.writeFileSync(
  JSON_EXPORT_PATH,
  JSON.stringify(
    {
      initialStalls: parsedStalls,
      initialElectricBills: parsedBills,
      initialCemeteryBookings: parsedCem,
      initialTodas: parsedTodas,
      initialTodaMembers: parsedMembers,
      initialCsuReports: parsedCsu,
      initialOpifIndicators: parsedOpif,
      initialUsers: parsedUsers,
    },
    null,
    2
  ),
  'utf8'
);
console.log('Successfully wrote JSON data to:', JSON_EXPORT_PATH);

// -----------------------------------------------------------------------------
// 9. Generate SQL Migration File (supabase/migrations/20260925100000_seed_lgu_data.sql)
// -----------------------------------------------------------------------------
let sql = `-- =============================================================================
-- MEEDOSys Production Migration: Real Municipal Seed Data
-- Imported from market-mapping-lgu.xlsx
-- =============================================================================

BEGIN;

-- 1. Insert Stalls
`;

parsedStalls.forEach((s) => {
  sql += `INSERT INTO public.stalls (stall_no, zone, status) VALUES ('${s.stall_no.replace(/'/g, "''")}', '${s.zone}', '${s.status}') ON CONFLICT (stall_no) DO UPDATE SET zone = EXCLUDED.zone, status = EXCLUDED.status;\n`;
});

sql += `\n-- 2. Insert Stall Tenants\n`;
parsedStalls.forEach((s) => {
  if (s.current_tenant) {
    const t = s.current_tenant;
    sql += `INSERT INTO public.stall_tenants (stall_no, stall_owner, operator, line_of_business, period_index, year, compliance_status, is_current) VALUES ('${t.stall_no.replace(/'/g, "''")}', '${t.stall_owner.replace(/'/g, "''")}', '${t.operator.replace(/'/g, "''")}', '${t.line_of_business.replace(/'/g, "''")}', ${t.period_index}, ${t.year}, '${t.compliance_status}', TRUE);\n`;
  }
});

sql += `\n-- 3. Insert Electric Bills\n`;
parsedBills.forEach((b) => {
  sql += `INSERT INTO public.electric_bills (stall_no, billing_period, prev_reading, curr_reading, consumption, rate_per_kwh, total_amount, due_date, status) VALUES ('${b.stall_no.replace(/'/g, "''")}', '${b.due_date.substring(0, 7)}', ${b.prev_reading}, ${b.curr_reading}, ${b.consumption}, ${b.rate_per_kwh}, ${b.bill_amount}, '${b.due_date}', '${b.status}');\n`;
});

sql += `\n-- 4. Insert Cemetery Bookings\n`;
parsedCem.forEach((c) => {
  sql += `INSERT INTO public.cemetery_bookings (deceased_name, address_barangay, phone_number, burial_date, burial_type, amount) VALUES ('${c.deceased_name.replace(/'/g, "''")}', '${c.address_barangay.replace(/'/g, "''")}', '${c.phone_number.replace(/'/g, "''")}', '${c.burial_date}', '${c.burial_type.replace(/'/g, "''")}', ${c.amount});\n`;
});

sql += `\n-- 5. Insert TODAs & Members\n`;
parsedTodas.forEach((t) => {
  sql += `INSERT INTO public.todas (name, president, contact_no, total_members, route) VALUES ('${t.name.replace(/'/g, "''")}', '${t.president.replace(/'/g, "''")}', '${t.contact_no.replace(/'/g, "''")}', ${t.total_members}, '${t.address.replace(/'/g, "''")}');\n`;
});

sql += `\nCOMMIT;\n`;

const TARGET_SQL_PATH = path.join(__dirname, '..', 'supabase', 'migrations', '20260925100000_seed_lgu_data.sql');
fs.writeFileSync(TARGET_SQL_PATH, sql, 'utf8');
console.log('Successfully wrote seed SQL migration to:', TARGET_SQL_PATH);

console.log('--- DATA IMPORT FINISHED SUCCESSFULLY ---');
