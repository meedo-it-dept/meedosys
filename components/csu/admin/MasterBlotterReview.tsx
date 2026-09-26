'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { CsuDailyReport } from '@/lib/types';
import {
  FileText,
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Eye,
  Shield,
  Clock,
  MapPin,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlotterPrintSheet } from '@/components/csu/blotter/BlotterPrintSheet';

export const MasterBlotterReview: React.FC = () => {
  const { csuReports, approveBlotterReport, updateCsuReport } = useMeedo();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Locked' | 'Draft' | 'Approved'>('All');
  const [selectedReport, setSelectedReport] = useState<CsuDailyReport | null>(null);
  const [printModalReport, setPrintModalReport] = useState<CsuDailyReport | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Filtered reports
  const filtered = csuReports.filter((r) => {
    if (statusFilter === 'Locked' && (!r.is_locked || r.app_name?.includes('Approved'))) return false;
    if (statusFilter === 'Draft' && r.is_locked) return false;
    if (statusFilter === 'Approved' && !r.app_name?.includes('Approved')) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDate = r.report_date.includes(q);
      const matchGuard = r.prep_name.toLowerCase().includes(q);
      const matchShift = r.shift.toLowerCase().includes(q);
      const matchArea = r.area_covered.toLowerCase().includes(q);
      if (!matchDate && !matchGuard && !matchShift && !matchArea) return false;
    }
    return true;
  });

  const handleApprove = (reportId: string) => {
    approveBlotterReport(reportId, reviewNotes.trim() || undefined);
    setSelectedReport(null);
    setReviewNotes('');
  };

  const handleUnlockForCorrection = (reportId: string) => {
    updateCsuReport(reportId, {
      is_locked: false,
    });
    if (selectedReport) {
      setSelectedReport({ ...selectedReport, is_locked: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Master Shift Blotter & Verification Desk
              </h1>
              <p className="text-xs text-slate-500">
                Administrative review, supervisory verification, and formal signoff of daily logbooks
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by guard name, date, shift, or sector..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="All">All Blotters ({csuReports.length})</option>
              <option value="Locked">Submitted / Pending Review</option>
              <option value="Approved">Fully Approved</option>
              <option value="Draft">Draft In Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b font-bold text-slate-600 uppercase">
            <tr>
              <th className="p-4">Report Date</th>
              <th className="p-4">Shift Schedule</th>
              <th className="p-4">Duty Guard</th>
              <th className="p-4">Sector Covered</th>
              <th className="p-4">Activity Log</th>
              <th className="p-4">Audit Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                  No daily blotter reports match your current filters.
                </td>
              </tr>
            ) : (
              filtered.map((report) => {
                const isApproved = report.app_name?.includes('Approved') || report.app_title?.includes('Approved');
                const hasCorrectionRequest = report.turnover_notes?.includes('CORRECTION REQUESTED');

                return (
                  <tr key={report.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block font-mono">
                        {report.report_date}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {report.day_of_week}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{report.shift}</td>
                    <td className="p-4 font-bold text-slate-900">{report.prep_name}</td>
                    <td className="p-4 text-slate-600">{report.area_covered}</td>
                    <td className="p-4">
                      <span className="text-[11px] text-slate-500">
                        {report.incident_data?.length || 0} incidents • {report.violations_data?.length || 0} violations
                      </span>
                    </td>
                    <td className="p-4">
                      {hasCorrectionRequest ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 border border-amber-300 animate-pulse">
                          <MessageSquare className="h-3 w-3" /> Correction Requested
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      ) : report.is_locked ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 border border-blue-300">
                          <Lock className="h-3 w-3" /> Submitted / Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPrintModalReport(report)}
                          className="rounded-xl text-xs font-bold gap-1 h-8 text-blue-700 hover:bg-blue-50 border-blue-200"
                          title="Print / Export in A4 or US Letter"
                        >
                          <Printer className="h-3.5 w-3.5" /> A4/Letter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReport(report)}
                          className="rounded-xl text-xs font-bold gap-1 h-8"
                        >
                          <Eye className="h-3.5 w-3.5" /> Review & Sign
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Review & Approval Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-slate-900 px-6 py-4 text-white">
              <div>
                <h3 className="text-lg font-bold">Shift Blotter Review & Signoff</h3>
                <p className="text-xs text-slate-400">
                  {selectedReport.report_date} • {selectedReport.shift} • Prepared by {selectedReport.prep_name}
                </p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Correction Alert if flagged */}
              {selectedReport.turnover_notes?.includes('CORRECTION REQUESTED') && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Pending Guard Correction Request
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleUnlockForCorrection(selectedReport.id!)}
                      className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-7 gap-1"
                    >
                      <Unlock className="h-3 w-3" /> Unlock for Guard Editing
                    </Button>
                  </div>
                  <p className="italic bg-white/70 p-2.5 rounded-lg border border-amber-200">
                    {selectedReport.turnover_notes}
                  </p>
                </div>
              )}

              {/* Roster Table */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Guards on Duty
                </span>
                <div className="rounded-xl border overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b font-semibold">
                      <tr>
                        <th className="p-2.5">Guard Name</th>
                        <th className="p-2.5">Area</th>
                        <th className="p-2.5">Time In</th>
                        <th className="p-2.5">Time Out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedReport.personnel_data.map((p, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-bold">{p.guard_name}</td>
                          <td className="p-2.5">{p.assigned_area}</td>
                          <td className="p-2.5 font-mono text-emerald-700 font-bold">{p.time_in}</td>
                          <td className="p-2.5 font-mono">{p.time_out}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Incidents & Violations count */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border p-3 bg-slate-50">
                  <span className="font-bold text-slate-700 block mb-1">
                    Incidents Logged ({selectedReport.incident_data?.length || 0})
                  </span>
                  {selectedReport.incident_data?.length === 0 ? (
                    <span className="text-slate-400 italic">None</span>
                  ) : (
                    selectedReport.incident_data.map((inc, i) => (
                      <p key={i} className="text-slate-600">
                        • <span className="font-bold">{inc.type}:</span> {inc.description}
                      </p>
                    ))
                  )}
                </div>

                <div className="rounded-xl border p-3 bg-slate-50">
                  <span className="font-bold text-slate-700 block mb-1">
                    Violations Cited ({selectedReport.violations_data?.length || 0})
                  </span>
                  {selectedReport.violations_data?.length === 0 ? (
                    <span className="text-slate-400 italic">None</span>
                  ) : (
                    selectedReport.violations_data.map((v, i) => (
                      <p key={i} className="text-slate-600">
                        • <span className="font-bold">{v.identifier}:</span> {v.violation}
                      </p>
                    ))
                  )}
                </div>
              </div>

              {/* Activities Summary */}
              <div className="rounded-xl border p-3 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Activities & Observations</span>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {selectedReport.summary_activities || 'Standard roving conducted.'}
                </p>
              </div>

              {/* Supervisor Signoff Section */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block">
                  Administrator & Supervisor Review Notes
                </span>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  placeholder="Official supervisory comments or instructions for this shift..."
                  className="w-full rounded-xl border border-blue-200 bg-white p-3 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrintModalReport(selectedReport)}
                className="rounded-xl text-xs font-bold gap-1.5 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50 border-blue-200"
              >
                <Printer className="h-4 w-4 text-blue-600" /> Print Document (A4 & Letter)
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApprove(selectedReport.id!)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Check className="h-4 w-4" /> Approve & Sign Blotter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated A4 / US Letter Print Preview Modal */}
      {printModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 md:p-8 backdrop-blur-sm overflow-y-auto no-print:bg-black/75">
          <div className="relative w-full max-w-5xl rounded-3xl bg-slate-100 p-4 sm:p-6 shadow-2xl max-h-[96vh] overflow-y-auto">
            <BlotterPrintSheet
              report={printModalReport}
              isModal
              onClose={() => setPrintModalReport(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
