'use client';

import React, { useState } from 'react';
import { CsuDailyReport } from '@/lib/types';
import { Printer, Download, CheckCircle2, Shield, Calendar, Clock, MapPin, Radio, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlotterPrintSheetProps {
  report: CsuDailyReport;
  onClose?: () => void;
  isModal?: boolean;
}

export const BlotterPrintSheet: React.FC<BlotterPrintSheetProps> = ({
  report,
  onClose,
  isModal = false,
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 ${isModal ? 'w-full max-w-4xl mx-auto' : ''}`}>
      {/* Paper Size & Action Controls (Hidden on Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Paper Format:
          </span>
          <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setPaperSize('A4')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                paperSize === 'A4'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 (210 × 297 mm)
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('Letter')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                paperSize === 'Letter'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              US Letter (8.5 × 11 in)
            </button>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Standard Philippine LGU Executive Format
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Close
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Printer className="h-4 w-4" /> Print Document ({paperSize})
          </Button>
        </div>
      </div>

      {/* Dynamic Print Styles for Paper Size */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${paperSize === 'A4' ? 'A4 portrait' : 'letter portrait'};
            margin: 10mm 12mm;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 10pt !important;
          }
          .no-print {
            display: none !important;
          }
          .csu-print-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .avoid-break {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* The Printable Sheet (Simulates true A4/Letter width & layout) */}
      <div
        className={`csu-print-sheet mx-auto bg-white text-slate-900 shadow-md border border-slate-300 rounded-lg p-8 transition-all ${
          paperSize === 'A4' ? 'max-w-[210mm]' : 'max-w-[216mm]'
        }`}
        style={{ minHeight: paperSize === 'A4' ? '297mm' : '279mm' }}
      >
        {/* 1. Official Government Header */}
        <div className="border-b-2 border-slate-900 pb-3 text-center space-y-0.5">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-600">
            Republic of the Philippines
          </p>
          <p className="text-xs font-bold tracking-wide uppercase text-slate-800">
            Province of Iloilo • Municipality of Pavia
          </p>
          <p className="text-sm font-black tracking-wider uppercase text-slate-900">
            MUNICIPAL ECONOMIC ENTERPRISE DEVELOPMENT OFFICE (MEEDO)
          </p>
          <p className="text-[11px] font-semibold text-slate-700 italic">
            Civil Security Unit (CSU) — Market Peace & Order Desk
          </p>
        </div>

        {/* 2. Document Title & Identification */}
        <div className="pt-3 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300">
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
              DAILY SHIFT BLOTTER REPORT
            </h1>
            <p className="text-[10px] font-mono font-semibold text-slate-600">
              DOCUMENT REF NO: <span className="font-bold text-slate-900">{report.id}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Audit Status</span>
            <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-emerald-800 font-mono">
              ● {report.is_locked ? 'OFFICIAL / LOCKED' : 'DRAFT IN-PROGRESS'}
            </span>
          </div>
        </div>

        {/* 3. Section I: Shift & Post Particulars Grid */}
        <div className="py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-b border-slate-200">
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              Duty Date
            </span>
            <span className="font-bold text-slate-900 font-mono text-[11px]">
              {report.report_date} ({report.day_of_week})
            </span>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              Shift Schedule
            </span>
            <span className="font-bold text-slate-900 text-[11px]">{report.shift}</span>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              Sector / Post Covered
            </span>
            <span className="font-bold text-slate-900 text-[11px] truncate block">
              {report.area_covered}
            </span>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              Lead Officer / Call Sign
            </span>
            <span className="font-bold text-slate-900 text-[11px] truncate block">
              {report.prep_name}
            </span>
          </div>
        </div>

        {/* 4. Section II: Guards / Personnel on Duty */}
        <div className="pt-3 pb-2 space-y-1">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-700" />
            I. Guard Personnel Deployment & Roster on Duty
          </h2>

          <table className="w-full border-collapse border border-slate-300 text-[10px] text-left">
            <thead className="bg-slate-100 font-bold uppercase text-slate-700">
              <tr>
                <th className="border border-slate-300 p-1.5 w-[14%] font-mono">Guard ID</th>
                <th className="border border-slate-300 p-1.5 w-[28%]">Full Name</th>
                <th className="border border-slate-300 p-1.5 w-[26%]">Designated Area</th>
                <th className="border border-slate-300 p-1.5 w-[12%] text-center">Time In</th>
                <th className="border border-slate-300 p-1.5 w-[12%] text-center">Time Out</th>
                <th className="border border-slate-300 p-1.5">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {report.personnel_data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-slate-300 p-2 text-center text-slate-500 italic">
                    No individual guard roster data attached.
                  </td>
                </tr>
              ) : (
                report.personnel_data.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-1.5 font-mono font-bold text-blue-900">
                      {p.guard_id}
                    </td>
                    <td className="border border-slate-300 p-1.5 font-bold text-slate-900">
                      {p.guard_name}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-slate-700">{p.assigned_area}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-emerald-800">
                      {p.time_in}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-800">
                      {p.time_out || '--'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-slate-600">{p.remarks || 'Standard duty'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Section III: Summary of Roving Activities */}
        <div className="pt-2 pb-2 space-y-1">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-700" />
            II. Summary of Patrol Activities & Operational Observations
          </h2>
          <div className="border border-slate-300 bg-slate-50/50 p-2.5 rounded text-[10.5px] leading-relaxed text-slate-800 whitespace-pre-line min-h-[44px]">
            {report.summary_activities ||
              'Roving and continuous monitoring conducted across assigned sector. Public order, stall walkway clearance, and facility security maintained in accordance with standard MEEDO directives.'}
          </div>
        </div>

        {/* 6. Section IV: Incidents & Emergency Record */}
        <div className="pt-2 pb-2 space-y-1">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            III. Record of Security Incidents & Emergency Actions ({report.incident_data.length})
          </h2>

          <table className="w-full border-collapse border border-slate-300 text-[10px] text-left">
            <thead className="bg-slate-100 font-bold uppercase text-slate-700">
              <tr>
                <th className="border border-slate-300 p-1.5 w-[10%] font-mono">Time</th>
                <th className="border border-slate-300 p-1.5 w-[20%]">Category</th>
                <th className="border border-slate-300 p-1.5 w-[22%]">Location</th>
                <th className="border border-slate-300 p-1.5 w-[28%]">Narrative Description</th>
                <th className="border border-slate-300 p-1.5 w-[20%]">Action Taken / Status</th>
              </tr>
            </thead>
            <tbody>
              {report.incident_data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border border-slate-300 p-2 text-center text-slate-500 italic">
                    NO INCIDENTS OR EMERGENCY EVENTS RECORDED DURING THIS SHIFT.
                  </td>
                </tr>
              ) : (
                report.incident_data.map((inc, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-1.5 font-mono font-bold">{inc.time}</td>
                    <td className="border border-slate-300 p-1.5 font-bold text-red-900">{inc.type}</td>
                    <td className="border border-slate-300 p-1.5">{inc.location}</td>
                    <td className="border border-slate-300 p-1.5">{inc.description}</td>
                    <td className="border border-slate-300 p-1.5 text-emerald-800 font-medium">
                      {inc.immediate_action || inc.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 7. Section V: Stall Violations & Vendor Enforcement */}
        <div className="pt-2 pb-2 space-y-1">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            IV. Stall Infractions & Vendor Compliance Citations ({report.violations_data.length})
          </h2>

          <table className="w-full border-collapse border border-slate-300 text-[10px] text-left">
            <thead className="bg-slate-100 font-bold uppercase text-slate-700">
              <tr>
                <th className="border border-slate-300 p-1.5 w-[25%]">Vendor / Stall Identifier</th>
                <th className="border border-slate-300 p-1.5 w-[35%]">Infraction / Violation</th>
                <th className="border border-slate-300 p-1.5 w-[30%]">Action Taken / Warning Level</th>
                <th className="border border-slate-300 p-1.5 w-[10%] text-center font-mono">Time</th>
              </tr>
            </thead>
            <tbody>
              {report.violations_data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-slate-300 p-2 text-center text-slate-500 italic">
                    NO STALL INFRACTIONS OR VENDOR VIOLATIONS CITED.
                  </td>
                </tr>
              ) : (
                report.violations_data.map((v, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-1.5 font-bold">{v.identifier}</td>
                    <td className="border border-slate-300 p-1.5 text-slate-800">{v.violation}</td>
                    <td className="border border-slate-300 p-1.5 text-emerald-800 font-medium">
                      {v.action_taken}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono">{v.time || '--'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 8. Section VI: Lost & Found Property */}
        <div className="pt-2 pb-2 space-y-1">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-600" />
            V. Lost & Found Property Custody Log ({report.lost_found_data.length})
          </h2>

          <table className="w-full border-collapse border border-slate-300 text-[10px] text-left">
            <thead className="bg-slate-100 font-bold uppercase text-slate-700">
              <tr>
                <th className="border border-slate-300 p-1.5 w-[35%]">Item Description</th>
                <th className="border border-slate-300 p-1.5 w-[25%]">Recovered Location</th>
                <th className="border border-slate-300 p-1.5 w-[20%]">Turned In By</th>
                <th className="border border-slate-300 p-1.5 w-[20%]">Claimant / Custody Status</th>
              </tr>
            </thead>
            <tbody>
              {report.lost_found_data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-slate-300 p-2 text-center text-slate-500 italic">
                    NO LOST PROPERTY SURRENDERED OR CLAIMED.
                  </td>
                </tr>
              ) : (
                report.lost_found_data.map((lf, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-1.5 font-bold">{lf.description}</td>
                    <td className="border border-slate-300 p-1.5">{lf.location || 'Market'}</td>
                    <td className="border border-slate-300 p-1.5">{lf.found_by}</td>
                    <td className="border border-slate-300 p-1.5 font-bold text-teal-800">{lf.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 9. Section VII: Turnover Notes & Equipment Custody */}
        <div className="pt-2 pb-2 space-y-1">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-700" />
            VI. Post Turnover & Equipment Custody Notes
          </h2>
          <div className="border border-slate-300 bg-slate-50/50 p-2.5 rounded text-[10.5px] leading-relaxed text-slate-800 whitespace-pre-line min-h-[38px]">
            {report.turnover_notes ||
              'Properly accounted for and turned over all entrance gate keys, master security padlocks, handheld two-way radios, and peace & order logbook in good operational condition to incoming duty shift.'}
          </div>
        </div>

        {/* 10. Section VIII: Tri-Level Certification & Signatures */}
        <div className="avoid-break pt-6 border-t-2 border-slate-900 mt-4">
          <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500 text-center mb-5">
            CERTIFICATION OF OFFICIAL RECORD • MUNICIPAL ECONOMIC ENTERPRISE DEVELOPMENT OFFICE
          </p>

          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Prepared by:</span>
              <div className="border-b border-slate-900 pb-1 mt-4">
                <p className="font-black text-slate-900 text-xs uppercase">{report.prep_name}</p>
              </div>
              <p className="text-[10px] text-slate-600 font-semibold">{report.prep_title || 'Market Guard-on-Duty'}</p>
              <p className="text-[9px] text-slate-400 font-mono">Duty Shift Officer</p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Verified by:</span>
              <div className="border-b border-slate-900 pb-1 mt-4">
                <p className="font-black text-slate-900 text-xs uppercase">{report.ver_name || 'CSU Supervisor'}</p>
              </div>
              <p className="text-[10px] text-slate-600 font-semibold">{report.ver_title || 'Chief Security Officer'}</p>
              <p className="text-[9px] text-slate-400 font-mono">Supervisory Verification</p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Approved by:</span>
              <div className="border-b border-slate-900 pb-1 mt-4">
                <p className="font-black text-slate-900 text-xs uppercase">{report.app_name || 'Marife V. Cachuela'}</p>
              </div>
              <p className="text-[10px] text-slate-600 font-semibold">{report.app_title || 'MEEDO Department Head'}</p>
              <p className="text-[9px] text-slate-400 font-mono">Head of Office</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
