/**
 * Serves the HTML file for the web app.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('MEEDOSys v2.0.0.1')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// --- CONSTANTS ---
const SHEET_ID = '17bQlBJzo0dpj9teK1t7Ycw697Edc_nTCO_0Hl468fjc';
const USER_SHEET_NAME = 'market-user';
const LOG_SHEET_NAME = 'Log'; 

// --- LOGGING HELPER FUNCTION ---
function logSystemEvent(username, action, details) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (sheet) {
      sheet.appendRow([new Date(), username, action, details]);
    }
  } catch (e) {
    console.log("Logging failed: " + e.message);
  }
}

// --- AUTHENTICATION & USER MANAGEMENT ---

function checkLogin(username, password) {
  let ss;
  try { ss = SpreadsheetApp.openById(SHEET_ID); } catch (e) { return { success: false, message: "Database Error" }; }
  
  const sheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!sheet) return { success: false, message: "User table not found" };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === username && data[i][2] === password) {
      if (data[i][4] !== 'Approved') return { success: false, message: "Account is pending or blocked" };
      
      logSystemEvent(username, "Login", "User logged in successfully");
      
      // RETURN THE SECTION DATA TO THE FRONTEND
      return { 
        success: true, 
        username: username, 
        role: data[i][3], 
        section: data[i][5] || 'A' // Returns the section, defaults to A if it's an old account
      };
    }
  }

  logSystemEvent(username, "Login Failed", "Invalid credentials");
  return { success: false, message: "Invalid username or password" };
}

function registerUser(username, password, section) {
  let ss;
  try { ss = SpreadsheetApp.openById(SHEET_ID); } catch (e) { return { success: false, message: "Database Error" }; }
  
  const sheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!sheet) return { success: false, message: "User table not found" };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === username) return { success: false, message: "Username already exists" };
  }

  // ADD THE SECTION TO THE END OF THE ROW
  sheet.appendRow([new Date(), username, password, 'Staff', 'Pending', section]);
  
  logSystemEvent(username, "Register", `New user registered for Section ${section}`);
  return { success: true };
}

function logClientEvent(username, action, details) { logSystemEvent(username, action, details); }

function getAllUsers() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(USER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const users = [];
  
  for (let i = 1; i < data.length; i++) {
    // Index 1 = User, Index 3 = Role, Index 4 = Status
    if (data[i][1]) { // Check if username exists (skips completely blank rows)
      users.push({ 
        username: String(data[i][1]), 
        role: String(data[i][3]), 
        status: String(data[i][4]), 
        rowIndex: i + 1 
      });
    }
  }
  return users;
}

function updateUserStatus(username, action) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(USER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  let foundRow = -1;
  
  for (let i = 1; i < data.length; i++) { 
    if (String(data[i][1]) === String(username)) { // Fix: Search Index 1 (Username) instead of 0
      foundRow = i + 1; 
      break; 
    } 
  }
  
  if (foundRow === -1) return { success: false, message: 'User not found' };
  
  if (action === 'delete') { 
    sheet.deleteRow(foundRow); 
    logSystemEvent('Admin', 'User Management', `Deleted user: ${username}`); 
  }
  else if (action === 'approve') { 
    sheet.getRange(foundRow, 5).setValue('Approved'); // Fix: Update Column 5 (Status) instead of 4
    logSystemEvent('Admin', 'User Management', `Approved user: ${username}`); 
  }
  else if (action === 'block') { 
    sheet.getRange(foundRow, 5).setValue('Blocked'); // Fix: Update Column 5 (Status) instead of 4
    logSystemEvent('Admin', 'User Management', `Blocked user: ${username}`); 
  }
  return { success: true };
}

// --- DATA FETCHING ---

function getSheetData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('stall_data') || ss.getSheets()[0]; 
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return { headers: [], data: [], monitoringHistory: [], latestReadings: {}, electricBills: [] };

  const headers = data[0].map(h => String(h || '')); 
  const rows = data.slice(1);
  let tz = "Asia/Manila"; 
  try { const sheetTz = ss.getSpreadsheetTimeZone(); if (sheetTz && typeof sheetTz === 'string') tz = sheetTz; } catch(e) {}
  
  const safeValue = (val, isYear = false, isTimestamp = false) => {
      if (val instanceof Date) {
          if (isYear) return String(val.getFullYear());
          if (isTimestamp) return Utilities.formatDate(val, tz, "yyyy-MM-dd HH:mm:ss");
          return Utilities.formatDate(val, tz, "yyyy-MM-dd");
      }
      return (val === null || val === undefined) ? '' : String(val);
  };

  const formattedData = rows.map((row, i) => {
    let obj = { _rowIndex: i + 2 }; 
    // Fix: Ensure headers is a valid array before calling forEach to prevent the null error
    if (Array.isArray(headers)) {
      headers.forEach((header, index) => {
        let value = row[index];
        let isYear = header.trim().toLowerCase() === 'year';
        obj[header] = safeValue(value, isYear);
      });
    }
    return obj;
  });

  let monHistory = [];
  try {
      const histSheet = ss.getSheetByName('monitoring_history');
      if (histSheet && histSheet.getLastRow() > 1) {
          const hData = histSheet.getDataRange().getValues();
          for(let i=1; i<hData.length; i++) {
              monHistory.push({
                  timestamp: safeValue(hData[i][0], false, true), stallNo: safeValue(hData[i][1]), owner: safeValue(hData[i][2]),
                  date: safeValue(hData[i][3]), goodwill: safeValue(hData[i][4]), status: safeValue(hData[i][5]),
                  permit: safeValue(hData[i][6]), lease: safeValue(hData[i][7]), rental: safeValue(hData[i][8]),
                  seminars: safeValue(hData[i][9]), claygo: safeValue(hData[i][10]), cctv: safeValue(hData[i][11]),
                  palengqr: safeValue(hData[i][12]), eBillAmount: safeValue(hData[i][13]), eBillStatus: safeValue(hData[i][14]), eBillDate: safeValue(hData[i][15])
              });
          }
      }
  } catch(e) {}

  let latestReadings = {};
  let electricBills = [];
  try {
      const billSheet = ss.getSheetByName('electric_bills');
      if(billSheet && billSheet.getLastRow() > 1) {
          const bData = billSheet.getDataRange().getValues();
          for(let i=1; i<bData.length; i++) {
             const stall = String(bData[i][1]);
             const currReading = parseFloat(bData[i][4]);
             if(!isNaN(currReading)) latestReadings[stall] = currReading; 
             
             let dDate = safeValue(bData[i][8]); if (typeof dDate === 'string' && dDate.length > 10) dDate = dDate.substring(0, 10);
             let discDate = safeValue(bData[i][9]); if (typeof discDate === 'string' && discDate.length > 10) discDate = discDate.substring(0, 10);

             electricBills.push({
              stallNo: stall, owner: String(bData[i][2]), previous: parseFloat(bData[i][3]) || 0, current: currReading || 0,
              consumption: parseFloat(bData[i][5]) || 0, rate: parseFloat(bData[i][6]) || 0, bill: parseFloat(bData[i][7]) || 0,
              dueDate: dDate, discDate: discDate, status: String(bData[i][10]) || 'Unpaid'
          });
          }
      }
  } catch(e) {}

  let slaughterData = [];
  try {
      const shSheet = ss.getSheetByName('slaughter_logs');
      if (shSheet && shSheet.getLastRow() > 1) {
          const shData = shSheet.getDataRange().getValues();
          const headers = shData[0].map(h => String(h).trim().toLowerCase());
          const getCol = (names, fallbackIdx) => {
              for (let n of names) {
                  const idx = headers.indexOf(n.toLowerCase());
                  if (idx !== -1) return idx;
              }
              return fallbackIdx;
          };
          const tsIdx = getCol(['Timestamp'], 0);
          const idIdx = getCol(['ClientID', 'Client ID', 'Client_ID'], 1);
          const nameIdx = getCol(['Name of Client', 'Client Name', 'Client'], 2);
          const addrIdx = getCol(['Address', 'Client Address'], -1);
          const contactIdx = getCol(['Contact No.', 'Contact', 'Contact Number', 'Phone'], 3);
          const orIdx = getCol(['OR #', 'OR Number', 'OR'], 4);
          const statusIdx = getCol(['Status'], 5);
          const typeIdx = getCol(['Livestock', 'Livestock Type', 'Type'], 6);
          const headIdx = getCol(['No. of Livestock', 'Head Count', 'Heads', 'No of Heads'], 7);
          const kiloIdx = getCol(['Weight (kg)', 'Weight', 'Kilos', 'Kilo'], -1);
          const amountIdx = getCol(['Amount', 'Amount (₱)'], 8);
          const butcherIdx = getCol(['Butcher', 'Butcher Name', 'Assigned Butcher'], -1);

          for(let i=1; i<shData.length; i++) {
              const rowTs = safeValue(shData[i][tsIdx], false, true);
              slaughterData.push({
                  id: 'sh_' + (i + 1) + '_' + (rowTs ? String(rowTs).replace(/[^a-zA-Z0-9]/g, '') : i),
                  rowIndex: i + 1,
                  timestamp: rowTs,
                  clientId: String(shData[i][idIdx] || ''),
                  clientName: String(shData[i][nameIdx] || ''),
                  address: addrIdx !== -1 ? String(shData[i][addrIdx] || '') : '',
                  contact: String(shData[i][contactIdx] || ''),
                  orNumber: String(shData[i][orIdx] || ''),
                  status: String(shData[i][statusIdx] || 'Private'),
                  livestockType: String(shData[i][typeIdx] || ''),
                  headCount: parseFloat(shData[i][headIdx]) || 0,
                  kilos: kiloIdx !== -1 ? (parseFloat(shData[i][kiloIdx]) || 0) : 0,
                  amount: parseFloat(shData[i][amountIdx]) || 0,
                  butcher: butcherIdx !== -1 ? String(shData[i][butcherIdx] || '') : ''
              });
          }
      }
  } catch(e) {}

  let todaData = [];
  try {
      const tdSheet = ss.getSheetByName('toda_list');
      if (tdSheet && tdSheet.getLastRow() > 1) {
          const tdVals = tdSheet.getDataRange().getValues();
          for(let i=1; i<tdVals.length; i++) {
              const rowId = safeValue(tdVals[i][0], false, true) || ('toda_' + i);
              todaData.push({
                  id: rowId,
                  rowIndex: i + 1,
                  regNo: String(tdVals[i][1]||''), name: String(tdVals[i][2]||''), president: String(tdVals[i][3]||''),
                  contact: String(tdVals[i][4]||''), membersCount: String(tdVals[i][5]||''), address: String(tdVals[i][6]||'')
              });
          }
      }
  } catch(e) {}

  let memberData = [];
  try {
      const memSheet = ss.getSheetByName('toda_members');
      if (memSheet && memSheet.getLastRow() > 1) {
          const memVals = memSheet.getDataRange().getValues();
          for(let i=1; i<memVals.length; i++) {
              const rowId = safeValue(memVals[i][0], false, true) || ('mem_' + i);
              memberData.push({
                  id: rowId,
                  rowIndex: i + 1,
                  todaName: String(memVals[i][1]||''), lastName: String(memVals[i][2]||''), firstName: String(memVals[i][3]||''),
                  middleName: String(memVals[i][4]||''), extName: String(memVals[i][5]||''), sex: String(memVals[i][6]||''),
                  barangay: String(memVals[i][7]||''), municipality: String(memVals[i][8]||''), contact: String(memVals[i][9]||''),
                  idType: String(memVals[i][10]||''), idNumber: String(memVals[i][11]||''), idExpiry: safeValue(memVals[i][12])
              });
          }
      }
  } catch(e) {}

  let cemeteryData = [];
  try {
      const cemSheet = ss.getSheetByName('cemetery_bookings');
      if (cemSheet && cemSheet.getLastRow() > 1) {
          const cemVals = cemSheet.getDataRange().getValues();
          for(let i=1; i<cemVals.length; i++) {
              cemeteryData.push({
                  id: safeValue(cemVals[i][0], false, true), // Captures Timestamp as the unique ID
                  deceasedName: String(cemVals[i][1]||''), address: String(cemVals[i][2]||''),
                  phone: String(cemVals[i][3]||''), burialDate: safeValue(cemVals[i][4]),
                  burialType: String(cemVals[i][5]||''), amount: parseFloat(cemVals[i][6]) || 0
              });
          }
      }
  } catch(e) {}

  let csuData = [];
  try {
      const csuSheet = ss.getSheetByName('csu_reports');
      if (csuSheet && csuSheet.getLastRow() > 1) {
          const cVals = csuSheet.getDataRange().getValues();
          for(let i=1; i<cVals.length; i++) {
              csuData.push({
                  timestamp: safeValue(cVals[i][0], false, true),
                  date: safeValue(cVals[i][1]),
                  shift: String(cVals[i][3]||''),
                  prepName: String(cVals[i][5]||''),
                  jsonData: String(cVals[i][6]||'')
              });
          }
      }
  } catch(e) {}

  let butcherData = [];
  try {
      const bSheet = ss.getSheetByName('butchers');
      if (bSheet && bSheet.getLastRow() > 1) {
          const bVals = bSheet.getDataRange().getValues();
          const bHeaders = bVals[0].map(h => String(h).trim().toLowerCase());
          const getBCol = (names, fallback) => {
              for (let n of names) {
                  const idx = bHeaders.indexOf(n.toLowerCase());
                  if (idx !== -1) return idx;
              }
              return fallback;
          };
          const bIdIdx = getBCol(['code', 'butcher code', 'id', 'butcher id'], 0);
          const bNameIdx = getBCol(['name', 'full name', 'butcher name'], 1);
          const bContactIdx = getBCol(['contact', 'phone', 'contact no', 'contact number'], 2);
          const bBarangayIdx = getBCol(['barangay', 'address', 'address barangay'], 3);
          const bSpecIdx = getBCol(['specialization', 'spec'], 4);
          const bCertIdx = getBCol(['cert number', 'certificate', 'health card no'], -1);
          const bExpiryIdx = getBCol(['health expiry', 'health card expiry', 'expiry date'], 5);
          const bStatusIdx = getBCol(['status'], 6);
          const bTotalIdx = getBCol(['total slaughtered', 'total', 'heads logged'], 7);

          for (let i = 1; i < bVals.length; i++) {
              const row = bVals[i];
              const hasData = row.some(cell => String(cell || '').trim() !== '');
              if (!hasData) continue;

              const rawName = String((bNameIdx !== -1 ? row[bNameIdx] : '') || '').trim();
              const rawId = String((bIdIdx !== -1 ? row[bIdIdx] : '') || '').trim();
              if ((!rawName && !rawId) || (rawName === 'undefined' && rawId === 'undefined')) continue;

              const cleanCode = (rawId && rawId !== 'undefined') ? rawId : ('BTC-' + String(i).padStart(3, '0'));
              const cleanName = (rawName && rawName !== 'undefined') ? rawName : ('Butcher ' + cleanCode);

              butcherData.push({
                  id: cleanCode,
                  code: cleanCode,
                  name: cleanName,
                  fullName: cleanName,
                  contact: String((bContactIdx !== -1 ? row[bContactIdx] : '') || '').trim(),
                  barangay: String((bBarangayIdx !== -1 ? row[bBarangayIdx] : '') || '').trim(),
                  specialization: String((bSpecIdx !== -1 ? row[bSpecIdx] : '') || 'General').trim(),
                  certNumber: String((bCertIdx !== -1 ? row[bCertIdx] : '') || '').trim(),
                  healthExpiry: safeValue(bExpiryIdx !== -1 ? row[bExpiryIdx] : ''),
                  healthCardExpiry: safeValue(bExpiryIdx !== -1 ? row[bExpiryIdx] : ''),
                  status: String((bStatusIdx !== -1 ? row[bStatusIdx] : '') || 'Active').trim(),
                  totalSlaughtered: parseFloat(bTotalIdx !== -1 ? row[bTotalIdx] : 0) || 0
              });
          }
      }
  } catch(e) {}

  let inventoryItems = [];
  try {
      const invSheet = ss.getSheetByName('inventory_items');
      if (invSheet && invSheet.getLastRow() > 1) {
          const iVals = invSheet.getDataRange().getValues();
          const iHeaders = iVals[0].map(h => String(h).trim().toLowerCase());
          const getICol = (names, fallback) => {
              for (let n of names) {
                  const idx = iHeaders.indexOf(n.toLowerCase());
                  if (idx !== -1) return idx;
              }
              return fallback;
          };
          const iIdIdx = getICol(['id', 'item id'], 0);
          const iNameIdx = getICol(['item', 'item name', 'name'], 1);
          const iDescIdx = getICol(['description'], 2);
          const iUnitIdx = getICol(['unit'], 3);
          const iQtyIdx = getICol(['quantity', 'qty'], 4);
          const iDateIdx = getICol(['date received', 'date'], 5);
          const iCatIdx = getICol(['category'], 6);
          const iMinIdx = getICol(['min stock', 'minimum'], 7);

          for (let i = 1; i < iVals.length; i++) {
              const rowId = String(iVals[i][iIdIdx] || ('INV-' + String(i).padStart(3, '0')));
              inventoryItems.push({
                  id: rowId,
                  code: rowId,
                  name: String(iVals[i][iNameIdx] || ''),
                  description: String(iVals[i][iDescIdx] || ''),
                  unit: String(iVals[i][iUnitIdx] || 'Pcs'),
                  quantity: parseFloat(iVals[i][iQtyIdx]) || 0,
                  dateReceived: safeValue(iVals[i][iDateIdx]),
                  category: String(iVals[i][iCatIdx] || 'Office Supplies'),
                  minStock: parseFloat(iVals[i][iMinIdx]) || 5
              });
          }
      }
  } catch(e) {}

  let inventoryTransactions = [];
  try {
      const txSheet = ss.getSheetByName('inventory_transactions');
      if (txSheet && txSheet.getLastRow() > 1) {
          const tVals = txSheet.getDataRange().getValues();
          const tHeaders = tVals[0].map(h => String(h).trim().toLowerCase());
          const getTCol = (names, fallback) => {
              for (let n of names) {
                  const idx = tHeaders.indexOf(n.toLowerCase());
                  if (idx !== -1) return idx;
              }
              return fallback;
          };
          const tIdIdx = getTCol(['id', 'tx id'], 0);
          const tItemIdIdx = getTCol(['item id'], 1);
          const tItemNameIdx = getTCol(['item name', 'item'], 2);
          const tTypeIdx = getTCol(['type'], 3);
          const tQtyIdx = getTCol(['quantity', 'qty'], 4);
          const tPrevIdx = getTCol(['prev qty', 'previous'], 5);
          const tNewIdx = getTCol(['new qty', 'new'], 6);
          const tDeptIdx = getTCol(['department', 'dept'], 7);
          const tRecBy = getTCol(['received by'], 8);
          const tDateIdx = getTCol(['date', 'timestamp'], 9);
          const tRemIdx = getTCol(['remarks', 'purpose'], 10);

          for (let i = 1; i < tVals.length; i++) {
              inventoryTransactions.push({
                  id: String(tVals[i][tIdIdx] || ('TX-' + i)),
                  itemId: String(tVals[i][tItemIdIdx] || ''),
                  itemName: String(tVals[i][tItemNameIdx] || ''),
                  type: String(tVals[i][tTypeIdx] || 'Release'),
                  quantity: parseFloat(tVals[i][tQtyIdx]) || 0,
                  prevQty: parseFloat(tVals[i][tPrevIdx]) || 0,
                  newQty: parseFloat(tVals[i][tNewIdx]) || 0,
                  department: String(tVals[i][tDeptIdx] || ''),
                  receivedBy: String(tVals[i][tRecBy] || ''),
                  date: safeValue(tVals[i][tDateIdx]),
                  remarks: String(tVals[i][tRemIdx] || '')
              });
          }
      }
  } catch(e) {}

  return { 
    headers: headers, 
    data: formattedData, 
    monitoringHistory: monHistory, 
    latestReadings: latestReadings, 
    electricBills: electricBills,
    slaughterData: slaughterData,
    todaData: todaData,
    memberData: memberData,
    cemeteryData: cemeteryData,
    csuData: csuData,
    butcherData: butcherData,
    inventoryItems: inventoryItems,
    inventoryTransactions: inventoryTransactions
  };

}

// --- SLAUGHTERHOUSE MANAGEMENT ---

function saveSlaughterData(data) {
  return saveSlaughterBatchData({
      clientId: data.clientId,
      clientName: data.clientName,
      address: data.address,
      contact: data.contact,
      orNumber: data.orNumber,
      status: data.status,
      items: [{
          livestockType: data.livestockType,
          headCount: data.headCount,
          kilos: data.kilos,
          amount: data.amount
      }]
  });
}

function saveSlaughterBatchData(payload) {
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let sheet = ss.getSheetByName('slaughter_logs');
      
      // Auto-create sheet if it doesn't exist
      if (!sheet) {
          sheet = ss.insertSheet('slaughter_logs');
          sheet.appendRow(['Timestamp', 'ClientID', 'Name of Client', 'Address', 'Contact No.', 'OR #', 'Status', 'Livestock', 'No. of Livestock', 'Weight (kg)', 'Amount']);
          sheet.getRange("A1:K1").setFontWeight("bold").setBackground("#f3f3f3");
          sheet.setFrozenRows(1);
      }
      
      const clientId = payload.clientId || ('C-' + new Date().getTime().toString().slice(-6));
      const timestamp = new Date();
      
      // Inspect current header row
      let headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(h => String(h).trim());
      let lowerHeaders = headers.map(h => h.toLowerCase());
      
      // If Address is missing from headers, append it
      if (!lowerHeaders.includes('address') && !lowerHeaders.includes('client address')) {
          const newCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, newCol).setValue('Address').setFontWeight("bold").setBackground("#f3f3f3");
          headers.push('Address');
          lowerHeaders.push('address');
      }
      
      // If Weight (kg) is missing from headers, append it
      if (!lowerHeaders.includes('weight (kg)') && !lowerHeaders.includes('weight') && !lowerHeaders.includes('kilos') && !lowerHeaders.includes('kilo')) {
          const newCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, newCol).setValue('Weight (kg)').setFontWeight("bold").setBackground("#f3f3f3");
          headers.push('Weight (kg)');
          lowerHeaders.push('weight (kg)');
      }
      
      // If Butcher is missing from headers, append it
      if (!lowerHeaders.includes('butcher') && !lowerHeaders.includes('butcher name') && !lowerHeaders.includes('assigned butcher')) {
          const newCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, newCol).setValue('Butcher').setFontWeight("bold").setBackground("#f3f3f3");
          headers.push('Butcher');
          lowerHeaders.push('butcher');
      }
      
      const findIdx = (names) => {
          for (let n of names) {
              const idx = lowerHeaders.indexOf(n.toLowerCase());
              if (idx !== -1) return idx;
          }
          return -1;
      };

      const tsCol = findIdx(['Timestamp']);
      const idCol = findIdx(['ClientID', 'Client ID', 'Client_ID']);
      const nameCol = findIdx(['Name of Client', 'Client Name', 'Client']);
      const addrCol = findIdx(['Address', 'Client Address']);
      const contactCol = findIdx(['Contact No.', 'Contact', 'Contact Number']);
      const orCol = findIdx(['OR #', 'OR Number', 'OR']);
      const statusCol = findIdx(['Status']);
      const typeCol = findIdx(['Livestock', 'Livestock Type']);
      const headCol = findIdx(['No. of Livestock', 'Head Count', 'Heads']);
      const kiloCol = findIdx(['Weight (kg)', 'Weight', 'Kilos', 'Kilo']);
      const amountCol = findIdx(['Amount', 'Amount (₱)']);
      const butcherCol = findIdx(['Butcher', 'Butcher Name', 'Assigned Butcher']);

      const rowsToAppend = payload.items.map(item => {
          const row = new Array(headers.length).fill('');
          if (tsCol !== -1) row[tsCol] = timestamp;
          if (idCol !== -1) row[idCol] = clientId;
          if (nameCol !== -1) row[nameCol] = payload.clientName;
          if (addrCol !== -1) row[addrCol] = payload.address || '';
          if (contactCol !== -1) row[contactCol] = payload.contact || '';
          if (orCol !== -1) row[orCol] = payload.orNumber || 'Unpaid';
          if (statusCol !== -1) row[statusCol] = payload.status || 'Private';
          if (typeCol !== -1) row[typeCol] = item.livestockType;
          if (headCol !== -1) row[headCol] = item.headCount || 1;
          if (kiloCol !== -1) row[kiloCol] = parseFloat(item.kilos) || 0;
          if (amountCol !== -1) row[amountCol] = parseFloat(item.amount) || 0;
          if (butcherCol !== -1) row[butcherCol] = item.butcher || item.butcherName || payload.butcher || payload.butcherName || '';
          return row;
      });

      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);

      logSystemEvent('System', 'Slaughterhouse', `Batch logged ${rowsToAppend.length} livestock entries for ${payload.clientName} under OR: ${payload.orNumber}`);
      return { success: true, clientId: clientId };
  } catch (e) {
      return { success: false, message: e.message };
  } finally {
      lock.releaseLock();
  }
}

function updateSlaughterRecord(payload) {
  if (!payload) return { success: false, message: 'Invalid payload' };
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sheet = ss.getSheetByName('slaughter_logs');
      if (!sheet) return { success: false, message: 'slaughter_logs sheet not found' };
      
      const shData = sheet.getDataRange().getValues();
      if (shData.length <= 1) return { success: false, message: 'No records found in sheet' };
      
      const headers = shData[0].map(h => String(h).trim().toLowerCase());
      const getCol = (names, fallbackIdx) => {
          for (let n of names) {
              const idx = headers.indexOf(n.toLowerCase());
              if (idx !== -1) return idx;
          }
          return fallbackIdx;
      };
      
      const tsCol = getCol(['timestamp'], 0);
      const idCol = getCol(['clientid', 'client id', 'client_id'], 1);
      const nameCol = getCol(['name of client', 'client name', 'client'], 2);
      const addrCol = getCol(['address', 'client address'], -1);
      const contactCol = getCol(['contact no.', 'contact', 'contact number'], 3);
      const orCol = getCol(['or #', 'or number', 'or'], 4);
      const statusCol = getCol(['status'], 5);
      const typeCol = getCol(['livestock', 'livestock type'], 6);
      const headCol = getCol(['no. of livestock', 'head count', 'heads'], 7);
      const kiloCol = getCol(['weight (kg)', 'weight', 'kilos', 'kilo'], -1);
      const amountCol = getCol(['amount', 'amount (₱)'], 8);
      const butcherCol = getCol(['butcher', 'butcher name', 'assigned butcher'], -1);

      let targetRow = -1;
      const targetId = String(payload.origClientId || payload.clientId || '').trim();
      const targetType = String(payload.origLivestockType || payload.livestockType || '').trim();
      const targetName = String(payload.origClientName || payload.clientName || '').trim();
      const targetTs = payload.origTimestamp || payload.timestamp;

      // 1. Check candidate rowIndex (1-indexed)
      if (payload.rowIndex && payload.rowIndex >= 2 && payload.rowIndex <= shData.length) {
          const rowIdx = payload.rowIndex - 1;
          const rRow = shData[rowIdx];
          const rId = String(rRow[idCol] || '').trim();
          const rType = String(rRow[typeCol] || '').trim();
          if ((!targetId || rId === targetId) && (!targetType || rType === targetType)) {
              targetRow = payload.rowIndex;
          }
      }

      // 2. Fallback scan if candidate row did not match
      if (targetRow === -1) {
          for (let i = 1; i < shData.length; i++) {
              const rId = String(shData[i][idCol] || '').trim();
              const rName = String(shData[i][nameCol] || '').trim();
              const rType = String(shData[i][typeCol] || '').trim();
              const rowTs = safeValue(shData[i][tsCol], false, true);
              const tsMatch = !targetTs || rowTs === targetTs;

              if ((rId === targetId || (targetName && rName === targetName)) && (!targetType || rType === targetType) && tsMatch) {
                  targetRow = i + 1;
                  break;
              }
          }
      }

      if (targetRow === -1) {
          return { success: false, message: 'Slaughter record not found in sheet' };
      }

      // If Address or Weight column is missing, ensure it exists before writing
      if (addrCol === -1 && payload.address) {
          const newCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, newCol).setValue('Address').setFontWeight("bold").setBackground("#f3f3f3");
          sheet.getRange(targetRow, newCol).setValue(payload.address);
      } else if (addrCol !== -1 && payload.address !== undefined) {
          sheet.getRange(targetRow, addrCol + 1).setValue(payload.address);
      }

      if (kiloCol === -1 && payload.kilos) {
          const newCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, newCol).setValue('Weight (kg)').setFontWeight("bold").setBackground("#f3f3f3");
          sheet.getRange(targetRow, newCol).setValue(parseFloat(payload.kilos) || 0);
      } else if (kiloCol !== -1 && payload.kilos !== undefined) {
          sheet.getRange(targetRow, kiloCol + 1).setValue(parseFloat(payload.kilos) || 0);
      }

      if (idCol !== -1 && payload.clientId !== undefined) sheet.getRange(targetRow, idCol + 1).setValue(payload.clientId);
      if (nameCol !== -1 && payload.clientName !== undefined) sheet.getRange(targetRow, nameCol + 1).setValue(payload.clientName);
      if (contactCol !== -1 && payload.contact !== undefined) sheet.getRange(targetRow, contactCol + 1).setValue(payload.contact);
      if (orCol !== -1 && payload.orNumber !== undefined) sheet.getRange(targetRow, orCol + 1).setValue(payload.orNumber);
      if (statusCol !== -1 && payload.status !== undefined) sheet.getRange(targetRow, statusCol + 1).setValue(payload.status);
      if (typeCol !== -1 && payload.livestockType !== undefined) sheet.getRange(targetRow, typeCol + 1).setValue(payload.livestockType);
      if (headCol !== -1 && payload.headCount !== undefined) sheet.getRange(targetRow, headCol + 1).setValue(parseFloat(payload.headCount) || 0);
      if (amountCol !== -1 && payload.amount !== undefined) sheet.getRange(targetRow, amountCol + 1).setValue(parseFloat(payload.amount) || 0);

      const butcherVal = payload.butcher !== undefined ? payload.butcher : payload.butcherName;
      if (butcherCol === -1 && butcherVal) {
          const newCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, newCol).setValue('Butcher').setFontWeight("bold").setBackground("#f3f3f3");
          sheet.getRange(targetRow, newCol).setValue(butcherVal);
      } else if (butcherCol !== -1 && butcherVal !== undefined) {
          sheet.getRange(targetRow, butcherCol + 1).setValue(butcherVal);
      }

      logSystemEvent('System', 'Slaughterhouse', `Updated slaughter entry for ${payload.clientName || targetId} (Type: ${payload.livestockType})`);
      return { success: true };
  } catch (e) {
      return { success: false, message: e.message };
  } finally {
      lock.releaseLock();
  }
}

function deleteSlaughterRecordDB(idOrPayload, rowIndex, timestamp, clientId, livestockType) {
  const payload = (typeof idOrPayload === 'object' && idOrPayload !== null) ? idOrPayload : {
      id: idOrPayload,
      rowIndex: rowIndex,
      timestamp: timestamp,
      clientId: clientId,
      livestockType: livestockType
  };

  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sheet = ss.getSheetByName('slaughter_logs');
      if (!sheet) return { success: false, message: 'slaughter_logs sheet not found' };
      
      const shData = sheet.getDataRange().getValues();
      if (shData.length <= 1) return { success: false, message: 'No records found in sheet' };
      
      const headers = shData[0].map(h => String(h).trim().toLowerCase());
      const getCol = (names, fallbackIdx) => {
          for (let n of names) {
              const idx = headers.indexOf(n.toLowerCase());
              if (idx !== -1) return idx;
          }
          return fallbackIdx;
      };
      
      const tsCol = getCol(['timestamp'], 0);
      const idCol = getCol(['clientid', 'client id', 'client_id'], 1);
      const nameCol = getCol(['name of client', 'client name', 'client'], 2);
      const typeCol = getCol(['livestock', 'livestock type'], 6);

      let targetRow = -1;
      const targetId = String(payload.clientId || '').trim();
      const targetType = String(payload.livestockType || '').trim();
      const targetName = String(payload.clientName || '').trim();
      const targetTs = payload.timestamp;

      // 1. Check candidate rowIndex (1-indexed)
      if (payload.rowIndex && payload.rowIndex >= 2 && payload.rowIndex <= shData.length) {
          const rowIdx = payload.rowIndex - 1;
          const rRow = shData[rowIdx];
          const rId = String(rRow[idCol] || '').trim();
          const rType = String(rRow[typeCol] || '').trim();
          if ((!targetId || rId === targetId) && (!targetType || rType === targetType)) {
              targetRow = payload.rowIndex;
          }
      }

      // 2. Fallback scan if candidate row did not match
      if (targetRow === -1) {
          for (let i = 1; i < shData.length; i++) {
              const rId = String(shData[i][idCol] || '').trim();
              const rName = String(shData[i][nameCol] || '').trim();
              const rType = String(shData[i][typeCol] || '').trim();
              const rowTs = safeValue(shData[i][tsCol], false, true);
              const tsMatch = !targetTs || rowTs === targetTs;

              if ((rId === targetId || (targetName && rName === targetName)) && (!targetType || rType === targetType) && tsMatch) {
                  targetRow = i + 1;
                  break;
              }
          }
      }

      if (targetRow === -1) {
          return { success: false, message: 'Slaughter record not found in sheet' };
      }

      sheet.deleteRow(targetRow);
      logSystemEvent('System', 'Slaughterhouse', `Deleted slaughter entry for ${payload.clientName || targetId} (Type: ${targetType})`);
      return { success: true };
  } catch (e) {
      return { success: false, message: e.message };
  } finally {
      lock.releaseLock();
  }
}

function getVendorImage(vendorName) {
  if (!vendorName) return null;
  const FOLDER_ID = '1jPe0AURsHSBmd6v47v-szWSwaWYCiVN3'; 
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const cleanName = String(vendorName).trim();
    if (!cleanName) return null;

    // 1. Direct folder file iteration (fastest, bypasses Drive search index delays)
    const allFiles = folder.getFiles();
    while (allFiles.hasNext()) {
      const f = allFiles.next();
      if (f.getName().toLowerCase().includes(cleanName.toLowerCase())) {
        try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
        return `https://lh3.googleusercontent.com/d/${f.getId()}`;
      }
    }

    // 2. Search fallback
    try {
      const files = folder.searchFiles(`title contains '${cleanName.replace(/'/g, "\\'")}' and trashed = false`);
      if (files.hasNext()) {
        const file = files.next();
        try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
        return `https://lh3.googleusercontent.com/d/${file.getId()}`;
      }
    } catch (_) {}
  } catch (e) {
    console.log("getVendorImage error: " + e.message);
  }
  return null;
}

function getVendorDocuments(vendorName) {
  if (!vendorName) return { lease: null, permit: null };
  const DOCS_FOLDER_ID = '1STNDVUK-T6rjmTgH87zZ709HpMhGH-Gp';
  const docs = { lease: null, permit: null };
  try {
    const folder = DriveApp.getFolderById(DOCS_FOLDER_ID);
    const files = folder.searchFiles(`title contains '${vendorName.replace(/'/g, "\\'")}' and trashed = false`);
    let foundFiles = [];
    while (files.hasNext()) { const f = files.next(); foundFiles.push({ name: f.getName().toLowerCase(), url: f.getUrl(), date: f.getLastUpdated() }); }
    foundFiles.sort((a, b) => b.date - a.date);
    for (const f of foundFiles) {
        const previewUrl = f.url.replace(/\/view.*/, '/preview');
        if (!docs.lease && (f.name.includes('lease') || f.name.includes('col') || f.name.includes('contract'))) docs.lease = previewUrl;
        if (!docs.permit && (f.name.includes('permit') || f.name.includes('business'))) docs.permit = previewUrl;
    }
  } catch (e) {}
  return docs;
}

