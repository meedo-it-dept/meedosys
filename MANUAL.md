# 📖 MEEDOSys v2.0 — Operator & User Manual
**Municipal Economic Enterprise Development Office (MEEDO)**  
*Municipality of Malungon, Province of Sarangani, Philippines*

---

## 🏛️ System Overview

MEEDOSys v2.0 is the official management and operational platform for the Municipal Economic Enterprise Development Office of Malungon.

The platform uses a **Hybrid Edge Architecture**:
1. **Frontend Web App (Cloud):** Hosted 24/7 on Google Firebase at **[https://meedosystem.web.app](https://meedosystem.web.app)**.
2. **Municipal Database (Local / On-Premises):** Powered by **PocketBase v0.23+** running locally on municipal hardware (`pb_data/data.db`).
3. **Secure Tunnel (Gateway):** Encrypted HTTPS connection via **Ngrok** (`https://unkind-staff-glancing.ngrok-free.dev`) bridging the web application to the local database.

---

## 🚀 Daily Operations (Quick 1-Click Guide)

### 1. How to Start the System
Whenever you turn on the computer or start your shift:
1. Open the project folder: `D:\IBM-Latin\market`
2. Double-click **`start-backend.bat`**
3. A green command window will open. It will:
   - Check if PocketBase is running (or start it on port 8090).
   - Connect to the permanent secure domain (`unkind-staff-glancing.ngrok-free.dev`).
4. **Keep this command window open or minimized while the office is working.**
5. Open your browser to: **[https://meedosystem.web.app](https://meedosystem.web.app)**
   - The status badge in the sidebar will show **"PB Live" (Green)**.

---

### 2. How to Stop the System
At the end of the day or before shutting down:
1. Double-click **`stop-backend.bat`**
2. It will cleanly terminate PocketBase and the tunnel, ensuring all SQLite database transactions are saved.

---

## 👥 User Access & Login

### 1. Accessing the Web Application
Open in any modern browser (Chrome, Edge, Firefox, Safari on PC, tablet, or phone):  
👉 **[https://meedosystem.web.app](https://meedosystem.web.app)**

### 2. Administrator Access
* **Username / Email:** `admin` (linked to the Administrator's Firebase Google/Email sign-in)
* **Authentication:** Managed via Firebase Authentication (password sign-in in PocketBase is disabled)
* **Role:** Municipal Administrator
* **Access Level:** Unrestricted access across all 6 municipal enterprise sections and user approvals.

### 3. Registering New Staff Accounts
1. Direct new staff to: **[https://meedosystem.web.app/register](https://meedosystem.web.app/register)**
2. They sign in with Google or Email via Firebase, then input their desired username, full name, and section (Market, Slaughterhouse, Cemetery, Terminal, CSU).
3. The Administrator opens **Admin > User Approvals** (`/admin/users`) and clicks **"Approve"**.

---

## 🗄️ Database Management (PocketBase Admin Dashboard)

For system administrators who need to inspect raw tables, export data, or configure settings:

1. **Dashboard URL:**
   * On this computer: **[http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/)**
   * Remotely over the internet: **`https://unkind-staff-glancing.ngrok-free.dev/_/`**
2. **Superuser Credentials:**
   * **Email:** `admin@meedosys.local`
   * **Password:** Stored securely in `.env.local` (`POCKETBASE_ADMIN_PASSWORD`) on the host PC — never commit or share this value.

### What you can do in the Admin Dashboard:
* View and edit all **17 collections** (`stalls`, `stall_tenants`, `electric_bills`, `slaughter_records`, `cemetery_bookings`, `todas`, `inventory_items`, etc.).
* Search and filter records using SQL-like expressions.
* Export collections to JSON or CSV.
* Monitor real-time API logs and requests.

---

## 💾 Backups & Disaster Recovery

Your system has 3 layers of data protection:

### 1. Automatic Daily Backups (Scheduled)
* PocketBase automatically creates a full `.zip` snapshot every day at **midnight** (`0 0 * * *`).
* The system automatically keeps the **last 30 daily backups** (1 rolling month of history).
* Backups are stored in: `D:\IBM-Latin\market\pocketbase\pb_data\backups\`

### 2. On-Demand 1-Click Backup (`backup-now.bat`)
Before performing large data updates or audits:
1. Double-click **`backup-now.bat`** in `D:\IBM-Latin\market`.
2. A timestamped backup file will be created in under 2 seconds.

### 3. How to Download or Restore a Backup
1. Go to **[http://127.0.0.1:8090/_/#/settings/backups](http://127.0.0.1:8090/_/#/settings/backups)**
2. Click the three dots `...` next to any backup file:
   * Click **Download** to save a copy to an external flash drive or municipal cloud.
   * Click **Restore** to immediately roll the database back to that exact point in time.

### 4. Physical Flash Drive Backup (Cold Storage)
Because the entire database is self-contained in one file:
* Plug in a USB flash drive.
* Copy the folder **`D:\IBM-Latin\market\pocketbase\pb_data`** to your flash drive.
* That's it! Your entire municipal database is safely backed up.

---

## 🖥️ Moving the Database to an Office Desktop / Server

If you want to keep the database running 24/7 on a dedicated office desktop instead of your personal laptop:

1. Insert a USB flash drive into your laptop.
2. Copy these items from `D:\IBM-Latin\market`:
   * The **`pocketbase\`** folder (contains `pocketbase.exe` and `pb_data\`)
   * **`start-backend.bat`**
   * **`stop-backend.bat`**
   * **`backup-now.bat`**
3. Paste them onto the target office PC (e.g. `C:\MEEDOSys` or `D:\MEEDOSys`).
4. On the office PC, double-click **`start-backend.bat`**.
5. **Done!** The office desktop is now your active municipal database server.
6. The frontend at **[https://meedosystem.web.app](https://meedosystem.web.app)** will immediately connect to the office desktop without needing any code changes!

---

## ❓ Frequently Asked Questions & Troubleshooting

### Q1: The web app says "Offline" or the badge isn't green.
* **Fix:** Check if `start-backend.bat` is running on your database computer. If the window was accidentally closed, simply double-click `start-backend.bat` again.

### Q2: What if our office internet goes down?
* **Answer:** MEEDOSys v2.0 includes an offline cache (`localStorage`). Staff can continue recording data and printing receipts. When the internet connection returns, records sync back with the database.

### Q3: What if we move to a different Wi-Fi or use a mobile hotspot?
* **Answer:** Ngrok handles dynamic IP changes automatically. Whether you are connected to PLDT, Starlink, or a mobile hotspot, the permanent domain `unkind-staff-glancing.ngrok-free.dev` never changes.

### Q4: Can multiple staff access the system at the same time?
* **Answer:** Yes! Any number of staff can open `https://meedosystem.web.app` on their own computers or mobile devices simultaneously.

---

*Document Version: 2.0.0*  
*Maintained by: Municipal Economic Enterprise Development Office (MEEDO)*  
*Municipality of Malungon, Sarangani*
