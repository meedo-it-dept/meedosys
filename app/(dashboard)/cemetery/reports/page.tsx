'use client';

import React from 'react';
import { useMeedo } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CalendarDays, Printer } from 'lucide-react';

export default function CemeteryReportsPage() {
  const { cemeteryBookings } = useMeedo();

  const totalBookings = cemeteryBookings.length;
  const totalFees = cemeteryBookings.reduce((sum, b) => sum + b.amount, 0);

  // Group by Barangay
  const brgyMap: Record<string, number> = {};
  cemeteryBookings.forEach((b) => {
    brgyMap[b.address_barangay] = (brgyMap[b.address_barangay] || 0) + 1;
  });

  // Group by Type
  const typeMap: Record<string, number> = {};
  cemeteryBookings.forEach((b) => {
    typeMap[b.burial_type] = (typeMap[b.burial_type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cemetery Demographic Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographical distribution by Barangay, burial type breakdown, and revenue collections.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => window.print()} className="no-print">
          <Printer className="w-4 h-4 mr-1.5" /> Print Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Burials</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalBookings}</span>
          <span className="text-[11px] text-slate-400 font-medium">All plot allocations</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Revenue</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {formatCurrency(totalFees)}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold">Cemetery Enterprise Fund</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Top Barangay</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">Poblacion</span>
          <span className="text-[11px] text-slate-400 font-medium">Highest burial allocation</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Apartment Niches</span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">
            {typeMap['Apartment'] || 0}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Multi-tier niches</span>
        </Card>
      </div>

      {/* Demographics Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-slate-800 text-sm mb-3">Burials by Barangay</h3>
          <div className="space-y-2 text-xs">
            {Object.entries(brgyMap).map(([brgy, count]) => (
              <div key={brgy} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="font-medium text-slate-700">Barangay {brgy}</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {count} ({Math.round((count / totalBookings) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-slate-800 text-sm mb-3">Burials by Type</h3>
          <div className="space-y-2 text-xs">
            {Object.entries(typeMap).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="font-medium text-slate-700">{type}</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {count} plots
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <h3 className="font-bold text-slate-800 text-sm mb-3">Deceased Registry</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-2.5 px-3">Deceased Name</th>
                <th className="py-2.5 px-3">Barangay Address</th>
                <th className="py-2.5 px-3">Date of Burial</th>
                <th className="py-2.5 px-3">Burial Type</th>
                <th className="py-2.5 px-3">Fee Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cemeteryBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{b.deceased_name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{b.address_barangay}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{formatDate(b.burial_date)}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant="info">{b.burial_type}</Badge>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700">{formatCurrency(b.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
