'use client';

import React, { useState, useEffect } from 'react';
import { useMeedo } from '@/lib/store';
import {
  MarketGuard,
  CsuDailyReport,
  CsuPersonnelItem,
  CsuIncidentItem,
  CsuViolationItem,
  CsuLostFoundItem,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Shield,
  Calendar,
  FileText,
  UserCheck,
  History,
  BarChart3,
  AlertTriangle,
  Package,
  Clock,
  Plus,
  Search,
  Phone,
  Radio,
  MapPin,
  Printer,
  Edit,
  Trash2,
  Smartphone,
  Eye,
  X,
  CheckCircle2,
  Users,
  Footprints,
  Activity,
  Layers,
} from 'lucide-react';

// Subcomponents
import { GuardShiftHome } from '@/components/csu/guard/GuardShiftHome';
import { GuardShiftBlotter } from '@/components/csu/guard/GuardShiftBlotter';
import { GuardHistoryView } from '@/components/csu/guard/GuardHistoryView';
import { GuardFacilityStats } from '@/components/csu/guard/GuardFacilityStats';
import { MarketCalendarView } from '@/components/csu/calendar/MarketCalendarView';
import { CreateEventModal } from '@/components/csu/calendar/CreateEventModal';
import { AdminOperationsDashboard } from '@/components/csu/admin/AdminOperationsDashboard';
import { SecurityReportsAnalytics } from '@/components/csu/admin/SecurityReportsAnalytics';
import { MasterBlotterReview } from '@/components/csu/admin/MasterBlotterReview';

