'use client';

import React from 'react';
import { useMeedo } from '@/lib/store';
import {
  Shield,
  Activity,
  AlertTriangle,
  Footprints,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  Radio,
  FileCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const GuardFacilityStats: React.FC = () => {
  const { guards, csuReports, activeShiftSession, marketCalendarEvents } = useMeedo();

  // Active guards count
  const activeGuardsCount = guards.filter((g) => g.status === 'Active').length;

  // Total incidents recorded across all blotters
  const allIncidents = csuReports.flatMap((r) => r.incident_data || []);
  const allViolations = csuReports.flatMap((r) => r.violations_data || []);
  const allLostFound = csuReports.flatMap((r) => r.lost_found_data || []);

  // Today's calendar activities
  const todayActivities = marketCalendarEvents.filter((e) => e.date === '2026-09-26');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Facility Security & Operations Overview
            </h1>
            <p className="text-xs text-slate-500">
              Operational situational awareness for Market Guards on duty
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Facility KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <Shield className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Roster</span>
          </div>
          <span className="text-2xl font-black text-blue-950 block">{activeGuardsCount}</span>
          <span className="text-[11px] text-blue-700 font-medium">Market Guards Deployed</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <Footprints className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Tasks</span>
          </div>
          <span className="text-2xl font-black text-emerald-950 block">{todayActivities.length}</span>
          <span className="text-[11px] text-emerald-700 font-medium">Scheduled Operations</span>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
          <div className="flex items-center justify-between text-red-700 mb-1">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Incident Log</span>
          </div>
          <span className="text-2xl font-black text-red-950 block">{allIncidents.length}</span>
          <span className="text-[11px] text-red-700 font-medium">Logged Incidents</span>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
          <div className="flex items-center justify-between text-teal-700 mb-1">
            <FileCheck className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Lost & Found</span>
          </div>
          <span className="text-2xl font-black text-teal-950 block">{allLostFound.length}</span>
          <span className="text-[11px] text-teal-700 font-medium">Items Processed</span>
        </div>
      </div>

      {/* Sector Security Roving Status */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          Sector Roving Priority Index
        </h2>

        <div className="space-y-3">
          {[
            { sector: 'Wet Section & Fish Alleyways', status: 'High Vigilance', level: '95%', color: 'bg-blue-600' },
            { sector: 'Triangular Section & Produce Walkways', status: 'Normal Roving', level: '85%', color: 'bg-emerald-600' },
            { sector: 'Terminal & Unloading Cargo Bays', status: 'Heavy Traffic Monitoring', level: '90%', color: 'bg-amber-600' },
            { sector: 'Dry Goods & Commercial Stalls', status: 'Routine Observation', level: '75%', color: 'bg-purple-600' },
            { sector: 'Main Gate & Perimeter Fence', status: 'Perimeter Lockdown Ready', level: '80%', color: 'bg-indigo-600' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">{item.sector}</span>
                <span className="text-slate-500 font-mono">{item.status} ({item.level})</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: item.level }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standard Guard Operating Checklist */}
      <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Active Duty Shift Standard Protocols
          </h2>
          <span className="text-[11px] text-slate-400">MEEDO CSU Directive</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="rounded-2xl bg-slate-800 p-3.5 space-y-1">
            <span className="font-bold text-white block">1. Roving & Walkway Clearance</span>
            <p className="text-slate-400 text-[11px]">
              Conduct visual inspections every hour. Ensure no vendor merchandise or crates spill past designated yellow stall boundary lines.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800 p-3.5 space-y-1">
            <span className="font-bold text-white block">2. Fire & Electrical Safety</span>
            <p className="text-slate-400 text-[11px]">
              Verify fire exit corridors and hydrants remain unobstructed. Check sub-meter areas for unauthorized jumper wires or smoke odors.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800 p-3.5 space-y-1">
            <span className="font-bold text-white block">3. Immediate Incident Escalation</span>
            <p className="text-slate-400 text-[11px]">
              For violent altercations or theft, contact PNP Substation immediately. Log details in mobile incident reporter within 15 minutes.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800 p-3.5 space-y-1">
            <span className="font-bold text-white block">4. Orderly Turnover at Shift End</span>
            <p className="text-slate-400 text-[11px]">
              Physically account for all entrance gate keys, master padlocks, and hand over the active blotter logbook to the incoming shift guard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
