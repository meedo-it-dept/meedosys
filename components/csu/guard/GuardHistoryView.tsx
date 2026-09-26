'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { MarketGuard, CsuDailyReport } from '@/lib/types';
import {
  Clock,
  Calendar,
  Shield,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface GuardHistoryViewProps {
  currentGuard: MarketGuard;
}

export const GuardHistoryView: React.FC<GuardHistoryViewProps> = ({ currentGuard }) => {
  const { csuReports } = useMeedo();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<CsuDailyReport | null>(null);

  // Filter reports where currentGuard served
  const myReports = csuReports.filter(
    (r) =>
      r.prep_name.toLowerCase().includes(currentGuard.guard_name.toLowerCase()) ||
      r.personnel_data.some((p) => p.guard_id === currentGuard.guard_id)
  );

  const filtered = myReports.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.report_date.includes(q) ||
      r.shift.toLowerCase().includes(q) ||
      r.area_covered.toLowerCase().includes(q) ||
      (r.summary_activities || '').toLowerCase().includes(q)
    );
  });

  const totalShifts = myReports.length;
  const totalIncidents = myReports.reduce((acc, curr) => acc + (curr.incident_data?.length || 0), 0);
  const totalViolations = myReports.reduce((acc, curr) => acc + (curr.violations_data?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & KPI Summary */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Duty History & Service Log
              </h1>
              <Badge className="bg-purple-600 text-white font-mono text-xs">
                {currentGuard.guard_id}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative service record and past shift blotters for {currentGuard.guard_name}
            </p>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-center">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Completed Shifts
            </span>
            <span className="block text-2xl font-black text-blue-950 mt-1">{totalShifts}</span>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 text-center">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-red-800">
              Incidents Handled
            </span>
            <span className="block text-2xl font-black text-red-950 mt-1">{totalIncidents}</span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Violations Cited
            </span>
            <span className="block text-2xl font-black text-amber-950 mt-1">{totalViolations}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by date (YYYY-MM-DD), shift, or sector..."
          className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Shifts Timeline List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No shift records matching your filter.</p>
          </div>
        ) : (
          filtered.map((report) => {
            const isSelected = selectedReport?.id === report.id;
            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(isSelected ? null : report)}
                className={`rounded-2xl border p-4.5 transition cursor-pointer shadow-xs ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="rounded-xl bg-slate-100 p-2.5 text-center min-w-[75px]">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">
                        {new Date(report.report_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="block text-lg font-black text-slate-900 leading-tight">
                        {new Date(report.report_date).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{report.shift}</span>
                        {report.is_locked ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                            <CheckCircle2 className="h-3 w-3" /> Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">{report.area_covered}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Incidents: {report.incident_data?.length || 0}</span>
                        <span>•</span>
                        <span>Violations: {report.violations_data?.length || 0}</span>
                        <span>•</span>
                        <span>Lost & Found: {report.lost_found_data?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-semibold text-blue-600 hover:underline">
                      {isSelected ? 'Hide Details' : 'View Shift'}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block uppercase text-[10px]">
                        Summary of Activities
                      </span>
                      <p className="text-slate-600 mt-0.5 whitespace-pre-line">
                        {report.summary_activities || 'Routine shift roving.'}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block uppercase text-[10px]">
                        Turnover Notes
                      </span>
                      <p className="text-slate-600 mt-0.5 italic">{report.turnover_notes}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-[11px] text-slate-500">
                      <span>Prepared by: {report.prep_name}</span>
                      <span>Approved by: {report.app_name}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
