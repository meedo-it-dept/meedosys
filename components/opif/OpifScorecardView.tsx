'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMeedo } from '@/lib/store';
import { OpifIndicator } from '@/lib/types';
import {
  Printer,
  Shield,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Calendar,
  Pencil,
  X,
  Save,
  FileEdit,
  Sparkles,
} from 'lucide-react';

const sectionNames: Record<string, string> = {
  'A': 'A. MARKET MANAGEMENT',
  'B': 'B. SLAUGHTER HOUSE MANAGEMENT',
  'C': 'C. CEMETERY MANAGEMENT',
  'D': 'D. TRANSPORT TERMINAL MANAGEMENT',
  'E': 'E. ADMINISTRATIVE SERVICES',
  'F': 'F. SECURITY & CSG SERVICES',
};

export type OpifSectionKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const sectionOrder: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];

export interface OpifScorecardViewProps {
  forcedSection?: 'A' | 'B' | 'C' | 'D' | 'E';
  pageTitle?: string;
}

interface OpifFormData {
  id?: string;
  section: OpifSectionKey;
  col3: string;
  col4: string;
  col5: string;
  col6: string;
  col7: string;
  actual: string;
  semi: string;
  q1t: string;
  q1a: string;
  q1p: string;
  q2t: string;
  q2a: string;
  q2p: string;
  q3t: string;
  q3a: string;
  q3p: string;
  q4t: string;
  q4a: string;
  q4p: string;
}

const defaultFormData: OpifFormData = {
  section: 'A',
  col3: '',
  col4: '',
  col5: '',
  col6: '',
  col7: '0',
  actual: '0',
  semi: '0',
  q1t: '0',
  q1a: '0',
  q1p: '0%',
  q2t: '0',
  q2a: '0',
  q2p: '0%',
  q3t: '0',
  q3a: '0',
  q3p: '0%',
  q4t: '0',
  q4a: '0',
  q4p: '0%',
};

