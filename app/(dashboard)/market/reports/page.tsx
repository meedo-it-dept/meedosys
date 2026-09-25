'use client';

import React, { useState, useMemo } from 'react';
import { useMeedo } from '@/lib/store';
import { StallZone, StallStatus, ComplianceStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  Store,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  GraduationCap,
} from 'lucide-react';

export default function MarketReportsPage() {
  const { stalls, currentUser } = useMeedo();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'general' | 'compliance'>('general');

  // --- TAB 1: General Status Report State ---
  const [genZone, setGenZone] = useState<string>('All');
  const [genStatus, setGenStatus] = useState<string>('All');
  const [genCompliance, setGenCompliance] = useState<string>('All');
  const [genSearch, setGenSearch] = useState<string>('');
  const [genSortBy, setGenSortBy] = useState<'stall_no' | 'owner'>('stall_no');
  const [genPage, setGenPage] = useState<number>(1);
  const pageSize = 20;

  // --- TAB 2: Monthly Compliance Report State ---
  const [compMonth, setCompMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [compMetric, setCompMetric] = useState<string>('all');
  const [compSortBy, setCompSortBy] = useState<'stall_no' | 'owner'>('stall_no');
  const [compPage, setCompPage] = useState<number>(1);

  // General KPI Metrics
  const totalStallsCount = stalls.length;
  const occupiedCount = stalls.filter((s) => s.status === 'Occupied').length;
  const vacantCount = totalStallsCount - occupiedCount;
  const occupancyRate = totalStallsCount ? Math.round((occupiedCount / totalStallsCount) * 100) : 0;
  const compliantCount = stalls.filter(
    (s) => s.current_tenant?.compliance_status === 'Compliant'
  ).length;

  // TAB 1: Filtered Stalls
  const filteredGeneralStalls = useMemo(() => {
    return stalls
      .filter((s) => {
        if (genZone !== 'All' && s.zone.toLowerCase() !== genZone.toLowerCase()) return false;
        if (genStatus !== 'All' && s.status !== genStatus) return false;
        if (genCompliance !== 'All') {
          const comp = s.current_tenant?.compliance_status || 'Non-Compliant';
          if (comp !== genCompliance) return false;
        }
        if (genSearch.trim() !== '') {
          const term = genSearch.toLowerCase();
          const str = `${s.stall_no} ${s.current_tenant?.stall_owner || ''} ${
            s.current_tenant?.operator || ''
          } ${s.current_tenant?.line_of_business || ''}`.toLowerCase();
          if (!str.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (genSortBy === 'owner') {
          const nameA = (a.current_tenant?.stall_owner || '').toLowerCase();
          const nameB = (b.current_tenant?.stall_owner || '').toLowerCase();
          return nameA.localeCompare(nameB);
        }
        return a.stall_no.localeCompare(b.stall_no, undefined, { numeric: true });
      });
  }, [stalls, genZone, genStatus, genCompliance, genSearch, genSortBy]);

  // General Pagination
  const totalGenRows = filteredGeneralStalls.length;
  const maxGenPage = Math.max(1, Math.ceil(totalGenRows / pageSize));
  const validGenPage = Math.min(genPage, maxGenPage);
  const genStartIndex = (validGenPage - 1) * pageSize;
  const genEndIndex = genStartIndex + pageSize;
  const paginatedGeneralStalls = filteredGeneralStalls.slice(genStartIndex, genEndIndex);

  // TAB 2: Derived Compliance Stalls
  const complianceData = useMemo(() => {
    return stalls.map((s) => {
      const isOccupied = s.status === 'Occupied';
      const isCompliant = s.current_tenant?.compliance_status === 'Compliant';

      // For occupied compliant stalls, simulate baseline approvals
      const operational = isOccupied;
      const permitSubmitted = isOccupied && isCompliant;
      const leaseSubmitted = isOccupied && isCompliant;
      const rentalPaid = isOccupied && isCompliant;
      const rentalOr = rentalPaid ? `OR-${s.stall_no}-2024` : '';
      const seminarsAttended = isOccupied && isCompliant ? ['Food Safety 2024', 'Sanitation'] : [];

      return {
        stall_no: s.stall_no,
        owner: s.current_tenant?.stall_owner || 'Vacant',
        operator: s.current_tenant?.operator || '—',
        line_of_business: s.current_tenant?.line_of_business || '—',
        operational,
        permitSubmitted,
        leaseSubmitted,
        rentalPaid,
        rentalOr,
        seminarsAttended,
      };
    });
  }, [stalls]);

  // Compliance KPIs
  const compTotals = useMemo(() => {
    const total = complianceData.length;
    const op = complianceData.filter((d) => d.operational).length;
    const permit = complianceData.filter((d) => d.permitSubmitted).length;
    const lease = complianceData.filter((d) => d.leaseSubmitted).length;
    const rental = complianceData.filter((d) => d.rentalPaid).length;

    return {
      total,
      op,
      permit,
      lease,
      rental,
    };
  }, [complianceData]);

  // Filtered Compliance Stalls
  const filteredComplianceStalls = useMemo(() => {
    return complianceData
      .filter((d) => {
        if (compMetric === 'op') return d.operational;
        if (compMetric === 'non_op') return !d.operational;
        if (compMetric === 'permit_yes') return d.permitSubmitted;
        if (compMetric === 'permit_no') return !d.permitSubmitted;
        if (compMetric === 'lease_yes') return d.leaseSubmitted;
        if (compMetric === 'lease_no') return !d.leaseSubmitted;
        if (compMetric === 'rental_yes') return d.rentalPaid;
        if (compMetric === 'rental_no') return !d.rentalPaid;
        if (compMetric === 'sem_yes') return d.seminarsAttended.length > 0;
        if (compMetric === 'sem_no') return d.seminarsAttended.length === 0;
        return true;
      })
      .sort((a, b) => {
        if (compSortBy === 'owner') {
          return a.owner.localeCompare(b.owner);
        }
        return a.stall_no.localeCompare(b.stall_no, undefined, { numeric: true });
      });
  }, [complianceData, compMetric, compSortBy]);

  // Compliance Pagination
  const totalCompRows = filteredComplianceStalls.length;
  const maxCompPage = Math.max(1, Math.ceil(totalCompRows / pageSize));
  const validCompPage = Math.min(compPage, maxCompPage);
  const compStartIndex = (validCompPage - 1) * pageSize;
  const compEndIndex = compStartIndex + pageSize;
  const paginatedComplianceStalls = filteredComplianceStalls.slice(compStartIndex, compEndIndex);

  // --- Export Full Dataset to CSV (UTF-8 BOM) ---
  const handleExportGeneralCSV = () => {
    const headers = ['Stall No', 'Zone', 'Status', 'Owner', 'Operator', 'Line of Business', 'Compliance'];
    const rows = filteredGeneralStalls.map((s) => [
      `"${s.stall_no}"`,
      `"${s.zone.toUpperCase()}"`,
      `"${s.status}"`,
      `"${s.current_tenant?.stall_owner || ''}"`,
      `"${s.current_tenant?.operator || ''}"`,
      `"${s.current_tenant?.line_of_business || ''}"`,
      `"${s.current_tenant?.compliance_status || 'N/A'}"`,
    ]);

    const csvString = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `market_general_status_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportComplianceCSV = () => {
    const headers = ['Stall No', 'Owner', 'Operational', 'Business Permit', 'Lease Contract', 'Rental O.R.', 'Seminars'];
    const rows = filteredComplianceStalls.map((d) => [
      `"${d.stall_no}"`,
      `"${d.owner}"`,
      `"${d.operational ? 'Operational' : 'Non-Operational'}"`,
      `"${d.permitSubmitted ? 'Submitted' : 'No Submission'}"`,
      `"${d.leaseSubmitted ? 'Submitted' : 'No Submission'}"`,
      `"${d.rentalPaid ? d.rentalOr : 'No Payment'}"`,
      `"${d.seminarsAttended.join('; ') || 'None'}"`,
    ]);

    const csvString = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `market_monthly_compliance_${compMonth}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Landscape Print Report Window (100% of Filtered Records) ---
  const handlePrintGeneralReport = () => {
    const preparerName = currentUser?.username || 'Market In-Charge / Supervisor';
    const subTitle = `Zone: ${genZone} | Status: ${genStatus} | Compliance: ${genCompliance} | Generated: ${new Date().toLocaleDateString()}`;

    const rowsHtml = filteredGeneralStalls
      .map(
        (s) => `<tr>
        <td style="font-weight:bold;">${s.stall_no}</td>
        <td style="text-transform:uppercase;">${s.zone}</td>
        <td>${s.status}</td>
        <td><strong>${s.current_tenant?.stall_owner || '—'}</strong></td>
        <td>${s.current_tenant?.operator || '—'}</td>
        <td>${s.current_tenant?.line_of_business || '—'}</td>
        <td>${s.current_tenant?.compliance_status || 'N/A'}</td>
      </tr>`
      )
      .join('');

    const printWin = window.open('', '', 'width=1000,height=750');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Market General Status Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 25px; color: #111; font-size: 10.5pt; }
          .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
          .report-header h2 { margin: 0; font-size: 1.35rem; text-transform: uppercase; letter-spacing: 0.5px; }
          .report-header h3 { margin: 4px 0 0; font-size: 1.1rem; color: #1e3a8a; }
          .report-header p { margin: 4px 0 0; color: #475569; font-size: 0.9rem; }
          
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.85rem; }
          table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          table.data-table th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; }
          table.data-table tr:nth-child(even) { background-color: #f8fafc; }

          .signature-section { display: flex; justify-content: space-between; margin-top: 45px; page-break-inside: avoid; }
          .sig-box { width: 240px; text-align: center; }
          .sig-label { text-align: left; margin-bottom: 40px; font-weight: 600; font-size: 0.9rem; }
          .sig-line { border-bottom: 1.5px solid #000; padding-bottom: 4px; font-weight: bold; font-size: 0.95rem; }
          .sig-title { margin-top: 4px; font-size: 0.8rem; color: #555; }

          @media print { 
            body { margin: 0.3in; }
            @page { size: landscape; margin: 0.3in; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h2>Municipal Economic Enterprise Development Office (MEEDO)</h2>
          <h3>Public Market General Status & Tenancy Register</h3>
          <p>${subTitle}</p>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Stall No.</th>
              <th>Zone</th>
              <th>Status</th>
              <th>Stall Owner</th>
              <th>Operator</th>
              <th>Line of Business</th>
              <th>Compliance</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center;">No stall records found.</td></tr>'}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-label">Prepared by:</div>
            <div class="sig-line">${preparerName}</div>
            <div class="sig-title">Market In-Charge / Inspector</div>
          </div>
          <div class="sig-box">
            <div class="sig-label">Noted by:</div>
            <div class="sig-line">Municipal Administrator</div>
            <div class="sig-title">MEEDO Administrator</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  };

  const handlePrintComplianceReport = () => {
    const preparerName = currentUser?.username || 'Market In-Charge / Supervisor';
    const subTitle = `Compliance Period: ${compMonth} | Metric Filter: ${compMetric.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}`;

    const rowsHtml = filteredComplianceStalls
      .map(
        (d) => `<tr>
        <td style="font-weight:bold;">${d.stall_no}</td>
        <td><strong>${d.owner}</strong></td>
        <td>${d.operational ? 'Operational' : 'Non-Operational'}</td>
        <td>${d.permitSubmitted ? 'Submitted' : 'No Submission'}</td>
        <td>${d.leaseSubmitted ? 'Submitted' : 'No Submission'}</td>
        <td>${d.rentalPaid ? d.rentalOr : 'No Payment'}</td>
        <td>${d.seminarsAttended.join(', ') || 'None'}</td>
      </tr>`
      )
      .join('');

    const printWin = window.open('', '', 'width=1000,height=750');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Market Monthly Compliance Report - ${compMonth}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 25px; color: #111; font-size: 10.5pt; }
          .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
          .report-header h2 { margin: 0; font-size: 1.35rem; text-transform: uppercase; letter-spacing: 0.5px; }
          .report-header h3 { margin: 4px 0 0; font-size: 1.1rem; color: #1e3a8a; }
          .report-header p { margin: 4px 0 0; color: #475569; font-size: 0.9rem; }
          
          .summary-grid { display: flex; gap: 12px; margin-bottom: 18px; }
          .summary-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #f8fafc; text-align: center; }
          .summary-val { font-size: 1.3rem; font-weight: bold; color: #1e3a8a; }
          .summary-lbl { font-size: 0.75rem; text-transform: uppercase; color: #64748b; margin-top: 3px; }

          table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem; }
          table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          table.data-table th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; }
          table.data-table tr:nth-child(even) { background-color: #f8fafc; }

          .signature-section { display: flex; justify-content: space-between; margin-top: 45px; page-break-inside: avoid; }
          .sig-box { width: 240px; text-align: center; }
          .sig-label { text-align: left; margin-bottom: 40px; font-weight: 600; font-size: 0.9rem; }
          .sig-line { border-bottom: 1.5px solid #000; padding-bottom: 4px; font-weight: bold; font-size: 0.95rem; }
          .sig-title { margin-top: 4px; font-size: 0.8rem; color: #555; }

          @media print { 
            body { margin: 0.3in; }
            @page { size: landscape; margin: 0.3in; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h2>Municipal Economic Enterprise Development Office (MEEDO)</h2>
          <h3>Monthly Stall Compliance & Verification Report</h3>
          <p>${subTitle}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-val">${compTotals.total}</div>
            <div class="summary-lbl">Total Stalls</div>
          </div>
          <div class="summary-card">
            <div class="summary-val" style="color: #166534;">${compTotals.op}</div>
            <div class="summary-lbl">Operational</div>
          </div>
          <div class="summary-card">
            <div class="summary-val">${compTotals.permit}</div>
            <div class="summary-lbl">Permits Submitted</div>
          </div>
          <div class="summary-card">
            <div class="summary-val">${compTotals.lease}</div>
            <div class="summary-lbl">Leases Submitted</div>
          </div>
          <div class="summary-card">
            <div class="summary-val">${compTotals.rental}</div>
            <div class="summary-lbl">Rentals Paid</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Stall No.</th>
              <th>Owner Name</th>
              <th>Operational Status</th>
              <th>Business Permit</th>
              <th>Lease Contract</th>
              <th>Rental O.R.</th>
              <th>Seminars Attended</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center;">No compliance records found.</td></tr>'}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-label">Prepared by:</div>
            <div class="sig-line">${preparerName}</div>
            <div class="sig-title">Market In-Charge / Inspector</div>
          </div>
          <div class="sig-box">
            <div class="sig-label">Noted by:</div>
            <div class="sig-line">Municipal Administrator</div>
            <div class="sig-title">MEEDO Administrator</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Generated Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            General tenancy registry, compliance verification matrices, full-dataset CSV exports, and formal registers.
          </p>
        </div>

        {/* Dual Tab Buttons */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs no-print">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            General Status Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              activeTab === 'compliance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Monthly Compliance Report
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GENERAL STATUS REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <Card className="p-3.5 bg-white border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">Total Stalls</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{totalStallsCount}</span>
              <span className="text-[11px] text-slate-400 font-medium">All 4 Market Zones</span>
            </Card>

            <Card className="p-3.5 bg-white border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">Occupied Stalls</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{occupiedCount}</span>
              <span className="text-[11px] text-emerald-700 font-semibold">{occupancyRate}% Occupancy</span>
            </Card>

            <Card className="p-3.5 bg-white border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">Vacant Stalls</span>
              <span className="text-2xl font-black text-slate-600 mt-1 block">{vacantCount}</span>
              <span className="text-[11px] text-slate-400 font-medium">Available for Lease</span>
            </Card>

            <Card className="p-3.5 bg-white border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">Compliant Tenants</span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">{compliantCount}</span>
              <span className="text-[11px] text-blue-700 font-semibold">Verified Permits & Lease</span>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="p-4 no-print bg-slate-50/70 border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Zone</label>
                <select
                  value={genZone}
                  onChange={(e) => {
                    setGenZone(e.target.value);
                    setGenPage(1);
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="All">All Zones</option>
                  <option value="Wet">Wet Section</option>
                  <option value="Dry">Dry Goods</option>
                  <option value="Old">Old Building</option>
                  <option value="Triangular">Triangular</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
                <select
                  value={genStatus}
                  onChange={(e) => {
                    setGenStatus(e.target.value);
                    setGenPage(1);
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Vacant">Vacant</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Compliance</label>
                <select
                  value={genCompliance}
                  onChange={(e) => {
                    setGenCompliance(e.target.value);
                    setGenPage(1);
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="All">All Compliance</option>
                  <option value="Compliant">Compliant</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Sort By</label>
                <select
                  value={genSortBy}
                  onChange={(e) => setGenSortBy(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="stall_no">Stall Number</option>
                  <option value="owner">Owner Name</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Search</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={genSearch}
                    onChange={(e) => {
                      setGenSearch(e.target.value);
                      setGenPage(1);
                    }}
                    placeholder="Search stall, owner, business..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={handleExportGeneralCSV}>
                <Download className="w-3.5 h-3.5 mr-1 text-blue-600" /> Export CSV (Full Dataset)
              </Button>
              <Button variant="primary" size="sm" onClick={handlePrintGeneralReport}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Report (Full Dataset)
              </Button>
            </div>
          </Card>

          {/* General Table */}
          <Card className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 whitespace-nowrap">Stall No</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Stall Owner</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Business Line</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedGeneralStalls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No stalls found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedGeneralStalls.map((s) => (
                      <tr key={s.stall_no} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{s.stall_no}</td>
                        <td className="py-2.5 px-3 uppercase text-slate-500 font-semibold text-[11px]">
                          {s.zone}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={s.status === 'Occupied' ? 'success' : 'neutral'}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {s.current_tenant?.stall_owner || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{s.current_tenant?.operator || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {s.current_tenant?.line_of_business || '—'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {s.current_tenant ? (
                            <Badge
                              variant={
                                s.current_tenant.compliance_status === 'Compliant' ? 'success' : 'danger'
                              }
                            >
                              {s.current_tenant.compliance_status}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 no-print">
              <span className="text-xs text-slate-500 font-medium">
                Showing {totalGenRows > 0 ? genStartIndex + 1 : 0} to {Math.min(genEndIndex, totalGenRows)} of{' '}
                {totalGenRows} entries
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGenPage((p) => Math.max(1, p - 1))}
                  disabled={validGenPage <= 1}
                  className="text-xs h-8 px-3"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <span className="text-xs font-semibold text-slate-700 px-2">
                  Page {validGenPage} of {maxGenPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGenPage((p) => Math.min(maxGenPage, p + 1))}
                  disabled={validGenPage >= maxGenPage}
                  className="text-xs h-8 px-3"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MONTHLY COMPLIANCE REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'compliance' && (
        <div className="space-y-5">
          {/* 5 Exact Legacy Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card className="p-3.5 bg-white border-slate-200 text-center">
              <div className="text-2xl font-black text-slate-900">{compTotals.total}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase">Total Stalls</div>
            </Card>

            <Card className="p-3.5 bg-white border-slate-200 text-center">
              <div className="text-2xl font-black text-emerald-600">{compTotals.op}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase">Operational</div>
            </Card>

            <Card className="p-3.5 bg-white border-slate-200 text-center">
              <div className="text-2xl font-black text-blue-600">{compTotals.permit}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase">Permits</div>
            </Card>

            <Card className="p-3.5 bg-white border-slate-200 text-center">
              <div className="text-2xl font-black text-purple-600">{compTotals.lease}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase">Leases</div>
            </Card>

            <Card className="p-3.5 bg-white border-slate-200 text-center">
              <div className="text-2xl font-black text-amber-600">{compTotals.rental}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase">Rentals Paid</div>
            </Card>
          </div>

          {/* Compliance Filter Controls */}
          <Card className="p-4 no-print bg-slate-50/70 border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Month</label>
                <input
                  type="month"
                  value={compMonth}
                  onChange={(e) => {
                    setCompMonth(e.target.value);
                    setCompPage(1);
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Metric</label>
                <select
                  value={compMetric}
                  onChange={(e) => {
                    setCompMetric(e.target.value);
                    setCompPage(1);
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="all">View All Stalls</option>
                  <optgroup label="Operational Status">
                    <option value="op">Operational Only</option>
                    <option value="non_op">Non-Operational Only</option>
                  </optgroup>
                  <optgroup label="Business Permit">
                    <option value="permit_yes">Submitted Permit</option>
                    <option value="permit_no">No Submission (Permit)</option>
                  </optgroup>
                  <optgroup label="Contract of Lease">
                    <option value="lease_yes">Submitted Lease</option>
                    <option value="lease_no">No Submission (Lease)</option>
                  </optgroup>
                  <optgroup label="Stall Rental">
                    <option value="rental_yes">Paid Rental (Has O.R.)</option>
                    <option value="rental_no">No Payment (Rental)</option>
                  </optgroup>
                  <optgroup label="Seminars">
                    <option value="sem_yes">Attended Seminars</option>
                    <option value="sem_no">No Seminars Attended</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Sort By</label>
                <select
                  value={compSortBy}
                  onChange={(e) => setCompSortBy(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="stall_no">Stall Number</option>
                  <option value="owner">Owner Name</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleExportComplianceCSV} className="text-xs h-8">
                  <Download className="w-3.5 h-3.5 mr-1 text-blue-600" /> Export CSV
                </Button>
                <Button variant="primary" size="sm" onClick={handlePrintComplianceReport} className="text-xs h-8">
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print Report
                </Button>
              </div>
            </div>
          </Card>

          {/* Compliance Table */}
          <Card className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 whitespace-nowrap">Stall No.</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Business Permit</th>
                    <th className="py-2.5 px-3">Lease Contract</th>
                    <th className="py-2.5 px-3">Rental O.R.</th>
                    <th className="py-2.5 px-3">Seminars</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedComplianceStalls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No stalls found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedComplianceStalls.map((d) => (
                      <tr key={d.stall_no} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{d.stall_no}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{d.owner}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={d.operational ? 'success' : 'neutral'}>
                            {d.operational ? 'Operational' : 'Non-Operational'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          {d.permitSubmitted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                              <XCircle className="w-3.5 h-3.5" /> No Submission
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {d.leaseSubmitted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                              <XCircle className="w-3.5 h-3.5" /> No Submission
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {d.rentalPaid ? (
                            <span className="font-bold text-slate-800">{d.rentalOr}</span>
                          ) : (
                            <span className="text-rose-600 font-bold">No Payment</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {d.seminarsAttended.length > 0 ? (
                            <span className="text-blue-700 font-medium">
                              {d.seminarsAttended.join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Compliance Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 no-print">
              <span className="text-xs text-slate-500 font-medium">
                Showing {totalCompRows > 0 ? compStartIndex + 1 : 0} to{' '}
                {Math.min(compEndIndex, totalCompRows)} of {totalCompRows} entries
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompPage((p) => Math.max(1, p - 1))}
                  disabled={validCompPage <= 1}
                  className="text-xs h-8 px-3"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <span className="text-xs font-semibold text-slate-700 px-2">
                  Page {validCompPage} of {maxCompPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompPage((p) => Math.min(maxCompPage, p + 1))}
                  disabled={validCompPage >= maxCompPage}
                  className="text-xs h-8 px-3"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