function uploadVendorImage(data, mimeType, vendorName) {
  const FOLDER_ID = '1jPe0AURsHSBmd6v47v-szWSwaWYCiVN3';
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const cleanName = String(vendorName || '').trim();
    if (!cleanName) return { success: false, message: 'Vendor name is missing' };

    // Clean up existing files with this vendor name to prevent duplicate accumulation
    try {
      const allFiles = folder.getFiles();
      while (allFiles.hasNext()) {
        const f = allFiles.next();
        if (f.getName().toLowerCase() === cleanName.toLowerCase()) {
          try { f.setTrashed(true); } catch (_) {}
        }
      }
    } catch (cleanupErr) {
      console.warn("Cleanup warning: " + cleanupErr.message);
    }

    // Decode and create the new image file in Google Drive
    const decoded = Utilities.base64Decode(data);
    const blob = Utilities.newBlob(decoded, mimeType || 'image/jpeg', cleanName);
    const newFile = folder.createFile(blob);

    try {
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (_) {}

    const fileId = newFile.getId();
    const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

    logSystemEvent('System', 'Image Upload', `Updated photo for ${cleanName}`);
    return { success: true, fileId: fileId, url: directUrl };
  } catch (e) { 
    console.error("uploadVendorImage error: " + e.message);
    return { success: false, message: e.message }; 
  }
}

