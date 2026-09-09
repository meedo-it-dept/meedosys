# MEEDOSys v2.0 — Municipal Economic Enterprise Development Office
**Municipality of Malungon, Province of Sarangani, Philippines**

MEEDOSys v2.0 is a modern fullstack municipal management platform converted from Google Apps Script to **Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React, and Supabase (PostgreSQL)**, designed for zero-downtime deployment on **Vercel** with source control on **GitHub**.

---

## 🏛️ Enterprise Modules

| Module | Division | Core Capabilities |
| :--- | :--- | :--- |
| **Section A: Market Layout & Tenancy** | Public Market | Interactive 4-zone stall map (Wet, Dry, Old, Triangular), digital lease & permit archiving |
| **Section A: Utility Electric Billing** | Public Market | Single & high-speed batch meter reading, arrears calculation, two-way sync with stall accounts |
| **Section A: Monthly Monitoring** | Public Market | DILG/LGU sanitation compliance (CLAYGO, CCTV, Paleng-QR Ph), acknowledgement receipts |
| **Section B: Slaughterhouse** | Slaughterhouse | Livestock intake (Hogs, Cattle, Goats, Poultry), client autocomplete, ante/post-mortem fees |
| **Section C: Cemetery Management** | Cemetery | Burial plot booking scheduler, Google Calendar notifications, demographic reports by Barangay |
| **Section D: Transport Terminal** | Transport Terminal | Registered TODA directory, driver member profiles, GAD gender demographic intelligence |
| **Section E: Executive OPIF** | Governance | DBM/LGU quarterly target vs. accomplishment tracking across all 5 divisions with database persistence |
| **Section F: Peace & Order Desk** | Civil Security Unit | 8-part digital guard blotter, incident desk, offline `localStorage` draft saving, print layout |
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
> The application includes a pre-seeded local municipal mock dataset. It is **100% functional and interactive immediately** even without connecting a live Supabase database.

---

## ⚡ Connecting to Live Supabase (PostgreSQL + Auth)

1. Create a free project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the entire contents of [`supabase/migrations/20260909000000_init_meedosys.sql`](./supabase/migrations/20260909000000_init_meedosys.sql) and execute it.
4. In your Supabase Project Settings, copy your **Project URL** and **anon public key**.
5. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
6. Restart your Next.js server (`npm run dev`). The status badge in the sidebar will switch to **"Supabase Live"**.

---

## 📦 Deploying to GitHub & Vercel

### Step 1: Initialize Git Repository
```bash
git init
git add .
git commit -m "feat: Initial commit of MEEDOSys v2.0 (Next.js, TypeScript, Supabase)"
```

### Step 2: Push to GitHub
Create a new repository on your GitHub account, then run:
```bash
git remote add origin https://github.com/your-username/meedo-market.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Select your `meedo-market` GitHub repository.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will automatically build and assign a global CDN URL with automatic SSL. Every future `git push` will deploy automatically!

---

## 🗄️ Legacy Files Preservation
The original Google Apps Script and HTML files are safely preserved in the [`legacy/`](./legacy/) directory:
- `legacy/market.gs`
- `legacy/Index.html`
- `legacy/map_css.html`
- `legacy/map_js.html`
- `legacy/presentation.html`
