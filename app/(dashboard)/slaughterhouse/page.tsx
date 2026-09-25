'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMeedo } from '@/lib/store';
import { SlaughterRecord, LivestockType, SlaughterStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Beef,
  PiggyBank,
  PawPrint,
  Lock,
  Users,
  UserCheck,
  Coins,
  Printer,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';

interface IntakeItem {
  id: string;
  livestockType: LivestockType;
  headCount: number;
  kilos: number;
  amount: number;
}

export default function SlaughterhousePage() {
  const {
    currentUser,
    slaughterRecords,
    addSlaughterBatch,
    updateSlaughterRecord,
    deleteSlaughterRecord,
    butchers,
  } = useMeedo();

  // Intake Form State
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [orNumber, setOrNumber] = useState('');
  const [status, setStatus] = useState<SlaughterStatus>('Private');
  const [selectedButcherId, setSelectedButcherId] = useState('');

  // Dynamic Livestock Items
  const [items, setItems] = useState<IntakeItem[]>([
    {
      id: 'item_1',
      livestockType: 'Hogs',
      headCount: 1,
      kilos: 0,
      amount: 150.0,
    },
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedButcherFilter, setSelectedButcherFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<SlaughterRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SlaughterRecord>>({});

  // Delete Dialog State
  const [recordToDelete, setRecordToDelete] = useState<SlaughterRecord | null>(null);

  // Known unique clients for autocomplete
  const clientSuggestions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; address?: string; contact?: string }>();
    slaughterRecords.forEach((r) => {
      if (r.client_name && !map.has(r.client_name.toLowerCase())) {
        map.set(r.client_name.toLowerCase(), {
          id: r.client_id,
          name: r.client_name,
          address: r.address,
          contact: r.contact_no,
        });
      }
    });
    return Array.from(map.values());
  }, [slaughterRecords]);

  // Autocomplete when client name or ID is entered
  const handleClientNameChange = (name: string) => {
    setClientName(name);
    const found = clientSuggestions.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found) {
      if (!clientId) setClientId(found.id);
      if (!address && found.address) setAddress(found.address);
      if (!contact && found.contact) setContact(found.contact);
    }
  };

  const handleClientIdChange = (id: string) => {
    setClientId(id);
    const found = clientSuggestions.find((c) => c.id.toLowerCase() === id.toLowerCase());
    if (found) {
      if (!clientName) setClientName(found.name);
      if (!address && found.address) setAddress(found.address);
      if (!contact && found.contact) setContact(found.contact);
    }
  };

  // Dynamic Item Row Handlers
  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        livestockType: 'Hogs',
        headCount: 1,
        kilos: 0,
        amount: 150.0,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemRow = (id: string, field: keyof IntakeItem, val: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, [field]: val };
      })
    );
  };

  // Save All Entries (Batch Submit)
  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const finalClientId = clientId.trim() || `C-${Date.now().toString().slice(-6)}`;
    const selectedButcher = butchers.find((b) => b.id === selectedButcherId);

    const newRecords = items.map((item) => ({
      client_id: finalClientId,
      client_name: clientName.trim(),
      address: address.trim() || undefined,
      contact_no: contact.trim() || undefined,
      or_number: orNumber.trim() || 'Unpaid',
      status,
      livestock_type: item.livestockType,
      head_count: Number(item.headCount) || 1,
      kilos: Number(item.kilos) || 0,
      amount: Number(item.amount) || 0,
      butcher_id: selectedButcher?.id || undefined,
      butcher_name: selectedButcher?.name || undefined,
    }));

    addSlaughterBatch(newRecords);

    // Reset Form
    setSavedSuccess(true);
    setClientId('');
    setClientName('');
    setAddress('');
    setContact('');
    setOrNumber('');
    setStatus('Private');
    setSelectedButcherId('');
    setItems([
      {
        id: 'item_' + Date.now(),
        livestockType: 'Hogs',
        headCount: 1,
        kilos: 0,
        amount: 150.0,
      },
    ]);

    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Filter & Search Logic
  const filteredRecords = useMemo(() => {
    return slaughterRecords.filter((r) => {
      // Month Filter
      if (selectedMonth && r.created_at) {
        const itemMonth = r.created_at.slice(0, 7);
        if (itemMonth !== selectedMonth) return false;
      }

      // Butcher Filter
      if (selectedButcherFilter !== 'ALL') {
        const matches = r.butcher_id === selectedButcherFilter || r.butcher_name === selectedButcherFilter;
        if (!matches) return false;
      }

      // Search Term Filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const fullString = `${r.client_id} ${r.client_name} ${r.address || ''} ${r.contact_no || ''} ${r.or_number || ''} ${r.butcher_name || ''}`.toLowerCase();
        if (!fullString.includes(term)) return false;
      }

      return true;
    });
  }, [slaughterRecords, selectedMonth, selectedButcherFilter, searchTerm]);

  // Totals computed across ALL filtered records
  const totals = useMemo(() => {
    let heads = 0;
    let kilos = 0;
    let amount = 0;
    let hogs = 0;
    let cow = 0;
    let goat = 0;
    let chicken = 0;
    let privateCount = 0;
    let publicCount = 0;

    filteredRecords.forEach((r) => {
      const hc = r.head_count || 0;
      const kg = r.kilos || 0;
      const amt = r.amount || 0;

      heads += hc;
      kilos += kg;
      amount += amt;

      if (r.livestock_type === 'Hogs') hogs += hc;
      if (r.livestock_type === 'Cow') cow += hc;
      if (r.livestock_type === 'Goat') goat += hc;
      if (r.livestock_type === 'Chicken') chicken += hc;

      if (r.status === 'Private') privateCount += hc;
      if (r.status === 'Public') publicCount += hc;
    });

    return { heads, kilos, amount, hogs, cow, goat, chicken, privateCount, publicCount };
  }, [filteredRecords]);

  // Pagination
  const totalRows = filteredRecords.length;
  const maxPage = Math.max(1, Math.ceil(totalRows / pageSize));
  const validPage = Math.min(currentPage, maxPage);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Edit Modal Handlers
  const handleOpenEdit = (record: SlaughterRecord) => {
    setEditingRecord(record);
    setEditFormData({
      client_id: record.client_id,
      client_name: record.client_name,
      address: record.address || '',
      contact_no: record.contact_no || '',
      or_number: record.or_number || '',
      status: record.status,
      livestock_type: record.livestock_type,
      head_count: record.head_count,
      kilos: record.kilos || 0,
      amount: record.amount,
      butcher_id: record.butcher_id || '',
      butcher_name: record.butcher_name || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord?.id) return;

    const btc = butchers.find((b) => b.id === editFormData.butcher_id);

    updateSlaughterRecord(editingRecord.id, {
      ...editFormData,
      butcher_id: btc ? btc.id : (editFormData.butcher_id || undefined),
      butcher_name: btc ? btc.name : (editFormData.butcher_name || undefined),
      head_count: Number(editFormData.head_count) || 1,
      kilos: Number(editFormData.kilos) || 0,
      amount: Number(editFormData.amount) || 0,
    });

    setEditingRecord(null);
  };

  // Delete Handlers
  const handleConfirmDelete = () => {
    if (recordToDelete?.id) {
      deleteSlaughterRecord(recordToDelete.id);
      setRecordToDelete(null);
    }
  };

  // Dedicated Formal Print Report Window (1:1 Legacy Layout)
  const handlePrintReport = () => {
    const subTitle = searchTerm.trim()
      ? `History for Client Search: ${searchTerm}`
      : selectedMonth
      ? `Month of ${selectedMonth}`
      : 'All Recorded Inspection Entries';

    const preparerName = currentUser?.username || 'Meat Inspector / Officer on Duty';

    const rowsHtml = filteredRecords
      .map((d) => {
        let dateStr = d.created_at || 'Recent';
        try {
          if (d.created_at) {
            const dt = new Date(d.created_at);
            dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
              dt.getDate()
            ).padStart(2, '0')} ${String(dt.getHours() % 12 || 12).padStart(2, '0')}:${String(
              dt.getMinutes()
            ).padStart(2, '0')} ${dt.getHours() >= 12 ? 'PM' : 'AM'}`;
          }
        } catch (_) {}

        return `<tr>
          <td>${dateStr}</td>
          <td>${d.client_id || '-'}</td>
          <td><strong>${d.client_name || '-'}</strong></td>
          <td>${d.address || '-'}</td>
          <td>${d.contact_no || '-'}</td>
          <td>${d.or_number || 'Unpaid'}</td>
          <td>${d.status || 'Private'}</td>
          <td>${d.butcher_name || '-'}</td>
          <td>${d.livestock_type}</td>
          <td style="text-align:center;">${d.head_count}</td>
          <td style="text-align:right;">${d.kilos && d.kilos > 0 ? d.kilos.toFixed(1) + ' kg' : '-'}</td>
          <td style="text-align:right;">₱ ${d.amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</td>
        </tr>`;
      })
      .join('');

    const printWin = window.open('', '', 'width=950,height=700');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Slaughterhouse Report - ${selectedMonth || 'Full Ledger'}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 25px; color: #111; font-size: 11pt; }
          .report-header { text-align: center; margin-bottom: 20px; }
          .report-header h2 { margin: 0; font-size: 1.4rem; text-transform: uppercase; letter-spacing: 0.5px; }
          .report-header p { margin: 4px 0 0; color: #555; font-size: 0.95rem; }
          
          .summary-box { display: flex; gap: 16px; margin-bottom: 24px; }
          .summary-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; }
          .summary-card h4 { margin: 0 0 8px; font-size: 0.85rem; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .summary-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
          .summary-table td { padding: 3px 0; border: none; }
          .summary-table td.val { text-align: right; font-weight: bold; }
          
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem; }
          table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          table.data-table th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.3px; }
          table.data-table tfoot td { font-weight: bold; background-color: #f8fafc; border-top: 2px solid #94a3b8; }

          .signature-section { display: flex; justify-content: space-between; margin-top: 45px; page-break-inside: avoid; }
          .sig-box { width: 240px; text-align: center; }
          .sig-label { text-align: left; margin-bottom: 40px; font-weight: 600; font-size: 0.9rem; }
          .sig-line { border-bottom: 1.5px solid #000; padding-bottom: 4px; font-weight: bold; font-size: 0.95rem; }
          .sig-title { margin-top: 4px; font-size: 0.8rem; color: #555; }

          @media print { 
            body { margin: 0.4in; }
            @page { size: landscape; margin: 0.4in; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h2>Municipal Slaughterhouse Monthly Report</h2>
          <p>${subTitle}</p>
        </div>

        <!-- TOTAL SUMMARY SECTION -->
        <div class="summary-box">
          <div class="summary-card">
            <h4>Livestock Count Summary</h4>
            <table class="summary-table">
              <tr><td>Total Hogs:</td><td class="val">${totals.hogs} heads</td></tr>
              <tr><td>Total Cattle / Cow:</td><td class="val">${totals.cow} heads</td></tr>
              <tr><td>Total Goats:</td><td class="val">${totals.goat} heads</td></tr>
              <tr><td>Total Chicken:</td><td class="val">${totals.chicken} heads</td></tr>
              <tr style="border-top: 1px solid #cbd5e1;">
                <td style="padding-top:4px;"><strong>Overall Livestock:</strong></td>
                <td class="val" style="padding-top:4px;">${totals.heads} heads ${
      totals.kilos > 0 ? '(' + totals.kilos.toFixed(1) + ' kg)' : ''
    }</td>
              </tr>
            </table>
          </div>

          <div class="summary-card">
            <h4>Sector Summary</h4>
            <table class="summary-table">
              <tr><td>Private Sector:</td><td class="val">${totals.privateCount} heads</td></tr>
              <tr><td>Public Sector:</td><td class="val">${totals.publicCount} heads</td></tr>
              <tr style="border-top: 1px solid #cbd5e1;">
                <td style="padding-top:4px;"><strong>Recorded Weight:</strong></td>
                <td class="val" style="padding-top:4px;">${totals.kilos > 0 ? totals.kilos.toFixed(1) + ' kg' : '0.0 kg'}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- DETAILED RECORDS TABLE -->
        <table class="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Client ID</th>
              <th>Client Name</th>
              <th>Address</th>
              <th>Contact No.</th>
              <th>OR #</th>
              <th>Status</th>
              <th>Butcher</th>
              <th>Livestock</th>
              <th style="text-align:center;">Heads</th>
              <th style="text-align:right;">Weight (kg)</th>
              <th style="text-align:right;">Amount (₱)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="12" style="text-align:center; padding:20px;">No slaughterhouse records found.</td></tr>'}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="9" style="text-align: right; text-transform: uppercase;">Grand Total:</td>
              <td style="text-align: center;">${totals.heads}</td>
              <td style="text-align: right;">${totals.kilos > 0 ? totals.kilos.toFixed(1) + ' kg' : '-'}</td>
              <td style="text-align: right; color: #166534;">₱ ${totals.amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</td>
            </tr>
          </tfoot>
        </table>

        <!-- SIGNATURES -->
        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-label">Prepared by:</div>
            <div class="sig-line">${preparerName}</div>
            <div class="sig-title">Meat Inspection Officer / In-Charge</div>
          </div>
          <div class="sig-box">
            <div class="sig-label">Noted by:</div>
            <div class="sig-line">Municipal Administrator</div>
            <div class="sig-title">Municipal Economic Enterprise Office</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Slaughterhouse Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section B: Livestock intake logs, meat inspection receipts, and volume throughput analytics.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handlePrintReport} className="no-print">
          <Printer className="w-4 h-4 mr-1.5" /> Print Monthly Report
        </Button>
      </div>

      {/* 6 Exact Legacy Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 bg-white border-slate-200">
          <span className="text-2xl font-black text-slate-800 block">{totals.hogs}</span>
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
            <PiggyBank className="w-3.5 h-3.5 text-rose-500" /> Total Hogs
          </span>
        </Card>

        <Card className="p-3.5 bg-white border-slate-200">
          <span className="text-2xl font-black text-slate-800 block">{totals.cow}</span>
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
            <Beef className="w-3.5 h-3.5 text-amber-600" /> Total Cattle/Cow
          </span>
        </Card>

        <Card className="p-3.5 bg-white border-slate-200">
          <span className="text-2xl font-black text-slate-800 block">{totals.goat}</span>
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
            <PawPrint className="w-3.5 h-3.5 text-purple-600" /> Total Goats
          </span>
        </Card>

        <Card className="p-3.5 bg-blue-50/60 border-blue-200">
          <span className="text-2xl font-black text-blue-700 block">{totals.privateCount}</span>
          <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5 mt-1">
            <Lock className="w-3.5 h-3.5 text-blue-600" /> Private Sector
          </span>
        </Card>

        <Card className="p-3.5 bg-blue-50/60 border-blue-200">
          <span className="text-2xl font-black text-blue-700 block">{totals.publicCount}</span>
          <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5 mt-1">
            <Users className="w-3.5 h-3.5 text-blue-600" /> Public Sector
          </span>
        </Card>

        <Card className="p-3.5 bg-emerald-50/70 border-emerald-200 overflow-hidden">
          <span className="text-lg sm:text-xl font-black text-emerald-800 truncate block">
            {formatCurrency(totals.amount)}
          </span>
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mt-1">
            <Coins className="w-3.5 h-3.5 text-emerald-600" /> Total Collections
          </span>
        </Card>
      </div>

      {/* Multi-Item Livestock Intake Form */}
      <Card className="no-print bg-blue-50/40 border-blue-200 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> Log Livestock
        </h3>

        <form onSubmit={handleSaveBatch} className="space-y-4 text-xs font-semibold text-slate-700">
          {/* Row 1: Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="block mb-1 text-slate-600">
                Client ID <span className="text-[10px] text-slate-400 font-normal">(Auto)</span>
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => handleClientIdChange(e.target.value)}
                placeholder="e.g. C-123456"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-slate-600">Name of Client</label>
              <input
                type="text"
                required
                list="clientSuggestionsList"
                value={clientName}
                onChange={(e) => handleClientNameChange(e.target.value)}
                placeholder="Search returning or Enter new name"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="clientSuggestionsList">
                {clientSuggestions.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.id} - {c.address || 'No Address'}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-slate-600">Client Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Barangay / Municipality"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-600">Contact No.</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Optional"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-slate-600">OR #</label>
              <input
                type="text"
                value={orNumber}
                onChange={(e) => setOrNumber(e.target.value)}
                placeholder="Leave blank if Unpaid"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SlaughterStatus)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Private">Private</option>
                <option value="Public">Public</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-600 flex items-center justify-between">
                <span>Assigned Butcher</span>
                <Link
                  href="/slaughterhouse/butchers"
                  className="text-[10px] text-blue-600 hover:underline font-normal"
                >
                  + Manage Roster
                </Link>
              </label>
              <select
                value={selectedButcherId}
                onChange={(e) => setSelectedButcherId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Select Butcher --</option>
                {butchers
                  .filter((b) => b.status === 'Active')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.butcher_code}) • {b.specialization}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Row 2: Dynamic Livestock Items */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">Livestock Items</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addItemRow}
                className="text-blue-600 border border-dashed border-blue-400 bg-white hover:bg-blue-50 text-xs h-7 px-2.5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Livestock
              </Button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm"
                >
                  <div className="sm:col-span-4">
                    <label className="block mb-1 text-[11px] text-slate-500">Livestock</label>
                    <select
                      value={item.livestockType}
                      onChange={(e) => updateItemRow(item.id, 'livestockType', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Hogs">Hogs</option>
                      <option value="Chicken">Chicken</option>
                      <option value="Goat">Goat</option>
                      <option value="Cow">Cow</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-[11px] text-slate-500">Heads</label>
                    <input
                      type="number"
                      min="1"
                      value={item.headCount}
                      onChange={(e) => updateItemRow(item.id, 'headCount', parseInt(e.target.value) || 1)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-[11px] text-slate-500">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={item.kilos || ''}
                      onChange={(e) => updateItemRow(item.id, 'kilos', parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block mb-1 text-[11px] text-slate-500">Amount (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.amount || ''}
                      onChange={(e) => updateItemRow(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-emerald-700 font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItemRow(item.id)}
                      disabled={items.length <= 1}
                      title="Remove Row"
                      className={`h-8 w-8 flex items-center justify-center rounded-md border text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors ${
                        items.length <= 1 ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            <div>
              {savedSuccess && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> All livestock entries successfully logged!
                </span>
              )}
            </div>
            <Button type="submit" variant="primary">
              <Save className="w-4 h-4 mr-1.5" /> Save All Entries
            </Button>
          </div>
        </form>
      </Card>

      {/* Monthly Slaughter Inspection Ledger */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Monthly Slaughter Report</h3>
            <p className="text-[11px] text-slate-500">
              Complete registry of slaughtered livestock, ante-mortem verification, and collections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto no-print">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Client ID or Name..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            />

            <select
              value={selectedButcherFilter}
              onChange={(e) => {
                setSelectedButcherFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
            >
              <option value="ALL">All Butchers</option>
              {butchers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={handlePrintReport}>
              <Printer className="w-3.5 h-3.5 mr-1" /> Print
            </Button>
          </div>
        </div>

        {/* 13-Column Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 whitespace-nowrap">Date & Time</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Client ID</th>
                <th className="py-2.5 px-3">Client Name</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3">Contact No.</th>
                <th className="py-2.5 px-3 whitespace-nowrap">OR #</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Butcher</th>
                <th className="py-2.5 px-3">Livestock</th>
                <th className="py-2.5 px-3 text-center">Heads</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Weight (kg)</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Amount (₱)</th>
                <th className="py-2.5 px-3 text-center no-print whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-500">
                    No slaughterhouse records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {r.created_at ? formatDate(r.created_at) : 'Recent'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 font-semibold whitespace-nowrap">
                      {r.client_id}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.client_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.address || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{r.contact_no || '-'}</td>
                    <td
                      className={`py-2.5 px-3 font-mono font-bold whitespace-nowrap ${
                        !r.or_number || r.or_number === 'Unpaid' ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {r.or_number || 'Unpaid'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={r.status === 'Public' ? 'info' : 'neutral'}>{r.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                      {r.butcher_name ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {r.butcher_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{r.livestock_type}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{r.head_count}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                      {r.kilos && r.kilos > 0 ? `${r.kilos.toFixed(1)} kg` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center no-print whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(r)}
                          title="Edit Record"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecordToDelete(r)}
                          title="Delete Record"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot className="border-t-2 border-slate-300 bg-slate-50/80 font-bold text-slate-900 text-xs">
                <tr>
                  <td colSpan={9} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-600">
                    Grand Total:
                  </td>
                  <td className="py-2.5 px-3 text-center">{totals.heads}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {totals.kilos > 0 ? `${totals.kilos.toFixed(1)} kg` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 whitespace-nowrap">
                    {formatCurrency(totals.amount)}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 15-item Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 no-print">
          <span className="text-xs text-slate-500 font-medium">
            Showing {totalRows > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, totalRows)} of {totalRows} entries
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage <= 1}
              className="text-xs h-8 px-3"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>
            <span className="text-xs font-semibold text-slate-700 px-2">
              Page {validPage} of {maxPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(maxPage, p + 1))}
              disabled={validPage >= maxPage}
              className="text-xs h-8 px-3"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Modal (Inline Modal with All 10 Fields) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" /> Edit Slaughter Record
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600">Client ID</label>
                  <input
                    type="text"
                    value={editFormData.client_id || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, client_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">Name of Client</label>
                  <input
                    type="text"
                    required
                    value={editFormData.client_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, client_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600">Client Address</label>
                  <input
                    type="text"
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">Contact No.</label>
                  <input
                    type="text"
                    value={editFormData.contact_no || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, contact_no: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600">OR #</label>
                  <input
                    type="text"
                    value={editFormData.or_number || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, or_number: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">Status</label>
                  <select
                    value={editFormData.status || 'Private'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as SlaughterStatus })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">Assigned Butcher</label>
                  <select
                    value={editFormData.butcher_id || ''}
                    onChange={(e) => {
                      const btc = butchers.find((b) => b.id === e.target.value);
                      setEditFormData({
                        ...editFormData,
                        butcher_id: e.target.value,
                        butcher_name: btc ? btc.name : '',
                      });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium"
                  >
                    <option value="">-- Unassigned --</option>
                    {butchers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.butcher_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="block mb-1 text-slate-600">Livestock</label>
                  <select
                    value={editFormData.livestock_type || 'Hogs'}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, livestock_type: e.target.value as LivestockType })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="Hogs">Hogs</option>
                    <option value="Chicken">Chicken</option>
                    <option value="Goat">Goat</option>
                    <option value="Cow">Cow</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">Heads</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.head_count || 1}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, head_count: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-bold"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editFormData.kilos || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, kilos: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.amount || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-emerald-700 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingRecord(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Alert Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white shadow-xl border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Delete Slaughter Record?</h4>
                <p className="text-xs text-slate-500">This action will remove the record from the ledger.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
              Are you sure you want to delete the entry for{' '}
              <strong className="text-slate-900">{recordToDelete.client_name}</strong> (
              {recordToDelete.livestock_type}, {recordToDelete.head_count} heads,{' '}
              {formatCurrency(recordToDelete.amount)})?
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setRecordToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Record
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