export default function CsuPage() {
  const {
    currentUser,
    guards,
    addGuard,
    updateGuard,
    deleteGuard,
    csuReports,
    marketCalendarEvents,
  } = useMeedo();

  // Mode state: 'admin' vs 'guard'
  // Auto-detect: if user is Staff in Section F, default to guard view
  const isDefaultGuard =
    currentUser?.role === 'Staff' && currentUser?.section === 'F';
  const [viewPersona, setViewPersona] = useState<'admin' | 'guard'>(
    isDefaultGuard ? 'guard' : 'admin'
  );

  // When admin previews guard mode, select which guard persona to preview
  const [previewGuardId, setPreviewGuardId] = useState<string>(
    guards[0]?.guard_id || 'G-103'
  );

  // Admin Navigation Tabs:
  // 1. dashboard, 2. roster, 3. calendar, 4. blotter, 5. incidents, 6. violations, 7. lostfound, 8. analytics
  const [adminTab, setAdminTab] = useState<
    | 'dashboard'
    | 'roster'
    | 'calendar'
    | 'masterBlotter'
    | 'incidents'
    | 'violations'
    | 'lostfound'
    | 'analytics'
  >('dashboard');

  // Guard Navigation Tabs:
  // 'shift' | 'blotter' | 'history' | 'stats'
  const [guardTab, setGuardTab] = useState<'shift' | 'blotter' | 'history' | 'stats'>('shift');

  // Guard Roster CRUD State
  const [isGuardModalOpen, setIsGuardModalOpen] = useState(false);
  const [editingGuardId, setEditingGuardId] = useState<string | null>(null);
  const [guardForm, setGuardForm] = useState<MarketGuard>({
    guard_id: '',
    guard_name: '',
    rank_title: 'Market Security Guard I',
    default_area: 'Wet Market Section',
    contact_no: '',
    radio_call_sign: '',
    assigned_facility: 'Public Market Main',
    current_shift: '1st Shift (06:00 - 14:00)',
    status: 'Active',
  });
  const [guardSearch, setGuardSearch] = useState('');
  const [guardStatusFilter, setGuardStatusFilter] = useState('All');
  const [guardAreaFilter, setGuardAreaFilter] = useState('All');

  // Calendar Event Creation Modal State
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  // Fallback guard profile if roster is still empty
  const defaultEmptyGuard: MarketGuard = {
    guard_id: 'G-101',
    guard_name: currentUser?.full_name || currentUser?.username || 'Duty Market Guard',
    rank_title: 'Market Guard',
    default_area: 'General Public Market',
    contact_no: '',
    radio_call_sign: 'EAGLE-1',
    assigned_facility: 'Public Market Main',
    current_shift: '1st Shift (06:00 - 14:00)',
    status: 'Active',
  };

  // Selected guard object for guard view
  const activeGuardObj =
    guards.find((g) => g.guard_id === previewGuardId) ||
    guards.find(
      (g) =>
        g.guard_name.toLowerCase().includes((currentUser?.full_name || currentUser?.username || '').toLowerCase())
    ) ||
    guards[0] ||
    defaultEmptyGuard;

  // Flattened Incidents, Violations, Lost & Found for Admin tables
  const allIncidents = csuReports.flatMap((r) => r.incident_data || []);
  const allViolations = csuReports.flatMap((r) => r.violations_data || []);
  const allLostFound = csuReports.flatMap((r) => r.lost_found_data || []);

  const handleOpenAddGuard = () => {
    setEditingGuardId(null);
    setGuardForm({
      guard_id: `G-${100 + guards.length + 1}`,
      guard_name: '',
      rank_title: 'Market Security Guard I',
      default_area: 'Wet Market Section',
      contact_no: '',
      radio_call_sign: '',
      assigned_facility: 'Public Market Main',
      current_shift: '1st Shift (06:00 - 14:00)',
      status: 'Active',
    });
    setIsGuardModalOpen(true);
  };

  const handleOpenEditGuard = (guard: MarketGuard) => {
    setEditingGuardId(guard.guard_id);
    setGuardForm({ ...guard });
    setIsGuardModalOpen(true);
  };

  const handleSaveGuard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardForm.guard_id.trim() || !guardForm.guard_name.trim()) return;

    if (editingGuardId) {
      updateGuard(editingGuardId, guardForm);
    } else {
      addGuard(guardForm);
    }
    setIsGuardModalOpen(false);
  };

  const filteredGuards = guards.filter((g) => {
    if (guardStatusFilter !== 'All' && g.status !== guardStatusFilter) return false;
    if (guardAreaFilter !== 'All' && g.default_area !== guardAreaFilter) return false;
    if (guardSearch) {
      const q = guardSearch.toLowerCase();
      const matchName = g.guard_name.toLowerCase().includes(q);
      const matchId = g.guard_id.toLowerCase().includes(q);
      const matchCall = (g.radio_call_sign || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchCall) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* TOP DUAL-PERSONA HEADER & MODE SWITCHER                               */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs overflow-hidden">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                Peace & Order Desk
              </h1>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  viewPersona === 'guard'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-blue-300 bg-blue-50 text-blue-800'
                }`}
              >
                {viewPersona === 'guard' ? '📱 Market Guard View' : '🖥️ Administrator Side'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              Section F: Operational Duty Roster, Market Calendar, Blotter & Multi-Sector Security
            </p>
          </div>
        </div>

        {/* Persona Switcher / Preview Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          {viewPersona === 'guard' ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
              {currentUser?.role === 'Admin' && (
                <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 min-w-0 flex-1 sm:flex-initial">
                  <Eye className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <span className="text-[11px] font-bold text-amber-900 shrink-0">Previewing:</span>
                  <select
                    value={previewGuardId}
                    onChange={(e) => setPreviewGuardId(e.target.value)}
                    className="rounded-lg border border-amber-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 min-w-0 flex-1 max-w-[200px]"
                  >
                    {guards.length === 0 ? (
                      <option value={defaultEmptyGuard.guard_id}>
                        {defaultEmptyGuard.guard_name} ({defaultEmptyGuard.guard_id})
                      </option>
                    ) : (
                      guards.map((g) => (
                        <option key={g.guard_id} value={g.guard_id}>
                          {g.guard_name} ({g.guard_id})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {currentUser?.role === 'Admin' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setViewPersona('admin')}
                  className="rounded-xl border-slate-300 text-xs font-bold gap-1.5 shadow-xs w-full sm:w-auto justify-center"
                >
                  <X className="h-3.5 w-3.5" /> Back to Admin Console
                </Button>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setViewPersona('guard')}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 shadow-sm w-full sm:w-auto justify-center"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
              Preview Market Guard Mobile View
            </Button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. MARKET GUARD VIEW (Mobile-First Duty Experience)                   */}
      {/* ===================================================================== */}
      {viewPersona === 'guard' ? (
        <div className="space-y-6">
          {/* Guard Navigation Pills */}
          <div className="overflow-x-auto no-scrollbar rounded-2xl bg-slate-100 p-1.5 border border-slate-200 max-w-full">
            <div className="flex items-center gap-1 min-w-max">
              <button
                onClick={() => setGuardTab('shift')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  guardTab === 'shift'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="h-4 w-4" /> 🏠 My Shift
              </button>

              <button
                onClick={() => setGuardTab('blotter')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  guardTab === 'blotter'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="h-4 w-4" /> 📝 My Shift Blotter
              </button>

              <button
                onClick={() => setGuardTab('history')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  guardTab === 'history'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="h-4 w-4" /> 📋 My History
              </button>

              <button
                onClick={() => setGuardTab('stats')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  guardTab === 'stats'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="h-4 w-4" /> 📊 Facility Stats
              </button>
            </div>
          </div>

          {/* Render Guard Sub-views */}
          {guardTab === 'shift' && (
            <GuardShiftHome
              onNavigateTab={(tab) => setGuardTab(tab)}
              selectedGuardOverride={activeGuardObj}
            />
          )}

          {guardTab === 'blotter' && (
            <GuardShiftBlotter currentGuard={activeGuardObj || guards[0]} />
          )}

          {guardTab === 'history' && (
            <GuardHistoryView currentGuard={activeGuardObj || guards[0]} />
          )}

          {guardTab === 'stats' && <GuardFacilityStats />}
        </div>
      ) : (
        /* =================================================================== */
        /* 2. ADMINISTRATOR VIEW (Comprehensive Operations Suite)              */
        /* =================================================================== */
        <div className="space-y-6">
          {/* Admin Navigation Tabs */}
          <div className="overflow-x-auto no-scrollbar rounded-2xl bg-slate-100 p-1.5 border border-slate-200 max-w-full">
            <div className="flex items-center gap-1 min-w-max">
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  adminTab === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏠 Dashboard
              </button>

              <button
                onClick={() => setAdminTab('roster')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  adminTab === 'roster'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👮 Guard Profiles & Roster
              </button>

              <button
                onClick={() => setAdminTab('calendar')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  adminTab === 'calendar'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📅 Market Calendar
              </button>

              <button
                onClick={() => setAdminTab('masterBlotter')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  adminTab === 'masterBlotter'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📝 Daily Shift Blotter
              </button>

              <button
                onClick={() => setAdminTab('incidents')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  adminTab === 'incidents'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🚨 Incident Management
              </button>

              <button
                onClick={() => setAdminTab('violations')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  adminTab === 'violations'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚠️ Violations & Enforcement
              </button>

              <button
                onClick={() => setAdminTab('lostfound')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  adminTab === 'lostfound'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📦 Lost & Found
              </button>

              <button
                onClick={() => setAdminTab('analytics')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  adminTab === 'analytics'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 Reports & Analytics
              </button>
            </div>
          </div>

          {/* TAB 1: OPERATIONS DASHBOARD */}
          {adminTab === 'dashboard' && (
            <AdminOperationsDashboard
              onNavigateTab={(tab: any) => setAdminTab(tab)}
              onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
            />
          )}

          {/* TAB 2: GUARD PROFILES & ROSTER */}
          {adminTab === 'roster' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    Market Guard Profiles & Duty Roster
                  </h2>
                  <p className="text-xs text-slate-500">
                    Personnel directory, radio call signs, assigned sectors, and duty status
                  </p>
                </div>

                <Button
                  onClick={handleOpenAddGuard}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus className="h-4 w-4" /> Add Market Guard
                </Button>
              </div>

              {/* Roster Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by guard name, ID, or call sign..."
                    value={guardSearch}
                    onChange={(e) => setGuardSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs bg-white shadow-xs"
                  />
                </div>

                <select
                  value={guardStatusFilter}
                  onChange={(e) => setGuardStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <select
                  value={guardAreaFilter}
                  onChange={(e) => setGuardAreaFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white font-medium"
                >
                  <option value="All">All Designated Sectors</option>
                  <option value="Wet Market Section">Wet Market Section</option>
                  <option value="Dry Goods & Perimeter">Dry Goods & Perimeter</option>
                  <option value="Whole Market / Main Hall">Whole Market / Main Hall</option>
                  <option value="Terminal & Unloading Bay">Terminal & Unloading Bay</option>
                  <option value="Commercial Plaza & Gates">Commercial Plaza & Gates</option>
                </select>
              </div>

              {/* Roster Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGuards.map((g) => (
                  <div
                    key={g.guard_id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-bold font-mono text-sm">
                          {g.guard_id}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{g.guard_name}</h3>
                          <p className="text-[11px] text-slate-500 font-medium">{g.rank_title || 'Market Guard'}</p>
                        </div>
                      </div>

                      <Badge
                        className={`text-[10px] ${
                          g.status === 'Active' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {g.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-bold uppercase">Radio Call Sign</span>
                        <span className="font-mono font-bold text-blue-900">{g.radio_call_sign || 'None'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-bold uppercase">Designated Sector</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">{g.default_area}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-bold uppercase">Contact Phone</span>
                        <span className="font-mono">{g.contact_no || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-bold uppercase">Assigned Facility</span>
                        <span>{g.assigned_facility || 'Public Market Main'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPreviewGuardId(g.guard_id);
                          setViewPersona('guard');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 rounded-xl h-8"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview Guard View
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditGuard(g)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 rounded-lg"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteGuard(g.guard_id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MARKET CALENDAR */}
          {adminTab === 'calendar' && <MarketCalendarView />}

          {/* TAB 4: DAILY SHIFT BLOTTER */}
          {adminTab === 'masterBlotter' && <MasterBlotterReview />}

          {/* TAB 5: INCIDENT MANAGEMENT */}
          {adminTab === 'incidents' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Market Incidents Logbook
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comprehensive log of thefts, altercations, fire hazards, and emergency responses
                  </p>
                </div>
                <Badge className="bg-red-600 text-white text-xs">{allIncidents.length} Records</Badge>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="p-4">Time & Date</th>
                      <th className="p-4">Incident Category</th>
                      <th className="p-4">Sector Location</th>
                      <th className="p-4">Narrative Description</th>
                      <th className="p-4">Action Taken</th>
                      <th className="p-4">Reporting Guard</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allIncidents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          No incidents recorded in the system.
                        </td>
                      </tr>
                    ) : (
                      allIncidents.map((inc, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-4 font-mono font-bold text-slate-800">
                            {inc.time}
                            <span className="block text-[10px] text-slate-400 font-normal">{inc.date}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-red-900 block">{inc.type}</span>
                            {inc.severity && (
                              <Badge variant="outline" className="text-[10px] bg-red-50 border-red-200">
                                {inc.severity}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-slate-700">{inc.location}</td>
                          <td className="p-4 max-w-xs text-slate-800">{inc.description}</td>
                          <td className="p-4 text-emerald-800 font-medium">{inc.immediate_action || '--'}</td>
                          <td className="p-4 font-semibold text-slate-900">{inc.guard_name || inc.guard_id}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px] bg-white">
                              {inc.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: VIOLATIONS & ENFORCEMENT */}
          {adminTab === 'violations' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    Stall Violations & Citations Desk
                  </h2>
                  <p className="text-xs text-slate-500">
                    Vendor compliance warnings, walkway obstruction notices, and CLAYGO violations
                  </p>
                </div>
                <Badge className="bg-amber-600 text-white text-xs">{allViolations.length} Citations</Badge>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="p-4">Stall / Vendor Identifier</th>
                      <th className="p-4">Violation / Infraction</th>
                      <th className="p-4">Corrective Action Taken</th>
                      <th className="p-4">Time Logged</th>
                      <th className="p-4">Reporting Guard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allViolations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                          No stall violations or vendor warnings recorded.
                        </td>
                      </tr>
                    ) : (
                      allViolations.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-900">{v.identifier}</td>
                          <td className="p-4 text-slate-800">{v.violation}</td>
                          <td className="p-4 text-emerald-800 font-medium">{v.action_taken}</td>
                          <td className="p-4 font-mono text-slate-500">{v.time || '--'}</td>
                          <td className="p-4 text-slate-700">{v.guard_name || v.guard_id || 'Market Guard'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: LOST & FOUND */}
          {adminTab === 'lostfound' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-teal-600" />
                    Market Lost & Found Property Custody
                  </h2>
                  <p className="text-xs text-slate-500">
                    Recovered articles, claimant verification, and turnover documentation
                  </p>
                </div>
                <Badge className="bg-teal-600 text-white text-xs">{allLostFound.length} Items</Badge>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="p-4">Item Description</th>
                      <th className="p-4">Recovered Location</th>
                      <th className="p-4">Found By</th>
                      <th className="p-4">Claimed By</th>
                      <th className="p-4">Custody Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allLostFound.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                          No lost property in municipal custody.
                        </td>
                      </tr>
                    ) : (
                      allLostFound.map((lf, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-teal-950">{lf.description}</td>
                          <td className="p-4 text-slate-700">{lf.location || 'Market Complex'}</td>
                          <td className="p-4 text-slate-600">{lf.found_by}</td>
                          <td className="p-4 text-slate-600">{lf.claimed_by || 'Unclaimed'}</td>
                          <td className="p-4">
                            <Badge
                              className={`text-[10px] ${
                                lf.status === 'Claimed' ? 'bg-emerald-600 text-white' : 'bg-teal-700 text-white'
                              }`}
                            >
                              {lf.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: REPORTS & ANALYTICS */}
          {adminTab === 'analytics' && <SecurityReportsAnalytics />}
        </div>
      )}

      {/* Add / Edit Guard Modal */}
      {isGuardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl p-6 space-y-4 my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                {editingGuardId ? 'Edit Market Guard Profile' : 'Register New Market Guard'}
              </h3>
              <button onClick={() => setIsGuardModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGuard} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Guard ID *</label>
                  <input
                    type="text"
                    value={guardForm.guard_id}
                    onChange={(e) => setGuardForm({ ...guardForm, guard_id: e.target.value })}
                    disabled={!!editingGuardId}
                    placeholder="e.g. G-106"
                    className="w-full rounded-xl border px-3 py-2 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Radio Call Sign</label>
                  <input
                    type="text"
                    value={guardForm.radio_call_sign || ''}
                    onChange={(e) => setGuardForm({ ...guardForm, radio_call_sign: e.target.value })}
                    placeholder="e.g. TIGER-6"
                    className="w-full rounded-xl border px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={guardForm.guard_name}
                  onChange={(e) => setGuardForm({ ...guardForm, guard_name: e.target.value })}
                  placeholder="e.g. Juan P. Dela Cruz"
                  className="w-full rounded-xl border px-3 py-2 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rank / Title</label>
                  <input
                    type="text"
                    value={guardForm.rank_title || ''}
                    onChange={(e) => setGuardForm({ ...guardForm, rank_title: e.target.value })}
                    placeholder="e.g. Market Guard I"
                    className="w-full rounded-xl border px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={guardForm.contact_no || ''}
                    onChange={(e) => setGuardForm({ ...guardForm, contact_no: e.target.value })}
                    placeholder="e.g. 0917-000-0000"
                    className="w-full rounded-xl border px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designated Sector</label>
                  <input
                    type="text"
                    value={guardForm.default_area || ''}
                    onChange={(e) => setGuardForm({ ...guardForm, default_area: e.target.value })}
                    placeholder="e.g. Wet Market Section"
                    className="w-full rounded-xl border px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={guardForm.status}
                    onChange={(e) => setGuardForm({ ...guardForm, status: e.target.value as any })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsGuardModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Save Guard Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        initialDate="2026-09-26"
      />
    </div>
  );
}
