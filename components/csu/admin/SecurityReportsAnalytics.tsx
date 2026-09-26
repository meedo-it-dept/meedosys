'use client';

import React, { useState, useMemo } from 'react';
import { useMeedo } from '@/lib/store';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  PieChart,
  BarChart3,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const SecurityReportsAnalytics: React.FC = () => {
  const { csuReports, marketCalendarEvents, guards } = useMeedo();

  const [dateRange, setDateRange] = useState<'all' | 'month' | 'week'>('month');

  // Total scheduled shifts from calendar
  const scheduledDutyEvents = marketCalendarEvents.filter((e) => e.category === 'Guard Duty');
  const completedDutyEvents = scheduledDutyEvents.filter((e) => e.status === 'Completed' || e.status === 'Ongoing');
  const coverageRate =
    scheduledDutyEvents.length > 0
      ? Math.round((completedDutyEvents.length / scheduledDutyEvents.length) * 100)
      : 100;

  // Flatten incidents & violations
  const allIncidents = useMemo(() => csuReports.flatMap((r) => r.incident_data || []), [csuReports]);
  const allViolations = useMemo(() => csuReports.flatMap((r) => r.violations_data || []), [csuReports]);
  const allLostFound = useMemo(() => csuReports.flatMap((r) => r.lost_found_data || []), [csuReports]);

  // Aggregate Incidents by Category
  const incidentsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    allIncidents.forEach((inc) => {
      const t = inc.type || 'Other Security Matter';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allIncidents]);

  // Aggregate Incidents by Location
  const incidentsByLocation = useMemo(() => {
    const counts: Record<string, number> = {};
    allIncidents.forEach((inc) => {
      const loc = inc.location || 'General Market';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allIncidents]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Report Date', 'Shift', 'Guard Name', 'Area Covered', 'Incidents Count', 'Violations Count', 'Status'];
    const rows = csuReports.map((r) => [
      r.report_date,
      `"${r.shift}"`,
      `"${r.prep_name}"`,
      `"${r.area_covered}"`,
      r.incident_data?.length || 0,
      r.violations_data?.length || 0,
      r.is_locked ? 'Locked/Submitted' : 'Draft',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MEEDO_Security_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Hub */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Security Reports & Operations Analytics
              </h1>
              <p className="text-xs text-slate-500">
                Comprehensive Municipal Market Guard Deployment & Incident Metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Download className="h-4 w-4" /> Export CSV / Excel
            </Button>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Printer className="h-4 w-4" /> Print Audit Report
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Shift Coverage Rate
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span className="text-3xl font-black text-blue-950 block">{coverageRate}%</span>
          <span className="text-xs text-slate-500 font-medium">
            {completedDutyEvents.length} of {scheduledDutyEvents.length} Shifts Fulfilled
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Blotters
            </span>
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-3xl font-black text-emerald-950 block">{csuReports.length}</span>
          <span className="text-xs text-slate-500 font-medium">Daily Shift Submissions</span>
        </div>

        <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-red-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Recorded Incidents
            </span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <span className="text-3xl font-black text-red-950 block">{allIncidents.length}</span>
          <span className="text-xs text-slate-500 font-medium">Cumulative Security Events</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Vendor Violations
            </span>
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-3xl font-black text-amber-950 block">{allViolations.length}</span>
          <span className="text-xs text-slate-500 font-medium">Obstruction & CLAYGO Warnings</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Incident Breakdown by Category */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="h-4 w-4 text-red-600" />
              Incidents by Incident Category
            </h2>
            <span className="text-xs font-semibold text-slate-500">{allIncidents.length} total</span>
          </div>

          <div className="space-y-3">
            {incidentsByType.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">
                No incidents on file across all blotters.
              </p>
            ) : (
              incidentsByType.map(([category, count]) => {
                const pct = Math.round((count / allIncidents.length) * 100);
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{category}</span>
                      <span className="text-slate-500 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-red-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Incidents Breakdown by Sector / Location */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Security Incidents by Sector / Location
            </h2>
            <span className="text-xs font-semibold text-slate-500">{incidentsByLocation.length} sectors</span>
          </div>

          <div className="space-y-3">
            {incidentsByLocation.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">
                No incidents reported across market sectors.
              </p>
            ) : (
              incidentsByLocation.map(([loc, count]) => {
                const pct = Math.round((count / allIncidents.length) * 100);
                return (
                  <div key={loc} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 truncate max-w-[240px]">{loc}</span>
                      <span className="text-slate-500 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Guard Deployment & Roster Performance Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            Market Guard Deployment & Service Index
          </h2>
          <span className="text-xs text-slate-500 font-semibold">{guards.length} Guards Registered</span>
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b font-bold text-slate-600 uppercase">
              <tr>
                <th className="p-3">Guard ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Call Sign</th>
                <th className="p-3">Designated Sector</th>
                <th className="p-3">Shifts Logged</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {guards.map((g) => {
                const guardShiftsCount = csuReports.filter(
                  (r) =>
                    r.prep_name.toLowerCase().includes(g.guard_name.toLowerCase()) ||
                    r.personnel_data.some((p) => p.guard_id === g.guard_id)
                ).length;

                return (
                  <tr key={g.guard_id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-700">{g.guard_id}</td>
                    <td className="p-3 font-bold text-slate-900">{g.guard_name}</td>
                    <td className="p-3 font-mono font-bold text-slate-600">
                      {g.radio_call_sign || '--'}
                    </td>
                    <td className="p-3 text-slate-700">{g.default_area || 'General Market'}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{guardShiftsCount} shifts</td>
                    <td className="p-3">
                      <Badge className="bg-emerald-600 text-white text-[10px]">{g.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
