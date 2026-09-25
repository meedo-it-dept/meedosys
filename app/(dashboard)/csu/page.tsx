'use client';

import React, { useState, useEffect } from 'react';
import { useMeedo } from '@/lib/store';
import {
  CsuDailyReport,
  CsuPersonnelItem,
  CsuIncidentItem,
  CsuViolationItem,
  CsuLostFoundItem,
} from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  Calendar,
  UserCheck,
  Search,
  History,
  FileText,
  Clock,
  Shield,
  UserPlus,
  Sparkles,
  Edit,
  Radio,
  Phone,
  MapPin,
  X,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { MarketGuard } from '@/lib/types';

export default function CsuPage() {
  const { csuReports, addCsuReport, guards, addGuard, updateGuard, deleteGuard, currentUser } = useMeedo();

  const [activeTab, setActiveTab] = useState<'blotter' | 'roster' | 'guardHistory'>('blotter');

  // Guard Roster Management State
  const [isGuardModalOpen, setIsGuardModalOpen] = useState(false);
  const [editingGuardId, setEditingGuardId] = useState<string | null>(null);
  const [guardForm, setGuardForm] = useState<MarketGuard>({
    guard_id: '',
    guard_name: '',
    rank_title: 'Market Guard I',
    default_area: 'Main Gate / Entrance',
    contact_no: '',
    radio_call_sign: '',
    status: 'Active',
  });
  const [guardSearch, setGuardSearch] = useState('');
  const [guardStatusFilter, setGuardStatusFilter] = useState('All');
  const [guardAreaFilter, setGuardAreaFilter] = useState('All');

  // Form State
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [shift, setShift] = useState('1st Shift (0600H - 1400H)');
  const [areaCovered, setAreaCovered] = useState('Main Building & Wet Section Perimeter');
  const [summary, setSummary] = useState('');
  const [turnover, setTurnover] = useState('');
  const [prepName, setPrepName] = useState('SO2 Roberto Alcantara');
  const [prepTitle, setPrepTitle] = useState('Duty Market Guard / Prepared By');
  const [verName, setVerName] = useState('TL Marcos Dalisay');
  const [verTitle, setVerTitle] = useState('Market Guard Team Leader');
  const [appName, setAppName] = useState('Hon. Market Administrator');
  const [appTitle, setAppTitle] = useState('Market Administrator');

  // Tabular Sections
  const [personnel, setPersonnel] = useState<CsuPersonnelItem[]>([
    {
      guard_id: 'G-101',
      guard_name: 'Roberto Alcantara',
      assigned_area: 'Gate 1 & Parking Area',
      time_in: '05:45',
      time_out: '14:00',
      remarks: 'On duty',
    },
    {
      guard_id: 'G-104',
      guard_name: 'Carlito Ramos',
      assigned_area: 'Wet Section Alley',
      time_in: '05:50',
      time_out: '14:00',
      remarks: 'Assisted sanitation',
    },
  ]);

  const [incidents, setIncidents] = useState<CsuIncidentItem[]>([]);
  const [violations, setViolations] = useState<CsuViolationItem[]>([
    {
      identifier: 'Transient Vendor #14',
      violation: 'Blocking pedestrian lane with produce crates',
      action_taken: 'Verbally reprimanded; vendor voluntarily cleared walkway',
      remarks: 'First offense',
    },
  ]);
  const [lostFound, setLostFound] = useState<CsuLostFoundItem[]>([
    {
      description: 'Black leather wallet with PhilHealth ID',
      found_by: 'Guard Alcantara (near Stall G-02-A)',
      claimed_by: 'Juanita Dela Cruz',
      status: 'Claimed',
    },
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Guard History Search State
  const [searchGuardId, setSearchGuardId] = useState('G-101');
  const [selectedReportToView, setSelectedReportToView] = useState<CsuDailyReport | null>(null);

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = {
      reportDate,
      dayOfWeek,
      shift,
      areaCovered,
      summary,
      turnover,
      prepName,
      prepTitle,
      verName,
      verTitle,
      appName,
      appTitle,
      personnel,
      incidents,
      violations,
      lostFound,
    };
    try {
      localStorage.setItem('csu_daily_draft', JSON.stringify(draft));
    } catch (e) {}
  }, [
    reportDate,
    dayOfWeek,
    shift,
    areaCovered,
    summary,
    turnover,
    prepName,
    prepTitle,
    verName,
    verTitle,
    appName,
    appTitle,
    personnel,
    incidents,
    violations,
    lostFound,
  ]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('csu_daily_draft');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.reportDate) setReportDate(d.reportDate);
        if (d.dayOfWeek) setDayOfWeek(d.dayOfWeek);
        if (d.shift) setShift(d.shift);
        if (d.areaCovered) setAreaCovered(d.areaCovered);
        if (d.summary) setSummary(d.summary);
        if (d.turnover) setTurnover(d.turnover);
        if (d.prepName) setPrepName(d.prepName);
        if (d.verName) setVerName(d.verName);
        if (d.appName) setAppName(d.appName);
        if (d.personnel && Array.isArray(d.personnel) && d.personnel.length > 0)
          setPersonnel(d.personnel);
        if (d.incidents && Array.isArray(d.incidents)) setIncidents(d.incidents);
        if (d.violations && Array.isArray(d.violations)) setViolations(d.violations);
        if (d.lostFound && Array.isArray(d.lostFound)) setLostFound(d.lostFound);
      }
    } catch (e) {}
  }, []);

  // Auto-fill Prepared By with logged-in guard if available on first visit
  useEffect(() => {
    if (currentUser && (currentUser.section === 'F' || currentUser.guard_id)) {
      const saved = localStorage.getItem('csu_daily_draft');
      if (!saved) {
        const nameWithRank = currentUser.rank_title
          ? `${currentUser.rank_title} ${currentUser.full_name || currentUser.username}`
          : (currentUser.full_name || currentUser.username);
        setPrepName(nameWithRank);
        setPrepTitle(currentUser.rank_title ? `${currentUser.rank_title} / Prepared By` : 'Duty Market Guard / Prepared By');
      }
    }
  }, [currentUser]);

  const handleUseLoggedInGuard = () => {
    if (currentUser) {
      const nameWithRank = currentUser.rank_title
        ? `${currentUser.rank_title} ${currentUser.full_name || currentUser.username}`
        : (currentUser.full_name || currentUser.username);
      setPrepName(nameWithRank);
      setPrepTitle(currentUser.rank_title ? `${currentUser.rank_title} / Prepared By` : 'Duty Market Guard / Prepared By');
    }
  };

  const handleGuardIdChange = (idx: number, idVal: string) => {
    const updated = [...personnel];
    updated[idx].guard_id = idVal;
    const match = guards.find(
      (g) => g.guard_id.trim().toLowerCase() === idVal.trim().toLowerCase()
    );
    if (match) {
      updated[idx].guard_name = match.guard_name;
      if (!updated[idx].assigned_area && match.default_area) {
        updated[idx].assigned_area = match.default_area;
      }
    }
    setPersonnel(updated);
  };

  const handleAddGuardFromRoster = (guardId: string) => {
    if (!guardId) return;
    const match = guards.find((g) => g.guard_id.toUpperCase() === guardId.toUpperCase());
    if (!match) return;

    // Check if already in personnel
    const exists = personnel.some((p) => p.guard_id.toUpperCase() === match.guard_id.toUpperCase());
    if (exists) {
      alert(`Guard ${match.guard_id} (${match.guard_name}) is already added to this shift.`);
      return;
    }

    setPersonnel([
      ...personnel,
      {
        guard_id: match.guard_id,
        guard_name: match.guard_name,
        assigned_area: match.default_area || 'Market General Patrol',
        time_in: shift.includes('2nd') ? '14:00' : shift.includes('3rd') ? '22:00' : '06:00',
        time_out: shift.includes('2nd') ? '22:00' : shift.includes('3rd') ? '06:00' : '14:00',
        remarks: 'On duty',
      },
    ]);
  };

  const handleAddPersonnel = () => {
    setPersonnel([
      ...personnel,
      {
        guard_id: `G-${100 + personnel.length + 1}`,
        guard_name: '',
        assigned_area: '',
        time_in: '06:00',
        time_out: '14:00',
        remarks: '',
      },
    ]);
  };

  const handleOpenAddGuard = () => {
    setEditingGuardId(null);
    const nextNum = guards.length + 1;
    setGuardForm({
      guard_id: `GRD-${String(nextNum).padStart(3, '0')}`,
      guard_name: '',
      rank_title: 'Market Guard I',
      default_area: 'Main Gate / Entrance',
      contact_no: '',
      radio_call_sign: '',
      status: 'Active',
    });
    setIsGuardModalOpen(true);
  };

  const handleOpenEditGuard = (guard: MarketGuard) => {
    setEditingGuardId(guard.guard_id);
    setGuardForm({
      guard_id: guard.guard_id,
      guard_name: guard.guard_name,
      rank_title: guard.rank_title || 'Market Guard I',
      default_area: guard.default_area || 'Main Gate / Entrance',
      contact_no: guard.contact_no || '',
      radio_call_sign: guard.radio_call_sign || '',
      status: guard.status,
    });
    setIsGuardModalOpen(true);
  };

  const handleSaveGuard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardForm.guard_name.trim() || !guardForm.guard_id.trim()) return;

    if (editingGuardId) {
      updateGuard(editingGuardId, guardForm);
    } else {
      addGuard(guardForm);
    }
    setIsGuardModalOpen(false);
  };

  const handleDeleteGuard = (guardId: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} (${guardId}) from the guard roster?`)) {
      deleteGuard(guardId);
    }
  };

  const handleToggleGuardStatus = (guard: MarketGuard) => {
    const nextStatus = guard.status === 'Active' ? 'Inactive' : 'Active';
    updateGuard(guard.guard_id, { status: nextStatus });
  };

  const handleQuickDeploy = (guard: MarketGuard) => {
    handleAddGuardFromRoster(guard.guard_id);
    setActiveTab('blotter');
  };

  const handleAddIncident = () => {
    setIncidents([
      ...incidents,
      {
        time: '09:00',
        location: 'Gate 1',
        type: 'Public Disturbance',
        description: '',
        status: 'Resolved',
      },
    ]);
  };

  const handleAddViolation = () => {
    setViolations([
      ...violations,
      {
        identifier: 'Vendor #',
        violation: 'Obstruction',
        action_taken: 'Verbal Warning',
        remarks: 'First Offense',
      },
    ]);
  };

  const handleAddLostFound = () => {
    setLostFound([
      ...lostFound,
      {
        description: '',
        found_by: '',
        claimed_by: '',
        status: 'In Custody',
      },
    ]);
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    addCsuReport({
      report_date: reportDate,
      day_of_week: dayOfWeek,
      shift,
      area_covered: areaCovered,
      summary_activities: summary,
      turnover_notes: turnover,
      prep_name: prepName,
      prep_title: prepTitle,
      ver_name: verName,
      ver_title: verTitle,
      app_name: appName,
      app_title: appTitle,
      personnel_data: personnel,
      incident_data: incidents,
      violations_data: violations,
      lost_found_data: lostFound,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // Compile guard history from all saved reports
  const normalizedSearch = searchGuardId.trim().toLowerCase();
  const matchedDeployments: Array<{
    reportDate: string;
    shift: string;
    guardId: string;
    guardName: string;
    assignedArea: string;
    timeIn: string;
    timeOut: string;
    remarks: string;
  }> = [];

  let matchedGuardName = '';

  csuReports.forEach((rep) => {
    (rep.personnel_data || []).forEach((p) => {
      if (
        normalizedSearch &&
        (p.guard_id.toLowerCase().includes(normalizedSearch) ||
          p.guard_name.toLowerCase().includes(normalizedSearch))
      ) {
        if (!matchedGuardName && p.guard_name) {
          matchedGuardName = p.guard_name;
        }
        matchedDeployments.push({
          reportDate: rep.report_date,
          shift: rep.shift,
          guardId: p.guard_id,
          guardName: p.guard_name,
          assignedArea: p.assigned_area,
          timeIn: p.time_in,
          timeOut: p.time_out,
          remarks: p.remarks || '-',
        });
      }
    });
  });

  // Fallback to registered guards roster if no shift history yet
  const matchedRosterGuard = guards.find(
    (g) =>
      g.guard_id.toLowerCase() === normalizedSearch ||
      g.guard_name.toLowerCase().includes(normalizedSearch)
  );
  if (!matchedGuardName && matchedRosterGuard) {
    matchedGuardName = matchedRosterGuard.guard_name;
  }

  // Print official Guard Deployment Report window matching legacy map_js.html:3005-3055
  const handlePrintGuardReport = () => {
    if (!normalizedSearch) {
      alert('Please enter a Guard ID first.');
      return;
    }

    if (matchedDeployments.length === 0 && !matchedRosterGuard) {
      alert(`No records found for Guard ID "${searchGuardId}".`);
      return;
    }

    const printWin = window.open('', '', 'width=950,height=750');
    if (!printWin) return;

    const rowsHtml = matchedDeployments
      .map(
        (d) => `
        <tr>
          <td>${d.reportDate}</td>
          <td>${d.shift}</td>
          <td>${d.assignedArea}</td>
          <td>${d.timeIn}</td>
          <td>${d.timeOut}</td>
          <td>${d.remarks}</td>
        </tr>`
      )
      .join('');

    printWin.document.write(`
      <html>
        <head>
          <title>Market Guard Deployment Report - ${searchGuardId.toUpperCase()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #111; }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .lgu { font-size: 0.95rem; text-transform: uppercase; letter-spacing: 1px; color: #333; margin: 0 0 4px 0; }
            h1 { font-size: 1.5rem; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f172a; }
            p.sub { color: #555; font-style: italic; margin-top: 4px; font-size: 0.9rem; }
            .info-grid { display: flex; justify-content: space-between; margin: 20px 0; font-size: 1rem; border: 1px solid #e2e8f0; padding: 12px 16px; background: #f8fafc; border-radius: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.9rem; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
            th { background-color: #f1f5f9; text-transform: uppercase; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px; }
            .sig-section { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; page-break-inside: avoid; }
            .sig-box { flex: 1; display: flex; flex-direction: column; align-items: center; }
            .sig-line { width: 75%; border-bottom: 1px solid #000; margin-bottom: 6px; height: 30px; font-weight: bold; }
            .sig-title { font-size: 0.75rem; color: #475569; }
            @media print {
              body { margin: 20px; }
              @page { size: portrait; margin: 0.5in; }
              th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="lgu">Republic of the Philippines • Municipality of Malungon • Province of Sarangani</p>
            <h1>Market Guard Deployment Report</h1>
            <p class="sub">Market Guard Security Desk • Individual Personnel Daily Shift History Summary</p>
          </div>

          <div class="info-grid">
            <div><strong>Guard ID:</strong> <u>${searchGuardId.toUpperCase()}</u></div>
            <div><strong>Guard Name:</strong> <u>${matchedGuardName || 'Assigned Officer'}</u></div>
            <div><strong>Total Recorded Shifts:</strong> <u>${matchedDeployments.length}</u></div>
            <div><strong>Generated:</strong> <u>${new Date().toLocaleDateString()}</u></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 14%;">Date</th>
                <th style="width: 22%;">Shift</th>
                <th style="width: 25%;">Assigned Post / Area</th>
                <th style="width: 12%;">Time In</th>
                <th style="width: 12%;">Time Out</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #64748b;">No shift entries logged yet for Guard ${searchGuardId.toUpperCase()}.</td></tr>`}
            </tbody>
          </table>

          <div class="sig-section">
            <div class="sig-box">
              <div class="sig-line">${matchedGuardName || 'Duty Guard'}</div>
              <div class="sig-title">Market Guard on Record</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">TL Marcos Dalisay</div>
              <div class="sig-title">Market Guard Supervisor / Team Leader</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">Hon. Market Administrator</div>
              <div class="sig-title">Market Administrator</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            Peace & Order Desk (Market Guard Blotter)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section F: 8-part digital Market Guard shift logbook with offline auto-save, tri-level sign-off, and guard deployment history.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 no-print bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('blotter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'blotter'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Daily Shift Blotter
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'roster'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Guard Profiles & Roster
          </button>
          <button
            onClick={() => setActiveTab('guardHistory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'guardHistory'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" /> History & Shift Calendar
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY SHIFT BLOTTER (8-PART FORM)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'blotter' && (
        <form onSubmit={handleSaveReport} className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 p-3 rounded-xl no-print">
            <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>
                Continuous Auto-Save Active: Draft persists in browser memory even if network disconnects.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="bg-white"
              >
                <Printer className="w-4 h-4 mr-1.5" /> Print Shift Blotter
              </Button>
              <Button type="submit" variant="primary" size="sm">
                <Save className="w-4 h-4 mr-1.5" /> Save Daily Report
              </Button>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fade-in no-print">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Shift report successfully registered to MEEDOSys database and local storage!
            </div>
          )}

          {/* Printable Official Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 print-only hidden">
            <p className="text-xs uppercase tracking-widest text-slate-700">
              Republic of the Philippines • Municipality of Malungon • Province of Sarangani
            </p>
            <h1 className="text-base font-bold uppercase tracking-wider text-slate-900 mt-1">
              Market Security Desk & Enforcement Section
            </h1>
            <h2 className="text-lg font-black uppercase text-blue-900 mt-0.5">
              Market Guard Daily Shift Report
            </h2>
          </div>

          {/* 1. Basic Information */}
          <Card>
            <div className="border-b border-slate-100 pb-2 mb-3">
              <h3 className="font-bold text-slate-800 text-sm">1. Basic Information</h3>
              <p className="text-[11px] text-slate-500">Date, operational shift, and area coverage of the security detachment.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block mb-1">Day of Week</label>
                <input
                  type="text"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block mb-1">Shift</label>
                <input
                  type="text"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block mb-1">Area Covered</label>
                <input
                  type="text"
                  value={areaCovered}
                  onChange={(e) => setAreaCovered(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </Card>

          {/* 2. Personnel Deployment */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span>2. Personnel Deployment</span>
                  <span className="text-[11px] font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    Auto-fetch by Guard ID
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select or type a Guard ID (e.g. G-101) to auto-fill Officer Name and assigned post.
                </p>
              </div>
              <div className="flex items-center gap-2 no-print">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddGuardFromRoster(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="text-xs border border-blue-200 rounded-lg px-2.5 py-1.5 bg-blue-50/60 hover:bg-blue-50 font-medium text-blue-900 transition-colors focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>+ Add from Guard Roster...</option>
                  {guards.map((g) => (
                    <option key={g.guard_id} value={g.guard_id}>
                      {g.guard_id} - {g.guard_name} ({g.rank_title || 'Guard'})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPersonnel}
                  className="no-print text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Custom Entry
                </Button>
              </div>
            </div>

            {/* Datalist for fast auto-fill lookup */}
            <datalist id="marketGuardList">
              {guards.map((g) => (
                <option key={g.guard_id} value={g.guard_id}>
                  {g.guard_name} ({g.rank_title || 'Guard'}) - {g.default_area || 'Market'}
                </option>
              ))}
            </datalist>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-2 px-2" style={{ width: '16%' }}>Guard ID</th>
                    <th className="py-2 px-2" style={{ width: '22%' }}>Guard Name</th>
                    <th className="py-2 px-2" style={{ width: '22%' }}>Assigned Area</th>
                    <th className="py-2 px-2" style={{ width: '12%' }}>Time In</th>
                    <th className="py-2 px-2" style={{ width: '12%' }}>Time Out</th>
                    <th className="py-2 px-2">Remarks</th>
                    <th className="py-2 px-2 no-print w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personnel.map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          list="marketGuardList"
                          value={p.guard_id}
                          onChange={(e) => handleGuardIdChange(idx, e.target.value)}
                          placeholder="e.g. G-101"
                          className="w-full px-2 py-1 border border-slate-200 rounded font-mono font-bold text-blue-700 uppercase"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={p.guard_name}
                          onChange={(e) => {
                            const updated = [...personnel];
                            updated[idx].guard_name = e.target.value;
                            setPersonnel(updated);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded font-medium"
                          placeholder="Officer Name"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={p.assigned_area}
                          onChange={(e) => {
                            const updated = [...personnel];
                            updated[idx].assigned_area = e.target.value;
                            setPersonnel(updated);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded"
                          placeholder="Post / Area"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="time"
                          value={p.time_in}
                          onChange={(e) => {
                            const updated = [...personnel];
                            updated[idx].time_in = e.target.value;
                            setPersonnel(updated);
                          }}
                          className="w-24 px-2 py-1 border border-slate-200 rounded"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="time"
                          value={p.time_out}
                          onChange={(e) => {
                            const updated = [...personnel];
                            updated[idx].time_out = e.target.value;
                            setPersonnel(updated);
                          }}
                          className="w-24 px-2 py-1 border border-slate-200 rounded"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={p.remarks || ''}
                          onChange={(e) => {
                            const updated = [...personnel];
                            updated[idx].remarks = e.target.value;
                            setPersonnel(updated);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded"
                        />
                      </td>
                      <td className="py-1.5 px-2 no-print">
                        <button
                          type="button"
                          onClick={() => setPersonnel(personnel.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 3. Summary of Activities */}
          <Card>
            <div className="border-b border-slate-100 pb-2 mb-2">
              <h3 className="font-bold text-slate-800 text-sm">3. Summary of Daily Shift Activities</h3>
              <p className="text-[11px] text-slate-500">Document roving patrols, enforcement assistance, public assistance, and peace maintenance.</p>
            </div>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Write in paragraph form including patrols, monitoring, vendor assistance, traffic regulation, and enforcement operations..."
              className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </Card>

          {/* 4. Incident Report */}
          <Card>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">4. Incident Blotter</h3>
                <p className="text-[11px] text-slate-500">Untoward incidents, physical altercations, theft, or fire alarms.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddIncident}
                className="no-print"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Incident
              </Button>
            </div>
            {incidents.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No untoward incidents reported during this operational shift.
              </p>
            ) : (
              <div className="space-y-2">
                {incidents.map((inc, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs items-center"
                  >
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Time</label>
                      <input
                        type="time"
                        value={inc.time}
                        onChange={(e) => {
                          const up = [...incidents];
                          up[idx].time = e.target.value;
                          setIncidents(up);
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Location</label>
                      <input
                        type="text"
                        value={inc.location}
                        onChange={(e) => {
                          const up = [...incidents];
                          up[idx].location = e.target.value;
                          setIncidents(up);
                        }}
                        placeholder="Location"
                        className="w-full p-1.5 border border-slate-200 rounded bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Type</label>
                      <input
                        type="text"
                        value={inc.type}
                        onChange={(e) => {
                          const up = [...incidents];
                          up[idx].type = e.target.value;
                          setIncidents(up);
                        }}
                        placeholder="Disturbance / Theft"
                        className="w-full p-1.5 border border-slate-200 rounded bg-white"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Description & Action Taken</label>
                      <input
                        type="text"
                        value={inc.description}
                        onChange={(e) => {
                          const up = [...incidents];
                          up[idx].description = e.target.value;
                          setIncidents(up);
                        }}
                        placeholder="Action taken / Resolution"
                        className="w-full p-1.5 border border-slate-200 rounded bg-white"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Status</label>
                      <select
                        value={inc.status}
                        onChange={(e) => {
                          const up = [...incidents];
                          up[idx].status = e.target.value;
                          setIncidents(up);
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs font-semibold"
                      >
                        <option>Resolved</option>
                        <option>Pending</option>
                        <option>Escalated</option>
                      </select>
                    </div>
                    <div className="md:col-span-1 text-center no-print pt-3">
                      <button
                        type="button"
                        onClick={() => setIncidents(incidents.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 5. Violations / Apprehensions */}
          <Card>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">5. Violations & Apprehensions</h3>
                <p className="text-[11px] text-slate-500">Obstructions, unsanitary waste disposal, illegal parking, unauthorized vending.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddViolation}
                className="no-print"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Violation
              </Button>
            </div>
            {violations.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No municipal market violations recorded for this shift.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2 px-2" style={{ width: '25%' }}>Name / Identifier</th>
                      <th className="py-2 px-2" style={{ width: '25%' }}>Violation Type</th>
                      <th className="py-2 px-2" style={{ width: '25%' }}>Action Taken</th>
                      <th className="py-2 px-2">Remarks</th>
                      <th className="py-2 px-2 no-print w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {violations.map((v, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={v.identifier}
                            onChange={(e) => {
                              const up = [...violations];
                              up[idx].identifier = e.target.value;
                              setViolations(up);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded font-medium"
                            placeholder="Stall # / Vendor / Plate #"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={v.violation}
                            onChange={(e) => {
                              const up = [...violations];
                              up[idx].violation = e.target.value;
                              setViolations(up);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded"
                            placeholder="e.g. Pathway Obstruction"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={v.action_taken}
                            onChange={(e) => {
                              const up = [...violations];
                              up[idx].action_taken = e.target.value;
                              setViolations(up);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded"
                            placeholder="e.g. Verbal Warning / Issued Citation"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={v.remarks || ''}
                            onChange={(e) => {
                              const up = [...violations];
                              up[idx].remarks = e.target.value;
                              setViolations(up);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded"
                            placeholder="Notes"
                          />
                        </td>
                        <td className="py-1.5 px-2 no-print">
                          <button
                            type="button"
                            onClick={() => setViolations(violations.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* 6. Lost & Found Property */}
          <Card>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">6. Lost and Found Property</h3>
                <p className="text-[11px] text-slate-500">Surrendered items, chain of custody, and owner release logs.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLostFound}
                className="no-print"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </Button>
            </div>
            {lostFound.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No items surrendered or claimed during this shift.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2 px-2" style={{ width: '35%' }}>Item Description</th>
                      <th className="py-2 px-2" style={{ width: '22%' }}>Found By</th>
                      <th className="py-2 px-2" style={{ width: '22%' }}>Claimed By</th>
                      <th className="py-2 px-2" style={{ width: '15%' }}>Status</th>
                      <th className="py-2 px-2 no-print w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lostFound.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const up = [...lostFound];
                              up[idx].description = e.target.value;
                              setLostFound(up);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded font-medium"
                            placeholder="Description of item"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={item.found_by}
                            onChange={(e) => {
                              const up = [...lostFound];
                              up[idx].found_by = e.target.value;
                              setLostFound(up);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded"
                            placeholder="Finder"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={item.claimed_by || ''}
                            onChange={(e) => {
                              const up = [...lostFound];
                              up[idx].claimed_by = e.target.value;
                              setLostFound(up);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded"
                            placeholder="Claimant"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const up = [...lostFound];
                              up[idx].status = e.target.value as any;
                              setLostFound(up);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-semibold"
                          >
                            <option value="In Custody">In Custody</option>
                            <option value="Claimed">Claimed</option>
                            <option value="Disposed">Disposed</option>
                          </select>
                        </td>
                        <td className="py-1.5 px-2 no-print">
                          <button
                            type="button"
                            onClick={() => setLostFound(lostFound.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* 7. Turnover Notes */}
          <Card>
            <div className="border-b border-slate-100 pb-2 mb-2">
              <h3 className="font-bold text-slate-800 text-sm">7. Turnover Notes for Incoming Shift</h3>
              <p className="text-[11px] text-slate-500">Reminders, unresolved concerns, or high-priority patrol instructions for the next shift.</p>
            </div>
            <textarea
              rows={3}
              value={turnover}
              onChange={(e) => setTurnover(e.target.value)}
              placeholder="Include reminders for incoming guards: perimeter lighting, padlock checks, scheduled early morning deliveries..."
              className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </Card>

          {/* 8. Tri-Level Signatures */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">8. Prepared and Noted By (Tri-Level Signatures)</h3>
                <p className="text-[11px] text-slate-500">Official chain-of-command accountability signatures.</p>
              </div>
              {currentUser && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseLoggedInGuard}
                  className="no-print text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Sign as {currentUser.full_name || currentUser.username} {currentUser.guard_id ? `(${currentUser.guard_id})` : ''}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
              <div>
                <input
                  type="text"
                  value={prepName}
                  onChange={(e) => setPrepName(e.target.value)}
                  className="w-full text-center font-bold text-sm border-b border-slate-800 pb-1 mb-1 bg-transparent"
                />
                <input
                  type="text"
                  value={prepTitle}
                  onChange={(e) => setPrepTitle(e.target.value)}
                  className="w-full text-center text-[11px] text-slate-500 font-semibold border-none bg-transparent"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={verName}
                  onChange={(e) => setVerName(e.target.value)}
                  className="w-full text-center font-bold text-sm border-b border-slate-800 pb-1 mb-1 bg-transparent"
                />
                <input
                  type="text"
                  value={verTitle}
                  onChange={(e) => setVerTitle(e.target.value)}
                  className="w-full text-center text-[11px] text-slate-500 font-semibold border-none bg-transparent"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full text-center font-bold text-sm border-b border-slate-800 pb-1 mb-1 bg-transparent"
                />
                <input
                  type="text"
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  className="w-full text-center text-[11px] text-slate-500 font-semibold border-none bg-transparent"
                />
              </div>
            </div>
          </Card>

          {/* Bottom Submit Controls */}
          <div className="flex justify-end gap-3 items-center no-print pt-2 pb-6">
            <Button type="submit" variant="primary" size="lg">
              <Save className="w-5 h-5 mr-2" /> Save & Finalize Shift Report
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GUARD PROFILES & SHIFT ROSTER                                      */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Market Guard Profiles & Roster Registry
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Accredited Civil Security Unit (CSU) personnel, radio call signs, assigned sectors, and deployment readiness.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleOpenAddGuard}>
              <UserPlus className="w-4 h-4 mr-1.5" /> Register Market Guard
            </Button>
          </div>

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Guards</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{guards.length}</div>
              <span className="text-[11px] text-slate-400">Security Personnel Roster</span>
            </Card>
            <Card className="p-4 bg-emerald-50/50 border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Active on Duty</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {guards.filter((g) => g.status === 'Active').length}
              </div>
              <span className="text-[11px] text-emerald-600">Available for Deployment</span>
            </Card>
            <Card className="p-4 bg-slate-50 border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Off-Duty / Relievers</span>
              <div className="text-2xl font-black text-slate-700 mt-1">
                {guards.filter((g) => g.status !== 'Active').length}
              </div>
              <span className="text-[11px] text-slate-500">Standby / On-Leave</span>
            </Card>
            <Card className="p-4 bg-blue-50/50 border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Call Signs Issued</span>
              <div className="text-2xl font-black text-blue-700 mt-1">
                {guards.filter((g) => !!g.radio_call_sign).length}
              </div>
              <span className="text-[11px] text-blue-600">Equipped with 2-Way Radios</span>
            </Card>
          </div>

          {/* Search & Filter Toolbar */}
          <Card className="p-4 bg-slate-50/70 border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={guardSearch}
                  onChange={(e) => setGuardSearch(e.target.value)}
                  placeholder="Search by Guard ID, Name, Rank, Sector, or Call Sign..."
                  className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white w-full focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={guardStatusFilter}
                  onChange={(e) => setGuardStatusFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
                <select
                  value={guardAreaFilter}
                  onChange={(e) => setGuardAreaFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium"
                >
                  <option value="All">All Sectors / Posts</option>
                  <option value="Main Gate / Entrance">Main Gate / Entrance</option>
                  <option value="Wet Market Perimeter">Wet Market Perimeter</option>
                  <option value="Dry Goods & Fish Section">Dry Goods & Fish Section</option>
                  <option value="Parking & Loading Bay">Parking & Loading Bay</option>
                  <option value="Slaughterhouse Sector">Slaughterhouse Sector</option>
                  <option value="Night Patrol / Perimeter">Night Patrol / Perimeter</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Guard Table */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Guard ID</th>
                    <th className="p-3">Name & Rank</th>
                    <th className="p-3">Assigned Sector / Post</th>
                    <th className="p-3">Radio Call Sign</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Shifts Logged</th>
                    <th className="p-3 text-center no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {guards
                    .filter((g) => {
                      if (guardStatusFilter !== 'All' && g.status !== guardStatusFilter) return false;
                      if (guardAreaFilter !== 'All' && g.default_area !== guardAreaFilter) return false;
                      if (guardSearch.trim()) {
                        const q = guardSearch.toLowerCase();
                        const hay = `${g.guard_id} ${g.guard_name} ${g.rank_title || ''} ${g.default_area || ''} ${g.radio_call_sign || ''} ${g.contact_no || ''}`.toLowerCase();
                        if (!hay.includes(q)) return false;
                      }
                      return true;
                    })
                    .map((g) => {
                      let shiftsCount = 0;
                      csuReports.forEach((r) => {
                        if (r.personnel_data?.some((p) => p.guard_id.toUpperCase() === g.guard_id.toUpperCase())) {
                          shiftsCount++;
                        }
                      });

                      const isActive = g.status === 'Active';

                      return (
                        <tr key={g.guard_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-blue-700">{g.guard_id}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{g.guard_name}</span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Shield className="w-3 h-3 text-slate-400" />
                              {g.rank_title || 'Market Guard I'}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-700">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              {g.default_area || 'Main Gate / Entrance'}
                            </span>
                          </td>
                          <td className="p-3">
                            {g.radio_call_sign ? (
                              <Badge variant="neutral" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px] flex items-center gap-1 w-max">
                                <Radio className="w-3 h-3 text-indigo-500" /> {g.radio_call_sign}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">
                            {g.contact_no ? (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" /> {g.contact_no}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant={isActive ? 'success' : 'neutral'}
                              className={isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}
                            >
                              {g.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-medium text-slate-700">
                            <strong>{shiftsCount}</strong> <span className="text-[10px] text-slate-400">shifts</span>
                          </td>
                          <td className="p-3 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Deploy to Today's Shift"
                                onClick={() => handleQuickDeploy(g)}
                                className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Edit Guard Profile"
                                onClick={() => handleOpenEditGuard(g)}
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title={isActive ? 'Deactivate Guard' : 'Activate Guard'}
                                onClick={() => handleToggleGuardStatus(g)}
                                className={`h-7 w-7 p-0 ${isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Remove Guard"
                                onClick={() => handleDeleteGuard(g.guard_id, g.guard_name)}
                                className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Add / Edit Guard Modal */}
          {isGuardModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="w-full max-w-lg bg-white shadow-2xl p-6 relative">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    {editingGuardId ? 'Edit Guard Profile' : 'Register Market Guard'}
                  </h3>
                  <button
                    onClick={() => setIsGuardModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveGuard} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Guard ID / Badge #
                      </label>
                      <input
                        type="text"
                        value={guardForm.guard_id}
                        onChange={(e) => setGuardForm({ ...guardForm, guard_id: e.target.value.toUpperCase() })}
                        placeholder="e.g. GRD-001"
                        required
                        disabled={!!editingGuardId}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono uppercase focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Rank / Designation
                      </label>
                      <select
                        value={guardForm.rank_title}
                        onChange={(e) => setGuardForm({ ...guardForm, rank_title: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Market Guard I">Market Guard I</option>
                        <option value="Market Guard II">Market Guard II</option>
                        <option value="Shift In-Charge / Team Leader">Shift In-Charge / Team Leader</option>
                        <option value="Security Officer">Security Officer</option>
                        <option value="Reliever / Auxiliary Guard">Reliever / Auxiliary Guard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={guardForm.guard_name}
                      onChange={(e) => setGuardForm({ ...guardForm, guard_name: e.target.value })}
                      placeholder="e.g. Roberto Alcantara"
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Radio Call Sign
                      </label>
                      <input
                        type="text"
                        value={guardForm.radio_call_sign || ''}
                        onChange={(e) => setGuardForm({ ...guardForm, radio_call_sign: e.target.value })}
                        placeholder="e.g. Echo 1 / Sierra 2"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={guardForm.contact_no || ''}
                        onChange={(e) => setGuardForm({ ...guardForm, contact_no: e.target.value })}
                        placeholder="09xx-xxx-xxxx"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Default Sector / Post
                      </label>
                      <select
                        value={guardForm.default_area}
                        onChange={(e) => setGuardForm({ ...guardForm, default_area: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Main Gate / Entrance">Main Gate / Entrance</option>
                        <option value="Wet Market Perimeter">Wet Market Perimeter</option>
                        <option value="Dry Goods & Fish Section">Dry Goods & Fish Section</option>
                        <option value="Parking & Loading Bay">Parking & Loading Bay</option>
                        <option value="Slaughterhouse Sector">Slaughterhouse Sector</option>
                        <option value="Night Patrol / Perimeter">Night Patrol / Perimeter</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Duty Status
                      </label>
                      <select
                        value={guardForm.status}
                        onChange={(e) => setGuardForm({ ...guardForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsGuardModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      <Save className="w-4 h-4 mr-1.5" />
                      {editingGuardId ? 'Update Guard' : 'Save Guard Profile'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HISTORY & SHIFT CALENDAR                                           */}
      {/* ========================================================================= */}
      {activeTab === 'guardHistory' && (
        <div className="space-y-6">
          {/* Search Header Bar matching legacy Index.html:926-936 */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-blue-950 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-700" />
                  Individual Guard History & Deployment Summary
                </h3>
                <p className="text-xs text-blue-800/80 mt-0.5">
                  Filter historical shift assignments, verified posts, and timekeeping logs across all shifts for any security personnel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    list="registeredGuardsSearch"
                    value={searchGuardId}
                    onChange={(e) => setSearchGuardId(e.target.value)}
                    placeholder="Enter Guard ID (e.g. G-101)..."
                    className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white w-52 font-mono uppercase focus:ring-2 focus:ring-blue-500/20"
                  />
                  <datalist id="registeredGuardsSearch">
                    {guards.map((g) => (
                      <option key={g.guard_id} value={g.guard_id}>
                        {g.guard_name} ({g.rank_title || 'Guard'})
                      </option>
                    ))}
                  </datalist>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePrintGuardReport}
                  disabled={matchedDeployments.length === 0 && !matchedRosterGuard}
                >
                  <Printer className="w-4 h-4 mr-1.5" /> Print Guard History Report
                </Button>
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-blue-200/60 text-xs">
              <span className="text-slate-500 font-semibold">Market Guards Roster:</span>
              {guards.map((g) => (
                <button
                  key={g.guard_id}
                  onClick={() => setSearchGuardId(g.guard_id)}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors flex items-center gap-1.5 ${
                    searchGuardId.toUpperCase() === g.guard_id.toUpperCase()
                      ? 'bg-blue-700 text-white font-bold shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-100'
                  }`}
                >
                  <span>{g.guard_id}</span>
                  <span className="text-[10px] opacity-75">({g.guard_name.split(' ')[0]})</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Guard Profile Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Market Security Officer
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-1">
                {matchedGuardName || matchedRosterGuard?.guard_name || (matchedDeployments.length > 0 ? 'Officer On Record' : 'No Record Found')}
              </h4>
              <p className="text-xs text-blue-600 font-mono mt-0.5">
                ID: {searchGuardId.toUpperCase()} {matchedRosterGuard?.rank_title ? `• Rank: ${matchedRosterGuard.rank_title}` : ''}
              </p>
            </Card>

            <Card>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Recorded Shifts
              </span>
              <h4 className="text-2xl font-black text-slate-900 mt-1">
                {matchedDeployments.length}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Logged across MEEDOSys shift blotters</p>
            </Card>

            <Card>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Primary Post & Status
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                {matchedRosterGuard?.default_area || matchedDeployments[0]?.assignedArea || 'General Market Security'}
              </h4>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">
                {matchedRosterGuard?.status || (matchedDeployments.length > 0 ? 'Active Deployment' : 'No Active Assignment')} {matchedRosterGuard?.contact_no ? `• Tel: ${matchedRosterGuard.contact_no}` : ''}
              </p>
            </Card>
          </div>

          {/* Deployment History Table */}
          <Card>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Deployment History Records ({matchedDeployments.length})
              </h4>
            </div>

            {matchedDeployments.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No recorded shifts match Guard ID &quot;{searchGuardId}&quot;</p>
                <p className="text-xs mt-1">Try selecting &quot;G-101&quot; or check past shift reports below.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Shift</th>
                      <th className="py-2.5 px-3">Officer Name</th>
                      <th className="py-2.5 px-3">Assigned Post / Area</th>
                      <th className="py-2.5 px-3">Time In</th>
                      <th className="py-2.5 px-3">Time Out</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matchedDeployments.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {formatDate(d.reportDate)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{d.shift}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{d.guardName}</td>
                        <td className="py-2.5 px-3 font-semibold text-blue-700">{d.assignedArea}</td>
                        <td className="py-2.5 px-3 font-mono">{d.timeIn}</td>
                        <td className="py-2.5 px-3 font-mono">{d.timeOut}</td>
                        <td className="py-2.5 px-3 text-slate-600">{d.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Past Shift Reports Master List */}
          <Card>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Historical Daily Shift Reports Logbook ({csuReports.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Comprehensive archive of all recorded daily security shift reports.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {csuReports.map((rep) => (
                <div
                  key={rep.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {formatDate(rep.report_date)} ({rep.day_of_week})
                      </span>
                      <Badge variant="neutral" className="text-[10px]">
                        {rep.shift}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Area: <span className="font-medium text-slate-700">{rep.area_covered}</span> •
                      Duty Guard: <span className="font-medium text-slate-700">{rep.prep_name}</span> •
                      Team Leader: <span className="font-medium text-slate-700">{rep.ver_name}</span>
                    </p>
                    {rep.summary_activities && (
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">
                        &ldquo;{rep.summary_activities}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReportToView(rep);
                      }}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" /> View Shift Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Detailed Modal for viewing past shift report */}
          {selectedReportToView && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Market Guard Daily Report • {selectedReportToView.report_date}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedReportToView.shift}</p>
                  </div>
                  <button
                    onClick={() => setSelectedReportToView(null)}
                    className="text-slate-400 hover:text-slate-700 font-bold text-lg"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Area Covered</h5>
                    <p className="text-slate-800 font-medium">{selectedReportToView.area_covered}</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Personnel Deployed ({selectedReportToView.personnel_data.length})
                    </h5>
                    <table className="w-full border border-slate-200 text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="p-1.5">Guard ID</th>
                          <th className="p-1.5">Name</th>
                          <th className="p-1.5">Assigned Area</th>
                          <th className="p-1.5">In</th>
                          <th className="p-1.5">Out</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReportToView.personnel_data.map((p, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5 font-mono font-bold text-blue-700">{p.guard_id}</td>
                            <td className="p-1.5">{p.guard_name}</td>
                            <td className="p-1.5">{p.assigned_area}</td>
                            <td className="p-1.5 font-mono">{p.time_in}</td>
                            <td className="p-1.5 font-mono">{p.time_out}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedReportToView.summary_activities && (
                    <div>
                      <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Summary of Activities</h5>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1 leading-relaxed">
                        {selectedReportToView.summary_activities}
                      </p>
                    </div>
                  )}

                  {selectedReportToView.incident_data && selectedReportToView.incident_data.length > 0 && (
                    <div>
                      <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Incident Blotter</h5>
                      <div className="space-y-1.5">
                        {selectedReportToView.incident_data.map((inc, idx) => (
                          <div key={idx} className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-900">
                            <strong>{inc.time} - {inc.location} ({inc.type}):</strong> {inc.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedReportToView.turnover_notes && (
                    <div>
                      <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Turnover Notes</h5>
                      <p className="text-slate-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-1">
                        {selectedReportToView.turnover_notes}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200 text-center">
                    <div>
                      <span className="font-bold text-slate-800 block">{selectedReportToView.prep_name}</span>
                      <span className="text-[10px] text-slate-500">{selectedReportToView.prep_title}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{selectedReportToView.ver_name}</span>
                      <span className="text-[10px] text-slate-500">{selectedReportToView.ver_title}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{selectedReportToView.app_name}</span>
                      <span className="text-[10px] text-slate-500">{selectedReportToView.app_title}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setSelectedReportToView(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
