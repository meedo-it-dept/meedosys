'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  Calendar,
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
    activeShiftSessions,
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
        (currentUser?.guard_id && g.guard_id.toUpperCase() === currentUser.guard_id.toUpperCase()) ||
        (currentUser?.username && g.guard_id.toUpperCase() === currentUser.username.toUpperCase()) ||
        (currentUser?.full_name && g.guard_name.toLowerCase() === currentUser.full_name.toLowerCase()) ||
        (currentUser?.username && g.guard_name.toLowerCase() === currentUser.username.toLowerCase()) ||
        g.guard_name.toLowerCase().includes((currentUser?.full_name || currentUser?.username || '').toLowerCase())
    ) || {
      guard_id: currentUser?.guard_id || (currentUser?.username ? `G-${currentUser.username.toUpperCase()}` : 'G-101'),
      guard_name: currentUser?.full_name || currentUser?.username || 'Duty Market Guard',
      rank_title: currentUser?.rank_title || 'SO1',
      default_area: 'General Public Market',
      radio_call_sign: currentUser?.radio_call_sign || 'EAGLE-1',
      assigned_facility: 'Public Market Main',
      current_shift: '1st Shift (06:00 - 14:00)',
      status: 'Active',
    };

  // Strict guard-specific active session isolation
  const guardSession = (() => {
    if (!currentGuard?.guard_id) return null;
    const targetId = currentGuard.guard_id.trim().toUpperCase();

    // 1. Check multi-guard session dictionary
    if (activeShiftSessions && typeof activeShiftSessions === 'object') {
      for (const [key, sess] of Object.entries(activeShiftSessions)) {
        if (
          key.trim().toUpperCase() === targetId &&
          sess &&
          sess.status !== 'ENDED' &&
          sess.guard_id?.trim().toUpperCase() === targetId
        ) {
          return sess;
        }
      }
    }

    // 2. Check activeShiftSession ONLY if its guard_id strictly matches this guard
    if (
      activeShiftSession &&
      activeShiftSession.guard_id?.trim().toUpperCase() === targetId &&
      activeShiftSession.status !== 'ENDED'
    ) {
      return activeShiftSession;
    }

    return null;
  })();

  const isOnDuty = Boolean(guardSession && guardSession.status !== 'ENDED');

  // Find calendar assignment for this guard (dynamic real-time date matching)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayScheduledEvent = useMemo(() => {
    const isGuardAssigned = (e: any) =>
      (e.assigned_guard_id && e.assigned_guard_id.toUpperCase() === currentGuard.guard_id.toUpperCase()) ||
      (e.assigned_personnel &&
        (e.assigned_personnel.toLowerCase().includes(currentGuard.guard_name.toLowerCase()) ||
          currentGuard.guard_name.toLowerCase().includes(e.assigned_personnel.toLowerCase()))) ||
      (currentUser?.username && e.assigned_guard_id?.toUpperCase() === currentUser.username.toUpperCase());

    // 1. Match guard duty assigned for today
    const todayMatch = marketCalendarEvents.find(
      (e) => e.category === 'Guard Duty' && e.status !== 'Completed' && e.status !== 'Cancelled' && e.date === todayStr && isGuardAssigned(e)
    );
    if (todayMatch) return todayMatch;

    // 2. Fallback: match any active/upcoming guard duty assigned for this guard
    return marketCalendarEvents.find(
      (e) => e.category === 'Guard Duty' && e.status !== 'Completed' && e.status !== 'Cancelled' && isGuardAssigned(e)
    );
  }, [marketCalendarEvents, todayStr, currentGuard.guard_id, currentGuard.guard_name, currentUser?.username]);

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
    if (!guardSession || !guardSession.time_in) {
      setElapsedTime('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const [h, m] = (guardSession.time_in || '06:00').split(':').map(Number);
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
  }, [guardSession]);

  // Shift assignment and working hours configuration state
  const [selectedShiftPreset, setSelectedShiftPreset] = useState<string>('1st Shift');
  const [startTime, setStartTime] = useState<string>('06:00');
  const [endTime, setEndTime] = useState<string>('14:00');
  const [customShiftTitle, setCustomShiftTitle] = useState<string>('Custom Shift');
  const [selectedArea, setSelectedArea] = useState<string>(
    currentGuard.default_area || 'General Public Market'
  );
  const [selectedCallSign, setSelectedCallSign] = useState<string>(
    currentGuard.radio_call_sign || 'EAGLE-1'
  );

  useEffect(() => {
    const raw = todayScheduledEvent?.shift_name || currentGuard.current_shift || '1st Shift';
    let preset = '1st Shift';
    let sTime = '06:00';
    let eTime = '14:00';

    if (raw.toLowerCase().includes('2nd')) {
      preset = '2nd Shift';
      sTime = '14:00';
      eTime = '22:00';
    } else if (raw.toLowerCase().includes('3rd')) {
      preset = '3rd Shift';
      sTime = '22:00';
      eTime = '06:00';
    } else if (raw.toLowerCase().includes('office')) {
      preset = 'Office Shift';
      sTime = '08:00';
      eTime = '17:00';
    } else if (raw.toLowerCase().includes('custom')) {
      preset = 'Custom Shift';
      sTime = '08:00';
      eTime = '17:00';
    }

    if (todayScheduledEvent?.start_time) sTime = todayScheduledEvent.start_time;
    if (todayScheduledEvent?.end_time) eTime = todayScheduledEvent.end_time;

    setSelectedShiftPreset(preset);
    setStartTime(sTime);
    setEndTime(eTime);
    setSelectedArea(todayScheduledEvent?.location || currentGuard.default_area || 'General Public Market');
    setSelectedCallSign(currentGuard.radio_call_sign || 'EAGLE-1');
  }, [
    currentGuard.guard_id,
    currentGuard.current_shift,
    currentGuard.default_area,
    currentGuard.radio_call_sign,
    todayScheduledEvent,
  ]);

  const handleShiftPresetChange = (preset: string) => {
    setSelectedShiftPreset(preset);
    if (preset === '1st Shift') {
      setStartTime('06:00');
      setEndTime('14:00');
    } else if (preset === '2nd Shift') {
      setStartTime('14:00');
      setEndTime('22:00');
    } else if (preset === '3rd Shift') {
      setStartTime('22:00');
      setEndTime('06:00');
    } else if (preset === 'Office Shift') {
      setStartTime('08:00');
      setEndTime('17:00');
    } else if (preset === 'Custom Shift') {
      if (!startTime || !endTime) {
        setStartTime('08:00');
        setEndTime('17:00');
      }
    }
  };

  const formattedShiftName = useMemo(() => {
    const baseTitle =
      selectedShiftPreset === 'Custom Shift'
        ? (customShiftTitle.trim() || 'Custom Shift')
        : selectedShiftPreset;
    if (startTime && endTime) {
      return `${baseTitle} (${startTime} - ${endTime})`;
    }
    return baseTitle;
  }, [selectedShiftPreset, customShiftTitle, startTime, endTime]);

  const handleStartShift = () => {
    startGuardShift({
      calendar_event_id: todayScheduledEvent?.id,
      guard_id: currentGuard.guard_id,
      guard_name: currentGuard.guard_name,
      facility: currentGuard.assigned_facility || 'Public Market Main',
      area: selectedArea || currentGuard.default_area || 'General Public Market',
      shift_name: formattedShiftName,
      call_sign: selectedCallSign || currentGuard.radio_call_sign || 'EAGLE-1',
      instructions: todayScheduledEvent?.special_instructions,
    });
  };

  const handleLogPatrol = (e: React.FormEvent) => {
    e.preventDefault();
    logPatrolCheck(patrolArea, patrolNotes, currentGuard.guard_id);
    setIsPatrolModalOpen(false);
    setPatrolNotes('Area roving completed. Normal situation maintained.');
  };

  const handleConfirmEndShift = (e: React.FormEvent) => {
    e.preventDefault();
    endGuardShift(turnoverNotes, summaryActivities, currentGuard.guard_id);
    setIsEndShiftModalOpen(false);
    onNavigateTab('blotter');
  };

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
              {isOnDuty ? `Time In: ${guardSession?.time_in}` : 'Shift Not Started'}
            </span>
          </div>
        </div>
      </div>

      {/* STATE MACHINE: Shift Control Panel */}
      {!isOnDuty ? (
        /* Case 1: NOT STARTED - Interactive Assume Security Post Card */
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/30">
              <Shield className="h-8 w-8" />
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h2 className="text-2xl font-black text-slate-900">Assume Security Post</h2>
              <p className="text-xs text-slate-600">
                Confirm your shift assignment, working hours, and post sector before logging Time-In.
              </p>
            </div>
          </div>

          {/* Today's Scheduled Assignment Alert (if scheduled in admin calendar) */}
          {todayScheduledEvent && (
            <div className="max-w-2xl mx-auto rounded-2xl border border-blue-200 bg-blue-50/90 p-4 sm:p-5 text-left shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase text-blue-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                  Scheduled Assignment (Market Calendar)
                </span>
                <Badge className="bg-blue-600 text-white font-mono text-[10px]">
                  {todayScheduledEvent.shift_name || 'Scheduled Duty'}
                </Badge>
              </div>

              <div>
                <p className="text-base font-black text-slate-900">{todayScheduledEvent.title}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                  <span>
                    Date: <strong className="font-mono text-slate-800">{todayScheduledEvent.date}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Hours:{' '}
                    <strong className="font-mono text-slate-800">
                      {todayScheduledEvent.start_time} - {todayScheduledEvent.end_time}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Post Location: <strong className="text-slate-800">{todayScheduledEvent.location}</strong>
                  </span>
                </div>
              </div>

              {/* Special Instructions & Scope of Work */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {todayScheduledEvent.special_instructions && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
                    <span className="font-bold block text-[10px] uppercase text-amber-800">Special Instructions / Orders:</span>
                    <span className="italic font-medium">{todayScheduledEvent.special_instructions}</span>
                  </div>
                )}
                {todayScheduledEvent.description && (
                  <div className="rounded-xl bg-slate-100 border border-slate-200 p-2.5 text-xs text-slate-800">
                    <span className="font-bold block text-[10px] uppercase text-slate-600">Scope of Work / Description:</span>
                    <span className="font-medium">{todayScheduledEvent.description}</span>
                  </div>
                )}
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (todayScheduledEvent.start_time) setStartTime(todayScheduledEvent.start_time);
                    if (todayScheduledEvent.end_time) setEndTime(todayScheduledEvent.end_time);
                    if (todayScheduledEvent.location) setSelectedArea(todayScheduledEvent.location);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs h-8 px-3.5"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Apply Scheduled Shift Details
                </Button>
              </div>
            </div>
          )}

          {/* Interactive Shift & Post Assignment Form */}
          <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 text-left shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Shift Assignment & Working Hours
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200 self-start sm:self-auto">
                Selected: {formattedShiftName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shift Assignment Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Shift Assignment <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedShiftPreset}
                    onChange={(e) => handleShiftPresetChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer pr-10"
                  >
                    <option value="1st Shift">1st Shift (06:00 - 14:00) • Morning / Day Patrol</option>
                    <option value="2nd Shift">2nd Shift (14:00 - 22:00) • Afternoon / Closing Shift</option>
                    <option value="3rd Shift">3rd Shift (22:00 - 06:00) • Night Watch / Graveyard</option>
                    <option value="Office Shift">Office / Day Shift (08:00 - 17:00)</option>
                    <option value="Custom Shift">Custom Shift (Specify Working Hours)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Select your assigned duty shift or choose Custom.
                </span>
              </div>

              {/* Custom Shift Title Input or Quick Preset Switcher */}
              {selectedShiftPreset === 'Custom Shift' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Custom Shift Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customShiftTitle}
                    onChange={(e) => setCustomShiftTitle(e.target.value)}
                    placeholder="e.g. Special Night Roving"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 block">Enter operational assignment name.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Quick Shift Switcher
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleShiftPresetChange('1st Shift')}
                      className={`rounded-lg py-2 px-1 text-center text-[11px] font-bold transition border ${
                        selectedShiftPreset === '1st Shift'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      1st Shift
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftPresetChange('2nd Shift')}
                      className={`rounded-lg py-2 px-1 text-center text-[11px] font-bold transition border ${
                        selectedShiftPreset === '2nd Shift'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      2nd Shift
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftPresetChange('3rd Shift')}
                      className={`rounded-lg py-2 px-1 text-center text-[11px] font-bold transition border ${
                        selectedShiftPreset === '3rd Shift'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      3rd Shift
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 block">Click to populate standard hours.</span>
                </div>
              )}

              {/* Shift Time Window (Start Time & End Time) */}
              <div className="space-y-1.5 sm:col-span-2 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    Duty Working Hours (Time Window)
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">
                    Adjust start or end time if starting early or on special hours
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Start Time (24-Hour)
                    </span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 shadow-sm focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      End Time (24-Hour)
                    </span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 shadow-sm focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sector / Post Assignment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  Designated Sector / Post
                </label>
                <div className="relative">
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm focus:border-blue-500 pr-10 cursor-pointer"
                  >
                    <option value="General Public Market">General Public Market</option>
                    <option value="Wet Market Section (Fish & Meat)">Wet Market Section (Fish & Meat)</option>
                    <option value="Dry Goods & Grocery Section">Dry Goods & Grocery Section</option>
                    <option value="Vegetables & Fruits Section">Vegetables & Fruits Section</option>
                    <option value="Market Perimeter & Parking Area">Market Perimeter & Parking Area</option>
                    <option value="Terminal & Loading Bay">Terminal & Loading Bay</option>
                    <option value="MEEDO Admin Gate & Main Entrance">MEEDO Admin Gate & Main Entrance</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Radio Call Sign */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Radio className="h-3.5 w-3.5 text-blue-600" />
                  Active Radio Call Sign
                </label>
                <input
                  type="text"
                  value={selectedCallSign}
                  onChange={(e) => setSelectedCallSign(e.target.value.toUpperCase())}
                  placeholder="e.g. EAGLE-1"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 shadow-sm focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Big Start Button */}
          <div className="pt-2 max-w-md mx-auto space-y-2">
            <Button
              onClick={handleStartShift}
              className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg gap-3 shadow-xl shadow-emerald-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="h-6 w-6 fill-current" />
              START SHIFT / TIME IN
            </Button>
            <p className="text-[11px] text-slate-500 text-center">
              Time-In will be recorded under <strong className="text-slate-800">{formattedShiftName}</strong> at{' '}
              <strong className="text-slate-800">{selectedArea}</strong>.
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
                  {guardSession?.shift_name}
                </Badge>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {guardSession?.area}
              </h2>
              <p className="text-xs text-slate-500">
                Radio Call Sign: <span className="font-mono font-bold text-slate-800">{guardSession?.call_sign}</span> • Post: {guardSession?.facility}
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
                Started at {guardSession?.time_in}
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
                Shift Roving & Inspection Logs ({guardSession?.patrol_logs.length || 0})
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Real-time GPS / Post Logs</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
              {(guardSession?.patrol_logs || []).map((log, i) => (
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
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Market Guard Chief</span>
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
        defaultLocation={guardSession?.area || currentGuard.default_area}
        currentGuard={currentGuard}
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
                  <span className="font-bold text-slate-900">{guardSession?.patrol_logs.length || 0} checks</span>
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
