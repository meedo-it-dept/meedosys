'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMeedo } from '@/lib/store';
import { CemeteryBooking, BurialType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateCemeteryInventory } from '@/lib/cemeteryUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  CalendarDays,
  Printer,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2,
  Infinity as InfinityIcon,
  FileSpreadsheet,
} from 'lucide-react';

export default function CemeteryReportsPage() {
  const { cemeteryBookings, updateCemeteryBooking, deleteCemeteryBooking } = useMeedo();

  // Current month default (YYYY-MM)
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [filterMonth, setFilterMonth] = useState<string>(currentMonthStr);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Edit / Delete states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deceasedName, setDeceasedName] = useState('');
  const [addressBarangay, setAddressBarangay] = useState('Poblacion');
  const [phone, setPhone] = useState('');
  const [burialDate, setBurialDate] = useState('');
  const [burialTime, setBurialTime] = useState('14:00');
  const [burialType, setBurialType] = useState<BurialType>('Apartment');
  const [amount, setAmount] = useState<number>(2500);

  const [deleteCandidate, setDeleteCandidate] = useState<CemeteryBooking | null>(null);

  // Calculate overall inventory (baseline + all dynamic records)
  const inv = useMemo(() => calculateCemeteryInventory(cemeteryBookings), [cemeteryBookings]);

  // Filter dynamic bookings by the selected month
  const monthlyFiltered = useMemo(() => {
    return cemeteryBookings
      .filter((c) => {
        if (!c.burial_date) return false;
        const dStr = c.burial_date.split('T')[0].split(' ')[0];
        return dStr.startsWith(filterMonth);
      })
      .sort((a, b) => new Date(b.burial_date).getTime() - new Date(a.burial_date).getTime());
  }, [cemeteryBookings, filterMonth]);

  const monthlyTotalBurials = monthlyFiltered.length;
  const monthlyTotalAmount = useMemo(() => {
    return monthlyFiltered.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [monthlyFiltered]);

  // Barangay stats for filtered month
  const brgyStats = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    monthlyFiltered.forEach((c) => {
      const bName = (c.address_barangay || 'Unspecified').trim();
      if (!map[bName]) map[bName] = { count: 0, amount: 0 };
      map[bName].count++;
      map[bName].amount += Number(c.amount) || 0;
    });
    return Object.entries(map)
      .map(([name, stat]) => ({ name, count: stat.count, amount: stat.amount }))
      .sort((a, b) => b.count - a.count);
  }, [monthlyFiltered]);

  // Burial Type stats for filtered month
  const typeStats = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    monthlyFiltered.forEach((c) => {
      const tName = (c.burial_type || 'Unspecified').trim();
      if (!map[tName]) map[tName] = { count: 0, amount: 0 };
      map[tName].count++;
      map[tName].amount += Number(c.amount) || 0;
    });
    return Object.entries(map)
      .map(([name, stat]) => ({ name, count: stat.count, amount: stat.amount }))
      .sort((a, b) => b.count - a.count);
  }, [monthlyFiltered]);

  // Table pagination
  const totalPages = Math.ceil(monthlyFiltered.length / itemsPerPage) || 1;
  const pagedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return monthlyFiltered.slice(start, start + itemsPerPage);
  }, [monthlyFiltered, currentPage, itemsPerPage]);

  // Edit handler
  const openEditModal = (booking: CemeteryBooking) => {
    setEditingId(booking.id || null);
    setDeceasedName(booking.deceased_name);
    setAddressBarangay(booking.address_barangay);
    setPhone(booking.phone_number || '');
    setBurialDate(booking.burial_date ? booking.burial_date.split('T')[0].split(' ')[0] : '');
    setBurialTime(booking.burial_time || '14:00');
    setBurialType(booking.burial_type);
    setAmount(booking.amount);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    updateCemeteryBooking(editingId, {
      deceased_name: deceasedName.trim(),
      address_barangay: addressBarangay.trim(),
      phone_number: phone.trim(),
      burial_date: burialDate,
      burial_time: burialTime,
      burial_type: burialType,
      amount: Number(amount) || 0,
    });

    setIsEditModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate && deleteCandidate.id) {
      deleteCemeteryBooking(deleteCandidate.id);
      setDeleteCandidate(null);
    }
  };

  // Formal Print Window matching Legacy map_js.html printCemReport
  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=1050,height=750');
    if (!printWin) return;

    let annualRowsHtml = '';
    Object.keys(inv.yearly)
      .sort()
      .forEach((yrStr) => {
        const yr = Number(yrStr);
        const row = inv.yearly[yr];
        const rowTotal = row.apartment + row.ground;
        annualRowsHtml += `<tr>
          <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #cbd5e1;">${yr}</td>
          <td style="padding: 6px 10px; text-align: center; color: #047857; font-weight: bold; border: 1px solid #cbd5e1;">${row.apartment}</td>
          <td style="padding: 6px 10px; text-align: center; color: #4338ca; font-weight: bold; border: 1px solid #cbd5e1;">${row.ground}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold; border: 1px solid #cbd5e1;">${rowTotal}</td>
        </tr>`;
      });

    let brgyRowsHtml = '';
    brgyStats.forEach((b) => {
      brgyRowsHtml += `<tr>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${b.name}</td>
        <td style="padding: 5px 8px; text-align: center; font-weight: bold; border: 1px solid #cbd5e1;">${b.count}</td>
        <td style="padding: 5px 8px; text-align: right; color: #047857; font-weight: bold; border: 1px solid #cbd5e1;">₱ ${b.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>`;
    });
    if (brgyStats.length === 0) {
      brgyRowsHtml = `<tr><td colspan="3" style="text-align: center; padding: 10px; color: #94a3b8; border: 1px solid #cbd5e1;">No records</td></tr>`;
    }

    let typeRowsHtml = '';
    typeStats.forEach((t) => {
      typeRowsHtml += `<tr>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${t.name}</td>
        <td style="padding: 5px 8px; text-align: center; font-weight: bold; border: 1px solid #cbd5e1;">${t.count}</td>
        <td style="padding: 5px 8px; text-align: right; color: #047857; font-weight: bold; border: 1px solid #cbd5e1;">₱ ${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>`;
    });
    if (typeStats.length === 0) {
      typeRowsHtml = `<tr><td colspan="3" style="text-align: center; padding: 10px; color: #94a3b8; border: 1px solid #cbd5e1;">No records</td></tr>`;
    }

    let recordsRowsHtml = '';
    monthlyFiltered.forEach((c) => {
      recordsRowsHtml += `<tr>
        <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #cbd5e1;">${c.deceased_name}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${c.address_barangay}</td>
        <td style="padding: 6px 10px; font-family: monospace; border: 1px solid #cbd5e1;">${c.phone_number || '—'}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${formatDate(c.burial_date)} ${c.burial_time || ''}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${c.burial_type}</td>
        <td style="padding: 6px 10px; text-align: right; color: #047857; font-weight: bold; border: 1px solid #cbd5e1;">₱ ${Number(c.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>`;
    });
    if (monthlyFiltered.length === 0) {
      recordsRowsHtml = `<tr><td colspan="6" style="text-align: center; padding: 15px; color: #94a3b8; border: 1px solid #cbd5e1;">No cemetery records found for this month.</td></tr>`;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cemetery Management Monthly Report - ${filterMonth}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 1.1rem; text-transform: uppercase; color: #0f172a; }
          .header h3 { margin: 3px 0 0 0; font-size: 1rem; color: #334155; text-transform: uppercase; }
          .header p.office { margin: 2px 0 0 0; font-size: 0.85rem; color: #64748b; font-weight: 600; }
          .header h1 { margin: 10px 0 2px 0; font-size: 1.35rem; text-transform: uppercase; color: #047857; letter-spacing: 0.5px; }
          .header p.subtitle { margin: 0; font-size: 0.95rem; font-weight: bold; color: #475569; }
          
          .kpi-container { display: flex; gap: 12px; margin-bottom: 20px; }
          .kpi-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; background: #f8fafc; }
          .kpi-val { font-size: 1.3rem; font-weight: 800; color: #0f172a; }
          .kpi-lbl { font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #64748b; margin-top: 2px; }
          .kpi-sub { font-size: 0.75rem; font-weight: 600; margin-top: 3px; }

          table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
          th { background: #f1f5f9; padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; }
          
          .section-title { font-size: 0.95rem; font-weight: 800; color: #0f172a; margin: 16px 0 8px 0; }
          .two-cols { display: flex; gap: 16px; margin-bottom: 20px; }
          .col-half { flex: 1; }

          .sig-block { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
          .sig-box { text-align: center; width: 240px; font-size: 0.85rem; }
          .sig-line { border-bottom: 1.5px solid #000; margin: 45px 0 4px 0; }

          @media print {
            body { margin: 0; padding: 15px; }
            @page { size: landscape; margin: 0.4in; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Republic of the Philippines</h2>
          <h3>Municipality of Malungon</h3>
          <p class="office">Municipal Economic Enterprise and Development Office (MEEDO)</p>
          <h1>Cemetery Management Monthly Report</h1>
          <p class="subtitle">Reporting Period: ${filterMonth}</p>
        </div>

        <div class="kpi-container">
          <div class="kpi-card" style="border-top: 4px solid #047857;">
            <div class="kpi-val" style="color: #047857;">${inv.totalApartment} <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">/ ${inv.maxApartmentCapacity}</span></div>
            <div class="kpi-lbl">Apartment Type - 624</div>
            <div class="kpi-sub" style="color: #047857;">${inv.availableApartment} Available (${inv.occupancyPercent}% Occupied)</div>
          </div>
          <div class="kpi-card" style="border-top: 4px solid #4338ca;">
            <div class="kpi-val" style="color: #4338ca;">${inv.totalGround}</div>
            <div class="kpi-lbl">Ground (Old Tomb)</div>
            <div class="kpi-sub" style="color: #64748b;">Unlimited Capacity</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${monthlyTotalBurials}</div>
            <div class="kpi-lbl">Month Burials (${filterMonth})</div>
            <div class="kpi-sub" style="color: #64748b;">Current log entries</div>
          </div>
          <div class="kpi-card" style="background: #f0fdf4;">
            <div class="kpi-val" style="color: #047857;">₱ ${monthlyTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-lbl">Total Collections (${filterMonth})</div>
            <div class="kpi-sub" style="color: #047857;">Enterprise Revenue</div>
          </div>
        </div>

        <div class="section-title">Annual Burial Inventory Summary (Apartment vs Ground)</div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Year</th>
              <th style="text-align: center;">Apartment Type - 624</th>
              <th style="text-align: center;">Old Tomb (Ground)</th>
              <th style="text-align: center;">Total Burials</th>
            </tr>
          </thead>
          <tbody>
            ${annualRowsHtml}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: 800;">
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Total (Running Balance)</td>
              <td style="padding: 8px 10px; text-align: center; color: #047857; border: 1px solid #cbd5e1;">
                ${inv.totalApartment} / ${inv.maxApartmentCapacity} (${inv.availableApartment} Available)
              </td>
              <td style="padding: 8px 10px; text-align: center; color: #4338ca; border: 1px solid #cbd5e1;">
                ${inv.totalGround} (Unlimited)
              </td>
              <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1;">
                ${inv.grandTotal}
              </td>
            </tr>
          </tfoot>
        </table>

        <div class="two-cols" style="margin-top: 15px;">
          <div class="col-half">
            <div class="section-title" style="margin-top: 0;">Burials by Barangay (${filterMonth})</div>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Barangay</th>
                  <th style="text-align: center;">Total</th>
                  <th style="text-align: right;">Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                ${brgyRowsHtml}
              </tbody>
            </table>
          </div>

          <div class="col-half">
            <div class="section-title" style="margin-top: 0;">Burials by Type (${filterMonth})</div>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Burial Type</th>
                  <th style="text-align: center;">Total</th>
                  <th style="text-align: right;">Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                ${typeRowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <div class="section-title">Detailed Burial Records (${filterMonth})</div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Name of the Deceased</th>
              <th style="text-align: left;">Address</th>
              <th style="text-align: left;">Phone number</th>
              <th style="text-align: left;">Date of Burial</th>
              <th style="text-align: left;">Burial Type</th>
              <th style="text-align: right;">Amount (₱)</th>
            </tr>
          </thead>
          <tbody>
            ${recordsRowsHtml}
          </tbody>
        </table>

        <div class="sig-block">
          <div class="sig-box">
            <div>Prepared by:</div>
            <div class="sig-line"></div>
            <strong>Cemetery In-Charge / Staff</strong>
          </div>
          <div class="sig-box">
            <div>Verified & Approved by:</div>
            <div class="sig-line"></div>
            <strong>MEEDO Administrator</strong>
          </div>
        </div>
      </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* View Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Cemetery Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section C: Apartment niche running tally, baseline inventory breakdown, and monthly revenue.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" /> Print Monthly Report
          </Button>
        </div>
      </div>

      {/* Navigation Submenu Tabs matching Legacy Layout */}
      <div className="flex border-b border-slate-200 bg-slate-50/60 rounded-t-lg p-1 gap-1">
        <Link
          href="/cemetery/bookings"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors"
        >
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          Booking Schedule for Burial
        </Link>
        <Link
          href="/cemetery/reports"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-white text-emerald-700 shadow-sm border border-slate-200/80"
        >
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          Reports & Running Inventory
        </Link>
      </div>

      {/* Filter Month Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Reporting Month:
          </span>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        <div className="text-xs text-slate-500">
          Showing metrics for{' '}
          <strong className="text-slate-800 font-semibold">{filterMonth}</strong>
        </div>
      </div>

      {/* 4 Summary KPI Cards matching Legacy Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Apartment Type Running Balance */}
        <Card className="p-4 bg-white border-slate-200 border-t-4 border-t-emerald-600 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
            Apartment Type - 624
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {inv.totalApartment}{' '}
            <span className="text-sm font-medium text-slate-400">
              / {inv.maxApartmentCapacity}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mt-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              {inv.availableApartment} Available ({inv.occupancyPercent}% Occupied)
            </span>
          </div>
        </Card>

        {/* Card 2: Ground / Old Tomb */}
        <Card className="p-4 bg-white border-slate-200 border-t-4 border-t-indigo-600 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
            Ground (Old Tomb)
          </span>
          <div className="text-2xl font-black text-indigo-900 mt-1">
            {inv.totalGround}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mt-2">
            <InfinityIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>Unlimited Capacity</span>
          </div>
        </Card>

        {/* Card 3: Total Burials for Selected Month */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
            Month Burials ({filterMonth})
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {monthlyTotalBurials}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            All plot allocations logged
          </div>
        </Card>

        {/* Card 4: Total Collections for Selected Month */}
        <Card className="p-4 bg-emerald-50/50 border-emerald-200 shadow-sm">
          <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">
            Total Collections ({filterMonth})
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(monthlyTotalAmount)}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-2">
            Cemetery Enterprise Fund
          </div>
        </Card>
      </div>

      {/* Annual Burial Inventory Table (2023 - 2026 Baseline & Running Balance) */}
      <Card className="p-5 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Annual Burial Inventory Summary
              </h3>
              <p className="text-xs text-slate-500">
                Multi-year baseline tally combined with live database entries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
              Apartment Max: {inv.maxApartmentCapacity}
            </span>
            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full">
              Ground: Unlimited
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <th className="py-2.5 px-4">Year</th>
                <th className="py-2.5 px-4 text-center">Apartment Type - 624</th>
                <th className="py-2.5 px-4 text-center">Old Tomb (Ground)</th>
                <th className="py-2.5 px-4 text-center">Total Burials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {Object.keys(inv.yearly)
                .sort()
                .map((yrStr) => {
                  const yr = Number(yrStr);
                  const row = inv.yearly[yr];
                  const rowTotal = row.apartment + row.ground;
                  return (
                    <tr key={yr} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{yr}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700">
                        {row.apartment}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700">
                        {row.ground}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                        {rowTotal}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                <td className="py-3 px-4">Total (Running Balance)</td>
                <td className="py-3 px-4 text-center text-emerald-700 font-black">
                  {inv.totalApartment} / {inv.maxApartmentCapacity}{' '}
                  <span className="font-semibold text-slate-500 text-[11px]">
                    ({inv.availableApartment} Available)
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-indigo-700 font-black">
                  {inv.totalGround}{' '}
                  <span className="font-semibold text-slate-500 text-[11px]">(Unlimited)</span>
                </td>
                <td className="py-3 px-4 text-center font-black text-slate-900">
                  {inv.grandTotal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Side-by-side Demographic Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Barangay Breakdown */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <span>Barangay Breakdown</span>
            <span className="text-xs text-slate-400 font-normal">({filterMonth})</span>
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <th className="py-2 px-3">Barangay</th>
                  <th className="py-2 px-3 text-center">Total Burials</th>
                  <th className="py-2 px-3 text-right">Total Amount (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brgyStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">
                      No records for this month.
                    </td>
                  </tr>
                ) : (
                  brgyStats.map((b) => (
                    <tr key={b.name} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{b.name}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{b.count}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(b.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Burial Type Breakdown */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <span>Burial Type Breakdown</span>
            <span className="text-xs text-slate-400 font-normal">({filterMonth})</span>
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <th className="py-2 px-3">Burial Type</th>
                  <th className="py-2 px-3 text-center">Total Burials</th>
                  <th className="py-2 px-3 text-right">Total Amount (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {typeStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">
                      No records for this month.
                    </td>
                  </tr>
                ) : (
                  typeStats.map((t) => (
                    <tr key={t.name} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{t.name}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{t.count}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Detailed Monthly Burial Records with Edit & Delete Actions */}
      <Card className="p-5 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Monthly Burial Ledger ({filterMonth})
            </h3>
            <p className="text-xs text-slate-500">
              Paginated records with direct management controls.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <th className="py-3 px-3.5">Name of the Deceased</th>
                <th className="py-3 px-3.5">Address</th>
                <th className="py-3 px-3.5">Phone number</th>
                <th className="py-3 px-3.5">Date of Burial</th>
                <th className="py-3 px-3.5">Burial Type</th>
                <th className="py-3 px-3.5 text-right">Amount (₱)</th>
                <th className="py-3 px-3.5 text-center no-print" style={{ width: '100px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No cemetery records found for {filterMonth}.
                  </td>
                </tr>
              ) : (
                pagedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-900">{b.deceased_name}</td>
                    <td className="py-3 px-3.5 text-slate-600">Brgy. {b.address_barangay}</td>
                    <td className="py-3 px-3.5 text-slate-600 font-mono">{b.phone_number || '—'}</td>
                    <td className="py-3 px-3.5 text-slate-700">
                      <div className="font-semibold">{formatDate(b.burial_date)}</div>
                      {b.burial_time && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {b.burial_time}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <Badge variant={b.burial_type === 'Apartment' ? 'info' : 'neutral'}>
                        {b.burial_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-emerald-700">
                      {formatCurrency(b.amount)}
                    </td>
                    <td className="py-3 px-3.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Edit Booking"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(b)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 text-xs text-slate-600 no-print">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-800">
              {monthlyFiltered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * itemsPerPage, monthlyFiltered.length)}
            </span>{' '}
            of <span className="font-bold text-slate-800">{monthlyFiltered.length}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>
            <span className="px-2 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Burial Booking"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1 text-slate-800">Name of the Deceased *</label>
            <input
              type="text"
              required
              value={deceasedName}
              onChange={(e) => setDeceasedName(e.target.value)}
              className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-800">Date of Burial *</label>
              <input
                type="date"
                required
                value={burialDate}
                onChange={(e) => setBurialDate(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-800">Time</label>
              <input
                type="time"
                value={burialTime}
                onChange={(e) => setBurialTime(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-800">Address (Barangay) *</label>
              <input
                type="text"
                required
                value={addressBarangay}
                onChange={(e) => setAddressBarangay(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-800">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-800">Burial Type *</label>
              <select
                value={burialType}
                onChange={(e) => setBurialType(e.target.value as BurialType)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Apartment">Apartment</option>
                <option value="Bone Vault">Bone Vault</option>
                <option value="Ground">Ground</option>
                <option value="Mausoleum">Mausoleum</option>
                <option value="Transfer of Cadaver">Transfer of Cadaver</option>
                <option value="Exhumation/Removal">Exhumation/Removal</option>
                <option value="Renewal">Renewal</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-slate-800">Fee Amount (₱) *</label>
              <input
                type="number"
                required
                min="0"
                step="50"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        title="Delete Booking?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              Are you sure you want to delete the scheduled burial for{' '}
              <strong className="text-slate-900 font-bold">
                {deleteCandidate?.deceased_name}
              </strong>
              ? This action cannot be undone.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setDeleteCandidate(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleConfirmDelete}>
              Yes, delete it!
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
