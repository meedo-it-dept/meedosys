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
  Printer,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BlotterPrintSheet } from '@/components/csu/blotter/BlotterPrintSheet';

interface GuardHistoryViewProps {
  currentGuard: MarketGuard;
}

export const GuardHistoryView: React.FC<GuardHistoryViewProps> = ({ currentGuard }) => {
  const { csuReports } = useMeedo();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<CsuDailyReport | null>(null);
  const [printReport, setPrintReport] = useState<CsuDailyReport | null>(null);

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

  // Helper to parse turnover notes cleanly
  const parseTurnoverNotes = (notes: string | undefined) => {
    if (!notes) {
      return {
        baseNote: 'Properly turned over security post, keys, handheld radio, and peace & order logbook.',
        annotations: [],
      };
    }

    const pattern = /(\[(?:CORRECTION REQUESTED[^\]]*|ADMIN APPROVAL NOTE[^\]]*)\]:[^[]*)/g;
    const matches = notes.match(pattern);
    let baseNote = notes.replace(pattern, '').trim();

    if (!baseNote) {
      baseNote = 'Properly turned over security post, keys, handheld radio, and peace & order logbook.';
    }

    const annotations = (matches || []).map((m) => {
      const isCorrection = m.startsWith('[CORRECTION REQUESTED');
      const headerMatch = m.match(/^(\[[^\]]+\]):\s*([\s\S]*)/);
      return {
        type: isCorrection ? 'correction' : 'admin',
        header: headerMatch ? headerMatch[1].replace(/[\[\]]/g, '') : '',
        body: headerMatch ? headerMatch[2].trim() : m.trim(),
      };
    });

    return { baseNote, annotations };
  };

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
      <div className="space-y-4">
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
                className={`rounded-2xl border transition shadow-sm overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Card Summary Header */}
                <div
                  onClick={() => setSelectedReport(isSelected ? null : report)}
                  className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="rounded-xl bg-slate-100 border border-slate-200/60 p-2.5 text-center min-w-[75px] shrink-0">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {new Date(report.report_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="block text-xl font-black text-slate-900 leading-tight">
                        {new Date(report.report_date).getDate()}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-medium">
                        {new Date(report.report_date).getFullYear()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{report.shift}</span>
                        {report.is_locked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Submitted & Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 border border-amber-200">
                            Draft / Open
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                        <Shield className="h-3 w-3 text-slate-400" />
                        {report.area_covered || 'General Market Perimeter'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 font-medium">
                          Incidents: <strong className="text-slate-800">{report.incident_data?.length || 0}</strong>
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 font-medium">
                          Violations: <strong className="text-slate-800">{report.violations_data?.length || 0}</strong>
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 font-medium">
                          Lost & Found: <strong className="text-slate-800">{report.lost_found_data?.length || 0}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-xs font-semibold text-blue-600">
                      {isSelected ? 'Collapse Details' : 'View Shift Details'}
                    </span>
                    <div
                      className={`p-1 rounded-full bg-slate-100 text-slate-500 transition-transform ${
                        isSelected ? 'rotate-90 bg-blue-100 text-blue-600' : ''
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isSelected && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-2 border-t border-slate-200/80 space-y-4">
                    {/* Summary of Activities */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4 space-y-1.5">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        Summary of Shift Activities
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pl-5">
                        {report.summary_activities ||
                          'Routine security patrol, sector perimeter inspection, and peace & order monitoring conducted.'}
                      </p>
                    </div>

                    {/* Turnover Notes with structured annotation tags */}
                    {(() => {
                      const { baseNote, annotations } = parseTurnoverNotes(report.turnover_notes);
                      return (
                        <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4 space-y-2.5">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                            <Clock className="h-3.5 w-3.5 text-indigo-600" />
                            Turnover & Service Notes
                          </span>
                          <p className="text-xs text-slate-700 italic pl-5">"{baseNote}"</p>

                          {/* Render any correction or admin approval notes as dedicated callouts */}
                          {annotations.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-200/60 pl-5">
                              {annotations.map((ann, idx) => (
                                <div
                                  key={idx}
                                  className={`rounded-lg p-2.5 text-xs ${
                                    ann.type === 'correction'
                                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                                      : 'bg-blue-50 border border-blue-200 text-blue-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 font-bold text-[11px] mb-1">
                                    {ann.type === 'correction' ? (
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                                    )}
                                    <span>{ann.header}</span>
                                  </div>
                                  <p className="text-slate-800 pl-5">{ann.body}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Sign-off and Print Action Bar (Footer) */}
                    <div className="rounded-xl bg-slate-100/90 border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs text-slate-600">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Duty Officer / Prepared by:
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {report.prep_name || currentGuard.guard_name}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {report.prep_title || 'Market Guard-on-Duty'}
                          </span>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-slate-200" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            MEEDO Approval:
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {report.app_name || 'Marife V. Cachuela'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {report.app_title || 'MEEDO Department Head'}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintReport(report);
                        }}
                        className="rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs h-8 gap-1.5 self-start sm:self-center shadow-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                        View / Print Blotter Sheet
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Dedicated Print Sheet Modal */}
      {printReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 md:p-8 backdrop-blur-sm overflow-y-auto no-print:bg-black/75">
          <div className="relative w-full max-w-5xl rounded-3xl bg-slate-100 p-4 sm:p-6 shadow-2xl max-h-[96vh] overflow-y-auto">
            <BlotterPrintSheet
              report={printReport}
              isModal
              onClose={() => setPrintReport(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
