// =============================================================================
// Live Supabase Sync Script
// Inserts data from lib/supabase/mockData.ts directly into Supabase tables
// =============================================================================

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach((line) => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

if (!url || !key) {
  console.error('Supabase URL or Key missing in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function syncAll() {
  console.log('--- SYNCING TO SUPABASE ---');

  // Load parsed data
  const {
    initialStalls,
    initialElectricBills,
    initialCemeteryBookings,
    initialTodas,
    initialTodaMembers,
    initialCsuReports,
    initialOpifIndicators,
    initialUsers,
  } = require('./import-lgu-excel-data.json');

  // 1. Sync Stalls
  console.log(`Syncing ${initialStalls.length} stalls...`);
  const stallsPayload = initialStalls.map((s) => ({
    stall_no: s.stall_no,
    zone: s.zone,
    status: s.status,
  }));
  for (let i = 0; i < stallsPayload.length; i += 50) {
    const chunk = stallsPayload.slice(i, i + 50);
    const { error } = await supabase.from('stalls').upsert(chunk, { onConflict: 'stall_no' });
    if (error) console.warn('Stall chunk warning:', error.message);
  }
  console.log('✓ Stalls synchronized.');

  // 2. Sync Stall Tenants
  console.log('Syncing stall tenants...');
  const tenantsPayload = [];
  initialStalls.forEach((s) => {
    if (s.current_tenant) {
      tenantsPayload.push({
        stall_no: s.current_tenant.stall_no,
        stall_owner: s.current_tenant.stall_owner,
        operator: s.current_tenant.operator,
        line_of_business: s.current_tenant.line_of_business,
        period_index: s.current_tenant.period_index,
        year: s.current_tenant.year,
        compliance_status: s.current_tenant.compliance_status,
        additional_info: s.current_tenant.additional_info,
        is_current: true,
      });
    }
  });

  for (let i = 0; i < tenantsPayload.length; i += 50) {
    const chunk = tenantsPayload.slice(i, i + 50);
    const { error } = await supabase.from('stall_tenants').insert(chunk);
    if (error) console.warn('Tenant chunk warning:', error.message);
  }
  console.log(`✓ ${tenantsPayload.length} Tenants synchronized.`);

  // 3. Sync Electric Bills
  console.log(`Syncing ${initialElectricBills.length} electric bills...`);
  for (let i = 0; i < initialElectricBills.length; i += 50) {
    const chunk = initialElectricBills.slice(i, i + 50).map((b) => ({
      stall_no: b.stall_no,
      owner_name: b.owner_name,
      due_date: b.due_date,
      disconnection_date: b.disconnection_date,
      prev_reading: b.prev_reading,
      curr_reading: b.curr_reading,
      rate_per_kwh: b.rate_per_kwh,
      arrears: b.arrears || 0,
      bill_amount: b.bill_amount,
      meter_reset: false,
      status: b.status,
    }));
    const { error } = await supabase.from('electric_bills').insert(chunk);
    if (error) {
      // ignore duplicates if any
      console.warn('Bill chunk note:', error.message);
    }
  }
  console.log('✓ Electric bills synchronized.');

  // 4. Sync TODAs
  console.log(`Syncing ${initialTodas.length} TODAs...`);
  for (const t of initialTodas) {
    const { error } = await supabase.from('todas').upsert(
      {
        reg_no: t.reg_no,
        name: t.name,
        president: t.president,
        contact_no: t.contact_no,
        total_members: t.total_members,
        address: t.address,
      },
      { onConflict: 'reg_no' }
    );
    if (error) console.warn('TODA note:', error.message);
  }
  console.log('✓ TODAs synchronized.');

  // 5. Sync TODA Members
  console.log(`Syncing ${initialTodaMembers.length} TODA members...`);
  for (let i = 0; i < initialTodaMembers.length; i += 50) {
    const chunk = initialTodaMembers.slice(i, i + 50).map((m) => ({
      toda_name: m.toda_name,
      last_name: m.last_name,
      first_name: m.first_name,
      middle_name: m.middle_name,
      sex: m.sex,
      barangay: m.barangay,
      municipality: m.municipality,
      contact_no: m.contact_number,
      id_type: m.id_type,
      id_number: m.id_number,
    }));
    const { error } = await supabase.from('toda_members').insert(chunk);
    if (error) console.warn('TODA member chunk note:', error.message);
  }
  console.log('✓ TODA members synchronized.');

  // 6. Sync Cemetery Bookings
  console.log(`Syncing ${initialCemeteryBookings.length} cemetery bookings...`);
  for (let i = 0; i < initialCemeteryBookings.length; i += 50) {
    const chunk = initialCemeteryBookings.slice(i, i + 50).map((c) => ({
      deceased_name: c.deceased_name,
      address_barangay: c.address_barangay,
      phone_number: c.phone_number,
      burial_date: c.burial_date,
      burial_time: '14:00',
      burial_type: c.burial_type,
      amount: c.amount,
    }));
    const { error } = await supabase.from('cemetery_bookings').insert(chunk);
    if (error) console.warn('Cemetery chunk note:', error.message);
  }
  console.log('✓ Cemetery bookings synchronized.');

  console.log('--- SUPABASE SYNC COMPLETE ---');
}

syncAll().catch(console.error);