function uploadVendorDocument(data, mimeType, vendorName, docType) {
  const FOLDER_ID = '1STNDVUK-T6rjmTgH87zZ709HpMhGH-Gp';
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const fileName = `${vendorName}_${docType}_${new Date().getFullYear()}`;
    const existingFiles = folder.searchFiles(`title = '${fileName.replace(/'/g, "\\'")}' and trashed = false`);
    while (existingFiles.hasNext()) existingFiles.next().setTrashed(true);
    folder.createFile(Utilities.newBlob(Utilities.base64Decode(data), mimeType, fileName));
    logSystemEvent('System', 'Document Upload', `Uploaded ${docType} for ${vendorName}`);
    return { success: true };
  } catch (e) { return { success: false, message: e.message }; }
}

function updateStallData(rowIndex, updateData) {
  if (!updateData || !updateData.stallNo) return { success: false, message: 'Invalid payload: stall data is missing' };
  
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10 seconds to prevent Race Conditions
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('stall_data') || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    if (data.length === 0) return { success: false, message: 'Sheet is empty' };
    
    const headers = data[0];
    const colMap = {}; 
    if (Array.isArray(headers)) {
        headers.forEach((h, i) => colMap[h] = i + 1);
    }
    
    // Find the true row index dynamically using stallNo instead of trusting frontend rowIndex
    let trueRowIndex = -1;
    const stallColIdx = colMap['Stall No.'] ? colMap['Stall No.'] - 1 : -1;
    if (stallColIdx !== -1) {
        for (let i = 1; i < data.length; i++) {
            if (String(data[i][stallColIdx]) === String(updateData.stallNo)) {
                trueRowIndex = i + 1;
                break;
            }
        }
    }
    
    const timestamp = new Date();
    const writeFields = (rIndex) => {
      if (colMap['Stall Owner']) sheet.getRange(rIndex, colMap['Stall Owner']).setValue(updateData.stallOwner);
      if (colMap['Operator']) sheet.getRange(rIndex, colMap['Operator']).setValue(updateData.operator);
      if (colMap['Line of Business']) sheet.getRange(rIndex, colMap['Line of Business']).setValue(updateData.lineOfBusiness);
      if (colMap['Period_Index']) sheet.getRange(rIndex, colMap['Period_Index']).setValue(updateData.periodIndex);
      if (colMap['Date']) sheet.getRange(rIndex, colMap['Date']).setValue(timestamp);
      if (colMap['Year']) sheet.getRange(rIndex, colMap['Year']).setValue(timestamp.getFullYear());
      if (headers.length >= 9) sheet.getRange(rIndex, 9).setValue(updateData.columnI);
      if (colMap['Status']) sheet.getRange(rIndex, colMap['Status']).setValue(updateData.status);
      else if (headers.length >= 12) sheet.getRange(rIndex, 12).setValue(updateData.status);
    };

    if (trueRowIndex !== -1) {
      writeFields(trueRowIndex); 
      logSystemEvent('System', 'Update Stall', `Updated Stall: ${updateData.stallNo}`); 
      return { success: true, message: 'Updated existing record' };
    } else {
      const newRow = new Array(headers.length).fill('');
      if (colMap['Stall No.']) newRow[colMap['Stall No.'] - 1] = updateData.stallNo;
      if (colMap['Stall Owner']) newRow[colMap['Stall Owner'] - 1] = updateData.stallOwner;
      if (colMap['Operator']) newRow[colMap['Operator'] - 1] = updateData.operator;
      if (colMap['Line of Business']) newRow[colMap['Line of Business'] - 1] = updateData.lineOfBusiness;
      if (colMap['Period_Index']) newRow[colMap['Period_Index'] - 1] = updateData.periodIndex;
      if (colMap['Date']) newRow[colMap['Date'] - 1] = timestamp;
      if (colMap['Year']) newRow[colMap['Year'] - 1] = timestamp.getFullYear();
      if (newRow.length > 8) newRow[8] = updateData.columnI;
      if (colMap['Status']) newRow[colMap['Status'] - 1] = updateData.status;
      sheet.appendRow(newRow); 
      logSystemEvent('System', 'New Entry', `Added new record for Stall: ${updateData.stallNo}`); 
      return { success: true, message: 'Created new record' };
    }
  } catch(e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}

