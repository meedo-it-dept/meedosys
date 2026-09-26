'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { CsuIncidentItem } from '@/lib/types';
import {
  X,
  AlertTriangle,
  Flame,
  ShieldAlert,
  HeartPulse,
  Package,
  CheckCircle2,
  MapPin,
  Clock,
  Camera,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentLogged?: (incident: CsuIncidentItem) => void;
  defaultLocation?: string;
}

export const QuickIncidentModal: React.FC<QuickIncidentModalProps> = ({
  isOpen,
  onClose,
  onIncidentLogged,
  defaultLocation,
}) => {
  const { activeShiftSession, currentUser } = useMeedo();

  const [incidentType, setIncidentType] = useState('Theft / Shoplifting');
  const [severity, setSeverity] = useState<'Minor' | 'Moderate' | 'Critical'>('Minor');
  const [location, setLocation] = useState(
    defaultLocation || activeShiftSession?.area || 'Public Market Main - Wet Section'
  );
  const [description, setDescription] = useState('');
  const [immediateAction, setImmediateAction] = useState('');
  const [personsInvolved, setPersonsInvolved] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const incidentTypes = [
    { label: 'Theft / Shoplifting', icon: '🚨', color: 'border-red-300 bg-red-50 text-red-800' },
    { label: 'Physical Altercation', icon: '🥊', color: 'border-amber-300 bg-amber-50 text-amber-800' },
    { label: 'Vendor Dispute', icon: '🗣️', color: 'border-blue-300 bg-blue-50 text-blue-800' },
    { label: 'Fire Hazard', icon: '🔥', color: 'border-rose-300 bg-rose-50 text-rose-800' },
    { label: 'Medical Emergency', icon: '🚑', color: 'border-purple-300 bg-purple-50 text-purple-800' },
    { label: 'Stall Obstruction', icon: '🚫', color: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
    { label: 'Lost / Found Item', icon: '📦', color: 'border-teal-300 bg-teal-50 text-teal-800' },
    { label: 'Other Security Matter', icon: '⚠️', color: 'border-slate-300 bg-slate-50 text-slate-800' },
  ];

  const quickLocations = [
    'Wet Market Section',
    'Dry Goods Section',
    'Triangular Section',
    'Meat & Fish Stalls',
    'Terminal & Unloading Bay',
    'Main Entrance / Gate 1',
    'Commercial Plaza',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const incident: CsuIncidentItem = {
      id: 'inc_' + Date.now(),
      time: timeStr,
      date: dateStr,
      location,
      type: incidentType,
      severity,
      description: description.trim(),
      immediate_action: immediateAction.trim() || 'Responded to scene and restored order.',
      persons_involved: personsInvolved.trim() || undefined,
      status: severity === 'Critical' ? 'Under Escalation' : 'Resolved On-Site',
      guard_id: activeShiftSession?.guard_id || 'G-103',
      guard_name: activeShiftSession?.guard_name || currentUser?.full_name || 'Market Guard',
      shift: activeShiftSession?.shift_name || '1st Shift',
      facility: activeShiftSession?.facility || 'Public Market Main',
    };

    if (onIncidentLogged) {
      onIncidentLogged(incident);
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-700 bg-red-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase">Report Market Incident</h2>
              <p className="text-xs text-red-100 font-medium">
                Immediate Operational Duty Logbook Entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Incident Dispatched & Logged</h3>
            <p className="text-xs text-slate-500">
              Recorded in active duty shift blotter and transmitted to security supervisor.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Quick 1-Tap Category Pills */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Select Incident Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {incidentTypes.map((item) => {
                  const isSelected = incidentType === item.label;
                  return (
                    <button
                      type="button"
                      key={item.label}
                      onClick={() => setIncidentType(item.label)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold transition min-h-[44px] ${
                        isSelected
                          ? 'border-red-600 bg-red-600 text-white shadow-md shadow-red-600/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity Pill Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                2. Urgency / Severity Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Minor', 'Moderate', 'Critical'] as const).map((lvl) => {
                  const isSelected = severity === lvl;
                  const color =
                    lvl === 'Minor'
                      ? isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200 text-emerald-800 bg-emerald-50'
                      : lvl === 'Moderate'
                      ? isSelected
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-slate-200 text-amber-800 bg-amber-50'
                      : isSelected
                      ? 'bg-red-700 text-white border-red-700 animate-pulse'
                      : 'border-slate-200 text-red-800 bg-red-50';

                  return (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setSeverity(lvl)}
                      className={`rounded-xl border py-2.5 text-center text-xs font-bold transition min-h-[44px] ${color}`}
                    >
                      {lvl === 'Critical' ? '🚨 ' : ''}
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sector / Location Quick Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-red-600" /> 3. Sector / Location *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickLocations.map((loc) => (
                  <button
                    type="button"
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition ${
                      location === loc
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Specific stall or landmark (e.g. Near Stall D-12)"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                4. What Happened? (Brief Narrative) *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what occurred, items or stalls affected, and initial situation..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                required
              />
            </div>

            {/* Immediate Action Taken */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                5. Immediate Action Taken
              </label>
              <input
                type="text"
                value={immediateAction}
                onChange={(e) => setImmediateAction(e.target.value)}
                placeholder="e.g. Pacified both parties; summoned PNP substation; cleared blockage"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-red-500"
              />
            </div>

            {/* Persons Involved */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Persons Involved / Stall Names (Optional)
              </label>
              <input
                type="text"
                value={personsInvolved}
                onChange={(e) => setPersonsInvolved(e.target.value)}
                placeholder="e.g. Stallholder Juan Dela Cruz, customer Maria Clara"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 shadow-sm"
              />
            </div>

            {/* Action Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider gap-2 shadow-lg shadow-red-600/30"
              >
                <Send className="h-4 w-4" /> Submit Immediate Incident Report
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
