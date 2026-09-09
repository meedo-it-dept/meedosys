/**
 * Serves the HTML file for the web app.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('MEEDOSys v1.18.8.4')
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
          for(let i=1; i<shData.length; i++) {
              slaughterData.push({
                  timestamp: safeValue(shData[i][0], false, true),
                  clientId: String(shData[i][1]),
                  clientName: String(shData[i][2]),
                  contact: String(shData[i][3]),
                  orNumber: String(shData[i][4]),
                  status: String(shData[i][5]), // Private or Public
                  livestockType: String(shData[i][6]), // Hogs, Cow, etc.
                  headCount: parseFloat(shData[i][7]) || 0,
                  amount: parseFloat(shData[i][8]) || 0
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
              todaData.push({
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
              memberData.push({
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
    csuData: csuData
  };

}

// --- SLAUGHTERHOUSE MANAGEMENT ---

function saveSlaughterData(data) {
  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let sheet = ss.getSheetByName('slaughter_logs');
      
      // Auto-create sheet if it doesn't exist
      if (!sheet) {
          sheet = ss.insertSheet('slaughter_logs');
          sheet.appendRow(['Timestamp', 'ClientID', 'Name of Client', 'Contact No.', 'OR #', 'Status', 'Livestock', 'No. of Livestock', 'Amount']);
          sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#f3f3f3");
          sheet.setFrozenRows(1);
      }
      
      // Generate simple ClientID for history profiling
      const clientId = data.clientId || ('C-' + new Date().getTime().toString().slice(-6));
      
      sheet.appendRow([
          new Date(), clientId, data.clientName, data.contact, data.orNumber, 
          data.status, data.livestockType, data.headCount, parseFloat(data.amount) || 0
      ]);

      logSystemEvent('System', 'Slaughterhouse', `Logged ${data.headCount} ${data.livestockType} (₱${data.amount}) for ${data.clientName}`);
      return { success: true, clientId: clientId };
  } catch (e) {
      return { success: false, message: e.message };
  } finally {
      lock.releaseLock();
  }
}

// --- ASSET MANAGEMENT ---

function getVendorImage(vendorName) {
  if (!vendorName) return null;
  const FOLDER_ID = '1jPe0AURsHSBmd6v47v-szWSwaWYCiVN3'; 
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.searchFiles(`title contains '${vendorName.replace(/'/g, "\\'")}' and trashed = false`);
    if (files.hasNext()) return `data:${files.next().getMimeType()};base64,${Utilities.base64Encode(files.next().getBlob().getBytes())}`;
  } catch (e) {}
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
    const existingFiles = folder.searchFiles(`title contains '${vendorName.replace(/'/g, "\\'")}' and trashed = false`);
    while (existingFiles.hasNext()) existingFiles.next().setTrashed(true);
    folder.createFile(Utilities.newBlob(Utilities.base64Decode(data), mimeType, vendorName));
    logSystemEvent('System', 'Image Upload', `Updated photo for ${vendorName}`);
    return { success: true };
  } catch (e) { return { success: false, message: e.message }; }
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
      
      sheet.appendRow([new Date(), data.regNo, data.name, data.president, data.contact, data.membersCount, data.address]);
      logSystemEvent('System', 'Transport Terminal', `Registered new TODA: ${data.name}`);
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
      
      sheet.appendRow([new Date(), data.todaName, data.lastName, data.firstName, data.middleName, data.extName, data.sex, data.barangay, data.municipality, data.contact, data.idType, data.idNumber, data.idExpiry]);
      return { success: true };
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
      const managerEmail = "mvcachuela@gmail.com"; // <--- CHANGE TO ACTUAL EMAIL
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