// --- TWO-WAY SYNC: MONTHLY MONITORING <-> ELECTRIC BILLS ---

function saveMonthlyMonitoring(rowIndex, data) {
    if (!data || !data.stallNo) return { success: false, message: 'Invalid payload: monitoring data is missing' };

    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const sheet = ss.getSheetByName('stall_data') || ss.getSheets()[0];
        
        // Find true row dynamically to prevent corruption
        const sheetData = sheet.getDataRange().getValues();
        let trueRowIndex = -1;
        const stallColIdx = sheetData[0].findIndex(h => String(h).trim() === 'Stall No.');
        if (stallColIdx !== -1) {
            for (let i = 1; i < sheetData.length; i++) {
                if (String(sheetData[i][stallColIdx]) === String(data.stallNo)) {
                    trueRowIndex = i + 1;
                    break;
                }
            }
        }
        
        if (trueRowIndex === -1) return { success: false, message: 'Stall not found in database' };

        // 1. Update the Main stall_data Sheet
        sheet.getRange(trueRowIndex, 14).setValue(data.date);
        sheet.getRange(trueRowIndex, 15).setValue(data.goodwill);
        sheet.getRange(trueRowIndex, 16).setValue(data.status);
        sheet.getRange(trueRowIndex, 17).setValue(data.permit);
        sheet.getRange(trueRowIndex, 18).setValue(data.lease);
        sheet.getRange(trueRowIndex, 19).setValue(data.rental);
        sheet.getRange(trueRowIndex, 20).setValue(data.seminars);
        sheet.getRange(trueRowIndex, 21).setValue(data.claygo);
        sheet.getRange(trueRowIndex, 22).setValue(data.cctv);
        sheet.getRange(trueRowIndex, 23).setValue(data.palengqr);
        sheet.getRange(trueRowIndex, 24).setValue(data.eBillAmount);
        sheet.getRange(trueRowIndex, 25).setValue(data.eBillStatus);
        sheet.getRange(trueRowIndex, 26).setValue(data.eBillDate);

        // Auto-add headers to main sheet if missing
        const headerRange = sheet.getRange(1, 21, 1, 6);
        if (!headerRange.getValues()[0][0]) {
            headerRange.setValues([['CLAYGO Compliance', 'CCTV Available', 'PalengQR Implemented', 'Electric Bill Amount', 'Electric Bill Status', 'Electric Bill Due Date']]);
            headerRange.setFontWeight("bold").setBackground("#f3f3f3");
        }

        // 2. Append to Monitoring History Sheet
        let historySheet = ss.getSheetByName('monitoring_history');
        if (!historySheet) {
            historySheet = ss.insertSheet('monitoring_history');
            historySheet.appendRow(['Timestamp', 'Stall No', 'Owner', 'Monitoring Date', 'Goodwill', 'Status', 'Permit', 'Lease', 'Rental', 'Seminars', 'CLAYGO', 'CCTV', 'PalengQR', 'E-Bill Amount', 'E-Bill Status', 'E-Bill Date']);
            historySheet.getRange("A1:P1").setFontWeight("bold").setBackground("#f3f3f3");
            historySheet.setFrozenRows(1);
        } else if (historySheet.getLastColumn() < 16) {
            historySheet.getRange(1, 11, 1, 6).setValues([['CLAYGO', 'CCTV', 'PalengQR', 'E-Bill Amount', 'E-Bill Status', 'E-Bill Date']]);
            historySheet.getRange("K1:P1").setFontWeight("bold").setBackground("#f3f3f3");
        }
        
        historySheet.appendRow([
            new Date(), data.stallNo, data.owner || '', data.date, data.goodwill, data.status,
            data.permit, data.lease, data.rental, data.seminars, data.claygo, data.cctv,
            data.palengqr, data.eBillAmount, data.eBillStatus, data.eBillDate
        ]);

        // 3. (SYNC) Update the original Electric Bill ledger to match "Fully Paid" status
        if (data.eBillStatus) {
            try {
                let eBillSheet = ss.getSheetByName('electric_bills');
                if (eBillSheet && eBillSheet.getLastRow() > 1) {
                    const eData = eBillSheet.getDataRange().getValues();
                    for (let i = eData.length - 1; i >= 1; i--) {
                        if (String(eData[i][1]) === String(data.stallNo)) {
                            eBillSheet.getRange(i + 1, 11).setValue(data.eBillStatus);
                            break; 
                        }
                    }
                }
            } catch(e) { console.log("Could not sync back to electric_bills ledger: " + e.message); }
        }

        logSystemEvent('System', 'Monthly Monitoring', `Logged updated monitoring fields for Stall ${data.stallNo}`);
        return { success: true, message: 'Monitoring data saved successfully' };
    } catch (e) { 
        return { success: false, message: e.message }; 
    } finally {
        lock.releaseLock();
    }
}

