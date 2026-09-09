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
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function CsuPage() {
  const { csuReports, addCsuReport } = useMeedo();

  const [activeTab, setActiveTab] = useState<'blotter' | 'guardHistory'>('blotter');

  // Form State
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [shift, setShift] = useState('1st Shift (0600H - 1400H)');
  const [areaCovered, setAreaCovered] = useState('Main Building & Wet Section Perimeter');
  const [summary, setSummary] = useState('');
  const [turnover, setTurnover] = useState('');
  const [prepName, setPrepName] = useState('SO2 Roberto Alcantara');
  const [prepTitle, setPrepTitle] = useState('Duty Guard / Prepared By');
  const [verName, setVerName] = useState('TL Marcos Dalisay');
  const [verTitle, setVerTitle] = useState('Team Leader on Duty');
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

  // Print official Guard Deployment Report window matching legacy map_js.html:3005-3055
  const handlePrintGuardReport = () => {
    if (!normalizedSearch) {
      alert('Please enter a Guard ID first.');
      return;
    }

    if (matchedDeployments.length === 0) {
      alert(`No shift records found for Guard ID "${searchGuardId}".`);
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
            <p class="sub">Civil Security Unit (CSU) • Individual Personnel Daily Shift History Summary</p>
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
              ${rowsHtml}
            </tbody>
          </table>

          <div class="sig-section">
            <div class="sig-box">
              <div class="sig-line">${matchedGuardName || 'Duty Guard'}</div>
              <div class="sig-title">Guard on Record</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">TL Marcos Dalisay</div>
              <div class="sig-title">CSU Supervisor / Team Leader</div>
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
            Peace & Order Desk (CSU Security Blotter)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section F: 8-part digital security desk shift logbook with offline auto-save, tri-level sign-off, and guard performance history.
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
            onClick={() => setActiveTab('guardHistory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'guardHistory'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" /> History & Print by Guard
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
              Civil Security Unit (CSU) & Market Security Desk
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
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">2. Personnel Deployment</h3>
                <p className="text-[11px] text-slate-500">Guard ID, duty posts, and time-in/time-out verification.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPersonnel}
                className="no-print"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Guard
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-2 px-2" style={{ width: '15%' }}>Guard ID</th>
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
                          value={p.guard_id}
                          onChange={(e) => {
                            const updated = [...personnel];
                            updated[idx].guard_id = e.target.value;
                            setPersonnel(updated);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded font-mono font-bold text-blue-700"
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
            <div className="border-b border-slate-100 pb-2 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">8. Prepared and Noted By (Tri-Level Signatures)</h3>
              <p className="text-[11px] text-slate-500">Official chain-of-command accountability signatures.</p>
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
      {/* TAB 2: HISTORY & PRINT BY GUARD ID                                        */}
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
                    value={searchGuardId}
                    onChange={(e) => setSearchGuardId(e.target.value)}
                    placeholder="Enter Guard ID (e.g. G-101)..."
                    className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white w-48 font-mono focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePrintGuardReport}
                  disabled={matchedDeployments.length === 0}
                >
                  <Printer className="w-4 h-4 mr-1.5" /> Print Guard History Report
                </Button>
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-blue-200/60 text-xs">
              <span className="text-slate-500 font-semibold">Quick Lookup:</span>
              {['G-101', 'G-102', 'G-104'].map((gid) => (
                <button
                  key={gid}
                  onClick={() => setSearchGuardId(gid)}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors ${
                    searchGuardId.toUpperCase() === gid
                      ? 'bg-blue-700 text-white font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-100'
                  }`}
                >
                  {gid}
                </button>
              ))}
            </div>
          </Card>

          {/* Guard Profile Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Security Officer
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-1">
                {matchedGuardName || (matchedDeployments.length > 0 ? 'Officer On Record' : 'No Record Found')}
              </h4>
              <p className="text-xs text-blue-600 font-mono mt-0.5">
                ID: {searchGuardId.toUpperCase()}
              </p>
            </Card>

            <Card>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Recorded Shifts
              </span>
              <h4 className="text-2xl font-black text-slate-900 mt-1">
                {matchedDeployments.length}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Logged across MEEDOSys blotters</p>
            </Card>

            <Card>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Primary Post
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                {matchedDeployments[0]?.assignedArea || 'General Market Security'}
              </h4>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">
                {matchedDeployments.length > 0 ? 'Active Deployment' : 'No Active Assignment'}
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
