'use client';

import React, { useState, useEffect } from 'react';
import { useMeedo } from '@/lib/store';
import { MarketGuard, GuardShiftSession, CsuIncidentItem } from '@/lib/types';
import {
  Shield,
  Clock,
  MapPin,
  Radio,
  Play,
  Square,
  Footprints,
  AlertTriangle,
  FileText,
  Package,
  PhoneCall,
  CheckCircle2,
  Bell,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickIncidentModal } from './QuickIncidentModal';

interface GuardShiftHomeProps {
  onNavigateTab: (tab: 'shift' | 'blotter' | 'history' | 'stats') => void;
  selectedGuardOverride?: MarketGuard | null;
}

export const GuardShiftHome: React.FC<GuardShiftHomeProps> = ({
  onNavigateTab,
  selectedGuardOverride,
}) => {
  const {
    currentUser,
    guards,
    marketCalendarEvents,
    activeShiftSession,
    startGuardShift,
    logPatrolCheck,
    endGuardShift,
    csuReports,
  } = useMeedo();

  // Find active guard identity
  const currentGuard: MarketGuard =
    selectedGuardOverride ||
    guards.find(
      (g) =>
        g.guard_name.toLowerCase().includes((currentUser?.full_name || currentUser?.username || '').toLowerCase()) ||
        g.guard_id.toUpperCase() === (currentUser?.username || '').toUpperCase()
    ) ||
    guards[0] || {
      guard_id: currentUser?.guard_id || 'G-101',
      guard_name: currentUser?.full_name || currentUser?.username || 'Duty Market Guard',
      rank_title: currentUser?.rank_title || 'Market Security Guard',
      default_area: 'General Public Market',
      radio_call_sign: 'EAGLE-1',
      assigned_facility: 'Public Market Main',
      current_shift: '1st Shift (06:00 - 14:00)',
      status: 'Active',
    };

  // Find today's calendar assignment for this guard
  const todayStr = '2026-09-26';
  const todayScheduledEvent = marketCalendarEvents.find(
    (e) =>
      e.date === todayStr &&
      e.category === 'Guard Duty' &&
      (e.assigned_guard_id === currentGuard.guard_id ||
        (e.assigned_personnel &&
          e.assigned_personnel.toLowerCase().includes(currentGuard.guard_name.toLowerCase())))
  );

  // Modals & form state
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isPatrolModalOpen, setIsPatrolModalOpen] = useState(false);
  const [patrolArea, setPatrolArea] = useState(currentGuard.default_area || 'Wet Market Section');
  const [patrolNotes, setPatrolNotes] = useState('Area roving completed. No obstructions or safety hazards observed.');
  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);
  const [turnoverNotes, setTurnoverNotes] = useState(
    'Properly turned over security post, keys, handheld radio, and peace & order logbook.'
  );
  const [summaryActivities, setSummaryActivities] = useState('');

  // Live timer for active duty
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    if (!activeShiftSession || !activeShiftSession.time_in) {
      setElapsedTime('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const [h, m] = (activeShiftSession.time_in || '06:00').split(':').map(Number);
      const now = new Date();
      const startTime = new Date();
      startTime.setHours(h || 6, m || 0, 0, 0);

      let diff = now.getTime() - startTime.getTime();
      if (diff < 0) diff = 0;

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeShiftSession]);

  const handleStartShift = () => {
    startGuardShift({
      calendar_event_id: todayScheduledEvent?.id,
      guard_id: currentGuard.guard_id,
      guard_name: currentGuard.guard_name,
      facility: currentGuard.assigned_facility || 'Public Market Main',
      area: todayScheduledEvent?.location || currentGuard.default_area || 'Whole Market / Main Hall',
      shift_name: todayScheduledEvent?.shift_name || currentGuard.current_shift || '1st Shift (06:00 - 14:00)',
      call_sign: currentGuard.radio_call_sign || 'FALCON-3',
      instructions: todayScheduledEvent?.special_instructions,
    });
  };

  const handleLogPatrol = (e: React.FormEvent) => {
    e.preventDefault();
    logPatrolCheck(patrolArea, patrolNotes);
    setIsPatrolModalOpen(false);
    setPatrolNotes('Area roving completed. Normal situation maintained.');
  };

  const handleConfirmEndShift = (e: React.FormEvent) => {
    e.preventDefault();
    endGuardShift(turnoverNotes, summaryActivities);
    setIsEndShiftModalOpen(false);
    onNavigateTab('blotter');
  };

  const isOnDuty = Boolean(activeShiftSession && activeShiftSession.status !== 'ENDED');

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12">
      {/* Guard Profile & Identity Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-lg sm:text-xl shadow-lg shadow-blue-600/30 ring-4 ring-blue-50">
              {currentGuard.guard_id}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 truncate">
                  {currentGuard.guard_name}
                </h1>
                <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider">
                  {currentGuard.status}
                </Badge>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
                {currentGuard.rank_title || 'Market Guard'} • {currentGuard.assigned_facility || 'Public Market Main'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {currentGuard.radio_call_sign && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-800">
                    <Radio className="h-3 w-3 text-blue-600" /> {currentGuard.radio_call_sign}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 truncate">
                  <MapPin className="h-3 w-3 text-slate-500 shrink-0" /> {currentGuard.default_area || 'General Market'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Shift Status indicator */}
          <div className="rounded-2xl border p-3.5 sm:p-4 text-center sm:text-right sm:min-w-[190px] bg-slate-50 shrink-0">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Duty Status
            </span>
            <div className="mt-1 flex items-center justify-center sm:justify-end gap-2">
              <span
                className={`h-3 w-3 rounded-full shrink-0 ${
                  isOnDuty ? 'bg-emerald-500 animate-ping' : 'bg-red-500'
                }`}
              />
              <span className={`text-base font-black ${isOnDuty ? 'text-emerald-700' : 'text-slate-700'}`}>
                {isOnDuty ? 'ON ACTIVE DUTY' : 'OFF DUTY'}
              </span>
            </div>
            <span className="block text-xs font-medium text-slate-500 mt-0.5">
              {isOnDuty ? `Time In: ${activeShiftSession?.time_in}` : 'Shift Not Started'}
            </span>
          </div>
        </div>
      </div>

      {/* STATE MACHINE: Shift Control Panel */}
      {!isOnDuty ? (
        /* Case 1: NOT STARTED - Big Start Shift Card */
        <div className="rounded-3xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50/80 via-white to-slate-50 p-6 sm:p-8 text-center space-y-5 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/30">
            <Shield className="h-8 w-8" />
          </div>

          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Assume Security Post</h2>
            <p className="text-xs text-slate-600">
              Check in for your scheduled duty shift, initialize communication, and log Time-In.
            </p>
          </div>

          {/* Today's Scheduled Assignment Preview */}
          {todayScheduledEvent ? (
            <div className="max-w-lg mx-auto rounded-2xl border border-blue-200 bg-white p-4 text-left shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-blue-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Scheduled Assignment for Today
                </span>
                <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-300">
                  {todayScheduledEvent.shift_name || '1st Shift'}
                </Badge>
              </div>

              <p className="text-sm font-bold text-slate-900">{todayScheduledEvent.title}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Time Window</span>
                  <span className="font-mono font-semibold">{todayScheduledEvent.start_time} - {todayScheduledEvent.end_time}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Post</span>
                  <span className="font-semibold truncate block">{todayScheduledEvent.location}</span>
                </div>
              </div>

              {todayScheduledEvent.special_instructions && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 mt-2">
                  <span className="font-bold block">Administrator Orders:</span>
                  <span className="italic">{todayScheduledEvent.special_instructions}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto rounded-xl bg-slate-100 p-3 text-xs text-slate-600 flex items-center justify-center gap-2">
              <Info className="h-4 w-4 text-slate-500" />
              <span>Standard Shift Assignment: {currentGuard.current_shift || '1st Shift (06:00 - 14:00)'}</span>
            </div>
          )}

          {/* Big Start Button */}
          <div className="pt-2 max-w-sm mx-auto">
            <Button
              onClick={handleStartShift}
              className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg gap-3 shadow-xl shadow-emerald-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="h-6 w-6 fill-current" />
              START SHIFT / TIME IN
            </Button>
            <p className="text-[11px] text-slate-500 mt-2">
              Pressing will record your exact Time-In and open your active blotter session.
            </p>
          </div>
        </div>
      ) : (
        /* Case 2: ON ACTIVE DUTY - Interactive Duty Dashboard */
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Duty In Progress
                </span>
                <Badge className="bg-emerald-700 text-white font-mono text-xs">
                  {activeShiftSession?.shift_name}
                </Badge>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {activeShiftSession?.area}
              </h2>
              <p className="text-xs text-slate-500">
                Radio Call Sign: <span className="font-mono font-bold text-slate-800">{activeShiftSession?.call_sign}</span> • Post: {activeShiftSession?.facility}
              </p>
            </div>

            {/* Timer Display */}
            <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-center sm:text-right shadow-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Elapsed Shift Time
              </span>
              <span className="block text-2xl font-black font-mono text-emerald-800 tracking-wider">
                {elapsedTime}
              </span>
              <span className="block text-[11px] font-semibold text-slate-500 mt-0.5">
                Started at {activeShiftSession?.time_in}
              </span>
            </div>
          </div>

          {/* Action Row: Log Patrol & End Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => setIsPatrolModalOpen(true)}
              className="h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm gap-2.5 shadow-md shadow-blue-600/20"
            >
              <Footprints className="h-5 w-5" />
              Log Patrol Check / Roving Note
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsEndShiftModalOpen(true)}
              className="h-13 rounded-2xl border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 font-bold text-sm gap-2.5"
            >
              <Square className="h-5 w-5 fill-current" />
              End Shift & Submit Blotter
            </Button>
          </div>

          {/* Patrol Log History during this shift */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Footprints className="h-4 w-4 text-blue-600" />
                Shift Roving & Inspection Logs ({activeShiftSession?.patrol_logs.length || 0})
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Real-time GPS / Post Logs</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
              {(activeShiftSession?.patrol_logs || []).map((log, i) => (
                <div key={i} className="py-2.5 flex items-start gap-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700">
                    {log.time}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">{log.area}</p>
                    <p className="text-xs text-slate-600 italic">{log.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RAPID OPERATIONAL ACTION GRID (Large, Touch-Friendly) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
          Rapid Operational Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* 1. Report Incident */}
          <button
            onClick={() => setIsIncidentModalOpen(true)}
            className="flex flex-col items-center justify-center gap-2.5 rounded-3xl border border-red-200 bg-red-50/70 p-5 text-center transition hover:bg-red-100 hover:shadow-md active:scale-95 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30 group-hover:scale-110 transition">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-sm font-black text-red-950">Report Incident</span>
              <span className="block text-[11px] font-medium text-red-700">Theft, Dispute, Safety</span>
            </div>
          </button>

          {/* 2. My Shift Blotter */}
          <button
            onClick={() => onNavigateTab('blotter')}
            className="flex flex-col items-center justify-center gap-2.5 rounded-3xl border border-blue-200 bg-blue-50/70 p-5 text-center transition hover:bg-blue-100 hover:shadow-md active:scale-95 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30 group-hover:scale-110 transition">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-sm font-black text-blue-950">My Blotter</span>
              <span className="block text-[11px] font-medium text-blue-700">Daily Logbook Entries</span>
            </div>
          </button>

          {/* 3. Lost & Found */}
          <button
            onClick={() => onNavigateTab('blotter')}
            className="flex flex-col items-center justify-center gap-2.5 rounded-3xl border border-teal-200 bg-teal-50/70 p-5 text-center transition hover:bg-teal-100 hover:shadow-md active:scale-95 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/30 group-hover:scale-110 transition">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-sm font-black text-teal-950">Lost & Found</span>
              <span className="block text-[11px] font-medium text-teal-700">Intake / Turnover</span>
            </div>
          </button>

          {/* 4. Shift History */}
          <button
            onClick={() => onNavigateTab('history')}
            className="flex flex-col items-center justify-center gap-2.5 rounded-3xl border border-purple-200 bg-purple-50/70 p-5 text-center transition hover:bg-purple-100 hover:shadow-md active:scale-95 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/30 group-hover:scale-110 transition">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-sm font-black text-purple-950">Duty History</span>
              <span className="block text-[11px] font-medium text-purple-700">Past Shifts & Logs</span>
            </div>
          </button>
        </div>
      </div>

      {/* Emergency Hotlines Quick Panel */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <PhoneCall className="h-4 w-4 text-red-400" />
            Emergency Contacts & Dispatch Hotlines
          </span>
          <span className="text-[11px] text-slate-400">Toll-free / Direct Line</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-xl bg-slate-800 p-2.5">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">MEEDO Admin</span>
            <span className="block text-sm font-mono font-bold text-white mt-0.5">(033) 501-2244</span>
          </div>
          <div className="rounded-xl bg-slate-800 p-2.5">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">CSU Security Chief</span>
            <span className="block text-sm font-mono font-bold text-white mt-0.5">0917-888-MEEDO</span>
          </div>
          <div className="rounded-xl bg-slate-800 p-2.5">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">PNP Market Substation</span>
            <span className="block text-sm font-mono font-bold text-white mt-0.5">117 / (033) 500-PNP</span>
          </div>
          <div className="rounded-xl bg-slate-800 p-2.5">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">BFP Fire Station</span>
            <span className="block text-sm font-mono font-bold text-white mt-0.5">160 / (033) 500-FIRE</span>
          </div>
        </div>
      </div>

      {/* Quick Incident Modal */}
      <QuickIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        defaultLocation={activeShiftSession?.area || currentGuard.default_area}
      />

      {/* Patrol Check Modal */}
      {isPatrolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Footprints className="h-5 w-5 text-blue-600" />
                Log Security Patrol Roving
              </h3>
              <button
                onClick={() => setIsPatrolModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogPatrol} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Area Inspected *
                </label>
                <input
                  type="text"
                  value={patrolArea}
                  onChange={(e) => setPatrolArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Observation / Check Notes *
                </label>
                <textarea
                  value={patrolNotes}
                  onChange={(e) => setPatrolNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPatrolModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Record Check
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Shift & Turnover Modal */}
      {isEndShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Square className="h-5 w-5 text-red-600 fill-current" />
                End Duty Shift & Submit Blotter
              </h3>
              <button
                onClick={() => setIsEndShiftModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmEndShift} className="space-y-4">
              <div className="rounded-xl bg-slate-50 border p-3 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Duty Shift Summary</span>
                <p className="text-slate-600">
                  Total Time On Duty: <span className="font-mono font-bold text-slate-900">{elapsedTime}</span>
                </p>
                <p className="text-slate-600">
                  Total Patrols Logged:{' '}
                  <span className="font-bold text-slate-900">{activeShiftSession?.patrol_logs.length || 0} checks</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Summary of Activities
                </label>
                <textarea
                  value={summaryActivities}
                  onChange={(e) => setSummaryActivities(e.target.value)}
                  rows={2}
                  placeholder="Summary of roving, inspections, vendor assistance, and situations handled..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Turnover Notes & Custody *
                </label>
                <textarea
                  value={turnoverNotes}
                  onChange={(e) => setTurnoverNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEndShiftModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Confirm End Shift & Lock Blotter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