function saveElectricBill(data) {
  if (!data || !data.stallNo) return { success: false, message: 'Invalid payload: bill data is missing' };
  
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let sheet = ss.getSheetByName('electric_bills');
      
      // 1. Add to Electric Bills Ledger
      if (!sheet) {
          sheet = ss.insertSheet('electric_bills');
          sheet.appendRow(['Timestamp', 'Stall No', 'Owner', 'Previous Reading', 'Current Reading', 'Consumption (kWh)', 'Rate/kWh', 'Total Bill', 'Due Date', 'Disconnection Date', 'Status']);
          sheet.getRange("A1:K1").setFontWeight("bold").setBackground("#f3f3f3");
          sheet.setFrozenRows(1);
      }
      
      sheet.appendRow([
          new Date(), data.stallNo, data.owner || 'N/A', data.previous, data.current,
          data.consumption, data.rate, data.bill, data.dueDate, data.discDate, 'Unpaid'
      ]);

      // 2. (SYNC) Auto-update the Monthly Monitoring Data for this Stall dynamically
      const mainSheet = ss.getSheetByName('stall_data') || ss.getSheets()[0];
      const sheetData = mainSheet.getDataRange().getValues();
      let trueRowIndex = -1;
      const stallColIdx = sheetData[0].findIndex(h => String(h).trim() === 'Stall No.');
      if (stallColIdx !== -1) {
          for (let i = 1; i < sheetData.length; i++) {
              if (String(sheetData[i][stallColIdx]) === String(data.stallNo)) {
                  trueRowIndex = i + 1;
                  break;
              }
          }
      }

      if (trueRowIndex !== -1) {
          const headerRange = mainSheet.getRange(1, 21, 1, 6);
          if (!headerRange.getValues()[0][0]) {
              headerRange.setValues([['CLAYGO Compliance', 'CCTV Available', 'PalengQR Implemented', 'Electric Bill Amount', 'Electric Bill Status', 'Electric Bill Due Date']]);
              headerRange.setFontWeight("bold").setBackground("#f3f3f3");
          }
          
          mainSheet.getRange(trueRowIndex, 24).setValue(data.bill);
          mainSheet.getRange(trueRowIndex, 25).setValue('Unpaid');
          mainSheet.getRange(trueRowIndex, 26).setValue(data.dueDate);
      }

      logSystemEvent('System', 'Electric Bill', `Generated bill for Stall ${data.stallNo} (₱${data.bill})`);
      return { success: true };
  } catch (e) { 
      return { success: false, message: e.message }; 
  } finally {
      lock.releaseLock();
  }
}


