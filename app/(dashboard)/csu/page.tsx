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
import { ShieldAlert, Plus, Trash2, Printer, Save, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function CsuPage() {
  const { csuReports, addCsuReport } = useMeedo();

  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [shift, setShift] = useState('1st Shift (0600H - 1400H)');
  const [areaCovered, setAreaCovered] = useState('Main Building & Wet Section Perimeter');
  const [summary, setSummary] = useState('');
  const [turnover, setTurnover] = useState('');
  const [prepName, setPrepName] = useState('SO2 Roberto Alcantara');
  const [verName, setVerName] = useState('TL Marcos Dalisay');
  const [appName, setAppName] = useState('Hon. Market Administrator');

  // Dynamic tabular sections
  const [personnel, setPersonnel] = useState<CsuPersonnelItem[]>([
    {
      guard_id: 'G-101',
      guard_name: 'Roberto Alcantara',
      assigned_area: 'Gate 1 & Parking',
      time_in: '05:45',
      time_out: '14:00',
      remarks: 'On duty',
    },
  ]);

  const [incidents, setIncidents] = useState<CsuIncidentItem[]>([]);
  const [violations, setViolations] = useState<CsuViolationItem[]>([]);
  const [lostFound, setLostFound] = useState<CsuLostFoundItem[]>([]);

  const [savedSuccess, setSavedSuccess] = useState(false);

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
      verName,
      appName,
      personnel,
      incidents,
      violations,
      lostFound,
    };
    localStorage.setItem('csu_daily_draft', JSON.stringify(draft));
  }, [reportDate, dayOfWeek, shift, areaCovered, summary, turnover, prepName, verName, appName, personnel, incidents, violations, lostFound]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('csu_daily_draft');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.summary) setSummary(d.summary);
        if (d.turnover) setTurnover(d.turnover);
        if (d.personnel) setPersonnel(d.personnel);
        if (d.incidents) setIncidents(d.incidents);
        if (d.violations) setViolations(d.violations);
        if (d.lostFound) setLostFound(d.lostFound);
      }
    } catch (e) {}
  }, []);

  const handleAddPersonnel = () => {
    setPersonnel([
      ...personnel,
      { guard_id: `G-${100 + personnel.length + 1}`, guard_name: '', assigned_area: '', time_in: '06:00', time_out: '14:00' },
    ]);
  };

  const handleAddIncident = () => {
    setIncidents([
      ...incidents,
      { time: '10:00', location: 'Gate 2', type: 'Disturbance', description: '', status: 'Resolved' },
    ]);
  };

  const handleAddViolation = () => {
    setViolations([
      ...violations,
      { identifier: 'Vendor #', violation: 'Obstruction', action_taken: 'Verbal Warning', remarks: '' },
    ]);
  };

  const handleAddLostFound = () => {
    setLostFound([
      ...lostFound,
      { description: '', found_by: '', claimed_by: '', status: 'In Custody' },
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
      prep_title: 'Duty Guard / Prepared By',
      ver_name: verName,
      ver_title: 'Team Leader on Duty',
      app_name: appName,
      app_title: 'Market Administrator',
      personnel_data: personnel,
      incident_data: incidents,
      violations_data: violations,
      lost_found_data: lostFound,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Peace & Order Desk (CSU Daily Blotter)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section F: 8-part digital security desk shift logbook with offline auto-save and tri-level sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" /> Print Shift Blotter
          </Button>
        </div>
      </div>

      <form onSubmit={handleSaveReport} className="space-y-6">
        {/* Printable Official Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 print-only hidden">
          <h1 className="text-base font-bold uppercase tracking-wider text-slate-900">
            Municipality of Malungon • Civil Security Unit (CSU)
          </h1>
          <h2 className="text-lg font-black uppercase text-blue-900 mt-1">
            Market Guard Daily Shift Report
          </h2>
        </div>

        {/* 1. Basic Information */}
        <Card>
          <h3 className="font-bold text-slate-800 text-sm mb-3">1. Basic Information</h3>
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
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 text-sm">2. Personnel Deployment</h3>
            <Button type="button" variant="outline" size="sm" onClick={handleAddPersonnel} className="no-print">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Guard
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-2 px-2">Guard ID</th>
                  <th className="py-2 px-2">Guard Name</th>
                  <th className="py-2 px-2">Assigned Area</th>
                  <th className="py-2 px-2">Time In</th>
                  <th className="py-2 px-2">Time Out</th>
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
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
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
                        className="w-full px-2 py-1 border border-slate-200 rounded"
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
        </Card>

        {/* 3. Summary of Activities */}
        <Card>
          <h3 className="font-bold text-slate-800 text-sm mb-2">3. Summary of Daily Shift Activities</h3>
          <textarea
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Document roving patrols, enforcement assistance, public assistance, and overall peace posture..."
            className="w-full text-sm p-3 border border-slate-300 rounded-lg"
          />
        </Card>

        {/* 4. Incident Reports */}
        <Card>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 text-sm">4. Incident Blotter</h3>
            <Button type="button" variant="outline" size="sm" onClick={handleAddIncident} className="no-print">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Incident
            </Button>
          </div>
          {incidents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No untoward incidents reported during this shift.</p>
          ) : (
            <div className="space-y-2">
              {incidents.map((inc, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-2 bg-slate-50 rounded-lg text-xs">
                  <input
                    type="time"
                    value={inc.time}
                    onChange={(e) => {
                      const up = [...incidents];
                      up[idx].time = e.target.value;
                      setIncidents(up);
                    }}
                    className="p-1.5 border border-slate-200 rounded"
                  />
                  <input
                    type="text"
                    value={inc.location}
                    onChange={(e) => {
                      const up = [...incidents];
                      up[idx].location = e.target.value;
                      setIncidents(up);
                    }}
                    placeholder="Location"
                    className="p-1.5 border border-slate-200 rounded"
                  />
                  <input
                    type="text"
                    value={inc.description}
                    onChange={(e) => {
                      const up = [...incidents];
                      up[idx].description = e.target.value;
                      setIncidents(up);
                    }}
                    placeholder="Incident Description"
                    className="p-1.5 border border-slate-200 rounded md:col-span-2"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 5. Turnover Notes */}
        <Card>
          <h3 className="font-bold text-slate-800 text-sm mb-2">5. Turnover Notes for Incoming Shift</h3>
          <textarea
            rows={3}
            value={turnover}
            onChange={(e) => setTurnover(e.target.value)}
            placeholder="Special reminders, unresolved concerns, or high-priority patrol instructions..."
            className="w-full text-sm p-3 border border-slate-300 rounded-lg"
          />
        </Card>

        {/* 6. Tri-Level Signatures */}
        <Card>
          <h3 className="font-bold text-slate-800 text-sm mb-4">6. Prepared and Noted By</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
            <div>
              <input
                type="text"
                value={prepName}
                onChange={(e) => setPrepName(e.target.value)}
                className="w-full text-center font-bold text-sm border-b border-slate-800 pb-1 mb-1"
              />
              <span className="text-[10px] text-slate-500 font-semibold block">Duty Guard / Prepared By</span>
            </div>

            <div>
              <input
                type="text"
                value={verName}
                onChange={(e) => setVerName(e.target.value)}
                className="w-full text-center font-bold text-sm border-b border-slate-800 pb-1 mb-1"
              />
              <span className="text-[10px] text-slate-500 font-semibold block">Team Leader on Duty</span>
            </div>

            <div>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full text-center font-bold text-sm border-b border-slate-800 pb-1 mb-1"
              />
              <span className="text-[10px] text-slate-500 font-semibold block">Market Administrator</span>
            </div>
          </div>
        </Card>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 items-center no-print">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Shift report recorded and saved to database!
            </span>
          )}
          <Button type="submit" variant="primary">
            <Save className="w-4 h-4 mr-1.5" /> Save Daily Shift Report
          </Button>
        </div>
      </form>
    </div>
  );
}
