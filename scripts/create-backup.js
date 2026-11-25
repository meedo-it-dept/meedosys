// =============================================================================
// MEEDOSys v2.0 - On-Demand Database Backup Script
// Generates a complete timestamped .zip snapshot of the PocketBase database
// =============================================================================

const fs = require('fs');
const path = require('path');
const PocketBase = require('pocketbase/cjs');

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  const vars = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([^=#]+)\s*=\s*(.*)\s*$/);
      if (m) vars[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return vars;
}

async function createBackup() {
  const localEnv = loadEnvLocal();
  const pbUrl = process.env.POCKETBASE_URL || localEnv.POCKETBASE_LOCAL_URL || 'http://127.0.0.1:8090';
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || localEnv.POCKETBASE_ADMIN_EMAIL;
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || localEnv.POCKETBASE_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in environment or .env.local.');
  }

  const pb = new PocketBase(pbUrl);
  pb.autoCancellation(false);

  console.log(`Connecting to PocketBase at ${pbUrl}...`);
  try {
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
  } catch (e) {
    await pb.admins.authWithPassword(adminEmail, adminPassword);
  }

  console.log(`Generating database snapshot...`);
  await pb.backups.create('');

  const list = await pb.backups.getFullList();
  list.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
  const latest = list[0];

  console.log(`\n=============================================================`);
  console.log(`✓ BACKUP CREATED SUCCESSFULLY!`);
  console.log(`  File:     pocketbase/pb_data/backups/${latest?.key}`);
  console.log(`  Size:     ${((latest?.size || 0) / 1024).toFixed(1)} KB`);
  console.log(`  Created:  ${latest?.modified}`);
  console.log(`=============================================================\n`);
}

createBackup().catch((err) => {
  console.error('❌ Backup failed:', err.message || err);
  process.exit(1);
});