// --- TRANSPORT TERMINAL MANAGEMENT ---
function saveTodaEntry(data) {
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let sheet = ss.getSheetByName('toda_list');
      
      if (!sheet) {
          sheet = ss.insertSheet('toda_list');
          sheet.appendRow(['Timestamp', 'Registration #', 'TODA Name', 'President', 'Contact No.', 'Total Members', 'Address']);
          sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      const timestamp = new Date();
      sheet.appendRow([timestamp, data.regNo, data.name, data.president, data.contact, data.membersCount, data.address]);
      logSystemEvent('System', 'Transport Terminal', `Registered new TODA: ${data.name}`);
      
      let tz = "Asia/Manila";
      try { tz = ss.getSpreadsheetTimeZone() || tz; } catch(e) {}
      const newId = Utilities.formatDate(timestamp, tz, "yyyy-MM-dd HH:mm:ss");
      return { success: true, id: newId };
  } catch (e) { return { success: false, message: e.message }; } 
  finally { lock.releaseLock(); }
}

function updateTodaEntry(data) {
  if (!data || (!data.id && !data.name)) return { success: false, message: 'Invalid TODA data' };
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sheet = ss.getSheetByName('toda_list');
      if (!sheet) return { success: false, message: 'toda_list sheet not found' };
      
      const vals = sheet.getDataRange().getValues();
      let tz = "Asia/Manila";
      try { tz = ss.getSpreadsheetTimeZone() || tz; } catch(e) {}
      
      let targetRowIndex = -1;
      let oldName = data.originalName || data.name;
      
      for (let i = 1; i < vals.length; i++) {
          let rowTimestamp = vals[i][0];
          let rowId = (rowTimestamp instanceof Date) 
              ? Utilities.formatDate(rowTimestamp, tz, "yyyy-MM-dd HH:mm:ss")
              : String(rowTimestamp).trim();
          
          if ((data.id && rowId === data.id) || (data.originalName && String(vals[i][2]).trim() === data.originalName.trim())) {
              targetRowIndex = i + 1;
              oldName = String(vals[i][2]).trim();
              break;
          }
      }
      
      if (targetRowIndex === -1) {
          return { success: false, message: 'TODA record not found in sheet' };
      }
      
      sheet.getRange(targetRowIndex, 2).setValue(data.regNo);
      sheet.getRange(targetRowIndex, 3).setValue(data.name);
      sheet.getRange(targetRowIndex, 4).setValue(data.president);
      sheet.getRange(targetRowIndex, 5).setValue(data.contact);
      sheet.getRange(targetRowIndex, 6).setValue(data.membersCount);
      sheet.getRange(targetRowIndex, 7).setValue(data.address);
      
      // Cascade update to toda_members if the TODA name has changed
      if (oldName && data.name && oldName !== data.name) {
          const memSheet = ss.getSheetByName('toda_members');
          if (memSheet && memSheet.getLastRow() > 1) {
              const memVals = memSheet.getDataRange().getValues();
              for (let j = 1; j < memVals.length; j++) {
                  if (String(memVals[j][1]).trim() === oldName) {
                      memSheet.getRange(j + 1, 2).setValue(data.name);
                  }
              }
          }
      }
      
      logSystemEvent('System', 'Transport Terminal', `Updated TODA: ${data.name}`);
      return { success: true };
  } catch (e) { return { success: false, message: e.message }; }
  finally { lock.releaseLock(); }
}

