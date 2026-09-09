'use client';

import React from 'react';
import { useMeedo } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Bus } from 'lucide-react';

export default function TransportReportsPage() {
  const { todas, todaMembers } = useMeedo();

  const totalRegisteredDrivers = todas.reduce((sum, t) => sum + t.total_members, 0);
  const totalEncodedProfiles = todaMembers.length;
  const maleCount = todaMembers.filter((m) => m.sex === 'Male').length;
  const femaleCount = todaMembers.filter((m) => m.sex === 'Female').length;

  const malePercent = totalEncodedProfiles ? Math.round((maleCount / totalEncodedProfiles) * 100) : 0;
  const femalePercent = totalEncodedProfiles ? Math.round((femaleCount / totalEncodedProfiles) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Transport Demographic Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section D: Gender & Development (GAD) analytics, franchise coverage, and association metrics.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => window.print()} className="no-print">
          <Printer className="w-4 h-4 mr-1.5" /> Print Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total TODAs</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{todas.length} Associations</span>
          <span className="text-[11px] text-slate-400 font-medium">Registered Franchises</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Drivers</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{totalRegisteredDrivers}</span>
          <span className="text-[11px] text-emerald-700 font-semibold">Across all routes</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Male Drivers (GAD)</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {maleCount} ({malePercent}%)
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Encoded profiles</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Female Drivers (GAD)</span>
          <span className="text-2xl font-black text-pink-600 mt-1 block">
            {femaleCount} ({femalePercent}%)
          </span>
          <span className="text-[11px] text-pink-700 font-semibold">Women in Transport</span>
        </Card>
      </div>

      {/* Association Summary Table */}
      <Card>
        <h3 className="font-bold text-slate-800 text-sm mb-3">TODA Summary Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-2.5 px-3">TODA Name</th>
                <th className="py-2.5 px-3">President</th>
                <th className="py-2.5 px-3">Registered Cap</th>
                <th className="py-2.5 px-3">Encoded Profiles</th>
                <th className="py-2.5 px-3">Male Drivers</th>
                <th className="py-2.5 px-3">Female Drivers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todas.map((t) => {
                const membersOfToda = todaMembers.filter(
                  (m) => m.toda_id === t.id || m.toda_name === t.name
                );
                const males = membersOfToda.filter((m) => m.sex === 'Male').length;
                const females = membersOfToda.filter((m) => m.sex === 'Female').length;

                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{t.president}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{t.total_members}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-700">{membersOfToda.length}</td>
                    <td className="py-2.5 px-3 text-slate-600">{males}</td>
                    <td className="py-2.5 px-3 text-pink-600 font-medium">{females}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
