/**
 * Idempotent Excel Archive Importer -> Live PocketBase
 * Source: D:\IBM-Latin\market\_archive\market-mapping-lgu-exported.xlsx
 *
 * Imports ALL sheets completely:
 *  - market-user (15 -> profiles + preserved admin, linking 6 Section F guards)
 *  - csu_reports -> extracts canonical 6 CSU guards into market_guards + imports all 191 reports
 *  - stall_data (802 rows -> 182 unique stalls + current & historical stall_tenants + inline monitoring fallback)
 *  - monitoring_history (246 rows -> monitoring_records)
 *  - electric_bills (all 939 rows -> electric_bills)
 *  - cemetery_bookings (all 75 rows -> cemetery_bookings)
 *  - toda_list (all 5 rows -> todas)
 *  - toda_members (all 150 rows -> toda_members)
 *  - opif_data (populated rows -> opif_indicators)
 *  - Log (2979 rows -> audit_logs alongside existing live audit entries)
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const PocketBase = require('pocketbase/cjs');

const XLSX_PATH = path.resolve(__dirname, '..', '_archive', 'market-mapping-lgu-exported.xlsx');
const LOCAL_PB_URL = 'http://127.0.0.1:8090';

// Match lib/pocketbase/client.ts toPbId deterministically
function toPbId(rawId) {
  if (!rawId) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let res = '';
    for (let i = 0; i < 15; i++) res += chars[Math.floor(Math.random() * chars.length)];
    return res;
  }
  const clean = String(rawId).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.length === 15) return clean;

  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < rawId.length; i++) {
    const code = rawId.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 16777619);
    h2 = Math.imul(h2 ^ code, 1099511628);
  }
  const part1 = Math.abs(h1).toString(36);
  const part2 = Math.abs(h2).toString(36);
  return (part1 + part2 + clean).padEnd(15, '0').slice(0, 15);
}

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  const env = {
    pbUrl: process.env.NEXT_PUBLIC_POCKETBASE_URL || LOCAL_PB_URL,
    email: process.env.POCKETBASE_ADMIN_EMAIL || '',
    password: process.env.POCKETBASE_ADMIN_PASSWORD || '',
  };
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([^=#]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const k = m[1].trim();
      const v = m[2].trim().replace(/^["']|["']$/g, '');
      if (k === 'NEXT_PUBLIC_POCKETBASE_URL' && v && !process.env.NEXT_PUBLIC_POCKETBASE_URL) env.pbUrl = v;
      if (k === 'POCKETBASE_ADMIN_EMAIL' && v && !env.email) env.email = v;
      if (k === 'POCKETBASE_ADMIN_PASSWORD' && v && !env.password) env.password = v;
    }
  }
  if (!env.email || !env.password) {
    throw new Error('Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD in environment or .env.local.');
  }
  return env;
}

async function connectPb() {
  const env = loadEnv();
  const candidates = process.argv.includes('--remote')
    ? (env.pbUrl !== LOCAL_PB_URL ? [env.pbUrl, LOCAL_PB_URL] : [LOCAL_PB_URL])
    : (env.pbUrl !== LOCAL_PB_URL ? [LOCAL_PB_URL, env.pbUrl] : [LOCAL_PB_URL]);

  for (const url of candidates) {
    try {
      const pb = new PocketBase(url);
      pb.autoCancellation(false);
      pb.beforeSend = (u, opts) => {
        opts.headers = { ...opts.headers, 'ngrok-skip-browser-warning': 'true' };
        opts.signal = opts.signal || AbortSignal.timeout(8000);
        return { url: u, options: opts };
      };
      await pb.health.check();
      await pb.admins.authWithPassword(env.email, env.password);
      console.log(`Connected to PocketBase at ${url}`);
      return pb;
    } catch (e) {
      console.warn(`Unable to reach ${url} (${e.message}), trying fallback...`);
    }
  }
  throw new Error('Could not authenticate to any PocketBase instance.');
}

function excelSerialToIsoDate(val) {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number' && val > 20000) {
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.round(val * 86400000));
    return Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d+(\.\d+)?$/.test(s) && Number(s) > 20000) {
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.round(Number(s) * 86400000));
    return Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? s : parsed.toISOString().slice(0, 10);
}

function excelSerialToIsoTimestamp(val) {
  if (val === null || val === undefined || val === '') return new Date().toISOString();
  if (typeof val === 'number' && val > 20000) {
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.round(val * 86400000));
    return Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
  }
  const parsed = new Date(String(val));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function formatPhPhone(val) {
  const s = String(val ?? '').trim().replace(/[^\d+]/g, '');
  if (!s) return '';
  if (s.length === 10 && s.startsWith('9')) return `0${s}`;
  return s;
}

function toNumber(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(String(val).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : fallback;
}

function normalizeYesNo(val) {
  const s = String(val ?? '').trim().toLowerCase();
  if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return 'Yes';
  if (s === 'no' || s === 'n' || s === 'false' || s === '0') return 'No';
  return 'No';
}

function inferZone(stallNo) {
  const s = String(stallNo || '').trim().toUpperCase();
  if (s.startsWith('W')) return 'wet';
  if (s.startsWith('O')) return 'old';
  if (s.startsWith('T')) return 'triangular';
  return 'dry';
}

async function runPool(items, worker, concurrency = 12) {
  let idx = 0;
  let errors = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      try {
        await worker(items[i], i);
      } catch (e) {
        errors++;
        if (errors <= 5) console.warn(`  [warn item ${i}]: ${e.message || e}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, next));
  return errors;
}

async function clearCollection(pb, name) {
  const existing = await pb.collection(name).getFullList({ fields: 'id', requestKey: null });
  if (!existing.length) return 0;
  await runPool(existing, (r) => pb.collection(name).delete(r.id, { requestKey: null }), 15);
  return existing.length;
}

async function upsertById(pb, collection, row) {
  const id = toPbId(row.id);
  const payload = { ...row, id };
  try {
    await pb.collection(collection).getOne(id, { requestKey: null });
    const updateBody = { ...payload };
    delete updateBody.id;
    return await pb.collection(collection).update(id, updateBody, { requestKey: null });
  } catch {
    return await pb.collection(collection).create(payload, { requestKey: null });
  }
}

const CANONICAL_CSU_GUARDS = {
  rafjunsomosa: {
    guard_id: '746',
    guard_name: 'Rafjun Somosa',
    rank_title: 'SO1',
    default_area: 'Public Market',
    radio_call_sign: 'EAGLE-1',
    assigned_facility: 'Public Market Main',
    current_shift: '3rd Shift / Night Duty',
  },
  melsion04: {
    guard_id: '933',
    guard_name: 'Melvin D. Sionosa',
    rank_title: 'SO1',
    default_area: 'Malandag Business Center',
    radio_call_sign: 'EAGLE-2',
    assigned_facility: 'Malandag Business Center',
    current_shift: '1st Shift (08:00 - 17:00)',
  },
  jomar: {
    guard_id: '750',
    guard_name: 'Jomar M. Luganao',
    rank_title: 'SO1',
    default_area: 'Hall Market',
    radio_call_sign: 'EAGLE-3',
    assigned_facility: 'Public Market Main',
    current_shift: '1st Shift (08:00 - 17:00)',
  },
  domingorios: {
    guard_id: '733',
    guard_name: 'Domingo V. Rios',
    rank_title: 'SO1',
    default_area: 'Wet Market',
    radio_call_sign: 'EAGLE-4',
    assigned_facility: 'Wet Market',
    current_shift: '2nd Shift (12:00 - 20:00)',
  },
  'aiellbernil1996@gmail.com': {
    guard_id: '792',
    guard_name: 'Aiell Bernil',
    rank_title: 'SO1',
    default_area: 'Triangular / Main Building',
    radio_call_sign: 'EAGLE-5',
    assigned_facility: 'Triangular Building',
    current_shift: '2nd Shift (12:00 - 20:00)',
  },
  rexmonteliza: {
    guard_id: '742',
    guard_name: 'Rex A. Monteliza',
    rank_title: 'SO1',
    default_area: 'All Market Covered Area',
    radio_call_sign: 'EAGLE-6',
    assigned_facility: 'Public Market Main',
    current_shift: '2nd Shift (12:00 - 17:00)',
  },
};

const isPlaceholderText = (s) => {
  const t = String(s || '').trim().toLowerCase();
  if (!t) return true;
  if (['none', 'nome', 'noneno', 'nnone', 'nne', 'kone', 'nonenone', 'n/a', 'na', '-', '--', 'nil', 'nothing'].includes(t)) {
    return true;
  }
  return /^n+o*n+e+$/.test(t);
};

async function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    throw new Error(`Excel file not found: ${XLSX_PATH}`);
  }
  console.log(`Reading ${XLSX_PATH}...`);
  const wb = XLSX.readFile(XLSX_PATH);
  const sheet = (name) => XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });

  const pb = await connectPb();

  // 1. market-user -> profiles (preserving admin account) + canonical market_guards
  const marketUsers = sheet('market-user');
  console.log(`\n[1/9] Importing market-user (${marketUsers.length} rows) & market_guards...`);
  const existingAdmin = await pb.collection('profiles').getList(1, 1, {
    filter: 'username="admin"',
    requestKey: null,
  });
  if (existingAdmin.items.length === 0 && process.env.MEEDO_DEFAULT_ADMIN_PASS) {
    await upsertById(pb, 'profiles', {
      id: 'user_admin_01',
      username: 'admin',
      username_lower: 'admin',
      role: 'Admin',
      section: 'ALL',
      status: 'Approved',
      full_name: 'Municipal Administrator',
      password: process.env.MEEDO_DEFAULT_ADMIN_PASS,
      passwordConfirm: process.env.MEEDO_DEFAULT_ADMIN_PASS,
      created_at: new Date().toISOString(),
    });
  }

  for (let i = 0; i < marketUsers.length; i++) {
    const r = marketUsers[i];
    const username = String(r['User'] || '').trim();
    if (!username) continue;
    const key = username.toLowerCase();
    const rawPw = String(r['Password'] || '').trim();
    const guardInfo = CANONICAL_CSU_GUARDS[key] || null;
    const payload = {
      id: `user_xlsx_${key}`,
      username,
      username_lower: key,
      ...(rawPw.length >= 4 ? { password: rawPw, passwordConfirm: rawPw } : {}),
      role: String(r['Role'] || 'Staff').trim() === 'Admin' ? 'Admin' : 'Staff',
      status: String(r['Status'] || 'Approved').trim() || 'Approved',
      section: String(r['Section'] || 'A').trim() || 'A',
      full_name: guardInfo ? guardInfo.guard_name : username,
      guard_id: guardInfo ? guardInfo.guard_id : '',
      rank_title: guardInfo ? guardInfo.rank_title : '',
      radio_call_sign: guardInfo ? guardInfo.radio_call_sign : '',
      default_area: guardInfo ? guardInfo.default_area : '',
      created_at: excelSerialToIsoTimestamp(r['Timestamp']),
      updated_at: new Date().toISOString(),
    };
    const existing = await pb.collection('profiles').getList(1, 1, {
      filter: `username="${username.replace(/"/g, '\\"')}"`,
      requestKey: null,
    });
    if (existing.items.length > 0) {
      const up = { ...payload };
      delete up.id;
      await pb.collection('profiles').update(existing.items[0].id, up, { requestKey: null });
    } else {
      await upsertById(pb, 'profiles', payload);
    }
  }

  for (const g of Object.values(CANONICAL_CSU_GUARDS)) {
    const payload = { ...g, status: 'Active', created_at: new Date().toISOString() };
    const existing = await pb.collection('market_guards').getList(1, 1, {
      filter: `guard_id="${g.guard_id}"`,
      requestKey: null,
    });
    if (existing.items.length > 0) {
      await pb.collection('market_guards').update(existing.items[0].id, payload, { requestKey: null });
    } else {
      await pb.collection('market_guards').create({ id: toPbId(`guard_${g.guard_id}`), ...payload }, { requestKey: null });
    }
  }

  // 2. stall_data -> stalls (182) + all historical/current stall_tenants
  const stallRows = sheet('stall_data');
  console.log(`\n[2/9] Importing stall_data (${stallRows.length} rows)...`);
  await clearCollection(pb, 'stall_tenants');
  await clearCollection(pb, 'stalls');

  const stallsByNo = new Map();
  stallRows.forEach((row, idx) => {
    const stallNo = String(row['Stall No.'] || '').trim();
    if (!stallNo) return;
    if (!stallsByNo.has(stallNo)) stallsByNo.set(stallNo, []);
    stallsByNo.get(stallNo).push({ row, idx });
  });

  const stallPayloads = [];
  const tenantPayloads = [];

  for (const [stallNo, entries] of stallsByNo.entries()) {
    entries.sort((a, b) => {
      const yA = toNumber(a.row['Inferred_Year'] || a.row['Year'], 0);
      const yB = toNumber(b.row['Inferred_Year'] || b.row['Year'], 0);
      if (yA !== yB) return yA - yB;
      const pA = toNumber(a.row['Period_Index'], -1);
      const pB = toNumber(b.row['Period_Index'], -1);
      if (pA !== pB) return pA - pB;
      return a.idx - b.idx;
    });

    const latestEntry = entries[entries.length - 1];
    const latestOwner = String(latestEntry.row['Stall Owner'] || '').trim();
    const isOccupied = Boolean(latestOwner);

    stallPayloads.push({
      id: toPbId(`stall_${stallNo}`),
      stall_no: stallNo,
      zone: inferZone(stallNo),
      status: isOccupied ? 'Occupied' : 'Vacant',
      created_at: new Date().toISOString(),
    });

    entries.forEach((entry, orderIdx) => {
      const r = entry.row;
      const owner = String(r['Stall Owner'] || '').trim();
      if (!owner) return; // Vacant snapshot rows don't create fake tenant records
      const isCurrent = orderIdx === entries.length - 1 && isOccupied;
      const claygo = normalizeYesNo(r['CLAYGO Compliance']);
      const cctv = normalizeYesNo(r['CCTV Available']);
      const palengqr = normalizeYesNo(r['PalengQR Implemented']);
      const rawStatus = String(r['Status'] || '').trim();
      const compliance =
        rawStatus === 'Compliant' || rawStatus === 'Lacking' || rawStatus === 'Non-Compliant'
          ? rawStatus
          : claygo === 'Yes' && palengqr === 'Yes'
          ? 'Compliant'
          : 'Non-Compliant';
      const op = String(r['Operator'] || '').trim();
      tenantPayloads.push({
        id: toPbId(`tenant_${stallNo}_${entry.idx}`),
        stall_no: stallNo,
        stall_owner: owner,
        operator: op.toLowerCase() === 'same' ? owner : op || owner,
        line_of_business: String(r['Line of Business'] || '').trim(),
        period_index: toNumber(r['Period_Index'], orderIdx),
        year: String(r['Inferred_Year'] || r['Year'] || '2025').trim(),
        compliance_status: compliance,
        lease_doc_url: String(r['Contract Of Lease'] || '').trim(),
        permit_doc_url: String(r['Business Permit'] || '').trim(),
        additional_info: `CLAYGO: ${claygo}, CCTV: ${cctv}, PalengQR: ${palengqr}`,
        is_current: isCurrent,
        created_at: excelSerialToIsoTimestamp(r['Date']),
      });
    });
  }

  const stallErrs = await runPool(stallPayloads, (p) => pb.collection('stalls').create(p, { requestKey: null }));
  const tenantErrs = await runPool(tenantPayloads, (p) => pb.collection('stall_tenants').create(p, { requestKey: null }));
  console.log(`  Stalls created: ${stallPayloads.length} (errs: ${stallErrs}), Tenants created: ${tenantPayloads.length} (errs: ${tenantErrs})`);

  // 3. monitoring_history (246 rows -> monitoring_records)
  const monRows = sheet('monitoring_history');
  console.log(`\n[3/9] Importing monitoring_history (${monRows.length} rows)...`);
  await clearCollection(pb, 'monitoring_records');
  const monPayloads = monRows
    .map((r, i) => {
      const stallNo = String(r['Stall No'] || '').trim();
      const monDate = excelSerialToIsoDate(r['Monitoring Date']) || excelSerialToIsoDate(r['Timestamp']);
      if (!stallNo || !monDate) return null;
      const semText = String(r['Seminars'] || '').trim();
      const seminars = semText ? semText.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean) : [];
      const permitStr = excelSerialToIsoDate(r['Permit']);
      const leaseStr = excelSerialToIsoDate(r['Lease']);
      const rentalStr = String(r['Rental'] || '').trim();
      return {
        id: toPbId(`mon_xlsx_${i}_${stallNo}_${monDate}`),
        stall_no: stallNo,
        monitoring_date: monDate,
        goodwill: toNumber(r['Goodwill'], 0),
        operational_status: String(r['Status'] || '').trim() === 'Non-Operational' ? 'Non-Operational' : 'Operational',
        permit_date: permitStr,
        permit_submitted: Boolean(permitStr),
        lease_date: leaseStr,
        lease_submitted: Boolean(leaseStr),
        rental_or: rentalStr,
        rental_paid: Boolean(rentalStr && rentalStr !== '0'),
        claygo_compliant: normalizeYesNo(r['CLAYGO']),
        cctv_available: normalizeYesNo(r['CCTV']),
        palengqr_implemented: normalizeYesNo(r['PalengQR']),
        seminars_attended: seminars,
        electric_bill_amount: toNumber(r['E-Bill Amount'], 0),
        electric_bill_status: String(r['E-Bill Status'] || '').trim() || 'Unpaid',
        electric_bill_due_date: excelSerialToIsoDate(r['E-Bill Date']),
        remarks: r['Owner'] ? `Owner: ${String(r['Owner']).trim()}` : '',
        created_by: 'Excel Import',
        created_at: excelSerialToIsoTimestamp(r['Timestamp']),
      };
    })
    .filter(Boolean);
  const monErrs = await runPool(monPayloads, (p) => pb.collection('monitoring_records').create(p, { requestKey: null }));
  console.log(`  Monitoring records created: ${monPayloads.length} (errs: ${monErrs})`);

  // 4. electric_bills (ALL 939 rows)
  const billRows = sheet('electric_bills');
  console.log(`\n[4/9] Importing ALL electric_bills (${billRows.length} rows)...`);
  await clearCollection(pb, 'electric_bills');
  const billPayloads = billRows
    .map((r, i) => {
      const stallNo = String(r['Stall No'] || '').trim();
      if (!stallNo) return null;
      const rawStatus = String(r['Status'] || '').trim();
      const status =
        rawStatus === 'Fully Paid' || rawStatus.toLowerCase() === 'paid'
          ? 'Fully Paid'
          : rawStatus === 'Partial'
          ? 'Partial'
          : 'Unpaid';
      return {
        id: toPbId(`bill_xlsx_${i}_${stallNo}`),
        stall_no: stallNo,
        owner_name: String(r['Owner'] || '').trim(),
        due_date: excelSerialToIsoDate(r['Due Date']),
        disconnection_date: excelSerialToIsoDate(r['Disconnection Date']),
        prev_reading: toNumber(r['Previous Reading'], 0),
        curr_reading: toNumber(r['Current Reading'], 0),
        consumption: toNumber(r['Consumption (kWh)'], 0),
        rate_per_kwh: toNumber(r['Rate/kWh'], 0),
        arrears: 0,
        bill_amount: toNumber(r['Total Bill'], 0),
        meter_reset: false,
        status,
        created_at: excelSerialToIsoTimestamp(r['Timestamp']),
      };
    })
    .filter(Boolean);
  const billErrs = await runPool(billPayloads, (p) => pb.collection('electric_bills').create(p, { requestKey: null }));
  console.log(`  Electric bills created: ${billPayloads.length} (errs: ${billErrs})`);

  // 5. cemetery_bookings (ALL 75 rows)
  const cemRows = sheet('cemetery_bookings');
  console.log(`\n[5/9] Importing ALL cemetery_bookings (${cemRows.length} rows)...`);
  await clearCollection(pb, 'cemetery_bookings');
  const cemPayloads = cemRows
    .map((r, i) => {
      const name = String(r['Name of the Deceased'] || '').trim();
      if (!name) return null;
      return {
        id: toPbId(`cem_xlsx_${i}_${name}`),
        deceased_name: name,
        address_barangay: String(r['Address'] || '').trim(),
        phone_number: formatPhPhone(r['Phone number']),
        burial_date: excelSerialToIsoDate(r['Date of Burial']),
        burial_time: '',
        burial_type: String(r['Burial Type'] || 'Ground').trim(),
        amount: toNumber(r['Amount'], 0),
        status: 'Scheduled',
        created_at: excelSerialToIsoTimestamp(r['Timestamp']),
      };
    })
    .filter(Boolean);
  const cemErrs = await runPool(cemPayloads, (p) => pb.collection('cemetery_bookings').create(p, { requestKey: null }));
  console.log(`  Cemetery bookings created: ${cemPayloads.length} (errs: ${cemErrs})`);

  // 6. toda_list (5) & toda_members (150)
  const todaRows = sheet('toda_list');
  const memRows = sheet('toda_members');
  console.log(`\n[6/9] Importing toda_list (${todaRows.length}) & toda_members (${memRows.length})...`);
  await clearCollection(pb, 'toda_members');
  await clearCollection(pb, 'todas');

  const todaIdByName = new Map();
  const todaPayloads = todaRows
    .map((r, i) => {
      const name = String(r['TODA Name'] || '').trim();
      if (!name) return null;
      const id = toPbId(`toda_xlsx_${i}_${name}`);
      todaIdByName.set(name.toLowerCase(), id);
      return {
        id,
        reg_no: String(r['Registration #'] || '').trim(),
        name,
        president: String(r['President'] || '').trim(),
        contact_no: formatPhPhone(r['Contact No.']),
        total_members: toNumber(r['Total Members'], 0),
        address: String(r['Address'] || '').trim(),
        created_at: excelSerialToIsoTimestamp(r['Timestamp']),
      };
    })
    .filter(Boolean);
  const todaErrs = await runPool(todaPayloads, (p) => pb.collection('todas').create(p, { requestKey: null }));

  const memPayloads = memRows
    .map((r, i) => {
      const todaName = String(r['TODA Name'] || '').trim();
      const last = String(r['Last Name'] || '').trim();
      const first = String(r['First Name'] || '').trim();
      if (!todaName || (!last && !first)) return null;
      const phone = formatPhPhone(r['Contact Number']);
      const exp = excelSerialToIsoDate(r['Expiration Date']);
      return {
        id: toPbId(`mem_xlsx_${i}_${last}_${first}`),
        toda_id: todaIdByName.get(todaName.toLowerCase()) || '',
        toda_name: todaName,
        last_name: last || '-',
        first_name: first || '-',
        middle_name: String(r['Middle Name'] || '').trim(),
        ext_name: String(r['Ext. Name'] || '').trim(),
        sex: String(r['Sex'] || '').trim().toLowerCase() === 'female' ? 'Female' : 'Male',
        barangay: String(r['Barangay'] || '').trim(),
        municipality: String(r['Municipality'] || 'Malungon').trim() || 'Malungon',
        contact_no: phone,
        contact_number: phone,
        id_type: String(r['Type of ID'] || '').trim(),
        id_number: String(r['ID Number'] || '').trim(),
        id_expiry: exp,
        created_at: excelSerialToIsoTimestamp(r['Timestamp']),
      };
    })
    .filter(Boolean);
  const memErrs = await runPool(memPayloads, (p) => pb.collection('toda_members').create(p, { requestKey: null }));
  console.log(`  TODAs created: ${todaPayloads.length} (errs: ${todaErrs}), Members created: ${memPayloads.length} (errs: ${memErrs})`);

  // 7. opif_data -> opif_indicators
  const opifRows = sheet('opif_data');
  console.log(`\n[7/9] Importing opif_data (${opifRows.length} rows)...`);
  await clearCollection(pb, 'opif_indicators');
  const opifPayloads = opifRows
    .map((r, idx) => {
      const secLetter = String(r['Section'] || 'A').trim().charAt(0).toUpperCase() || 'A';
      const hasContent = Boolean(
        String(r['Strategic Priority'] || '').trim() ||
        String(r['MFO'] || '').trim() ||
        String(r['PPA'] || '').trim()
      );
      if (!hasContent) return null;
      return {
        id: toPbId(r['ID'] || `opif_xlsx_${idx}`),
        section: secLetter,
        division: secLetter,
        col3: String(r['Strategic Priority'] || '').trim(),
        col4: String(r['MFO'] || '').trim(),
        col5: String(r['PPA'] || '').trim(),
        col6: String(r['MFO'] || r['PPA'] || '').trim(),
        col7: String(r['CDS Target'] ?? '').trim(),
        actual: String(r['Actual'] ?? '').trim(),
        semi: String(r['Semi Annual'] ?? '').trim(),
        q1t: String(r['Q1 T'] ?? '').trim(),
        q1a: String(r['Q1 A'] ?? '').trim(),
        q1p: String(r['Q1 %'] ?? '').trim(),
        q2t: String(r['Q2 T'] ?? '').trim(),
        q2a: String(r['Q2 A'] ?? '').trim(),
        q2p: String(r['Q2 %'] ?? '').trim(),
        q3t: String(r['Q3 T'] ?? '').trim(),
        q3a: String(r['Q3 A'] ?? '').trim(),
        q3p: String(r['Q3 %'] ?? '').trim(),
        q4t: String(r['Q4 T'] ?? '').trim(),
        q4a: String(r['Q4 A'] ?? '').trim(),
        q4p: String(r['Q4 %'] ?? '').trim(),
        major_output: String(r['MFO'] || '').trim(),
        indicator_code: String(r['PPA'] || '').trim(),
        indicator_name: String(r['MFO'] || '').trim(),
        annual_target: toNumber(r['CDS Target'], 0),
        q1_target: toNumber(r['Q1 T'], 0),
        q1_actual: toNumber(r['Q1 A'], 0),
        q2_target: toNumber(r['Q2 T'], 0),
        q2_actual: toNumber(r['Q2 A'], 0),
        q3_target: toNumber(r['Q3 T'], 0),
        q3_actual: toNumber(r['Q3 A'], 0),
        q4_target: toNumber(r['Q4 T'], 0),
        q4_actual: toNumber(r['Q4 A'], 0),
        year: 2025,
        sort_order: idx + 1,
        created_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);
  const opifErrs = await runPool(opifPayloads, (p) => pb.collection('opif_indicators').create(p, { requestKey: null }));
  console.log(`  OPIF indicators created: ${opifPayloads.length} (errs: ${opifErrs})`);

  // 8. csu_reports (191 rows -> csu_daily_reports)
  const csuRows = sheet('csu_reports');
  console.log(`\n[8/9] Importing ALL csu_reports (${csuRows.length} rows)...`);
  await clearCollection(pb, 'csu_daily_reports');
  const csuPayloads = csuRows.map((r, idx) => {
    let parsed = {};
    try {
      parsed = JSON.parse(r['Full JSON Data'] || '{}');
    } catch {
      parsed = {};
    }
    const tables = parsed.tables || {};
    const sigs = parsed.signatures || {};
    const texts = parsed.texts || {};
    const basic = parsed.basic || {};

    const reportDate = excelSerialToIsoDate(r['Date']) || basic.date || new Date().toISOString().slice(0, 10);

    const personnel_data = (Array.isArray(tables.personnel) ? tables.personnel : [])
      .filter((row) => Array.isArray(row) && (String(row[0] || '').trim() || String(row[1] || '').trim()))
      .map((row) => ({
        guard_id: String(row[0] || '').trim() || 'CSU',
        guard_name: String(row[1] || r['Prepared By'] || 'Guard on Duty').trim(),
        assigned_area: String(row[2] || r['Area Covered'] || 'Market').trim(),
        time_in: String(row[3] || '').trim() || '--',
        time_out: String(row[4] || '').trim() || '--',
        remarks: String(row[5] || '').trim(),
      }));

    const incident_data = (Array.isArray(tables.incident) ? tables.incident : [])
      .filter((row) => Array.isArray(row) && row.some((cell) => !isPlaceholderText(cell)))
      .map((row) => ({
        time: String(row[0] || '').trim() || '--',
        location: String(row[1] || 'Market Area').trim(),
        type: String(row[2] || 'Incident').trim(),
        description: String(row[2] || row[3] || '').trim(),
        immediate_action: String(row[3] || '').trim(),
        status: String(row[4] || row[3] || 'Logged').trim(),
      }));

    const violations_data = (Array.isArray(tables.violations) ? tables.violations : [])
      .filter((row) => Array.isArray(row) && row.some((cell) => !isPlaceholderText(cell)))
      .map((row) => ({
        identifier: String(row[0] || '').trim(),
        violation: String(row[1] || '').trim(),
        action_taken: String(row[2] || '').trim(),
        remarks: String(row[3] || '').trim(),
      }));

    const lost_found_data = (Array.isArray(tables.lostfound) ? tables.lostfound : [])
      .filter((row) => Array.isArray(row) && row.some((cell) => !isPlaceholderText(cell)))
      .map((row) => ({
        description: String(row[0] || '').trim(),
        location: String(row[1] || 'Market').trim(),
        found_by: String(row[2] || '').trim(),
        status: String(row[3] || 'Recorded').trim(),
      }));

    const prepName = String(r['Prepared By'] || sigs.prepName || 'Market Guard').trim();
    const verName = String(sigs.verName || '').trim();
    const appName = String(sigs.appName || '').trim();

    return {
      id: toPbId(`csu_xlsx_${idx}_${reportDate}_${prepName}`),
      report_date: reportDate,
      day_of_week: String(r['Day'] || basic.day || '').trim(),
      shift: String(r['Shift'] || basic.shift || '').trim(),
      team_leader: prepName,
      prep_name: prepName,
      prep_title: String(sigs.prepTitle || '').trim() || 'Guard on Duty / CSU',
      ver_name: verName,
      ver_title: String(sigs.verTitle || '').trim(),
      app_name: appName,
      app_title: String(sigs.appTitle || '').trim(),
      area_covered: String(r['Area Covered'] || basic.area || '').trim(),
      summary_activities: String(texts.summary || '').trim(),
      turnover_notes: String(texts.turnover || '').trim(),
      personnel_data,
      incident_data,
      violations_data,
      lost_found_data,
      is_locked: true,
      locked_at: excelSerialToIsoTimestamp(r['Timestamp']),
      created_at: excelSerialToIsoTimestamp(r['Timestamp']),
    };
  });
  const csuErrs = await runPool(csuPayloads, (p) => pb.collection('csu_daily_reports').create(p, { requestKey: null }));
  console.log(`  CSU blotters created: ${csuPayloads.length} (errs: ${csuErrs})`);

  // 9. Log (2979 rows -> audit_logs, idempotent upsert preserving recent app audit logs)
  const logRows = sheet('Log');
  console.log(`\n[9/9] Importing historical Log (${logRows.length} rows) into audit_logs...`);
  const existingLogs = new Set(
    (await pb.collection('audit_logs').getFullList({ fields: 'id', requestKey: null })).map((x) => x.id)
  );
  const newLogPayloads = logRows
    .map((r, i) => {
      const id = toPbId(`log_xlsx_${i}`);
      if (existingLogs.has(id)) return null;
      return {
        id,
        username: String(r['User'] || 'system').trim() || 'system',
        action: String(r['Action'] || 'SYSTEM_EVENT').trim() || 'SYSTEM_EVENT',
        details: String(r['Details'] || '').trim(),
        created_at: excelSerialToIsoTimestamp(r['Timestamp']),
      };
    })
    .filter(Boolean);

  const logErrs = await runPool(newLogPayloads, (p) => pb.collection('audit_logs').create(p, { requestKey: null }), 20);
  console.log(`  Audit logs added: ${newLogPayloads.length} (errs: ${logErrs})`);

  // Final Live Verification
  console.log('\n=== LIVE POCKETBASE COUNTS ===');
  const cols = [
    'profiles',
    'market_guards',
    'stalls',
    'stall_tenants',
    'monitoring_records',
    'electric_bills',
    'cemetery_bookings',
    'todas',
    'toda_members',
    'opif_indicators',
    'csu_daily_reports',
    'audit_logs',
  ];
  for (const c of cols) {
    const r = await pb.collection(c).getList(1, 1, { requestKey: null });
    console.log(`  ${c.padEnd(22)} : ${r.totalItems}`);
  }
}

main().catch((err) => {
  console.error('IMPORT FAILED:', err);
  process.exit(1);
});