function deleteTodaEntryDB(id, todaName) {
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sheet = ss.getSheetByName('toda_list');
      if (!sheet) return { success: false, message: 'toda_list sheet not found' };
      
      const vals = sheet.getDataRange().getValues();
      let tz = "Asia/Manila";
      try { tz = ss.getSpreadsheetTimeZone() || tz; } catch(e) {}
      
      let targetName = todaName;
      let deleted = false;
      
      for (let i = 1; i < vals.length; i++) {
          let rowTimestamp = vals[i][0];
          let rowId = (rowTimestamp instanceof Date) 
              ? Utilities.formatDate(rowTimestamp, tz, "yyyy-MM-dd HH:mm:ss")
              : String(rowTimestamp).trim();
          
          if ((id && rowId === id) || (todaName && String(vals[i][2]).trim() === todaName.trim())) {
              targetName = String(vals[i][2]).trim();
              sheet.deleteRow(i + 1);
              deleted = true;
              break;
          }
      }
      
      if (!deleted) {
          return { success: false, message: 'TODA record not found in sheet' };
      }
      
      // Cascade delete members for this TODA in toda_members
      if (targetName) {
          const memSheet = ss.getSheetByName('toda_members');
          if (memSheet && memSheet.getLastRow() > 1) {
              const memVals = memSheet.getDataRange().getValues();
              for (let j = memVals.length - 1; j >= 1; j--) {
                  if (String(memVals[j][1]).trim() === targetName) {
                      memSheet.deleteRow(j + 1);
                  }
              }
          }
      }
      
      logSystemEvent('System', 'Transport Terminal', `Deleted TODA: ${targetName} and associated members`);
      return { success: true };
  } catch (e) { return { success: false, message: e.message }; }
  finally { lock.releaseLock(); }
}

function saveMemberEntry(data) {
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let sheet = ss.getSheetByName('toda_members');
      
      if (!sheet) {
          sheet = ss.insertSheet('toda_members');
          sheet.appendRow(['Timestamp', 'TODA Name', 'Last Name', 'First Name', 'Middle Name', 'Ext. Name', 'Sex', 'Barangay', 'Municipality', 'Contact Number', 'Type of ID', 'ID Number', 'Expiration Date']);
          sheet.getRange("A1:M1").setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      const timestamp = new Date();
      sheet.appendRow([timestamp, data.todaName, data.lastName, data.firstName, data.middleName, data.extName, data.sex, data.barangay, data.municipality, data.contact, data.idType, data.idNumber, data.idExpiry]);
      
      let tz = "Asia/Manila";
      try { tz = ss.getSpreadsheetTimeZone() || tz; } catch(e) {}
      const newId = Utilities.formatDate(timestamp, tz, "yyyy-MM-dd HH:mm:ss");
      return { success: true, id: newId };
  } catch (e) { return { success: false, message: e.message }; } 
  finally { lock.releaseLock(); }
}

function updateMemberEntry(data) {
  if (!data || !data.id) return { success: false, message: 'Invalid member data or missing ID' };
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sheet = ss.getSheetByName('toda_members');
      if (!sheet) return { success: false, message: 'toda_members sheet not found' };
      
      const vals = sheet.getDataRange().getValues();
      let tz = "Asia/Manila";
      try { tz = ss.getSpreadsheetTimeZone() || tz; } catch(e) {}
      
      let targetRowIndex = -1;
      for (let i = 1; i < vals.length; i++) {
          let rowTimestamp = vals[i][0];
          let rowId = (rowTimestamp instanceof Date) 
              ? Utilities.formatDate(rowTimestamp, tz, "yyyy-MM-dd HH:mm:ss")
              : String(rowTimestamp).trim();
          
          if (rowId === data.id) {
              targetRowIndex = i + 1;
              break;
          }
      }
      
      if (targetRowIndex === -1) {
          return { success: false, message: 'Member record not found in sheet' };
      }
      
      sheet.getRange(targetRowIndex, 2).setValue(data.todaName);
      sheet.getRange(targetRowIndex, 3).setValue(data.lastName);
      sheet.getRange(targetRowIndex, 4).setValue(data.firstName);
      sheet.getRange(targetRowIndex, 5).setValue(data.middleName);
      sheet.getRange(targetRowIndex, 6).setValue(data.extName);
      sheet.getRange(targetRowIndex, 7).setValue(data.sex);
      sheet.getRange(targetRowIndex, 8).setValue(data.barangay);
      sheet.getRange(targetRowIndex, 9).setValue(data.municipality);
      sheet.getRange(targetRowIndex, 10).setValue(data.contact);
      sheet.getRange(targetRowIndex, 11).setValue(data.idType);
      sheet.getRange(targetRowIndex, 12).setValue(data.idNumber);
      sheet.getRange(targetRowIndex, 13).setValue(data.idExpiry);
      
      logSystemEvent('System', 'Transport Terminal', `Updated member: ${data.lastName}, ${data.firstName}`);
      return { success: true };
  } catch (e) { return { success: false, message: e.message }; }
  finally { lock.releaseLock(); }
}

function deleteMemberEntryDB(id) {
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sheet = ss.getSheetByName('toda_members');
      if (!sheet) return { success: false, message: 'toda_members sheet not found' };
      
      const vals = sheet.getDataRange().getValues();
      let tz = "Asia/Manila";
      try { tz = ss.getSpreadsheetTimeZone() || tz; } catch(e) {}
      
      for (let i = 1; i < vals.length; i++) {
          let rowTimestamp = vals[i][0];
          let rowId = (rowTimestamp instanceof Date) 
              ? Utilities.formatDate(rowTimestamp, tz, "yyyy-MM-dd HH:mm:ss")
              : String(rowTimestamp).trim();
          
          if (rowId === id) {
              const name = `${vals[i][2]}, ${vals[i][3]}`;
              sheet.deleteRow(i + 1);
              logSystemEvent('System', 'Transport Terminal', `Deleted member: ${name}`);
              return { success: true };
          }
      }
      return { success: false, message: 'Member record not found in database' };
  } catch (e) { return { success: false, message: e.message }; }
  finally { lock.releaseLock(); }
}

// --- CEMETERY MANAGEMENT ---
function saveCemeteryBooking(data) {
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let sheet = ss.getSheetByName('cemetery_bookings');
      
      if (!sheet) {
          sheet = ss.insertSheet('cemetery_bookings');
          sheet.appendRow(['Timestamp', 'Name of the Deceased', 'Address', 'Phone number', 'Date of Burial', 'Burial Type', 'Amount']);
          sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      const timestamp = new Date();
      sheet.appendRow([timestamp, data.deceasedName, data.address, data.phone, data.burialDate, data.burialType, data.amount]);
      logSystemEvent('System', 'Cemetery Management', `Booked burial for ${data.deceasedName}`);

      // Format the timestamp exactly like getSheetData does to establish the ID
      let tz = "Asia/Manila";
      try { tz = ss.getSpreadsheetTimeZone() || tz; } catch(e) {}
      const newId = Utilities.formatDate(timestamp, tz, "yyyy-MM-dd HH:mm:ss");

      // ==========================================
      // AUTOMATION: EMAIL AND GOOGLE CALENDAR
      // ==========================================
      const managerEmail = "market@malungon.gov.ph"; // <--- CHANGE TO ACTUAL EMAIL
      const staffEmail = "barlonpenalber66@gmail.com";     // <--- CHANGE TO ACTUAL EMAIL
      const allRecipients = managerEmail + "," + staffEmail;

      // 1. Send Email Notification
      try {
         const subject = "New Burial Booking Scheduled: " + data.deceasedName;
         const message = `A new burial has been scheduled in the MEEDO Market system.\n\n` +
                         `Deceased: ${data.deceasedName}\n` +
                         `Date of Burial: ${data.burialDate}\n` +
                         `Burial Type: ${data.burialType}\n` +
                         `Address: ${data.address}\n` +
                         `Contact: ${data.phone}\n\n` +
                         `Please check your Google Calendar for the event.`;
         MailApp.sendEmail(allRecipients, subject, message);
      } catch(e) { console.log("Email sending failed: " + e.message); }

      // 2. Google Calendar Event Creation & Invites
      try {
         const calendar = CalendarApp.getDefaultCalendar(); // Uses the script owner's calendar
         const eventTitle = "Burial Booking: " + data.deceasedName;
         let event;
         
         if (data.rawTime) {
            // Create a timed event (Defaults to a 2 hour duration)
            const startDateTime = new Date(`${data.rawDate}T${data.rawTime}:00`);
            const endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000)); 
            event = calendar.createEvent(eventTitle, startDateTime, endDateTime);
         } else {
            // Fallback to an all-day event if no time is provided
            const eventDate = new Date(data.rawDate || data.burialDate);
            event = calendar.createAllDayEvent(eventTitle, eventDate);
         }
         
         // Add Guests so it shows up in their personal Google Calendars
         event.addGuest(managerEmail);
         event.addGuest(staffEmail);
         
         event.setDescription(`Address: ${data.address}\nContact: ${data.phone}\nBurial Type: ${data.burialType}\nAmount: PHP ${data.amount}`);
      } catch(e) { console.log("Calendar creation failed: " + e.message); }
      // ==========================================

      return { success: true, id: newId };
  } catch (e) { return { success: false, message: e.message }; } 
  finally { lock.releaseLock(); }
}

