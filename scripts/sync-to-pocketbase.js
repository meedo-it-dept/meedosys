// =============================================================================
// MEEDOSys v2.0 - PocketBase Data Sync Script
// Replaces sync-to-supabase.js: Inserts municipal data directly into PocketBase
// =============================================================================

const fs = require('fs');
const PocketBase = require('pocketbase/cjs');

let url = process.env.POCKETBASE_LOCAL_URL || 'http://127.0.0.1:8090';
let adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || '';
let adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || '';
if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf8');
  env.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([^=#]+)\s*=\s*(.*)\s*$/);
    if (!m) return;
    const k = m[1].trim();
    const v = m[2].trim().replace(/^["']|["']$/g, '');
    if (k === 'NEXT_PUBLIC_POCKETBASE_URL' && v && !process.env.POCKETBASE_LOCAL_URL) url = v;
    if (k === 'POCKETBASE_ADMIN_EMAIL' && v && !adminEmail) adminEmail = v;
    if (k === 'POCKETBASE_ADMIN_PASSWORD' && v && !adminPassword) adminPassword = v;
  });
}

const pb = new PocketBase(url);
pb.autoCancellation(false);

async function syncAll() {
  if (!adminEmail || !adminPassword) {
    throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be configured.');
  }
  await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword).catch(() =>
    pb.admins.authWithPassword(adminEmail, adminPassword)
  );
  console.log(`--- SYNCING TO POCKETBASE (${url}) ---`);

  const {
    initialStalls,
    initialElectricBills,
    initialCemeteryBookings,
    initialTodas,
    initialTodaMembers,
  } = require('./import-lgu-excel-data.json');

  // 1. Sync Stalls
  console.log(`Syncing ${initialStalls.length} stalls...`);
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
      }
    } catch (e) {
      console.warn(`Stall ${s.stall_no} note:`, e.message);
    }
  }
  console.log('✓ Stalls synchronized.');

  // 2. Sync Stall Tenants
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
      } catch (e) {
        console.warn(`Tenant for ${s.stall_no} note:`, e.message);
      }
    }
  }
  console.log(`✓ ${tenantCount} Tenants synchronized.`);

  // 3. Sync Electric Bills
  console.log(`Syncing ${initialElectricBills.length} electric bills...`);
  for (const b of initialElectricBills) {
    try {
      await pb.collection('electric_bills').create({
        stall_no: b.stall_no,
        owner_name: b.owner_name || '',
        due_date: b.due_date,
        disconnection_date: b.disconnection_date,
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
    } catch {}
  }
  console.log('✓ Electric bills synchronized.');

  // 4. Sync TODAs
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
    } catch (e) {
      console.warn(`TODA ${t.reg_no} note:`, e.message);
    }
  }
  console.log('✓ TODAs synchronized.');

  // 5. Sync TODA Members
  console.log(`Syncing ${initialTodaMembers.length} TODA members...`);
  for (const m of initialTodaMembers) {
    try {
      await pb.collection('toda_members').create({
        toda_name: m.toda_name,
        last_name: m.last_name,
        first_name: m.first_name,
        middle_name: m.middle_name || '',
        sex: m.sex || 'Male',
        barangay: m.barangay || '',
        municipality: m.municipality || 'Malungon',
        contact_no: m.contact_number || '',
        id_type: m.id_type || 'Driver License',
        id_number: m.id_number || '',
        created_at: new Date().toISOString(),
      });
    } catch {}
  }
  console.log('✓ TODA members synchronized.');

  // 6. Sync Cemetery Bookings
  console.log(`Syncing ${initialCemeteryBookings.length} cemetery bookings...`);
  for (const c of initialCemeteryBookings) {
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
    } catch {}
  }
  console.log('✓ Cemetery bookings synchronized.');

  console.log('--- POCKETBASE SYNC COMPLETE ---');
}

syncAll().catch(console.error);
