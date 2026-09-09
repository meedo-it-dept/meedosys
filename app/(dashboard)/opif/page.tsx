'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { OpifIndicator } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { BarChart3, Plus, Trash2, Printer, Download, Save, CheckCircle2 } from 'lucide-react';

export default function OpifScorecardPage() {
  const { opifIndicators, updateOpifIndicator, addOpifIndicator, deleteOpifIndicator } = useMeedo();

  const [activeSection, setActiveSection] = useState<'ALL' | 'A' | 'B' | 'C' | 'D' | 'E'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSection, setNewSection] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [mfo, setMfo] = useState('');
  const [indicator, setIndicator] = useState('');
  const [annualTarget, setAnnualTarget] = useState('100');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const sections = [
    { id: 'ALL', label: 'All Divisions' },
    { id: 'A', label: 'Section A: Market' },
    { id: 'B', label: 'Section B: Slaughterhouse' },
    { id: 'C', label: 'Section C: Cemetery' },
    { id: 'D', label: 'Section D: Transport' },
    { id: 'E', label: 'Section E: Admin Services' },
  ];

  const filteredIndicators = opifIndicators.filter(
    (item) => activeSection === 'ALL' || item.section === activeSection
  );

  const handleAddIndicator = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: OpifIndicator = {
      id: 'opif_' + Date.now(),
      section: newSection,
      major_final_output: mfo,
      performance_indicator: indicator,
      annual_target: annualTarget,
      actual_annual: '0',
      semi_annual_target: String(Math.round(parseFloat(annualTarget) / 2) || 0),
      q1_target: String(Math.round(parseFloat(annualTarget) / 4) || 0),
      q1_actual: '0',
      q1_percent: '0%',
      q2_target: String(Math.round(parseFloat(annualTarget) / 4) || 0),
      q2_actual: '0',
      q2_percent: '0%',
      q3_target: String(Math.round(parseFloat(annualTarget) / 4) || 0),
      q3_actual: '0',
      q3_percent: '0%',
      q4_target: String(Math.round(parseFloat(annualTarget) / 4) || 0),
      q4_actual: '0',
      q4_percent: '0%',
      year: new Date().getFullYear(),
    };

    addOpifIndicator(newRecord);
    setIsModalOpen(false);
    setMfo('');
    setIndicator('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleInlineChange = (id: string, field: keyof OpifIndicator, value: string) => {
    updateOpifIndicator(id, { [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            OPIF Performance Indicator Scorecard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organizational Performance Indicator Framework • DBM/LGU quarterly target vs. accomplishment tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add KPI Indicator
          </Button>
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" /> Print Scorecard
          </Button>
        </div>
      </div>

      {/* Division Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs no-print">
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSection === sec.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Performance indicator updated and saved!
        </div>
      )}

      {/* OPIF Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 border-r border-slate-700 w-16">Sec</th>
                <th className="py-3 px-3 border-r border-slate-700 min-w-44">Major Final Output</th>
                <th className="py-3 px-3 border-r border-slate-700 min-w-56">Performance Indicator</th>
                <th className="py-3 px-2 border-r border-slate-700 text-center w-16">Target</th>
                <th className="py-3 px-2 border-r border-slate-700 text-center w-16">Actual</th>
                <th className="py-3 px-2 border-r border-slate-700 text-center w-14">Q1 %</th>
                <th className="py-3 px-2 border-r border-slate-700 text-center w-14">Q2 %</th>
                <th className="py-3 px-2 border-r border-slate-700 text-center w-14">Q3 %</th>
                <th className="py-3 px-2 border-r border-slate-700 text-center w-14">Q4 %</th>
                <th className="py-3 px-2 text-center w-10 no-print"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIndicators.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-black text-blue-700 border-r border-slate-100">
                    Sec {item.section}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 border-r border-slate-100">
                    {item.major_final_output}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                    {item.performance_indicator}
                  </td>
                  <td className="py-2 px-2 text-center font-bold border-r border-slate-100">
                    <input
                      type="text"
                      value={item.annual_target}
                      onChange={(e) => item.id && handleInlineChange(item.id, 'annual_target', e.target.value)}
                      className="w-14 text-center py-1 border border-slate-200 rounded text-xs font-bold"
                    />
                  </td>
                  <td className="py-2 px-2 text-center font-bold border-r border-slate-100">
                    <input
                      type="text"
                      value={item.actual_annual || ''}
                      onChange={(e) => item.id && handleInlineChange(item.id, 'actual_annual', e.target.value)}
                      className="w-14 text-center py-1 border border-slate-200 rounded text-xs font-bold text-blue-600"
                    />
                  </td>
                  <td className="py-2 px-2 text-center font-semibold text-emerald-700 border-r border-slate-100">
                    {item.q1_percent || '—'}
                  </td>
                  <td className="py-2 px-2 text-center font-semibold text-emerald-700 border-r border-slate-100">
                    {item.q2_percent || '—'}
                  </td>
                  <td className="py-2 px-2 text-center font-semibold text-emerald-700 border-r border-slate-100">
                    {item.q3_percent || '—'}
                  </td>
                  <td className="py-2 px-2 text-center font-semibold text-emerald-700 border-r border-slate-100">
                    {item.q4_percent || '—'}
                  </td>
                  <td className="py-2 px-2 text-center no-print">
                    <button
                      onClick={() => item.id && deleteOpifIndicator(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete indicator"
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

      {/* Add Indicator Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add OPIF Indicator">
        <form onSubmit={handleAddIndicator} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1">Enterprise Division / Section</label>
            <select
              value={newSection}
              onChange={(e) => setNewSection(e.target.value as any)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="A">Section A: Market Management</option>
              <option value="B">Section B: Slaughterhouse</option>
              <option value="C">Section C: Cemetery Management</option>
              <option value="D">Section D: Transport Terminal</option>
              <option value="E">Section E: Administration Services</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Major Final Output (MFO)</label>
            <input
              type="text"
              required
              value={mfo}
              onChange={(e) => setMfo(e.target.value)}
              placeholder="e.g. Market Operations & Sanitation"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block mb-1">Performance Indicator Description</label>
            <input
              type="text"
              required
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              placeholder="e.g. No. of stalls inspected once a week"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block mb-1">Annual Target Quantity</label>
            <input
              type="text"
              required
              value={annualTarget}
              onChange={(e) => setAnnualTarget(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Indicator
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
