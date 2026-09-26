'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import {
  CsuDailyReport,
  CsuIncidentItem,
  CsuViolationItem,
  CsuLostFoundItem,
  MarketGuard,
} from '@/lib/types';
import {
  FileText,
  Lock,
  Unlock,
  AlertTriangle,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Clock,
  Shield,
  Send,
  MessageSquare,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickIncidentModal } from './QuickIncidentModal';
import { BlotterPrintSheet } from '@/components/csu/blotter/BlotterPrintSheet';

interface GuardShiftBlotterProps {
  currentGuard: MarketGuard;
}

export const GuardShiftBlotter: React.FC<GuardShiftBlotterProps> = ({ currentGuard }) => {
  const { csuReports, addCsuReport, updateCsuReport, requestBlotterCorrection, activeShiftSession } =
    useMeedo();

  // Find the latest blotter report belonging to this guard or today
  const myReports = csuReports.filter(
    (r) =>
      r.prep_name.toLowerCase().includes(currentGuard.guard_name.toLowerCase()) ||
      r.personnel_data.some((p) => p.guard_id === currentGuard.guard_id)
  );

  const [selectedReportId, setSelectedReportId] = useState<string>(
    myReports[0]?.id || ''
  );

  const activeReport = myReports.find((r) => r.id === selectedReportId) || myReports[0];

  // Modals
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Local draft additions if not locked
  const [newViolation, setNewViolation] = useState({
    identifier: '',
    violation: '',
    action_taken: 'Verbal reminder issued',
  });
  const [isAddViolationOpen, setIsAddViolationOpen] = useState(false);

  const [newLostFound, setNewLostFound] = useState({
    description: '',
    location: '',
  });
  const [isAddLostFoundOpen, setIsAddLostFoundOpen] = useState(false);

  const handleLockAndSubmit = (reportId: string) => {
    updateCsuReport(reportId, {
      is_locked: true,
      locked_at: new Date().toISOString(),
    });
  };

  const handleSendCorrectionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport?.id || !correctionReason.trim()) return;
    requestBlotterCorrection(activeReport.id, correctionReason.trim());
    setIsCorrectionModalOpen(false);
    setCorrectionReason('');
  };

  const handleIncidentLogged = (incident: CsuIncidentItem) => {
    if (!activeReport) return;
    const updatedIncidents = [...activeReport.incident_data, incident];
    updateCsuReport(activeReport.id!, { incident_data: updatedIncidents });
  };

  const handleAddViolation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport || !newViolation.identifier || !newViolation.violation) return;
    const item: CsuViolationItem = {
      id: 'viol_' + Date.now(),
      identifier: newViolation.identifier,
      violation: newViolation.violation,
      action_taken: newViolation.action_taken,
      guard_id: currentGuard.guard_id,
      guard_name: currentGuard.guard_name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    updateCsuReport(activeReport.id!, {
      violations_data: [...activeReport.violations_data, item],
    });
    setNewViolation({ identifier: '', violation: '', action_taken: 'Verbal reminder issued' });
    setIsAddViolationOpen(false);
  };

  const handleAddLostFound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport || !newLostFound.description) return;
    const item: CsuLostFoundItem = {
      id: 'lf_' + Date.now(),
      description: newLostFound.description,
      location: newLostFound.location || currentGuard.default_area,
      found_by: `${currentGuard.guard_name} (${currentGuard.guard_id})`,
      status: 'In Custody',
      date_found: activeReport.report_date,
      time_found: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    updateCsuReport(activeReport.id!, {
      lost_found_data: [...activeReport.lost_found_data, item],
    });
    setNewLostFound({ description: '', location: '' });
    setIsAddLostFoundOpen(false);
  };

  const isLocked = Boolean(activeReport?.is_locked);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header & Report Switcher */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Guard Shift Blotter
              </h1>
              <p className="text-xs text-slate-500">
                Official Peace & Order Daily Logbook for {currentGuard.guard_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintModalOpen(true)}
              className="rounded-xl text-xs font-bold gap-1.5 shadow-xs"
            >
              <Printer className="h-4 w-4" /> Print / Export (A4 & Letter)
            </Button>
          </div>
        </div>

        {/* Shift selector dropdown */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Shift Blotter:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {myReports.map((r) => {
              const isSelected = (r.id || '') === (activeReport?.id || '');
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id || '')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r.report_date} • {r.shift.split('(')[0]?.trim()}
                  {r.is_locked ? ' 🔒' : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!activeReport ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 space-y-3">
          <Clock className="h-10 w-10 mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-800">No Shift Blotters on File Yet</h3>
          <p className="text-xs text-slate-500">
            Once you start and complete an active duty shift from the "My Shift" tab, your compiled blotter will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status & Submission Banner */}
          <div
            className={`rounded-3xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
              isLocked
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                : 'border-amber-200 bg-amber-50/70 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  isLocked ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                {isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider">
                  {isLocked ? 'Official Shift Blotter Submitted & Locked' : 'Draft Shift Blotter In Progress'}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isLocked
                    ? `Locked for official audit at ${activeReport.locked_at ? new Date(activeReport.locked_at).toLocaleTimeString() : 'Shift Completion'}`
                    : 'Changes and logged entries are actively saving to this shift.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isLocked ? (
                <Button
                  onClick={() => handleLockAndSubmit(activeReport.id!)}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Lock className="h-4 w-4" /> Submit & Lock Shift Blotter
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsCorrectionModalOpen(true)}
                  className="rounded-2xl border-amber-300 bg-white text-amber-800 hover:bg-amber-100 font-bold text-xs gap-1.5 shadow-xs"
                >
                  <MessageSquare className="h-4 w-4" /> Request Correction
                </Button>
              )}
            </div>
          </div>

          {/* Quick Draft Action Toolbar (if not locked) */}
          {!isLocked && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Log Operational Records for This Shift:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsIncidentModalOpen(true)}
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold h-8 gap-1.5 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Log Incident
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddViolationOpen(true)}
                  className="rounded-xl text-xs font-bold h-8 gap-1.5 bg-white border-slate-300"
                >
                  <Plus className="h-3.5 w-3.5" /> Log Stall Infraction
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddLostFoundOpen(true)}
                  className="rounded-xl text-xs font-bold h-8 gap-1.5 bg-white border-slate-300"
                >
                  <Plus className="h-3.5 w-3.5" /> Log Lost Item
                </Button>
              </div>
            </div>
          )}

          {/* Official A4 / US Letter Size Printable Blotter Sheet */}
          <BlotterPrintSheet report={activeReport} />
        </div>
      )}

      {/* Quick Incident Modal */}
      <QuickIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onIncidentLogged={handleIncidentLogged}
      />

      {/* Request Correction Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-600" />
                Request Blotter Correction
              </h3>
              <button
                onClick={() => setIsCorrectionModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendCorrectionRequest} className="space-y-4">
              <p className="text-xs text-slate-600">
                This locked shift blotter requires supervisor authorization to unlock. Explain the omission or correction needed:
              </p>

              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Omitted stall violation citation for Stall D-06 during 11:00 roving..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Submit Correction Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Violation Modal */}
      {isAddViolationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Log Stall Infraction</h3>
              <button onClick={() => setIsAddViolationOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddViolation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stall or Vendor *</label>
                <input
                  type="text"
                  value={newViolation.identifier}
                  onChange={(e) => setNewViolation({ ...newViolation, identifier: e.target.value })}
                  placeholder="e.g. Stall W-04 or Transient Vendor"
                  className="w-full rounded-xl border px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Violation *</label>
                <input
                  type="text"
                  value={newViolation.violation}
                  onChange={(e) => setNewViolation({ ...newViolation, violation: e.target.value })}
                  placeholder="e.g. Obstructing walkway with crates"
                  className="w-full rounded-xl border px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action Taken</label>
                <input
                  type="text"
                  value={newViolation.action_taken}
                  onChange={(e) => setNewViolation({ ...newViolation, action_taken: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddViolationOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lost & Found Modal */}
      {isAddLostFoundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Log Lost & Found Item</h3>
              <button onClick={() => setIsAddLostFoundOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddLostFound} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Description *</label>
                <input
                  type="text"
                  value={newLostFound.description}
                  onChange={(e) => setNewLostFound({ ...newLostFound, description: e.target.value })}
                  placeholder="e.g. Set of house keys with red keychain"
                  className="w-full rounded-xl border px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Found Location</label>
                <input
                  type="text"
                  value={newLostFound.location}
                  onChange={(e) => setNewLostFound({ ...newLostFound, location: e.target.value })}
                  placeholder="e.g. Near Meat Section Wash Area"
                  className="w-full rounded-xl border px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddLostFoundOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated A4 / US Letter Print Preview Modal */}
      {isPrintModalOpen && activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 md:p-8 backdrop-blur-sm overflow-y-auto no-print:bg-black/75">
          <div className="relative w-full max-w-5xl rounded-3xl bg-slate-100 p-4 sm:p-6 shadow-2xl max-h-[96vh] overflow-y-auto">
            <BlotterPrintSheet
              report={activeReport}
              isModal
              onClose={() => setIsPrintModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