export default function OpifScorecardView({ forcedSection, pageTitle }: OpifScorecardViewProps) {
  const searchParams = useSearchParams();
  const querySection = searchParams.get('section') as 'A' | 'B' | 'C' | 'D' | 'E' | null;

  const {
    currentUser,
    opifIndicators,
    updateOpifIndicator,
    addOpifIndicator,
    deleteOpifIndicator,
    resetOpifIndicators,
  } = useMeedo();

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.section === 'ALL';
  const isDepartmentStaff = !isAdmin && currentUser?.section && ['A', 'B', 'C', 'D', 'E'].includes(currentUser.section);

  // Editable Year state with persistence
  const [opifYear, setOpifYear] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('meedo_opif_year') || '2025';
    }
    return '2025';
  });

  const handleYearChange = (newYear: string) => {
    const cleanYear = newYear.trim();
    setOpifYear(cleanYear);
    if (typeof window !== 'undefined') {
      localStorage.setItem('meedo_opif_year', cleanYear);
    }
  };

  // Determine initial active section:
  const computeInitialSection = (): 'ALL' | 'A' | 'B' | 'C' | 'D' | 'E' => {
    if (forcedSection) return forcedSection;
    if (isDepartmentStaff && currentUser?.section) {
      return currentUser.section as 'A' | 'B' | 'C' | 'D' | 'E';
    }
    if (querySection && ['A', 'B', 'C', 'D', 'E'].includes(querySection)) {
      return querySection;
    }
    return 'ALL';
  };

  const [activeSection, setActiveSection] = useState<'ALL' | 'A' | 'B' | 'C' | 'D' | 'E'>(computeInitialSection);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data Input Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OpifFormData>(defaultFormData);

  useEffect(() => {
    if (forcedSection) {
      setActiveSection(forcedSection);
    } else if (isDepartmentStaff && currentUser?.section) {
      setActiveSection(currentUser.section as 'A' | 'B' | 'C' | 'D' | 'E');
    } else if (querySection && ['A', 'B', 'C', 'D', 'E'].includes(querySection)) {
      setActiveSection(querySection);
    }
  }, [forcedSection, isDepartmentStaff, currentUser, querySection]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetTemplate = () => {
    if (confirm(`Reset all OPIF indicator data to the official government template? Any custom edits will be replaced.`)) {
      resetOpifIndicators();
      showToast(`OPIF scorecard reset to official ${opifYear} template.`);
    }
  };

  // Open Modal for adding a new row
  const openAddModal = (sectionKey?: OpifSectionKey) => {
    const targetSection = sectionKey || (activeSection !== 'ALL' ? activeSection : 'A');
    setEditingRowId(null);
    setFormData({
      ...defaultFormData,
      section: targetSection,
      col3: '',
      col4: '',
      col5: '',
      col6: '',
      col7: '',
      actual: '',
      semi: '',
      q1t: '', q1a: '', q1p: '',
      q2t: '', q2a: '', q2p: '',
      q3t: '', q3a: '', q3p: '',
      q4t: '', q4a: '', q4p: '',
    });
    setShowModal(true);
  };

  // Open Modal for editing an existing row
  const openEditModal = (row: OpifIndicator) => {
    setEditingRowId(row.id || null);
    setFormData({
      id: row.id,
      section: row.section,
      col3: row.col3 || '',
      col4: row.col4 || '',
      col5: row.col5 || '',
      col6: row.col6 || '',
      col7: row.col7 || '',
      actual: row.actual || '',
      semi: row.semi || '',
      q1t: row.q1t || '', q1a: row.q1a || '', q1p: row.q1p || '',
      q2t: row.q2t || '', q2a: row.q2a || '', q2p: row.q2p || '',
      q3t: row.q3t || '', q3a: row.q3a || '', q3p: row.q3p || '',
      q4t: row.q4t || '', q4a: row.q4a || '', q4p: row.q4p || '',
    });
    setShowModal(true);
  };

  // Quick add blank row directly to table
  const handleAddBlankRow = (sectionKey: OpifSectionKey) => {
    const yearNum = parseInt(opifYear) || 2025;
    const newRow: OpifIndicator = {
      id: 'opif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      section: sectionKey,
      col3: 'General Operations',
      col4: 'Service Delivery',
      col5: 'Regular Activities',
      col6: 'Key Indicator',
      col7: '0',
      actual: '0',
      semi: '0',
      q1t: '0', q1a: '0', q1p: '0%',
      q2t: '0', q2a: '0', q2p: '0%',
      q3t: '0', q3a: '0', q3p: '0%',
      q4t: '0', q4a: '0', q4p: '0%',
      major_final_output: 'Service Delivery',
      performance_indicator: 'Key Indicator',
      annual_target: '0',
      year: yearNum,
    };
    addOpifIndicator(newRow);
    showToast(`New row added to ${sectionNames[sectionKey]}. Click any cell to edit.`);
  };

  // Update form field with automatic % accomplishment calculation
  const updateFormField = (field: keyof OpifFormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      const calcPct = (t: string, a: string) => {
        const tNum = parseFloat(t.replace(/,/g, ''));
        const aNum = parseFloat(a.replace(/,/g, ''));
        if (!isNaN(tNum) && !isNaN(aNum) && tNum > 0) {
          return Math.round((aNum / tNum) * 100) + '%';
        }
        return '';
      };

      if (field === 'q1t' || field === 'q1a') {
        const p = calcPct(next.q1t, next.q1a);
        if (p) next.q1p = p;
      }
      if (field === 'q2t' || field === 'q2a') {
        const p = calcPct(next.q2t, next.q2a);
        if (p) next.q2p = p;
      }
      if (field === 'q3t' || field === 'q3a') {
        const p = calcPct(next.q3t, next.q3a);
        if (p) next.q3p = p;
      }
      if (field === 'q4t' || field === 'q4a') {
        const p = calcPct(next.q4t, next.q4a);
        if (p) next.q4p = p;
      }
      return next;
    });
  };

  // Save Modal Data (Add or Edit)
  const handleSaveFormData = (e: React.FormEvent) => {
    e.preventDefault();
    const yearNum = parseInt(opifYear) || 2025;

    if (editingRowId) {
      updateOpifIndicator(editingRowId, {
        ...formData,
        major_final_output: formData.col4,
        performance_indicator: formData.col6,
        annual_target: formData.col7,
        actual_annual: formData.actual,
        semi_annual_target: formData.semi,
        year: yearNum,
      });
      showToast(`Indicator updated successfully.`);
    } else {
      const newIndicator: OpifIndicator = {
        id: 'opif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        ...formData,
        major_final_output: formData.col4,
        performance_indicator: formData.col6,
        annual_target: formData.col7,
        actual_annual: formData.actual,
        semi_annual_target: formData.semi,
        year: yearNum,
      };
      addOpifIndicator(newIndicator);
      showToast(`New indicator row added to ${sectionNames[formData.section]}.`);
    }
    setShowModal(false);
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('Are you sure you want to delete this indicator row?')) {
      deleteOpifIndicator(id);
      showToast('Indicator row deleted.');
    }
  };

  const handleCellBlur = (id: string, field: keyof OpifIndicator, newValue: string) => {
    const trimmed = newValue.trim();
    const row = opifIndicators.find((r) => r.id === id);
    if (!row) return;

    if (row[field] === trimmed) return;

    const updates: Partial<OpifIndicator> = { [field]: trimmed };

    if (field === 'col4') updates.major_final_output = trimmed;
    if (field === 'col6') updates.performance_indicator = trimmed;
    if (field === 'col7') updates.annual_target = trimmed;
    if (field === 'actual') updates.actual_annual = trimmed;
    if (field === 'semi') updates.semi_annual_target = trimmed;

    // Auto calculate % accomp if editing target or actual
    const checkQuarter = (
      targetKey: keyof OpifIndicator,
      actualKey: keyof OpifIndicator,
      percentKey: 'q1p' | 'q2p' | 'q3p' | 'q4p'
    ) => {
      const tVal = field === targetKey ? trimmed : (row[targetKey] as string | undefined);
      const aVal = field === actualKey ? trimmed : (row[actualKey] as string | undefined);
      if (tVal !== undefined && aVal !== undefined && tVal !== '' && aVal !== '') {
        const tNum = parseFloat(tVal.replace(/,/g, ''));
        const aNum = parseFloat(aVal.replace(/,/g, ''));
        if (!isNaN(tNum) && !isNaN(aNum) && tNum > 0) {
          updates[percentKey] = Math.round((aNum / tNum) * 100) + '%';
        }
      }
    };

    if (field === 'q1t' || field === 'q1a') checkQuarter('q1t', 'q1a', 'q1p');
    if (field === 'q2t' || field === 'q2a') checkQuarter('q2t', 'q2a', 'q2p');
    if (field === 'q3t' || field === 'q3a') checkQuarter('q3t', 'q3a', 'q3p');
    if (field === 'q4t' || field === 'q4a') checkQuarter('q4t', 'q4a', 'q4p');

    updateOpifIndicator(id, updates);
  };

  const isSectionLocked = isDepartmentStaff || (Boolean(forcedSection) && !isAdmin);

  // Allow editing for all authorized officers, department staff, and admin
  const canEdit = true;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-lg bg-emerald-700 text-white text-xs font-semibold shadow-lg flex items-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* Admin / Department Controls */}
      <div
        id="opifControls"
        className="print-hide p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Viewing As:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                isAdmin
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}
            >
              {currentUser ? `${currentUser.role} (${currentUser.section})` : 'Authorized Officer'}
            </span>
          </div>

          {/* Year Quick Selector */}
          <div className="flex items-center gap-1.5 font-bold text-slate-800 ml-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Reporting Year:</span>
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5 shadow-xs">
              {['2024', '2025', '2026', '2027'].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleYearChange(yr)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                    opifYear === yr
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {yr}
                </button>
              ))}
              <input
                type="text"
                value={opifYear}
                onChange={(e) => handleYearChange(e.target.value)}
                placeholder="Custom..."
                className="w-16 px-1.5 py-0.5 text-xs font-bold text-center border-l border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                title="Type any custom year"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-slate-800 ml-1">
            <span>Visible Section:</span>
            {isSectionLocked ? (
              <div className="inline-flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>
                  {activeSection !== 'ALL' ? sectionNames[activeSection] : 'All Sections'}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">(Department Scoped)</span>
              </div>
            ) : (
              <select
                id="opifSectionSelect"
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value as any)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Sections (Admin View)</option>
                <option value="A">Section A: Market Mgmt</option>
                <option value="B">Section B: Slaughter House</option>
                <option value="C">Section C: Cemetery</option>
                <option value="D">Section D: Transport Terminal</option>
                <option value="E">Section E: Admin Services</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Row Button in Controls Bar */}
          <button
            onClick={() => openAddModal(activeSection !== 'ALL' ? activeSection : 'A')}
            className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs inline-flex items-center gap-1.5 transition"
            title="Open form to add an indicator row"
          >
            <Plus className="w-4 h-4" /> Add Indicator Row
          </button>

          {isAdmin && (
            <button
              onClick={handleResetTemplate}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs inline-flex items-center gap-1.5 transition"
              title="Reset all rows to official government template"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset Template
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs inline-flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print OPIF
          </button>
        </div>
      </div>

      {/* Main OPIF Document Container (White Paper / Official Government Format) */}
      <div className="opif-wrapper rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 bg-white overflow-x-auto">
        {/* Document Header */}
        <div className="document-header">
          {/* Editable OPIF Title */}
          <div className="opif-title flex items-center justify-center gap-1.5 flex-wrap">
            <span>Organizational Performance Indicator Framework (OPIF) -</span>
            <input
              type="text"
              value={opifYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-16 sm:w-20 text-center font-bold text-inherit bg-transparent border-none underline focus:outline-none focus:bg-blue-50/60 rounded transition-colors cursor-text p-0 m-0"
              title="Click to edit year"
              placeholder="2025"
            />
          </div>

          <table className="info-table">
            <tbody>
              <tr>
                <td className="info-label">Name of Department:</td>
                <td className="bold">
                  {activeSection !== 'ALL'
                    ? `Municipal Economic Enterprise - ${sectionNames[activeSection] || 'Department'}`
                    : 'Municipal Economic Enterprise'}
                </td>
              </tr>
              <tr>
                <td className="info-label">Legal Mandate:</td>
                <td className="bold">RA 7160</td>
              </tr>
              <tr>
                <td className="info-label">Societal Goals:</td>
                <td></td>
              </tr>
              <tr>
                <td className="info-label">Sectoral Outcome:</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Official 21-Column Three-Tier Table */}
        <table className="opif-table">
          <thead className="print-single-header">
            <tr>
              <th rowSpan={3}>Organizational Outcome (3)</th>
              <th rowSpan={3}>Service Area (4)</th>
              <th rowSpan={3}>Strategic Priorities/Core &amp; Support Functions (5)</th>
              <th rowSpan={3}>Major Final Output (6)</th>
              <th rowSpan={3}>Programs/Projects/Activities (7)</th>
              <th rowSpan={3}>Performance Indicator (8)</th>
              <th rowSpan={3}>Annual Target (9)</th>
              <th rowSpan={3}>Actual (latest data)</th>
              <th rowSpan={3}>Semi-Annual Physical Targets</th>
              <th colSpan={12}>PHYSICAL TARGETS/ACCOMPLISHMENTS</th>
              <th rowSpan={3} className="print-hide">Actions</th>
            </tr>
            <tr>
              <th colSpan={3}>1st QTR</th>
              <th colSpan={3}>2nd QTR</th>
              <th colSpan={3}>3rd QTR</th>
              <th colSpan={3}>4th QTR</th>
            </tr>
            <tr className="sub-header">
              <th>Target</th><th>Accomp</th><th>% Accomp</th>
              <th>Target</th><th>Accomp</th><th>% Accomp</th>
              <th>Target</th><th>Accomp</th><th>% Accomp</th>
              <th>Target</th><th>Accomp</th><th>% Accomp</th>
            </tr>
          </thead>

          <tbody id="opifDynamicBody">
            {sectionOrder.map((secKey) => {
              if (activeSection !== 'ALL' && activeSection !== secKey) return null;

              const secRows = opifIndicators.filter((r) => r.section === secKey);

              // If section has no rows, render an Add Row banner
              if (secRows.length === 0) {
                return (
                  <tr key={`empty_${secKey}`} className="print-hide">
                    <td colSpan={22} className="p-4 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-300">
                      <span>No indicators recorded for {sectionNames[secKey]}.</span>
                      <button
                        onClick={() => openAddModal(secKey)}
                        className="ml-3 inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add First Row
                      </button>
                    </td>
                  </tr>
                );
              }

              // Pre-calculate spans dynamically matching legacy algorithm
              const processedRows = secRows.map((r) => ({
                ...r,
                spanCol3: 0,
                spanCol4: 0,
                spanCol5: 0,
              }));

              for (let i = 0; i < processedRows.length; i++) {
                // Col3 Span
                if (i === 0 || processedRows[i].col3 !== processedRows[i - 1].col3) {
                  let span = 1;
                  for (let j = i + 1; j < processedRows.length; j++) {
                    if (processedRows[j].col3 === processedRows[i].col3) span++;
                    else break;
                  }
                  processedRows[i].spanCol3 = span;
                } else {
                  processedRows[i].spanCol3 = 0;
                }

                // Col4 Span
                if (
                  i === 0 ||
                  processedRows[i].col4 !== processedRows[i - 1].col4 ||
                  (processedRows[i].spanCol3 ?? 0) > 0
                ) {
                  let span = 1;
                  for (let j = i + 1; j < processedRows.length; j++) {
                    if (
                      processedRows[j].col4 === processedRows[i].col4 &&
                      processedRows[j].col3 === processedRows[i].col3
                    )
                      span++;
                    else break;
                  }
                  processedRows[i].spanCol4 = span;
                } else {
                  processedRows[i].spanCol4 = 0;
                }

                // Col5 Span
                if (
                  i === 0 ||
                  processedRows[i].col5 !== processedRows[i - 1].col5 ||
                  (processedRows[i].spanCol4 ?? 0) > 0
                ) {
                  let span = 1;
                  for (let j = i + 1; j < processedRows.length; j++) {
                    if (
                      processedRows[j].col5 === processedRows[i].col5 &&
                      processedRows[j].col4 === processedRows[i].col4 &&
                      processedRows[j].col3 === processedRows[i].col3
                    )
                      span++;
                    else break;
                  }
                  processedRows[i].spanCol5 = span;
                } else {
                  processedRows[i].spanCol5 = 0;
                }
              }

              return (
                <React.Fragment key={secKey}>
                  {processedRows.map((row, i) => {
                    return (
                      <tr key={row.id || `${secKey}_${i}`} className="hover:bg-blue-50/20 transition-colors">
                        {/* Section Title (Rowspan across all items in this section) */}
                        {i === 0 && (
                          <>
                            <td rowSpan={processedRows.length} className="text-left align-top bold bg-slate-50/50">
                              {sectionNames[secKey]}
                            </td>
                            <td rowSpan={processedRows.length} className="bg-slate-50/50"></td>
                          </>
                        )}

                        {/* Strategic Priorities (Col 3 with dynamic rowspan) */}
                        {row.spanCol3 > 0 && (
                          <td
                            rowSpan={row.spanCol3}
                            className="text-left align-top opif-editable-cell"
                            contentEditable={canEdit}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleCellBlur(row.id!, 'col3', e.currentTarget.textContent || '')
                            }
                            title="Click to edit Strategic Priority"
                          >
                            {row.col3 || ''}
                          </td>
                        )}

                        {/* Major Final Output (Col 4 with dynamic rowspan) */}
                        {row.spanCol4 > 0 && (
                          <td
                            rowSpan={row.spanCol4}
                            className="text-left align-top opif-editable-cell"
                            contentEditable={canEdit}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleCellBlur(row.id!, 'col4', e.currentTarget.textContent || '')
                            }
                            title="Click to edit Major Final Output"
                          >
                            {row.col4 || ''}
                          </td>
                        )}

                        {/* Programs/Projects/Activities (Col 5 with dynamic rowspan) */}
                        {row.spanCol5 > 0 && (
                          <td
                            rowSpan={row.spanCol5}
                            className="text-left align-top opif-editable-cell"
                            contentEditable={canEdit}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleCellBlur(row.id!, 'col5', e.currentTarget.textContent || '')
                            }
                            title="Click to edit PPA"
                          >
                            {row.col5 || ''}
                          </td>
                        )}

                        {/* Performance Indicator (Col 6) */}
                        <td
                          className="text-left align-top opif-editable-cell"
                          contentEditable={canEdit}
                          suppressContentEditableWarning={true}
                          onBlur={(e) =>
                            handleCellBlur(row.id!, 'col6', e.currentTarget.textContent || '')
                          }
                          title="Click to edit Performance Indicator"
                        >
                          {row.col6 || ''}
                        </td>

                        {/* Annual Target (Col 7) */}
                        <td
                          className="text-center align-top opif-editable-cell font-semibold"
                          contentEditable={canEdit}
                          suppressContentEditableWarning={true}
                          onBlur={(e) =>
                            handleCellBlur(row.id!, 'col7', e.currentTarget.textContent || '')
                          }
                          title="Click to edit Annual Target"
                        >
                          {row.col7 || ''}
                        </td>

                        {/* Actual (latest data) */}
                        <td
                          className="text-center align-top opif-editable-cell font-bold text-blue-900"
                          contentEditable={canEdit}
                          suppressContentEditableWarning={true}
                          onBlur={(e) =>
                            handleCellBlur(row.id!, 'actual', e.currentTarget.textContent || '')
                          }
                          title="Click to edit Actual (latest data)"
                        >
                          {row.actual || ''}
                        </td>

                        {/* Semi-Annual Physical Targets */}
                        <td
                          className="text-center align-top opif-editable-cell"
                          contentEditable={canEdit}
                          suppressContentEditableWarning={true}
                          onBlur={(e) =>
                            handleCellBlur(row.id!, 'semi', e.currentTarget.textContent || '')
                          }
                          title="Click to edit Semi-Annual Target"
                        >
                          {row.semi || ''}
                        </td>

                        {/* Physical Targets / Accomplishments by Quarter */}
                        {row.specialSpan ? (
                          <>
                            <td
                              className="text-center align-top opif-editable-cell"
                              contentEditable={canEdit}
                              suppressContentEditableWarning={true}
                              onBlur={(e) =>
                                handleCellBlur(row.id!, 'q1t', e.currentTarget.textContent || '')
                              }
                            >
                              {row.q1t || ''}
                            </td>
                            <td
                              className="text-center align-top opif-editable-cell"
                              contentEditable={canEdit}
                              suppressContentEditableWarning={true}
                              onBlur={(e) =>
                                handleCellBlur(row.id!, 'q1a', e.currentTarget.textContent || '')
                              }
                            >
                              {row.q1a || ''}
                            </td>
                            <td
                              className="bg-yellow text-center align-top opif-editable-cell font-bold"
                              contentEditable={canEdit}
                              suppressContentEditableWarning={true}
                              onBlur={(e) =>
                                handleCellBlur(row.id!, 'q1p', e.currentTarget.textContent || '')
                              }
                            >
                              {row.q1p || ''}
                            </td>
                            <td
                              colSpan={row.specialSpan}
                              className="bg-yellow text-center align-top opif-editable-cell font-semibold"
                              contentEditable={canEdit}
                              suppressContentEditableWarning={true}
                              onBlur={(e) =>
                                handleCellBlur(row.id!, 'specialText', e.currentTarget.textContent || '')
                              }
                            >
                              {row.specialText || ''}
                            </td>
                          </>
                        ) : (
                          (['q1', 'q2', 'q3', 'q4'] as const).map((q) => (
                            <React.Fragment key={q}>
                              <td
                                className="text-center align-top opif-editable-cell"
                                contentEditable={canEdit}
                                suppressContentEditableWarning={true}
                                onBlur={(e) =>
                                  handleCellBlur(row.id!, `${q}t` as keyof OpifIndicator, e.currentTarget.textContent || '')
                                }
                                title={`Q${q[1]} Target`}
                              >
                                {row[`${q}t` as keyof OpifIndicator] || ''}
                              </td>
                              <td
                                className="text-center align-top opif-editable-cell font-semibold"
                                contentEditable={canEdit}
                                suppressContentEditableWarning={true}
                                onBlur={(e) =>
                                  handleCellBlur(row.id!, `${q}a` as keyof OpifIndicator, e.currentTarget.textContent || '')
                                }
                                title={`Q${q[1]} Accomplishment`}
                              >
                                {row[`${q}a` as keyof OpifIndicator] || ''}
                              </td>
                              <td
                                className="bg-yellow text-center align-top opif-editable-cell font-bold"
                                contentEditable={canEdit}
                                suppressContentEditableWarning={true}
                                onBlur={(e) =>
                                  handleCellBlur(row.id!, `${q}p` as keyof OpifIndicator, e.currentTarget.textContent || '')
                                }
                                title={`Q${q[1]} % Accomp (Auto-calculated)`}
                              >
                                {row[`${q}p` as keyof OpifIndicator] || ''}
                              </td>
                            </React.Fragment>
                          ))
                        )}

                        {/* Actions column (print-hide) */}
                        <td className="print-hide text-center" style={{ border: 'none' }}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(row)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                              title="Edit / Input Data for Row"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(row.id!)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Add Row Buttons at the bottom of each Section */}
                  <tr className="print-hide">
                    <td
                      colSpan={22}
                      className="text-center p-2.5 bg-slate-50 border-2 border-dashed border-slate-300"
                    >
                      <div className="flex items-center justify-center gap-2.5 flex-wrap">
                        <button
                          onClick={() => openAddModal(secKey)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                          title="Open structured form to input new indicator data"
                        >
                          <Plus className="w-4 h-4" /> Add Row to {sectionNames[secKey]} (Data Input Form)
                        </button>
                        <button
                          onClick={() => handleAddBlankRow(secKey)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
                          title="Instantly add an editable row directly in table"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-500" /> Quick Blank Row
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Official Signature Table */}
        <table className="signature-table">
          <tbody>
            <tr>
              <td style={{ width: '33.33%' }}>PLAN EVALUATED BY:</td>
              <td style={{ width: '33.33%' }}>RECOMMENDING APPROVAL:</td>
              <td style={{ width: '33.33%' }}>APPROVED BY:</td>
            </tr>
            <tr>
              <td className="bold pt-20">Richard E. Saranillo / MPDO</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td className="pl-20">PMT Technical Secretariat</td>
              <td className="pt-20">Date ________</td>
              <td></td>
            </tr>
            <tr>
              <td className="pt-20">REVIEWED BY:</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td className="bold pl-20">Richard E. Saranillo</td>
              <td className="bold text-center">Richard E.</td>
              <td className="bold underline text-center">REYNALDO F. CONSTANTINO</td>
            </tr>
            <tr>
              <td className="pl-20">MPDO</td>
              <td className="text-center">MPDO</td>
              <td className="text-center">Municipal Mayor</td>
            </tr>
            <tr>
              <td className="pt-20">Date ________</td>
              <td className="pt-20">Date ________</td>
              <td className="pt-20">Date ________</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* OPIF INDICATOR DATA INPUT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {editingRowId ? 'Edit OPIF Indicator & Data Input' : 'Add New OPIF Indicator & Data Input'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Input performance targets, physical accomplishments, and indicator details for {opifYear}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveFormData} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Section Choice */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-800">Target Enterprise Section</label>
                <select
                  value={formData.section}
                  onChange={(e) => updateFormField('section', e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A">Section A: Market Management</option>
                  <option value="B">Section B: Slaughter House Management</option>
                  <option value="C">Section C: Cemetery Management</option>
                  <option value="D">Section D: Transport Terminal Management</option>
                  <option value="E">Section E: Administrative Services</option>
                  <option value="F">Section F: Security & CSG Services</option>
                </select>
              </div>

              {/* Framework Alignment Inputs */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Indicator Framework Alignment
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Strategic Priorities / Core Functions (Col 3)
                    </label>
                    <input
                      type="text"
                      value={formData.col3}
                      onChange={(e) => updateFormField('col3', e.target.value)}
                      placeholder="e.g. Occupancy, Revenue, Sanitation"
                      required
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Major Final Output (Col 4)
                    </label>
                    <input
                      type="text"
                      value={formData.col4}
                      onChange={(e) => updateFormField('col4', e.target.value)}
                      placeholder="e.g. Lease contracts checked, Ante-mortem conducted"
                      required
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Programs / Projects / Activities (Col 5)
                    </label>
                    <input
                      type="text"
                      value={formData.col5}
                      onChange={(e) => updateFormField('col5', e.target.value)}
                      placeholder="e.g. New / Renewal, Regular inspection"
                      required
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Performance Indicator (Col 6)
                    </label>
                    <input
                      type="text"
                      value={formData.col6}
                      onChange={(e) => updateFormField('col6', e.target.value)}
                      placeholder="e.g. No. of stalls monitored, Compliance rate"
                      required
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Annual Targets */}
              <div className="space-y-3 pt-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-900">
                  Annual Targets &amp; Accomplishment
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Annual Target (Col 7)</label>
                    <input
                      type="text"
                      value={formData.col7}
                      onChange={(e) => updateFormField('col7', e.target.value)}
                      placeholder="e.g. 50, 1000"
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white text-center focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Actual (Latest Data)</label>
                    <input
                      type="text"
                      value={formData.actual}
                      onChange={(e) => updateFormField('actual', e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg bg-white text-blue-800 text-center focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Semi-Annual Target</label>
                    <input
                      type="text"
                      value={formData.semi}
                      onChange={(e) => updateFormField('semi', e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-center focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quarterly Targets & Accomplishments */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-900">
                    Quarterly Targets &amp; Accomplishments
                  </h4>
                  <span className="text-[10px] text-slate-500 italic">
                    % Accomp auto-calculates when Target &amp; Accomp are filled
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Q1 */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-extrabold text-slate-800 block text-center border-b border-slate-200 pb-1">
                      1st Quarter
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Target:</span>
                      <input
                        type="text"
                        value={formData.q1t}
                        onChange={(e) => updateFormField('q1t', e.target.value)}
                        placeholder="0"
                        className="w-full text-xs px-2 py-1 border rounded bg-white text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Accomp:</span>
                      <input
                        type="text"
                        value={formData.q1a}
                        onChange={(e) => updateFormField('q1a', e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-semibold px-2 py-1 border rounded bg-white text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">% Accomp:</span>
                      <input
                        type="text"
                        value={formData.q1p}
                        onChange={(e) => updateFormField('q1p', e.target.value)}
                        placeholder="0%"
                        className="w-full text-xs font-bold px-2 py-1 border rounded bg-yellow-50 text-amber-900 text-center"
                      />
                    </div>
                  </div>

                  {/* Q2 */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-extrabold text-slate-800 block text-center border-b border-slate-200 pb-1">
                      2nd Quarter
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Target:</span>
                      <input
                        type="text"
                        value={formData.q2t}
                        onChange={(e) => updateFormField('q2t', e.target.value)}
                        placeholder="0"
                        className="w-full text-xs px-2 py-1 border rounded bg-white text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Accomp:</span>
                      <input
                        type="text"
                        value={formData.q2a}
                        onChange={(e) => updateFormField('q2a', e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-semibold px-2 py-1 border rounded bg-white text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">% Accomp:</span>
                      <input
                        type="text"
                        value={formData.q2p}
                        onChange={(e) => updateFormField('q2p', e.target.value)}
                        placeholder="0%"
                        className="w-full text-xs font-bold px-2 py-1 border rounded bg-yellow-50 text-amber-900 text-center"
                      />
                    </div>
                  </div>

                  {/* Q3 */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-extrabold text-slate-800 block text-center border-b border-slate-200 pb-1">
                      3rd Quarter
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Target:</span>
                      <input
                        type="text"
                        value={formData.q3t}
                        onChange={(e) => updateFormField('q3t', e.target.value)}
                        placeholder="0"
                        className="w-full text-xs px-2 py-1 border rounded bg-white text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Accomp:</span>
                      <input
                        type="text"
                        value={formData.q3a}
                        onChange={(e) => updateFormField('q3a', e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-semibold px-2 py-1 border rounded bg-white text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">% Accomp:</span>
                      <input
                        type="text"
                        value={formData.q3p}
                        onChange={(e) => updateFormField('q3p', e.target.value)}
                        placeholder="0%"
                        className="w-full text-xs font-bold px-2 py-1 border rounded bg-yellow-50 text-amber-900 text-center"
                      />
                    </div>
                  </div>

                  {/* Q4 */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-extrabold text-slate-800 block text-center border-b border-slate-200 pb-1">
                      4th Quarter
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Target:</span>
                      <input
                        type="text"
                        value={formData.q4t}
                        onChange={(e) => updateFormField('q4t', e.target.value)}
                        placeholder="0"
                        className="w-full text-xs px-2 py-1 border rounded bg-white text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Accomp:</span>
                      <input
                        type="text"
                        value={formData.q4a}
                        onChange={(e) => updateFormField('q4a', e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-semibold px-2 py-1 border rounded bg-white text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">% Accomp:</span>
                      <input
                        type="text"
                        value={formData.q4p}
                        onChange={(e) => updateFormField('q4p', e.target.value)}
                        placeholder="0%"
                        className="w-full text-xs font-bold px-2 py-1 border rounded bg-yellow-50 text-amber-900 text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs inline-flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {editingRowId ? 'Save Changes' : 'Add Indicator Row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