function updateCemeteryBooking(data) {
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sheet = ss.getSheetByName('cemetery_bookings');
      if (!sheet) return { success: false, message: 'Database sheet not found' };
      
      const values = sheet.getDataRange().getValues();
      let tz = "Asia/Manila";
      try { tz = ss.getSpreadsheetTimeZone() || tz; } catch(e) {}

      for (let i = 1; i < values.length; i++) {
          let rowTimestamp = values[i][0];
          let rowId = "";
          
          if (rowTimestamp instanceof Date) {
              rowId = Utilities.formatDate(rowTimestamp, tz, "yyyy-MM-dd HH:mm:ss");
          } else {
              rowId = String(rowTimestamp).trim();
          }
          
          if (rowId === data.id) {
              const rowIndex = i + 1;
              // Columns: [Timestamp, Name of Deceased, Address, Phone, Date of Burial, Burial Type, Amount]
              sheet.getRange(rowIndex, 2).setValue(data.deceasedName);
              sheet.getRange(rowIndex, 3).setValue(data.address);
              sheet.getRange(rowIndex, 4).setValue(data.phone);
              sheet.getRange(rowIndex, 5).setValue(data.burialDate);
              sheet.getRange(rowIndex, 6).setValue(data.burialType);
              sheet.getRange(rowIndex, 7).setValue(data.amount);
              
              logSystemEvent('System', 'Cemetery Management', `Updated booking for ${data.deceasedName}`);
              return { success: true };
          }
      }
      return { success: false, message: 'Booking record not found in database' };
  } catch (e) {
      return { success: false, message: e.message };
  } finally {
      lock.releaseLock();
  }
}

// --- PEACE & ORDER (CSU) MANAGEMENT ---
function saveCsuReport(data) {
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let sheet = ss.getSheetByName('csu_reports');
      
      // Auto-create the sheet if it doesn't exist yet
      if (!sheet) {
          sheet = ss.insertSheet('csu_reports');
          sheet.appendRow(['Timestamp', 'Date', 'Day', 'Shift', 'Area Covered', 'Prepared By', 'Full JSON Data']);
          sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#f3f3f3");
          sheet.setFrozenRows(1);
      }
      
      // Server-side check: Only allow submission on the day of duty (unless Admin)
      let tz = "Asia/Manila";
      try { tz = ss.getSpreadsheetTimeZone() || tz; } catch(e) {}
      const todayInManila = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
      
      if (data.userRole !== 'Admin' && data.basic.date !== todayInManila) {
          return { 
              success: false, 
              message: 'Submission closed: Reports can only be submitted on the day of duty (' + todayInManila + ').' 
          };
      }
      
      // Append the data to the spreadsheet
      sheet.appendRow([
          new Date(), 
          data.basic.date, 
          data.basic.day, 
          data.basic.shift, 
          data.basic.area,
          data.signatures.prepName || 'Unknown',
          JSON.stringify(data) // Saves all complex dynamic tables securely
      ]);
      
      logSystemEvent('System', 'Peace & Order', `Saved CSU daily report for ${data.basic.date}`);
      return { success: true };
  } catch (e) { 
      return { success: false, message: e.message }; 
  } finally { 
      lock.releaseLock(); 
  }
}

function deleteCemeteryBookingDB(id) {
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sheet = ss.getSheetByName('cemetery_bookings');
      if (!sheet) return { success: false, message: 'Database sheet not found' };
      
      const data = sheet.getDataRange().getValues();
      let tz = "Asia/Manila";
      try { tz = ss.getSpreadsheetTimeZone() || tz; } catch(e) {}

      // Search for the matching timestamp ID to delete
      for (let i = 1; i < data.length; i++) {
          let rowTimestamp = data[i][0];
          let rowId = "";
          
          if (rowTimestamp instanceof Date) {
              rowId = Utilities.formatDate(rowTimestamp, tz, "yyyy-MM-dd HH:mm:ss");
          } else {
              rowId = String(rowTimestamp).trim();
          }
          
          if (rowId === id) {
              const name = data[i][1];
              sheet.deleteRow(i + 1); // +1 because array is 0-indexed
              logSystemEvent('System', 'Cemetery Management', `Deleted booking for ${name}`);
              return { success: true };
          }
      }
      return { success: false, message: 'Booking record not found in database' };
  } catch (e) { 
      return { success: false, message: e.message }; 
  } finally { 
      lock.releaseLock(); 
  }
}

// --- BUTCHER MANAGEMENT BACKEND ---
function saveButchersData(butchersList) {
  if (!butchersList || !Array.isArray(butchersList)) return { success: false, message: 'Invalid data' };
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName('butchers');
    if (!sheet) {
      sheet = ss.insertSheet('butchers');
      sheet.appendRow(['Code', 'Name', 'Contact', 'Barangay', 'Specialization', 'Health Card Expiry', 'Status', 'Total Slaughtered']);
      sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#f3f3f3");
      sheet.setFrozenRows(1);
    }
    const existingLast = sheet.getLastRow();
    if (existingLast > 1) {
      sheet.getRange(2, 1, existingLast - 1, Math.max(sheet.getLastColumn(), 8)).clearContent();
    }
    const rows = butchersList
      .filter(b => b && (b.name || b.fullName) && (b.name !== 'undefined' && b.fullName !== 'undefined'))
      .map(b => [
        b.code || b.id || '',
        b.name || b.fullName || '',
        b.contact || '',
        b.barangay || '',
        b.specialization || 'General',
        b.healthExpiry || b.healthCardExpiry || '',
        b.status || 'Active',
        parseFloat(b.totalSlaughtered) || 0
      ]);
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 8).setValues(rows);
    }
    logSystemEvent('System', 'Slaughterhouse', `Saved ${rows.length} butcher profiles`);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}

// --- INVENTORY MANAGEMENT BACKEND ---
function saveInventoryData(itemsList, transactionsList) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // 1. Items
    if (itemsList && Array.isArray(itemsList)) {
      let sheet = ss.getSheetByName('inventory_items');
      if (!sheet) {
        sheet = ss.insertSheet('inventory_items');
        sheet.appendRow(['Item ID', 'Item Name', 'Description', 'Unit', 'Quantity', 'Date Received', 'Category', 'Min Stock']);
        sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#f3f3f3");
        sheet.setFrozenRows(1);
      }
      const existingLast = sheet.getLastRow();
      if (existingLast > 1) {
        sheet.getRange(2, 1, existingLast - 1, 8).clearContent();
      }
      const rows = itemsList.map(item => [
        item.id || '',
        item.name || '',
        item.description || '',
        item.unit || 'Pcs',
        item.quantity || 0,
        item.dateReceived || '',
        item.category || 'Office Supplies',
        item.minStock || 5
      ]);
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 8).setValues(rows);
      }
    }

    // 2. Transactions
    if (transactionsList && Array.isArray(transactionsList)) {
      let txSheet = ss.getSheetByName('inventory_transactions');
      if (!txSheet) {
        txSheet = ss.insertSheet('inventory_transactions');
        txSheet.appendRow(['TX ID', 'Item ID', 'Item Name', 'Type', 'Quantity', 'Prev Qty', 'New Qty', 'Department', 'Received By', 'Date', 'Remarks']);
        txSheet.getRange("A1:K1").setFontWeight("bold").setBackground("#f3f3f3");
        txSheet.setFrozenRows(1);
      }
      const existingTxLast = txSheet.getLastRow();
      if (existingTxLast > 1) {
        txSheet.getRange(2, 1, existingTxLast - 1, 11).clearContent();
      }
      const txRows = transactionsList.map(tx => [
        tx.id || '',
        tx.itemId || '',
        tx.itemName || '',
        tx.type || 'Release',
        tx.quantity || 0,
        tx.prevQty || 0,
        tx.newQty || 0,
        tx.department || '',
        tx.receivedBy || '',
        tx.date || '',
        tx.remarks || ''
      ]);
      if (txRows.length > 0) {
        txSheet.getRange(2, 1, txRows.length, 11).setValues(txRows);
      }
    }

    logSystemEvent('System', 'Inventory', `Synced inventory items and transactions`);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}