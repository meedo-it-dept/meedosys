'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { MarketCalendarEvent, EventStatus } from '@/lib/types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Shield,
  User,
  Radio,
  FileText,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EventDetailModalProps {
  event: MarketCalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onViewBlotterReport?: (reportId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onViewBlotterReport,
}) => {
  const { updateCalendarEvent, deleteCalendarEvent } = useMeedo();
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<EventStatus>(event?.status || 'Scheduled');
  const [editInstructions, setEditInstructions] = useState(event?.special_instructions || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !event) return null;

  const handleUpdateStatus = (newStatus: EventStatus) => {
    updateCalendarEvent(event.id, { status: newStatus }, true);
    setEditStatus(newStatus);
  };

  const handleSaveEdits = () => {
    updateCalendarEvent(
      event.id,
      {
        status: editStatus,
        special_instructions: editInstructions.trim(),
      },
      true
    );
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteCalendarEvent(event.id);
    onClose();
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Guard Duty':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Market Inspection':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Cleaning':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Meeting':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Market Event':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Security Activity':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Administrative Deadline':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusColor = (st: EventStatus) => {
    switch (st) {
      case 'Scheduled':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Ongoing':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Postponed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-900 px-6 py-5 text-white">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold ${getCategoryColor(
                  event.category
                )}`}
              >
                {event.category}
              </span>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getStatusColor(
                  event.status
                )}`}
              >
                ● {event.status}
              </span>
              {event.priority === 'Urgent' && (
                <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                  Urgent
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white pt-1">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Schedule Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Date
              </span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-4 w-4 text-blue-600" />
                {event.date}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Shift Hours
              </span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Clock className="h-4 w-4 text-indigo-600" />
                {event.start_time} - {event.end_time}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Priority
              </span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {event.priority}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <MapPin className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Facility & Sector Location
              </span>
              <p className="text-sm font-semibold text-slate-800">{event.location}</p>
            </div>
          </div>

          {/* Assigned Guard / Personnel */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-blue-600" />
                Assigned Personnel / Duty Officer
              </span>
              {event.shift_name && (
                <Badge className="bg-blue-600 text-white font-semibold text-xs">
                  {event.shift_name}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div>
                <p className="text-base font-bold text-slate-900">
                  {event.assigned_personnel || 'Unassigned / Open Activity'}
                </p>
                {event.assigned_guard_id && (
                  <p className="text-xs font-mono text-slate-600">
                    Guard ID: <span className="font-bold">{event.assigned_guard_id}</span>
                  </p>
                )}
              </div>

              {event.call_sign && (
                <div className="rounded-lg bg-blue-100 border border-blue-200 px-3 py-1 text-center">
                  <span className="block text-[10px] font-bold text-blue-700 uppercase">Radio Call Sign</span>
                  <span className="text-xs font-mono font-bold text-blue-900">{event.call_sign}</span>
                </div>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          {event.special_instructions && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Special Operational Instructions
              </span>
              <p className="text-sm text-amber-950 font-medium whitespace-pre-line pt-1">
                {event.special_instructions}
              </p>
            </div>
          )}

          {/* Activity Description */}
          {event.description && (
            <div className="rounded-xl border border-slate-200 p-4 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Description / Scope of Work
              </span>
              <p className="text-sm text-slate-700 whitespace-pre-line pt-1">{event.description}</p>
            </div>
          )}

          {/* Associated Blotter Report Link */}
          {event.blotter_report_id && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold">Duty Shift Blotter Submitted & Linked</p>
                  <p className="text-xs text-emerald-700">Report ID: {event.blotter_report_id}</p>
                </div>
              </div>
              {onViewBlotterReport && (
                <Button
                  size="sm"
                  onClick={() => onViewBlotterReport(event.blotter_report_id!)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Blotter
                </Button>
              )}
            </div>
          )}

          {/* Quick Status Control */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Quick Status Transition
            </span>
            <div className="flex flex-wrap gap-2">
              {(['Scheduled', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled', 'Postponed'] as EventStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                      event.status === st
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <div>
            {!confirmDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg text-xs font-semibold gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Delete Event
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-600">Confirm delete?</span>
                <button
                  onClick={handleDelete}
                  className="rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2 py-1"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded border border-slate-300 bg-white text-slate-600 text-xs px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <Button type="button" onClick={onClose} className="rounded-xl px-5 py-2 font-semibold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
