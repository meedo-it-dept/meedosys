'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Printer, Download, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function MarketReportsPage() {
  const { stalls } = useMeedo();

  const [activeTab, setActiveTab] = useState<'general' | 'compliance'>('general');
  const [filterZone, setFilterZone] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const totalStalls = stalls.length;
  const occupiedStalls = stalls.filter((s) => s.status === 'Occupied').length;
  const vacantStalls = totalStalls - occupiedStalls;
  const occupancyPercent = totalStalls ? Math.round((occupiedStalls / totalStalls) * 100) : 0;
  const compliantStalls = stalls.filter(
    (s) => s.current_tenant?.compliance_status === 'Compliant'
  ).length;

  const filteredStalls = stalls.filter((stall) => {
    if (filterZone !== 'All' && stall.zone !== filterZone.toLowerCase()) return false;
    if (filterStatus !== 'All' && stall.status !== filterStatus) return false;
    const term = searchTerm.toLowerCase();
    if (
      term &&
      !stall.stall_no.toLowerCase().includes(term) &&
      !(stall.current_tenant?.stall_owner || '').toLowerCase().includes(term)
    )
      return false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Stall No', 'Zone', 'Status', 'Owner', 'Operator', 'Business Line', 'Compliance'];
    const rows = filteredStalls.map((s) => [
      s.stall_no,
      s.zone.toUpperCase(),
      s.status,
      `"${s.current_tenant?.stall_owner || ''}"`,
      `"${s.current_tenant?.operator || ''}"`,
      `"${s.current_tenant?.line_of_business || ''}"`,
      s.current_tenant?.compliance_status || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `market_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Market Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tenancy status summaries, compliance rates, CSV data export, and print registers.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1.5 text-blue-600" /> Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" /> Print Report
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Stalls</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalStalls}</span>
          <span className="text-[11px] text-slate-400 font-medium">All 4 Market Zones</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Occupied Stalls</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{occupiedStalls}</span>
          <span className="text-[11px] text-emerald-700 font-semibold">{occupancyPercent}% Occupancy Rate</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Vacant Stalls</span>
          <span className="text-2xl font-black text-slate-600 mt-1 block">{vacantStalls}</span>
          <span className="text-[11px] text-slate-400 font-medium">Available for Lease</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Compliant Tenants</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{compliantStalls}</span>
          <span className="text-[11px] text-blue-700 font-semibold">Verified Permits & Lease</span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="no-print">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
            >
              <option value="All">All Zones</option>
              <option value="Wet">Wet Section</option>
              <option value="Dry">Dry Goods</option>
              <option value="Old">Old Building</option>
              <option value="Triangular">Triangular</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Occupied">Occupied</option>
              <option value="Vacant">Vacant</option>
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stall or owner..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Report Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-2.5 px-3">Stall No</th>
                <th className="py-2.5 px-3">Zone</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Stall Owner</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Business Line</th>
                <th className="py-2.5 px-3">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStalls.map((s) => (
                <tr key={s.stall_no} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{s.stall_no}</td>
                  <td className="py-2.5 px-3 uppercase text-slate-500 font-medium">{s.zone}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={s.status === 'Occupied' ? 'success' : 'neutral'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {s.current_tenant?.stall_owner || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{s.current_tenant?.operator || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{s.current_tenant?.line_of_business || '—'}</td>
                  <td className="py-2.5 px-3">
                    {s.current_tenant ? (
                      <Badge
                        variant={
                          s.current_tenant.compliance_status === 'Compliant'
                            ? 'success'
                            : 'danger'
                        }
                      >
                        {s.current_tenant.compliance_status}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
