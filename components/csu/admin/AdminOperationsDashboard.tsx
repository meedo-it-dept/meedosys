'use client';

import React from 'react';
import { useMeedo } from '@/lib/store';
import {
  Calendar,
  Shield,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Users,
  Activity,
  Plus,
  ArrowRight,
  Radio,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminOperationsDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateEvent: () => void;
}

export const AdminOperationsDashboard: React.FC<AdminOperationsDashboardProps> = ({
  onNavigateTab,
  onOpenCreateEvent,
}) => {
  const { marketCalendarEvents, guards, activeShiftSession, csuReports } = useMeedo();

  const todayStr = '2026-09-26';

  // Today's events
  const todayEvents = marketCalendarEvents.filter((e) => e.date === todayStr);

  // Upcoming events (after today)
  const upcomingEvents = marketCalendarEvents
    .filter((e) => e.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    .slice(0, 5);

  // Active guards count
  const activeGuardsCount = guards.filter((g) => g.status === 'Active').length;

  // Total incidents & violations today/all
  const totalIncidents = csuReports.reduce((acc, r) => acc + (r.incident_data?.length || 0), 0);
  const totalViolations = csuReports.reduce((acc, r) => acc + (r.violations_data?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 text-white font-bold text-xs uppercase tracking-wider">
                Municipal Peace & Order Operations Desk
              </Badge>
              <span className="text-xs text-slate-300 font-mono">
                Saturday, September 26, 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Market Operations & Security Center
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Centralized oversight of Market Guard rosters, daily shift blotters, multi-sector sanitation inspections, and facility operations calendar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={onOpenCreateEvent}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-lg shadow-blue-600/30 px-4 py-2.5"
            >
              <Plus className="h-4 w-4" /> Schedule Activity / Shift
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigateTab('calendar')}
              className="rounded-2xl border-slate-600 bg-slate-800/80 text-white hover:bg-slate-700 font-bold text-xs gap-1.5 px-4 py-2.5"
            >
              <Calendar className="h-4 w-4" /> Open Full Calendar
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('roster')}
          className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs transition hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <Shield className="h-5 w-5" />
            <span className="text-xs font-bold text-blue-700 group-hover:translate-x-1 transition">
              View Roster →
            </span>
          </div>
          <span className="text-3xl font-black text-slate-900 block">{activeGuardsCount}</span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">Active Market Guards</span>
        </div>

        <div
          onClick={() => onNavigateTab('calendar')}
          className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs transition hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition">
              Calendar →
            </span>
          </div>
          <span className="text-3xl font-black text-slate-900 block">{todayEvents.length}</span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">Operations Today</span>
        </div>

        <div
          onClick={() => onNavigateTab('incidents')}
          className="rounded-2xl border border-red-200 bg-white p-5 shadow-xs transition hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between text-red-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-bold text-red-700 group-hover:translate-x-1 transition">
              Incidents →
            </span>
          </div>
          <span className="text-3xl font-black text-slate-900 block">{totalIncidents}</span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">Incident Records</span>
        </div>

        <div
          onClick={() => onNavigateTab('masterBlotter')}
          className="rounded-2xl border border-purple-200 bg-white p-5 shadow-xs transition hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-bold text-purple-700 group-hover:translate-x-1 transition">
              Blotters →
            </span>
          </div>
          <span className="text-3xl font-black text-slate-900 block">{csuReports.length}</span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">Shift Blotter Reports</span>
        </div>
      </div>

      {/* Main Grid: Today's Operations & Live Guard Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Operations Schedule */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Today's Market Operations & Shifts
              </h2>
              <p className="text-xs text-slate-500">
                Live monitoring for September 26, 2026 ({todayEvents.length} scheduled tasks)
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-bold rounded-xl"
            >
              Full Calendar
            </Button>
          </div>

          <div className="space-y-3">
            {todayEvents.length === 0 ? (
              <div className="py-10 text-center text-slate-400 italic text-xs">
                No scheduled activities or guard duty for today.
              </div>
            ) : (
              todayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="rounded-xl bg-white border border-slate-200 p-2 text-center min-w-[75px] shadow-xs">
                      <span className="block font-mono text-xs font-bold text-slate-800">
                        {evt.start_time}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-500">
                        {evt.end_time}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{evt.title}</span>
                        <Badge variant="outline" className="text-[10px] bg-white">
                          {evt.category}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <MapPin className="h-3 w-3 text-emerald-600" /> {evt.location}
                        </span>
                        {evt.assigned_personnel && (
                          <span className="flex items-center gap-1 font-bold text-blue-900">
                            <Shield className="h-3 w-3 text-blue-600" /> {evt.assigned_personnel}
                            {evt.call_sign && ` (${evt.call_sign})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        evt.status === 'Ongoing'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : evt.status === 'Completed'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Guards On-Duty Monitor & Upcoming Activities */}
        <div className="space-y-6">
          {/* Active Guard Monitor */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-600" />
                Live Guard On-Duty Status
              </h2>
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            {activeShiftSession ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">
                    {activeShiftSession.guard_name}
                  </span>
                  <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                    ON DUTY
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>Call Sign: <span className="font-mono font-bold text-slate-900">{activeShiftSession.call_sign}</span></p>
                  <p>Sector: <span className="font-semibold text-slate-800">{activeShiftSession.area}</span></p>
                  <p>Time In: <span className="font-mono font-bold text-emerald-800">{activeShiftSession.time_in}</span></p>
                  <p>Checks: <span className="font-bold text-slate-900">{activeShiftSession.patrol_logs.length} roving checks logged</span></p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">No Guard Clocked In Right Now</p>
                <p className="text-[11px] text-slate-400">
                  Guards on duty clock in via their mobile "My Shift" dashboard.
                </p>
              </div>
            )}
          </div>

          {/* Upcoming Activities Widget */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-purple-600" />
                Upcoming Activities (Next 7 Days)
              </h2>
            </div>

            <div className="space-y-2.5">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No upcoming events scheduled.</p>
              ) : (
                upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[190px]">
                        {evt.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {evt.date} • {evt.start_time}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {evt.category}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
