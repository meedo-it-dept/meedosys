# MEEDOSys v2.0 — Municipal Economic Enterprise Development Office
**Municipality of Malungon, Province of Sarangani, Philippines**

> 📖 **Looking for the User & Operator Manual?**  
> Read the complete operational guide in [MANUAL.md](./MANUAL.md) for 1-click startup, logins, backups, and office server deployment.

MEEDOSys v2.0 is a modern fullstack municipal management platform converted from Google Apps Script to **Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React, and PocketBase (SQLite + Realtime SSE)**, engineered for high-speed local government unit (LGU) edge deployment, intranet servers, and cloud hosts.

---

## 🏛️ Enterprise Modules

| Module | Division | Core Capabilities |
| :--- | :--- | :--- |
| **Section A: Market Layout & Tenancy** | Public Market | Interactive 4-zone stall map (Wet, Dry, Old, Triangular), digital lease & permit archiving |
| **Section A: Utility Electric Billing** | Public Market | Single & high-speed batch meter reading, arrears calculation, two-way sync with stall accounts |
| **Section A: Monthly Monitoring** | Public Market | DILG/LGU sanitation compliance (CLAYGO, CCTV, Paleng-QR Ph), acknowledgement receipts |
| **Section B: Slaughterhouse** | Slaughterhouse | Livestock intake (Hogs, Cattle, Goats, Poultry), client autocomplete, ante/post-mortem fees, accredited butchers |
| **Section C: Cemetery Management** | Cemetery | Burial plot booking scheduler, Google Calendar notifications, demographic reports by Barangay |
| **Section D: Transport Terminal** | Transport Terminal | Registered TODA directory, driver member profiles, GAD gender demographic intelligence |
| **Section E: Executive OPIF** | Governance | DBM/LGU quarterly target vs. accomplishment tracking across all 5 divisions with database persistence |
| **Section F: Peace & Order Desk** | Civil Security Unit | 8-part digital guard blotter, incident desk, offline `localStorage` draft saving, print layout |
| **Inventory & Supplies** | General Services | Municipal supply ledger, stock in/out adjustments, low-threshold alerts |
| **Admin Portal** | System Admin | Staff accounts lifecycle (Pending, Approved, Blocked), section role assignment (RBAC) |

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> The application includes a pre-seeded local municipal mock dataset with offline `localStorage` fallback. It is **100% functional and interactive immediately** even before starting the PocketBase backend.

---

## ⚡ Connecting to PocketBase Backend (Zero-Cloud / Local Edge)

PocketBase provides a single-binary backend with embedded SQLite, Realtime Server-Sent Events (SSE), built-in file storage, and an Admin UI.

### Step 1: Download PocketBase
On Windows, you can automatically download the official binary using the included script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/download-pocketbase.ps1
```
Or download the binary for your platform directly from [pocketbase.io](https://pocketbase.io/docs/).

### Step 2: Start PocketBase
Open a terminal in the `pocketbase` directory:
```bash
cd pocketbase
./pocketbase serve --http="0.0.0.0:8090"
```
The PocketBase server is now running at `http://127.0.0.1:8090` and the Admin UI at `http://127.0.0.1:8090/_/`.

### Step 3: Initialize Collections & Seed Municipal Data
Run the automated turnkey setup script:
```bash
node scripts/init-pocketbase.js
```
This script automatically:
1. Connects to your running PocketBase instance.
2. Imports all 17 municipal collections from [`pocketbase/pb_schema.json`](./pocketbase/pb_schema.json).
3. Seeds stalls, tenants, electric bills, TODA drivers, cemetery bookings, and administrator credentials.

### Step 4: Configure Environment Variables
Verify `.env.local` in the project root:
```env
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=admin@meedosys.local
POCKETBASE_ADMIN_PASSWORD=<set-a-strong-password>
```

Once running, the status badge in the sidebar will reflect **"PB Live"** with full real-time data synchronization.

---

## 🗄️ Collections Schema (PocketBase)

All 17 collections are declaratively defined in [`pocketbase/pb_schema.json`](./pocketbase/pb_schema.json):

1. `profiles` — System staff, guard profiles, RBAC roles (`Admin`, `Staff`), and section access.
2. `stalls` — Market stalls registry with zone mapping (`wet`, `dry`, `old`, `triangular`).
3. `stall_tenants` — Current and historical tenant records, permits, and compliance.
4. `monitoring_records` — Monthly sanitation & compliance inspections (CLAYGO, CCTV, Paleng-QR).
5. `electric_bills` — Power meter reading ledger, consumption formulas, and billing history.
6. `slaughter_records` — Meat inspection reports, livestock intake, and slaughterhouse receipts.
7. `cemetery_bookings` — Burial schedules, niche assignments, and payment statuses.
8. `todas` — Tricycle Operators and Drivers Associations registry.
9. `toda_members` — Driver directory and demographic data.
10. `opif_indicators` — Organizational Performance Indicator Framework quarterly metrics.
11. `csu_daily_reports` — Civil Security Unit daily blotters, patrols, and incident logs.
12. `inventory_items` — Municipal supplies and consumables inventory catalog.
13. `inventory_transactions` — Supply ledger transactions (Stock In, Release, Adjustment).
14. `butchers` — Accredited municipal slaughterhouse butchers registry.
15. `audit_logs` — System-wide security, user management, and transaction audit trails.
16. `market_guards` — Security guard roster, radio call signs, and shifts.
17. `market_calendar_events` — Operations schedule, guard shifts, and inspections.

---

## 📦 Building for Production & Export
```bash
npm run build
```
The output is written to `out/` for static hosting, Nginx, or embedding directly alongside PocketBase.

---

## 🏛️ Legacy Files Preservation
The original Google Apps Script and HTML files are safely preserved in the [`legacy/`](./legacy/) directory.
