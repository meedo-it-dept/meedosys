'use client';

import React, { useState, useMemo } from 'react';
import { useMeedo } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ElectricBill } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Printer,
  Table as TableIcon,
  Save,
  CheckCircle2,
  FileText,
  Lock,
  Unlock,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Scissors,
  Copy,
  Layers,
  Sparkles,
  LayoutTemplate,
} from 'lucide-react';

// Generates printable HTML formatted for 4-to-a-page (2x2 grid) on A4 or US Letter
function generatePrintHtml(
  sheets: ({ bill: ElectricBill; copyLabel?: string } | null)[][],
  paperSize: 'a4' | 'letter',
  orientation: 'portrait' | 'landscape',
  showCutGuides: boolean
) {
  const isLetter = paperSize === 'letter';
  const isLandscape = orientation === 'landscape';

  const sheetWidth = isLandscape
    ? isLetter ? '267mm' : '284mm'
    : isLetter ? '203mm' : '198mm';

  const sheetHeight = isLandscape
    ? isLetter ? '203mm' : '198mm'
    : isLetter ? '266mm' : '284mm';

  const sheetsHtml = sheets
    .map((sheet, sheetIdx) => {
      const cardsHtml = sheet
        .map((slot) => {
          if (!slot) {
            return `<div class="empty-card"></div>`;
          }
          const { bill: b, copyLabel } = slot;
          const totalAmount = typeof b.bill_amount === 'number' ? b.bill_amount : parseFloat(String(b.bill_amount || 0));
          const arrears = typeof b.arrears === 'number' ? b.arrears : parseFloat(String(b.arrears || 0));

          if (isLandscape) {
            // WIDE / LANDSCAPE SLIP (2 columns side-by-side inside card)
            return `
              <div class="bill-card landscape-slip">
                ${copyLabel ? `<div class="copy-badge">${copyLabel}</div>` : ''}

                <!-- Header -->
                <div class="slip-header-ls">
                  <div class="muni-title-ls">MUNICIPALITY OF MALUNGON • PROVINCE OF SARANGANI</div>
                  <div class="dept-title-ls">Municipal Economic Enterprise Development Office (MEEDO)</div>
                  <div class="statement-title-ls">ELECTRIC UTILITY BILLING STATEMENT</div>
                  <div class="header-divider-ls"></div>
                </div>

                <!-- 2-Column Body -->
                <div class="body-grid-ls">
                  <!-- Left: Stall Info, Dates, and Notice -->
                  <div class="col-left-ls">
                    <div class="account-card-ls">
                      <div class="field-row-ls">
                        <span class="label-ls">Stall No:</span>
                        <span class="val-stall-ls">${b.stall_no}</span>
                      </div>
                      <div class="field-row-ls">
                        <span class="label-ls">Concessionaire:</span>
                        <span class="val-owner-ls">${b.owner_name || 'Vacant'}</span>
                      </div>
                      <div class="field-divider-ls"></div>
                      <div class="field-row-ls">
                        <span class="label-ls">Due Date:</span>
                        <span class="val-due-ls">${formatDate(b.due_date)}</span>
                      </div>
                      <div class="field-row-ls">
                        <span class="label-ls">Disconnection:</span>
                        <span class="val-disc-ls">${b.disconnection_date ? formatDate(b.disconnection_date) : '—'}</span>
                      </div>
                    </div>

                    <div class="notice-box-ls">
                      <strong>Reminder:</strong> Settle on or before due date to avoid service disconnection. Present at MEEDO / Cashier.
                    </div>
                  </div>

                  <!-- Right: Readings & Computation Table -->
                  <div class="col-right-ls">
                    <div class="reading-card-ls">
                      <div class="calc-row-ls">
                        <span>Prev Reading:</span>
                        <span class="mono">${Number(b.prev_reading || 0).toFixed(1)} kWh</span>
                      </div>
                      <div class="calc-row-ls">
                        <span>Curr Reading:</span>
                        <span class="mono">${Number(b.curr_reading || 0).toFixed(1)} kWh</span>
                      </div>
                      <div class="calc-divider-thin-ls"></div>
                      <div class="calc-row-ls font-bold">
                        <span>Consumption:</span>
                        <span class="text-blue">${Number(b.consumption || 0).toFixed(1)} kWh</span>
                      </div>
                      <div class="calc-row-ls">
                        <span>Rate / kWh:</span>
                        <span>₱${Number(b.rate_per_kwh || 0).toFixed(2)}</span>
                      </div>
                      ${arrears > 0 ? `
                      <div class="calc-row-ls text-rose">
                        <span>Prev Arrears:</span>
                        <span class="font-bold">₱${arrears.toFixed(2)}</span>
                      </div>` : ''}
                      <div class="calc-divider-thick-ls"></div>
                      <div class="total-row-ls">
                        <span class="total-label-ls">TOTAL AMOUNT DUE:</span>
                        <span class="total-val-ls">₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer: Signatures & System Reference -->
                <div class="footer-row-ls">
                  <div class="sig-wrapper-ls">
                    <div class="sig-unit-ls">
                      <div class="sig-line-ls"></div>
                      <div class="sig-label-ls">Billing Clerk / Meter Reader</div>
                    </div>
                    <div class="sig-unit-ls">
                      <div class="sig-line-ls"></div>
                      <div class="sig-label-ls">Concessionaire / Received By</div>
                    </div>
                  </div>
                  <div class="system-tag-ls">
                    MEEDO Market System • Official Bill • Stall ${b.stall_no}
                  </div>
                </div>
              </div>
            `;
          }

          // PORTRAIT SLIP (Stacked vertical with zero dead space)
          return `
            <div class="bill-card portrait-slip">
              ${copyLabel ? `<div class="copy-badge">${copyLabel}</div>` : ''}
              
              <!-- Header -->
              <div class="slip-header-pt">
                <div class="muni-title-pt">MUNICIPALITY OF MALUNGON</div>
                <div class="province-title-pt">Province of Sarangani</div>
                <div class="dept-title-pt">Municipal Economic Enterprise Development Office (MEEDO)</div>
                <div class="statement-title-pt">ELECTRIC UTILITY BILLING STATEMENT</div>
                <div class="header-divider-pt"></div>
              </div>

              <!-- Account & Stall Box -->
              <div class="account-card-pt">
                <div class="account-grid-pt">
                  <div>
                    <span class="meta-label-pt">Stall Number:</span>
                    <div class="meta-stall-pt">${b.stall_no}</div>
                  </div>
                  <div>
                    <span class="meta-label-pt">Tenant / Owner:</span>
                    <div class="meta-owner-pt">${b.owner_name || 'Vacant / N/A'}</div>
                  </div>
                  <div>
                    <span class="meta-label-pt">Due Date:</span>
                    <div class="meta-due-pt">${formatDate(b.due_date)}</div>
                  </div>
                  <div>
                    <span class="meta-label-pt">Disconnection Date:</span>
                    <div class="meta-disc-pt">${b.disconnection_date ? formatDate(b.disconnection_date) : '—'}</div>
                  </div>
                </div>
              </div>

              <!-- Readings & Computation Box -->
              <div class="reading-card-pt">
                <div class="reading-row-pt">
                  <span class="calc-label-pt">Previous Meter Reading:</span>
                  <span class="calc-val-pt mono">${Number(b.prev_reading || 0).toFixed(1)} kWh</span>
                </div>
                <div class="reading-row-pt">
                  <span class="calc-label-pt">Current Meter Reading:</span>
                  <span class="calc-val-pt mono">${Number(b.curr_reading || 0).toFixed(1)} kWh</span>
                </div>
                <div class="divider-thin-pt"></div>
                <div class="reading-row-pt">
                  <span class="calc-label-pt font-bold">Total Power Consumption:</span>
                  <span class="calc-val-pt font-extrabold text-blue">${Number(b.consumption || 0).toFixed(1)} kWh</span>
                </div>
                <div class="reading-row-pt">
                  <span class="calc-label-pt">Applicable Rate per kWh:</span>
                  <span class="calc-val-pt">₱${Number(b.rate_per_kwh || 0).toFixed(2)}</span>
                </div>
                ${arrears > 0 ? `
                <div class="reading-row-pt text-rose">
                  <span class="calc-label-pt font-semibold text-rose">Previous Unpaid Balance:</span>
                  <span class="calc-val-pt font-bold text-rose">₱${arrears.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>` : ''}
                <div class="divider-thick-pt"></div>
                <div class="total-row-pt">
                  <span class="total-label-pt">TOTAL AMOUNT DUE:</span>
                  <span class="total-val-pt">₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <!-- Settlement Notice -->
              <div class="notice-box-pt">
                <strong>Notice:</strong> Please settle your utility bill on or before the due date to avoid service disconnection. Present this statement at the MEEDO / Cashier.
              </div>

              <!-- Signatures & Verification -->
              <div class="signatures-pt">
                <div class="sig-col-pt">
                  <div class="sig-line-pt"></div>
                  <div class="sig-label-pt">Billing In-Charge / Reader</div>
                </div>
                <div class="sig-col-pt">
                  <div class="sig-line-pt"></div>
                  <div class="sig-label-pt">Concessionaire / Received By</div>
                </div>
              </div>

              <!-- System Stamp -->
              <div class="system-stamp-pt">
                MEEDO Market System • Official Utility Billing Statement • Stall ${b.stall_no}
              </div>
            </div>
          `;
        })
        .join('');

      const cutGuidesHtml = showCutGuides
        ? `
          <div class="cut-line-h">
            <span class="cut-tag">✂ - - - - - - - - - - - - - - cut here - - - - - - - - - - - - - - ✂</span>
          </div>
          <div class="cut-line-v">
            <span class="cut-tag" style="writing-mode: vertical-rl; transform: rotate(180deg);">✂ - - - cut here - - - ✂</span>
          </div>
        `
        : '';

      return `
        <div class="sheet-wrapper" data-sheet="${sheetIdx + 1}">
          ${cardsHtml}
          ${cutGuidesHtml}
        </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Electric Utility Billing Statements - 4x4 (${paperSize.toUpperCase()} ${orientation.toUpperCase()})</title>
  <style>
    @page {
      size: ${isLetter ? 'letter' : 'A4'} ${isLandscape ? 'landscape' : 'portrait'};
      margin: 6mm 6mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
    }
    .sheet-wrapper {
      width: ${sheetWidth};
      height: ${sheetHeight};
      max-height: ${sheetHeight};
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 5mm 6mm;
      position: relative;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
      box-sizing: border-box;
    }
    .sheet-wrapper:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .empty-card {
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      height: 100%;
      background: #fafafa;
    }

    /* Common Card Styling */
    .bill-card {
      border: 2px solid #0f172a;
      border-radius: 12px;
      background: #ffffff;
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
    }
    .copy-badge {
      position: absolute;
      top: 5px;
      right: 7px;
      font-size: 6.5pt;
      font-weight: 800;
      background: #e2e8f0;
      color: #334155;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      z-index: 10;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .font-bold { font-weight: 700; }
    .font-extrabold { font-weight: 800; }
    .text-blue { color: #1d4ed8; }
    .text-rose { color: #dc2626; }

    /* ========================================================
       PORTRAIT SLIP STYLES (Balanced Vertical Flow)
       ======================================================== */
    .portrait-slip {
      padding: 7px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 3px;
      height: 100%;
    }
    .slip-header-pt {
      text-align: center;
      padding-top: 1px;
    }
    .muni-title-pt {
      font-weight: 800;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #0f172a;
      line-height: 1.15;
    }
    .province-title-pt {
      font-size: 6.5pt;
      color: #64748b;
      line-height: 1.15;
      font-weight: 600;
      text-transform: uppercase;
    }
    .dept-title-pt {
      font-weight: 600;
      font-size: 6.8pt;
      color: #334155;
      line-height: 1.15;
      margin-top: 1px;
    }
    .statement-title-pt {
      font-weight: 900;
      font-size: 8.8pt;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #0f172a;
      margin-top: 2px;
      line-height: 1.15;
    }
    .header-divider-pt {
      border-bottom: 2px solid #0f172a;
      margin: 3px 0 2px 0;
    }
    .account-card-pt {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 7px;
      padding: 5px 8px;
    }
    .account-grid-pt {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px 8px;
      font-size: 7.2pt;
      line-height: 1.25;
    }
    .meta-label-pt {
      color: #64748b;
      font-size: 6.5pt;
      font-weight: 600;
      display: block;
    }
    .meta-stall-pt {
      font-size: 10pt;
      font-weight: 900;
      color: #0f172a;
    }
    .meta-owner-pt {
      font-size: 8pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      word-break: break-word;
    }
    .meta-due-pt {
      font-size: 8pt;
      font-weight: 800;
      color: #b91c1c;
    }
    .meta-disc-pt {
      font-size: 7.8pt;
      font-weight: 700;
      color: #1e293b;
    }
    .reading-card-pt {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 7px;
      padding: 5px 8px;
      font-size: 7.2pt;
      line-height: 1.35;
    }
    .reading-row-pt {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .calc-label-pt {
      color: #475569;
    }
    .calc-val-pt {
      color: #0f172a;
      font-weight: 600;
    }
    .divider-thin-pt {
      border-top: 1px solid #e2e8f0;
      margin: 2px 0;
    }
    .divider-thick-pt {
      border-top: 2px solid #0f172a;
      margin: 3px 0 2px 0;
    }
    .total-row-pt {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 8.5pt;
      font-weight: 900;
      color: #0f172a;
    }
    .total-val-pt {
      font-size: 10.5pt;
      font-weight: 900;
      color: #1e3a8a;
    }
    .notice-box-pt {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 6px;
      padding: 3px 6px;
      font-size: 6.2pt;
      color: #78350f;
      line-height: 1.25;
      text-align: center;
    }
    .signatures-pt {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 0 4px;
      margin-top: 1px;
    }
    .sig-col-pt {
      text-align: center;
    }
    .sig-line-pt {
      border-bottom: 1px solid #475569;
      height: 11px;
    }
    .sig-label-pt {
      font-size: 5.8pt;
      color: #64748b;
      margin-top: 1.5px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .system-stamp-pt {
      font-size: 5.5pt;
      color: #94a3b8;
      text-align: center;
      letter-spacing: 0.2px;
    }

    /* ========================================================
       LANDSCAPE SLIP STYLES (Wide 2-Column Balance)
       ======================================================== */
    .landscape-slip {
      padding: 7px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      gap: 3px;
    }
    .slip-header-ls {
      text-align: center;
    }
    .muni-title-ls {
      font-weight: 800;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #0f172a;
      line-height: 1.15;
    }
    .dept-title-ls {
      font-weight: 600;
      font-size: 6.5pt;
      color: #475569;
      line-height: 1.15;
    }
    .statement-title-ls {
      font-weight: 900;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #0f172a;
      margin-top: 1px;
      line-height: 1.15;
    }
    .header-divider-ls {
      border-bottom: 2px solid #0f172a;
      margin: 3px 0 2px 0;
    }
    .body-grid-ls {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 6px;
      flex: 1;
      align-items: stretch;
    }
    .col-left-ls {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 3px;
    }
    .account-card-ls {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px 6px;
      font-size: 7pt;
      line-height: 1.25;
    }
    .field-row-ls {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .label-ls {
      color: #64748b;
      font-size: 6.5pt;
      font-weight: 600;
    }
    .val-stall-ls {
      font-weight: 900;
      font-size: 9pt;
      color: #0f172a;
    }
    .val-owner-ls {
      font-weight: 800;
      font-size: 7.5pt;
      color: #0f172a;
      text-transform: uppercase;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .val-due-ls {
      font-weight: 800;
      color: #b91c1c;
      font-size: 7.5pt;
    }
    .val-disc-ls {
      font-weight: 700;
      color: #1e293b;
      font-size: 7.2pt;
    }
    .field-divider-ls {
      border-top: 1px solid #e2e8f0;
      margin: 2px 0;
    }
    .notice-box-ls {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 5px;
      padding: 3px 5px;
      font-size: 6pt;
      color: #78350f;
      line-height: 1.2;
    }
    .col-right-ls {
      display: flex;
      flex-direction: column;
      justify-content: stretch;
    }
    .reading-card-ls {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 6px;
      font-size: 7pt;
      line-height: 1.35;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .calc-row-ls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #334155;
    }
    .calc-divider-thin-ls {
      border-top: 1px solid #e2e8f0;
      margin: 1.5px 0;
    }
    .calc-divider-thick-ls {
      border-top: 2px solid #0f172a;
      margin: 2px 0 1.5px 0;
    }
    .total-row-ls {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 8pt;
      font-weight: 900;
      color: #0f172a;
    }
    .total-val-ls {
      font-size: 9.8pt;
      font-weight: 900;
      color: #1e3a8a;
    }
    .footer-row-ls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 2px;
      margin-top: 2px;
    }
    .sig-wrapper-ls {
      display: flex;
      gap: 12px;
      flex: 1;
    }
    .sig-unit-ls {
      flex: 1;
      text-align: center;
    }
    .sig-line-ls {
      border-bottom: 1px solid #475569;
      height: 10px;
    }
    .sig-label-ls {
      font-size: 5.5pt;
      color: #64748b;
      margin-top: 1px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .system-tag-ls {
      font-size: 5.5pt;
      color: #94a3b8;
      text-align: right;
      padding-left: 6px;
    }

    /* Cut Guides Overlay */
    .cut-line-h {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      border-top: 1px dashed #94a3b8;
      transform: translateY(-50%);
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cut-line-v {
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      border-left: 1px dashed #94a3b8;
      transform: translateX(-50%);
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cut-tag {
      background: #ffffff;
      padding: 0 4px;
      font-size: 6.5pt;
      color: #94a3b8;
      font-family: monospace;
    }
  </style>
</head>
<body>
  ${sheetsHtml}
</body>
</html>
  `;
}

export default function ElectricBillingPage() {
  const { stalls, electricBills, addElectricBill, updateBillStatus } = useMeedo();

  const [rate, setRate] = useState<number>(15.0);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [discDate, setDiscDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 20);
    return d.toISOString().split('T')[0];
  });

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedStall, setSelectedStall] = useState('');
  const [prevReading, setPrevReading] = useState(0);
  const [currReading, setCurrReading] = useState(0);
  const [arrears, setArrears] = useState(0);
  const [meterReset, setMeterReset] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Batch readings state: stallNo -> curr reading
  const [batchReadings, setBatchReadings] = useState<Record<string, { curr: number }>>({});

  // Pagination & Filtering for Electric Utility Ledger
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<'all' | 'Unpaid' | 'Partial' | 'Fully Paid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 4x4 Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTargetBill, setPrintTargetBill] = useState<ElectricBill | null>(null);
  const [printLayoutMode, setPrintLayoutMode] = useState<
    'single-4copies' | 'single-1slip' | 'batch-due' | 'batch-filtered'
  >('single-4copies');
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [showCopyLabels, setShowCopyLabels] = useState(true);
  const [previewSheetIndex, setPreviewSheetIndex] = useState(0);

  const filteredBills = useMemo(() => {
    return electricBills.filter((bill) => {
      const term = ledgerSearch.toLowerCase().trim();
      const matchesSearch =
        term === '' ||
        bill.stall_no.toLowerCase().includes(term) ||
        (bill.owner_name || '').toLowerCase().includes(term);

      const matchesStatus =
        ledgerStatusFilter === 'all' || bill.status === ledgerStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [electricBills, ledgerSearch, ledgerStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedBills = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredBills.slice(start, start + itemsPerPage);
  }, [filteredBills, safeCurrentPage, itemsPerPage]);

  const activeStall = stalls.find((s) => s.stall_no === selectedStall);

  const handleSelectStall = (stallNo: string) => {
    setSelectedStall(stallNo);
    const lastBill = electricBills.find((b) => b.stall_no === stallNo);
    const prev = lastBill ? lastBill.curr_reading : 100;
    setPrevReading(prev);
    setCurrReading(prev);
    setArrears(lastBill && lastBill.status === 'Unpaid' ? lastBill.bill_amount : 0);
  };

  const handleToggleMeterReset = (checked: boolean) => {
    setMeterReset(checked);
    if (!checked) {
      const lastBill = electricBills.find((b) => b.stall_no === selectedStall);
      const prev = lastBill ? lastBill.curr_reading : 100;
      setPrevReading(prev);
    } else {
      setPrevReading(0);
    }
  };

  const consumption = meterReset
    ? Math.max(0, currReading)
    : Math.max(0, currReading - prevReading);
  const totalAmount = consumption * rate + arrears;

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStall) return;

    const newBill: ElectricBill = {
      stall_no: selectedStall,
      owner_name: activeStall?.current_tenant?.stall_owner || 'Unknown',
      due_date: dueDate,
      disconnection_date: discDate,
      prev_reading: prevReading,
      curr_reading: currReading,
      consumption,
      rate_per_kwh: rate,
      arrears,
      bill_amount: totalAmount,
      meter_reset: meterReset,
      status: 'Unpaid',
      created_at: new Date().toISOString(),
    };

    addElectricBill(newBill);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveBatchItem = (stallNo: string) => {
    const lastBill = electricBills.find((b) => b.stall_no === stallNo);
    const prev = lastBill ? lastBill.curr_reading : 100;
    const curr = batchReadings[stallNo]?.curr ?? prev;
    const cons = Math.max(0, curr - prev);
    const bill = cons * rate;
    const stall = stalls.find((s) => s.stall_no === stallNo);

    const newBill: ElectricBill = {
      stall_no: stallNo,
      owner_name: stall?.current_tenant?.stall_owner || 'Unknown',
      due_date: dueDate,
      disconnection_date: discDate,
      prev_reading: prev,
      curr_reading: curr,
      consumption: cons,
      rate_per_kwh: rate,
      arrears: 0,
      bill_amount: bill,
      status: 'Unpaid',
      created_at: new Date().toISOString(),
    };

    addElectricBill(newBill);
  };

  // Open 4x4 print modal for a single stall/bill
  const handleOpenSinglePrint = (bill: ElectricBill) => {
    setPrintTargetBill(bill);
    setPrintLayoutMode('single-4copies');
    setPreviewSheetIndex(0);
    setShowPrintModal(true);
  };

  // Open 4x4 print modal for the form draft bill
  const handlePrintDraftBill = () => {
    if (!selectedStall) return;
    const draftBill: ElectricBill = {
      stall_no: selectedStall,
      owner_name: activeStall?.current_tenant?.stall_owner || 'Unknown',
      due_date: dueDate,
      disconnection_date: discDate,
      prev_reading: prevReading,
      curr_reading: currReading,
      consumption,
      rate_per_kwh: rate,
      arrears,
      bill_amount: totalAmount,
      meter_reset: meterReset,
      status: 'Unpaid',
      created_at: new Date().toISOString(),
    };
    handleOpenSinglePrint(draftBill);
  };

  // Open 4x4 print modal for batch bills
  const handleOpenBatchPrint = (mode: 'due' | 'filtered') => {
    setPrintLayoutMode(mode === 'due' ? 'batch-due' : 'batch-filtered');
    setPreviewSheetIndex(0);
    setShowPrintModal(true);
  };

  // Prepare sheets of 4 slips for printing and interactive preview
  const printSheets = useMemo(() => {
    type SheetSlot = { bill: ElectricBill; copyLabel?: string } | null;
    const copyLabels = ['TENANT COPY', 'MEEDO COPY', 'CASHIER COPY', 'AUDITOR COPY'];

    if (printLayoutMode === 'single-4copies' && printTargetBill) {
      return [
        [
          { bill: printTargetBill, copyLabel: showCopyLabels ? copyLabels[0] : undefined },
          { bill: printTargetBill, copyLabel: showCopyLabels ? copyLabels[1] : undefined },
          { bill: printTargetBill, copyLabel: showCopyLabels ? copyLabels[2] : undefined },
          { bill: printTargetBill, copyLabel: showCopyLabels ? copyLabels[3] : undefined },
        ] as SheetSlot[],
      ];
    }

    if (printLayoutMode === 'single-1slip' && printTargetBill) {
      return [
        [
          { bill: printTargetBill, copyLabel: showCopyLabels ? 'ORIGINAL' : undefined },
          null,
          null,
          null,
        ] as SheetSlot[],
      ];
    }

    const billsToPrint =
      printLayoutMode === 'batch-due'
        ? electricBills.filter((b) => b.due_date === dueDate)
        : filteredBills;

    const sheets: SheetSlot[][] = [];
    for (let i = 0; i < billsToPrint.length; i += 4) {
      const chunk = billsToPrint.slice(i, i + 4);
      const sheet: SheetSlot[] = [
        chunk[0] ? { bill: chunk[0] } : null,
        chunk[1] ? { bill: chunk[1] } : null,
        chunk[2] ? { bill: chunk[2] } : null,
        chunk[3] ? { bill: chunk[3] } : null,
      ];
      sheets.push(sheet);
    }

    if (sheets.length === 0) {
      sheets.push([null, null, null, null]);
    }

    return sheets;
  }, [
    printLayoutMode,
    printTargetBill,
    electricBills,
    dueDate,
    filteredBills,
    showCopyLabels,
  ]);

  const totalSheets = printSheets.length;
  const currentSheet = printSheets[Math.min(previewSheetIndex, totalSheets - 1)] || [null, null, null, null];

  // Execute printing in dedicated popup window
  const handleTriggerPrint = () => {
    const printWin = window.open('', '_blank', 'width=1050,height=800');
    if (!printWin) {
      window.print();
      return;
    }

    const html = generatePrintHtml(printSheets, paperSize, orientation, showCutGuides);
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();

    setTimeout(() => {
      printWin.print();
    }, 350);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Electric Utility Billing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single & batch meter reading calculation, arrears tracking, and balanced 4x4 A4/Letter slip printing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBatchMode(!isBatchMode)}
          >
            <TableIcon className="w-4 h-4 mr-1.5 text-blue-600" />
            {isBatchMode ? 'Switch to Single Entry' : 'Batch Entry Mode'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenBatchPrint('due')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Print 4-to-a-Page (A4/Letter)
          </Button>
        </div>
      </div>

      {/* Billing Configuration Card */}
      <Card className="bg-blue-50/50 border-blue-200 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1 text-blue-950 font-bold">Rate per kWh (₱)</label>
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
              className="w-full text-sm px-3 py-2 border border-blue-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-blue-950 font-bold">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-blue-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-blue-950 font-bold">Disconnection Date</label>
            <input
              type="date"
              value={discDate}
              onChange={(e) => setDiscDate(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-blue-200 rounded-lg bg-white"
            />
          </div>
        </div>
      </Card>

      {/* SINGLE ENTRY MODE */}
      {!isBatchMode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          <Card className="lg:col-span-1">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Generate Single Bill</h3>
            <form onSubmit={handleSaveSingle} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Stall</label>
                <select
                  value={selectedStall}
                  onChange={(e) => handleSelectStall(e.target.value)}
                  required
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Choose a stall...</option>
                  {stalls.map((s) => (
                    <option key={s.stall_no} value={s.stall_no}>
                      {s.stall_no} - {s.current_tenant?.stall_owner || 'Vacant'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStall && (
                <>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                    <span className="block font-semibold">Tenant:</span>
                    <span className="text-sm font-bold text-blue-700">
                      {activeStall?.current_tenant?.stall_owner || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                        Previous Reading (kWh)
                        {!meterReset && <Lock className="w-3 h-3 text-slate-400" />}
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={meterReset}
                          onChange={(e) => handleToggleMeterReset(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Meter Reset</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      value={prevReading}
                      readOnly={!meterReset}
                      tabIndex={!meterReset ? -1 : 0}
                      onChange={(e) => setPrevReading(parseFloat(e.target.value) || 0)}
                      className={`w-full text-sm px-3 py-2 border rounded-lg font-mono transition-all ${
                        !meterReset
                          ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed select-none'
                          : 'bg-white border-amber-300 ring-1 ring-amber-400 text-slate-900 font-bold'
                      }`}
                    />
                    {!meterReset ? (
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Auto-carried from last bill. Check &quot;Meter Reset&quot; to override.
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-semibold">
                        <Unlock className="w-2.5 h-2.5" /> Unlocked for replacement meter baseline.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Current Reading (kWh) <span className="text-blue-600 font-normal text-[11px]">(Active Entry)</span>
                    </label>
                    <input
                      type="number"
                      value={currReading}
                      onChange={(e) => setCurrReading(parseFloat(e.target.value) || 0)}
                      required
                      placeholder="Enter new meter reading..."
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Arrears / Unpaid Balance (₱)</label>
                    <input
                      type="number"
                      value={arrears}
                      onChange={(e) => setArrears(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white text-rose-600 font-bold"
                    />
                  </div>

                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>Consumption:</span>
                      <strong className="text-slate-800">{consumption.toFixed(1)} kWh</strong>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-blue-900 border-t border-blue-200/60 pt-1.5 mt-1.5">
                      <span>Total Bill:</span>
                      <span className="text-base text-blue-700 font-extrabold">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button type="submit" variant="primary" className="flex-1">
                      <Save className="w-4 h-4 mr-1.5" /> Save Bill
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrintDraftBill}
                      className="flex-1 text-slate-700 hover:text-blue-700 hover:border-blue-300"
                      title="Print 4x4 Statement in A4 / Letter"
                    >
                      <Printer className="w-4 h-4 mr-1.5 text-blue-600" /> Print 4x4 Slip
                    </Button>
                  </div>

                  {savedSuccess && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold justify-center">
                      <CheckCircle2 className="w-4 h-4" /> Bill saved successfully!
                    </div>
                  )}
                </>
              )}
            </form>
          </Card>

          {/* Electric Bills Ledger Table */}
          <Card className="lg:col-span-2 flex flex-col justify-between">
            <div>
              {/* Ledger Header & Search/Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Electric Utility Ledger</h3>
                  <Badge variant="neutral" className="text-[10px]">
                    {filteredBills.length} {filteredBills.length === 1 ? 'Record' : 'Records'}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <div className="relative min-w-[150px] sm:min-w-[170px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => {
                        setLedgerSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search stall or owner..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                    />
                    {ledgerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setLedgerSearch('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <select
                    value={ledgerStatusFilter}
                    onChange={(e) => {
                      setLedgerStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    <option value="all">All Status</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Fully Paid">Fully Paid</option>
                  </select>

                  {/* Rows Per Page */}
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                    title="Rows per page"
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>

                  {/* Batch Print Filtered */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenBatchPrint('filtered')}
                    className="text-xs h-7 px-2 border-slate-300 hover:text-blue-700"
                    title="Print 4x4 sheets for all current filtered records"
                  >
                    <Layers className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    Print Filtered (4x4)
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2.5 px-3">Stall No.</th>
                      <th className="py-2.5 px-3">Owner</th>
                      <th className="py-2.5 px-3">Readings</th>
                      <th className="py-2.5 px-3">Cons.</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedBills.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          No electric utility records found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedBills.map((bill) => (
                        <tr key={bill.id || bill.stall_no} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{bill.stall_no}</td>
                          <td className="py-2.5 px-3 text-slate-700">{bill.owner_name}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">
                            <span>{bill.prev_reading}</span>
                            <span className="mx-1.5 text-slate-400">→</span>
                            <span>{bill.curr_reading}</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold">{bill.consumption} kWh</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {formatCurrency(bill.bill_amount)}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={
                                bill.status === 'Fully Paid'
                                  ? 'success'
                                  : bill.status === 'Partial'
                                  ? 'warning'
                                  : 'danger'
                              }
                            >
                              {bill.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              {bill.status === 'Unpaid' ? (
                                <button
                                  onClick={() => updateBillStatus(bill.stall_no, 'Fully Paid')}
                                  className="text-[11px] font-semibold text-emerald-600 hover:underline shrink-0"
                                >
                                  Mark Paid
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 shrink-0">Settled</span>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenSinglePrint(bill)}
                                className="h-6 px-2 text-[10px] flex items-center gap-1 border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300"
                                title="Print 4x4 Statement on A4 / Letter"
                              >
                                <Printer className="w-3 h-3 text-blue-600" />
                                <span>4x4</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {filteredBills.length > 0 && (
              <div className="pt-4 mt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  Showing{' '}
                  <span className="font-bold text-slate-800">
                    {(safeCurrentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-slate-800">
                    {Math.min(safeCurrentPage * itemsPerPage, filteredBills.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-slate-800">{filteredBills.length}</span> entries
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1.5 h-7 w-7 text-xs flex items-center justify-center"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="text-xs h-7 px-2.5 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </Button>
                  <span className="px-2 font-bold text-slate-700">
                    Page {safeCurrentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="text-xs h-7 px-2.5 flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1.5 h-7 w-7 text-xs flex items-center justify-center"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* BATCH ENTRY MODE */}
      {isBatchMode && (
        <Card className="no-print">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Batch Reading Entry</h3>
              <p className="text-xs text-slate-500">Encode meter readings for all stalls simultaneously.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-3">Stall No.</th>
                  <th className="py-2.5 px-3">Tenant</th>
                  <th className="py-2.5 px-3">Previous (kWh)</th>
                  <th className="py-2.5 px-3 w-32">Current (kWh)</th>
                  <th className="py-2.5 px-3">Cons (kWh)</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stalls.map((stall) => {
                  const lastBill = electricBills.find((b) => b.stall_no === stall.stall_no);
                  const prev = lastBill ? lastBill.curr_reading : 100;
                  const curr = batchReadings[stall.stall_no]?.curr ?? prev;
                  const cons = Math.max(0, curr - prev);
                  const total = cons * rate;

                  return (
                    <tr key={stall.stall_no} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{stall.stall_no}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {stall.current_tenant?.stall_owner || 'Vacant'}
                      </td>
                      <td className="py-2 px-3 font-mono">{prev}</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={curr}
                          onChange={(e) =>
                            setBatchReadings({
                              ...batchReadings,
                              [stall.stall_no]: { curr: parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="w-24 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold">{cons}</td>
                      <td className="py-2 px-3 font-bold text-blue-700">{formatCurrency(total)}</td>
                      <td className="py-2 px-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveBatchItem(stall.stall_no)}
                        >
                          Save
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 4x4 BILLING STATEMENT PRINT PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    Print Electric Utility Statements
                    <Badge variant="info" className="text-[10px] font-bold">
                      4x4 Grid on {paperSize.toUpperCase()} ({orientation.toUpperCase()})
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Balanced 4-per-sheet layout with zero dead space, official municipal styling, and scissors cut guides.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls Bar */}
            <div className="p-4 bg-white border-b border-slate-200/80 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Print Layout Mode selector */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {printTargetBill && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPrintLayoutMode('single-4copies');
                          setPreviewSheetIndex(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          printLayoutMode === 'single-4copies'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        4 Copies of Stall {printTargetBill.stall_no}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPrintLayoutMode('single-1slip');
                          setPreviewSheetIndex(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          printLayoutMode === 'single-1slip'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        1 Slip Only
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPrintLayoutMode('batch-due');
                      setPreviewSheetIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      printLayoutMode === 'batch-due'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Batch: Due Date ({electricBills.filter((b) => b.due_date === dueDate).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrintLayoutMode('batch-filtered');
                      setPreviewSheetIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      printLayoutMode === 'batch-filtered'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Batch: Filtered ({filteredBills.length})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Orientation selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-bold">
                    <span className="text-[11px] text-slate-500 px-1.5 font-medium">Layout:</span>
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        orientation === 'portrait'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Portrait (Vertical)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        orientation === 'landscape'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Landscape (Wide)
                    </button>
                  </div>

                  {/* Paper Size selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-bold">
                    <span className="text-[11px] text-slate-500 px-1.5 font-medium">Paper:</span>
                    <button
                      type="button"
                      onClick={() => setPaperSize('a4')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        paperSize === 'a4'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      A4
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperSize('letter')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        paperSize === 'letter'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Letter
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-4 text-slate-600 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={showCutGuides}
                    onChange={(e) => setShowCutGuides(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <Scissors className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dashed Center Cut Guides (✂)</span>
                </label>

                {printLayoutMode === 'single-4copies' && (
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={showCopyLabels}
                      onChange={(e) => setShowCopyLabels(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Badges (Tenant, MEEDO, Cashier, Auditor)</span>
                  </label>
                )}
              </div>
            </div>

            {/* Interactive Visual Sheet Preview */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex flex-col items-center justify-start">
              {/* Sheet Navigation Bar */}
              {totalSheets > 1 && (
                <div className="mb-3 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-xs border border-slate-200 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={previewSheetIndex <= 0}
                    onClick={() => setPreviewSheetIndex((p) => Math.max(0, p - 1))}
                    className="h-6 px-2 text-[11px]"
                  >
                    <ChevronLeft className="w-3 h-3 mr-0.5" /> Prev Sheet
                  </Button>
                  <span className="font-bold text-slate-700 px-2">
                    Sheet {previewSheetIndex + 1} of {totalSheets}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={previewSheetIndex >= totalSheets - 1}
                    onClick={() => setPreviewSheetIndex((p) => Math.min(totalSheets - 1, p + 1))}
                    className="h-6 px-2 text-[11px]"
                  >
                    Next Sheet <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </div>
              )}

              {/* The Sheet Paper Representation */}
              <div
                className={`bg-white rounded-xl shadow-lg border border-slate-300 w-full ${
                  orientation === 'landscape' ? 'max-w-[760px] aspect-[11/8.5]' : 'max-w-[620px] aspect-[8.5/11]'
                } p-3 relative transition-all flex flex-col`}
              >
                {/* 2x2 Grid Preview */}
                <div className="grid grid-cols-2 grid-rows-2 gap-2.5 h-full relative">
                  {currentSheet.map((slot, slotIdx) => {
                    if (!slot) {
                      return (
                        <div
                          key={slotIdx}
                          className="border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-xs font-semibold"
                        >
                          Empty Slip Slot
                        </div>
                      );
                    }

                    const { bill: b, copyLabel } = slot;

                    if (orientation === 'landscape') {
                      // Wide Landscape preview card
                      return (
                        <div
                          key={slotIdx}
                          className="border-2 border-slate-900 rounded-xl p-2 bg-white flex flex-col justify-between text-slate-900 relative shadow-2xs overflow-hidden select-none"
                        >
                          {copyLabel && (
                            <span className="absolute top-1 right-1 text-[7px] font-extrabold uppercase bg-slate-200 text-slate-700 px-1 py-0.2 rounded tracking-wider">
                              {copyLabel}
                            </span>
                          )}

                          {/* Slip Header */}
                          <div className="text-center">
                            <h4 className="text-[9px] font-black uppercase tracking-wide leading-tight">
                              MUNICIPALITY OF MALUNGON • PROVINCE OF SARANGANI
                            </h4>
                            <p className="text-[7.5px] font-bold text-slate-600 leading-tight">
                              Municipal Economic Enterprise Development Office (MEEDO)
                            </p>
                            <p className="text-[9px] font-black text-slate-900 uppercase tracking-wide leading-tight">
                              ELECTRIC UTILITY BILLING STATEMENT
                            </p>
                            <div className="border-b-2 border-slate-900 my-0.5"></div>
                          </div>

                          {/* 2-Column Body */}
                          <div className="grid grid-cols-2 gap-2 flex-1 my-0.5">
                            {/* Left: Account & Notice */}
                            <div className="flex flex-col justify-between text-[8px] bg-slate-50 border border-slate-200 rounded p-1.5 leading-tight">
                              <div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-semibold">Stall No:</span>
                                  <strong className="text-[10px] text-slate-900 font-black">{b.stall_no}</strong>
                                </div>
                                <div className="flex justify-between mt-0.5">
                                  <span className="text-slate-500 font-semibold">Owner:</span>
                                  <strong className="text-[8.5px] text-slate-900 truncate max-w-[90px]">{b.owner_name}</strong>
                                </div>
                              </div>
                              <div className="border-t border-slate-200 pt-0.5 mt-0.5">
                                <div className="flex justify-between text-[7.5px]">
                                  <span className="text-slate-500">Due:</span>
                                  <strong className="text-rose-700 font-bold">{formatDate(b.due_date)}</strong>
                                </div>
                                <div className="flex justify-between text-[7.5px]">
                                  <span className="text-slate-500">Disconnect:</span>
                                  <strong className="text-slate-700">{b.disconnection_date ? formatDate(b.disconnection_date) : '—'}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Right: Calculations */}
                            <div className="flex flex-col justify-between text-[8px] bg-slate-50 border border-slate-200 rounded p-1.5 leading-tight">
                              <div className="space-y-0.5">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Prev Reading:</span>
                                  <span className="font-mono">{Number(b.prev_reading || 0).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Curr Reading:</span>
                                  <span className="font-mono">{Number(b.curr_reading || 0).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 pt-0.5">
                                  <span className="font-bold">Consumption:</span>
                                  <strong className="text-blue-700">{Number(b.consumption || 0).toFixed(1)} kWh</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Rate:</span>
                                  <span>₱{Number(b.rate_per_kwh || 0).toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="border-t-2 border-slate-900 pt-0.5 flex justify-between font-black text-[9px]">
                                <span>TOTAL DUE:</span>
                                <span className="text-blue-900 font-extrabold">{formatCurrency(b.bill_amount)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Footer Signatures */}
                          <div className="grid grid-cols-2 gap-3 text-[6.5px] border-t border-slate-200 pt-0.5 text-center text-slate-500">
                            <div>
                              <div className="border-b border-slate-400 h-2"></div>
                              <span>Billing Clerk</span>
                            </div>
                            <div>
                              <div className="border-b border-slate-400 h-2"></div>
                              <span>Concessionaire</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Balanced Portrait preview card (zero dead space)
                    return (
                      <div
                        key={slotIdx}
                        className="border-2 border-slate-900 rounded-xl p-2 bg-white flex flex-col justify-between text-slate-900 relative shadow-2xs overflow-hidden select-none gap-1"
                      >
                        {copyLabel && (
                          <span className="absolute top-1.5 right-1.5 text-[7px] font-extrabold uppercase bg-slate-200 text-slate-700 px-1 py-0.5 rounded tracking-wider">
                            {copyLabel}
                          </span>
                        )}

                        {/* Slip Header */}
                        <div className="text-center pt-0.5">
                          <h4 className="text-[9px] font-black uppercase tracking-wide leading-tight">
                            MUNICIPALITY OF MALUNGON
                          </h4>
                          <p className="text-[7.5px] font-bold text-slate-600 leading-tight">
                            MEEDO — ELECTRIC UTILITY STATEMENT
                          </p>
                          <div className="border-b-2 border-slate-900 my-0.5"></div>
                        </div>

                        {/* Meta info box */}
                        <div className="bg-slate-50 border border-slate-200 rounded p-1.5 grid grid-cols-2 gap-1 text-[8px] leading-tight">
                          <div>
                            <span className="text-slate-500 block text-[6.5px]">Stall Number:</span>
                            <strong className="text-[10px] text-slate-900 font-black">{b.stall_no}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[6.5px]">Tenant / Owner:</span>
                            <strong className="text-[8px] text-slate-900 font-bold truncate block">{b.owner_name}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[6.5px]">Due Date:</span>
                            <strong className="text-rose-700 font-bold text-[8px]">{formatDate(b.due_date)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[6.5px]">Disconnection:</span>
                            <strong className="text-slate-800 text-[8px]">
                              {b.disconnection_date ? formatDate(b.disconnection_date) : '—'}
                            </strong>
                          </div>
                        </div>

                        {/* Readings / Breakdown Card */}
                        <div className="border border-slate-200 rounded p-1.5 bg-slate-50 text-[8px] space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Prev Reading:</span>
                            <strong className="font-mono">{Number(b.prev_reading || 0).toFixed(1)} kWh</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Curr Reading:</span>
                            <strong className="font-mono">{Number(b.curr_reading || 0).toFixed(1)} kWh</strong>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-0.5">
                            <span className="text-slate-600 font-semibold">Total Consumption:</span>
                            <strong className="font-black text-blue-700">{Number(b.consumption || 0).toFixed(1)} kWh</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Rate per kWh:</span>
                            <span>₱{Number(b.rate_per_kwh || 0).toFixed(2)}</span>
                          </div>
                          {Number(b.arrears || 0) > 0 && (
                            <div className="flex justify-between text-rose-600 font-bold">
                              <span>Arrears:</span>
                              <span>₱{Number(b.arrears).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t-2 border-slate-900 pt-0.5 text-[9px] font-black text-slate-900">
                            <span>TOTAL AMOUNT DUE:</span>
                            <span className="text-blue-900 font-extrabold text-[10px]">
                              {formatCurrency(b.bill_amount)}
                            </span>
                          </div>
                        </div>

                        {/* Settlement Alert Box */}
                        <div className="bg-amber-50/80 border border-amber-200 rounded p-1 text-[6.8px] text-amber-900 text-center leading-tight">
                          Please settle on or before due date to avoid service disconnection.
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-3 text-[6px] text-center text-slate-500 px-1">
                          <div>
                            <div className="border-b border-slate-400 h-2"></div>
                            <span>Billing In-Charge</span>
                          </div>
                          <div>
                            <div className="border-b border-slate-400 h-2"></div>
                            <span>Concessionaire</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Cut lines overlay in preview */}
                  {showCutGuides && (
                    <>
                      <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-400 pointer-events-none -translate-y-1/2 flex items-center justify-center">
                        <span className="bg-white px-2 text-[8px] text-slate-500 font-mono">✂ cut guide</span>
                      </div>
                      <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-400 pointer-events-none -translate-x-1/2 flex items-center justify-center">
                        <span className="bg-white py-2 text-[8px] text-slate-500 font-mono rotate-90">✂ cut guide</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Ready to print <strong>{totalSheets}</strong> {totalSheets === 1 ? 'sheet' : 'sheets'} on{' '}
                  <strong className="uppercase">{paperSize}</strong> in <strong className="capitalize">{orientation}</strong> orientation.
                </span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrintModal(false)}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTriggerPrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4"
                >
                  <Printer className="w-4 h-4 mr-1.5" /> Print Now ({totalSheets} {totalSheets === 1 ? 'Sheet' : 'Sheets'})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
