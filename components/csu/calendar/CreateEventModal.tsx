'use client';

import React, { useState, useEffect } from 'react';
import { useMeedo } from '@/lib/store';
import {
  MarketCalendarEvent,
  MarketEventCategory,
  EventPriority,
  EventStatus,
} from '@/lib/types';
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Shield,
  User,
  Radio,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialCategory?: MarketEventCategory;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialCategory,
}) => {
  const { guards, addCalendarEvent, checkScheduleConflict, currentUser } = useMeedo();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MarketEventCategory>(initialCategory || 'Guard Duty');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('14:00');
  const [location, setLocation] = useState('Public Market Main - Whole Market');
  const [assignedGuardId, setAssignedGuardId] = useState('');
  const [assignedPersonnel, setAssignedPersonnel] = useState('');
  const [shiftName, setShiftName] = useState('1st Shift');
  const [callSign, setCallSign] = useState('');
  const [priority, setPriority] = useState<EventPriority>('Normal');
  const [status, setStatus] = useState<EventStatus>('Scheduled');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [description, setDescription] = useState('');
  const [bypassConflict, setBypassConflict] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill guard details when selected
  useEffect(() => {
    if (assignedGuardId) {
      const g = guards.find((item) => item.guard_id === assignedGuardId);
      if (g) {
        setAssignedPersonnel(g.guard_name);
        setCallSign(g.radio_call_sign || '');
        if (g.default_area) setLocation(`Public Market Main - ${g.default_area}`);
      }
    }
  }, [assignedGuardId, guards]);

  // Reset initial fields on open
  useEffect(() => {
    if (isOpen) {
      if (initialDate) setDate(initialDate);
      if (initialCategory) setCategory(initialCategory);
      if (!title) {
        if (category === 'Guard Duty') setTitle('Guard Duty: 1st Shift - Wet Section');
      }
      setBypassConflict(false);
      setErrorMsg('');
    }
  }, [isOpen, initialDate, initialCategory]);

  if (!isOpen) return null;

  // Real-time conflict detection
  const detectedConflict =
    category === 'Guard Duty' && assignedGuardId
      ? checkScheduleConflict(assignedGuardId, date, startTime, endTime)
      : null;

  const handleApplyShiftPreset = (preset: '1st' | '2nd' | '3rd' | 'day') => {
    if (preset === '1st') {
      setStartTime('06:00');
      setEndTime('14:00');
      setShiftName('1st Shift');
      if (category === 'Guard Duty') setTitle(`Guard Duty: 1st Shift - ${location.split('-')[1]?.trim() || 'Main'}`);
    } else if (preset === '2nd') {
      setStartTime('14:00');
      setEndTime('22:00');
      setShiftName('2nd Shift');
      if (category === 'Guard Duty') setTitle(`Guard Duty: 2nd Shift - ${location.split('-')[1]?.trim() || 'Main'}`);
    } else if (preset === '3rd') {
      setStartTime('22:00');
      setEndTime('06:00');
      setShiftName('3rd Shift');
      if (category === 'Guard Duty') setTitle(`Guard Duty: 3rd Shift - Night Watch`);
    } else if (preset === 'day') {
      setStartTime('08:00');
      setEndTime('17:00');
      setShiftName('Regular Day');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Event title is required.');
      return;
    }
    if (!date) {
      setErrorMsg('Date is required.');
      return;
    }
    if (!startTime || !endTime) {
      setErrorMsg('Start time and end time are required.');
      return;
    }

    if (category === 'Guard Duty' && !assignedGuardId) {
      setErrorMsg('Please select a Market Guard for guard duty shifts.');
      return;
    }

    const res = addCalendarEvent(
      {
        title: title.trim(),
        category,
        date,
        start_time: startTime,
        end_time: endTime,
        location: location.trim(),
        assigned_personnel: assignedPersonnel || undefined,
        assigned_guard_id: assignedGuardId || undefined,
        shift_name: category === 'Guard Duty' ? shiftName : undefined,
        call_sign: callSign || undefined,
        priority,
        status,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule : undefined,
        special_instructions: specialInstructions.trim() || undefined,
        description: description.trim() || undefined,
        created_by: currentUser?.full_name || currentUser?.username || 'Administrator',
      },
      bypassConflict
    );

    if (!res.success) {
      setErrorMsg(res.message || 'Failed to save event due to a scheduling conflict.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[94vh] sm:max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-4 sm:px-6 py-3.5 sm:py-4 text-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/30 text-blue-400 ring-1 ring-blue-500/50">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">Create Market Operation Event</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">
                Schedule guard duties, inspections, cleanings, and market activities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Scheduling Error</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Conflict Warning Banner */}
          {detectedConflict && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-amber-950">Overlapping Guard Assignment Detected</p>
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">{assignedPersonnel}</span> is already scheduled for{' '}
                    <span className="font-semibold italic">"{detectedConflict.title}"</span> ({detectedConflict.start_time} - {detectedConflict.end_time}) on this date.
                  </p>
                  <label className="mt-2 flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={bypassConflict}
                      onChange={(e) => setBypassConflict(e.target.checked)}
                      className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-amber-900">
                      Administrator Override: Proceed with simultaneous assignment
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Category & Title */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Activity Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MarketEventCategory)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Guard Duty">👮 Guard Duty / Shift</option>
                <option value="Market Inspection">🔍 Market Inspection</option>
                <option value="Cleaning">🧹 Cleaning / Flushing</option>
                <option value="Maintenance">🔧 Maintenance / Electrical</option>
                <option value="Meeting">👥 Vendor / Admin Meeting</option>
                <option value="Market Event">🎪 Market Event</option>
                <option value="Security Activity">🚨 Security Activity</option>
                <option value="Administrative Deadline">⏰ Admin Deadline</option>
                <option value="Other">📌 Other Operation</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Guard Duty: 1st Shift - Wet Section"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          {/* Date & Shift Quick Presets */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                Schedule & Shift Timing
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 mr-1 text-[11px]">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyShiftPreset('1st')}
                  className="rounded-lg bg-blue-100 hover:bg-blue-200 px-2 py-1 font-semibold text-blue-800 transition text-[11px]"
                >
                  1st Shift (06-14h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyShiftPreset('2nd')}
                  className="rounded-lg bg-indigo-100 hover:bg-indigo-200 px-2 py-1 font-semibold text-indigo-800 transition text-[11px]"
                >
                  2nd Shift (14-22h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyShiftPreset('3rd')}
                  className="rounded-lg bg-purple-100 hover:bg-purple-200 px-2 py-1 font-semibold text-purple-800 transition text-[11px]"
                >
                  3rd Shift (22-06h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyShiftPreset('day')}
                  className="rounded-lg bg-slate-200 hover:bg-slate-300 px-2 py-1 font-semibold text-slate-800 transition text-[11px]"
                >
                  Office (08-17h)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white shadow-sm focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time (24h) *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white shadow-sm focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Time (24h) *</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white shadow-sm focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Guard Assignment Section (Active when category === 'Guard Duty') */}
          {category === 'Guard Duty' ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                <Shield className="h-4 w-4 text-blue-600" />
                Guard Duty Assignment & Roster Binding
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Market Guard *
                  </label>
                  <select
                    value={assignedGuardId}
                    onChange={(e) => setAssignedGuardId(e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-blue-500"
                    required
                  >
                    <option value="">-- Choose Assigned Guard --</option>
                    {guards.map((g) => (
                      <option key={g.guard_id} value={g.guard_id}>
                        {g.guard_name} ({g.guard_id}) - {g.radio_call_sign || 'No Call Sign'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Name</label>
                  <select
                    value={shiftName}
                    onChange={(e) => setShiftName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm"
                  >
                    <option value="1st Shift">1st Shift (Day Patrol)</option>
                    <option value="2nd Shift">2nd Shift (Afternoon/Closing)</option>
                    <option value="3rd Shift">3rd Shift (Night Watch)</option>
                    <option value="Custom Shift">Custom Operational Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Radio className="h-3.5 w-3.5 text-blue-600" /> Radio Call Sign
                  </label>
                  <input
                    type="text"
                    value={callSign}
                    onChange={(e) => setCallSign(e.target.value)}
                    placeholder="e.g. FALCON-3"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 font-mono shadow-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-500" />
                Assigned Personnel / Lead Official
              </label>
              <input
                type="text"
                value={assignedPersonnel}
                onChange={(e) => setAssignedPersonnel(e.target.value)}
                placeholder="e.g. Market Inspector / Sanitation Crew / Admin Officer"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-blue-500"
              />
            </div>
          )}

          {/* Location & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Location / Facility Sector *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Public Market Main - Wet Section"
                list="market-locations-list"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-blue-500"
                required
              />
              <datalist id="market-locations-list">
                <option value="Public Market Main - Wet Market Section" />
                <option value="Public Market Main - Dry Goods Section" />
                <option value="Public Market Main - Triangular Section" />
                <option value="Public Market Main - Meat & Fish Stalls" />
                <option value="Public Market Main - Terminal & Unloading Bay" />
                <option value="Public Market Main - Gate 1 & Perimeter" />
                <option value="Public Market Main - Food Court / Commercial" />
                <option value="MEEDO Conference Hall - 2nd Floor" />
                <option value="Public Market Main - Whole Market" />
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as EventPriority)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm"
                >
                  <option value="Normal">🟢 Normal</option>
                  <option value="Important">🟡 Important</option>
                  <option value="Urgent">🔴 Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EventStatus)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Ongoing">Ongoing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Recurrence Rule */}
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-slate-800">Recurring Schedule</span>
            </label>

            {isRecurring && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Frequency:</span>
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value as 'Daily' | 'Weekly' | 'Monthly')}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
                >
                  <option value="Daily">Daily (7 days a week)</option>
                  <option value="Weekly">Weekly (Every {new Date(date).toLocaleDateString('en-US', { weekday: 'long' })})</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          {/* Instructions & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Special Orders / Shift Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                placeholder="Specific operational instructions (e.g. Conduct hourly checks on fire exits, ensure no vendors block the alleyways)..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Activity Description / Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="General description or background of this scheduled event..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 sm:px-6 py-3.5 shrink-0">
          <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5 order-2 sm:order-1">
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 shrink-0" />
            Synchronized with Market Guard "My Shift" interface
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-4 py-2 flex-1 sm:flex-initial text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 shadow-md shadow-blue-600/20 flex-1 sm:flex-initial text-xs"
            >
              Confirm & Schedule Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
