'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMeedo } from '@/lib/store';
import { OpifIndicator } from '@/lib/types';
import { Printer, Shield, RotateCcw, Plus, Trash2, CheckCircle2, Lock } from 'lucide-react';

const sectionNames: Record<string, string> = {
  'A': 'A. MARKET MANAGEMENT',
  'B': 'B. SLAUGHTER HOUSE MANAGEMENT',
  'C': 'C. CEMETERY MANAGEMENT',
  'D': 'D. TRANSPORT TERMINAL MANAGEMENT',
  'E': 'E. ADMINISTRATIVE SERVICES',
};

const sectionOrder: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];

export interface OpifScorecardViewProps {
  forcedSection?: 'A' | 'B' | 'C' | 'D' | 'E';
  pageTitle?: string;
}

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

  // Determine initial active section:
  // 1. forcedSection (if embedded into /market/opif etc.)
  // 2. if staff user, lock to their assigned section
  // 3. if query param exists
  // 4. if admin, default to 'ALL'
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
    if (confirm('Reset all OPIF indicator data to the official government template? Any custom edits will be replaced.')) {
      resetOpifIndicators();
      showToast('OPIF scorecard reset to official 2025 template.');
    }
  };

  const handleAddRow = (sectionKey: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const newRow: OpifIndicator = {
      id: 'opif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      section: sectionKey,
      col3: '[New Entry]',
      col4: '[New Entry]',
      col5: '[New Entry]',
      col6: '',
      col7: '0',
      actual: '0',
      semi: '0',
      q1t: '0', q1a: '0', q1p: '0%',
      q2t: '0', q2a: '0', q2p: '0%',
      q3t: '0', q3a: '0', q3p: '0%',
      q4t: '0', q4a: '0', q4p: '0%',
      major_final_output: '[New Entry]',
      performance_indicator: '',
      annual_target: '0',
      year: 2025,
    };
    addOpifIndicator(newRow);
    showToast(`New indicator row added to ${sectionNames[sectionKey]}.`);
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

    // Also update compatibility aliases
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

  // Check if dropdown can be changed
  // Staff cannot switch to other departments' OPIF
  const isSectionLocked = isDepartmentStaff || (Boolean(forcedSection) && !isAdmin);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-lg bg-emerald-700 text-white text-xs font-semibold shadow-lg flex items-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* Admin / Department Controls (Exact Replica of Legacy Controls Bar) */}
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
              {currentUser ? `${currentUser.role} (${currentUser.section})` : 'Guest'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-slate-800 ml-2">
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

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleResetTemplate}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs inline-flex items-center gap-1.5 transition"
              title="Reset all rows to official 2025 government template"
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
          <div className="opif-title">
            Organizational Performance Indicator Framework (OPIF) - 2025
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
              {(isAdmin || isDepartmentStaff) && <th rowSpan={3} className="print-hide">Actions</th>}
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
              // Strict Section Isolation:
              // If activeSection is specific (e.g. 'A'), skip other sections entirely!
              if (activeSection !== 'ALL' && activeSection !== secKey) return null;

              const secRows = opifIndicators.filter((r) => r.section === secKey);
              if (secRows.length === 0) return null;

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

              const canEditThisSection = isAdmin || currentUser?.section === secKey;

              return (
                <React.Fragment key={secKey}>
                  {processedRows.map((row, i) => {
                    const canEditActual = canEditThisSection || !currentUser;
                    const canEditTarget = isAdmin;

                    return (
                      <tr key={row.id || `${secKey}_${i}`}>
                        {/* Section Title (Rowspan across all items in this section) */}
                        {i === 0 && (
                          <>
                            <td rowSpan={processedRows.length} className="text-left align-top bold">
                              {sectionNames[secKey]}
                            </td>
                            <td rowSpan={processedRows.length}></td>
                          </>
                        )}

                        {/* Strategic Priorities (Col 3 with dynamic rowspan) */}
                        {row.spanCol3 > 0 && (
                          <td
                            rowSpan={row.spanCol3}
                            className="text-left align-top opif-editable-cell"
                            contentEditable={canEditTarget}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleCellBlur(row.id!, 'col3', e.currentTarget.textContent || '')
                            }
                          >
                            {row.col3 || ''}
                          </td>
                        )}

                        {/* Major Final Output (Col 4 with dynamic rowspan) */}
                        {row.spanCol4 > 0 && (
                          <td
                            rowSpan={row.spanCol4}
                            className="text-left align-top opif-editable-cell"
                            contentEditable={canEditTarget}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleCellBlur(row.id!, 'col4', e.currentTarget.textContent || '')
                            }
                          >
                            {row.col4 || ''}
                          </td>
                        )}

                        {/* Programs/Projects/Activities (Col 5 with dynamic rowspan) */}
                        {row.spanCol5 > 0 && (
                          <td
                            rowSpan={row.spanCol5}
                            className="text-left align-top opif-editable-cell"
                            contentEditable={canEditTarget}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleCellBlur(row.id!, 'col5', e.currentTarget.textContent || '')
                            }
                          >
                            {row.col5 || ''}
                          </td>
                        )}

                        {/* Performance Indicator (Col 6) */}
                        <td
                          className="text-left align-top opif-editable-cell"
                          contentEditable={canEditTarget}
                          suppressContentEditableWarning={true}
                          onBlur={(e) =>
                            handleCellBlur(row.id!, 'col6', e.currentTarget.textContent || '')
                          }
                        >
                          {row.col6 || ''}
                        </td>

                        {/* Annual Target (Col 7) */}
                        <td
                          className="text-center align-top opif-editable-cell"
                          contentEditable={canEditTarget}
                          suppressContentEditableWarning={true}
                          onBlur={(e) =>
                            handleCellBlur(row.id!, 'col7', e.currentTarget.textContent || '')
                          }
                        >
                          {row.col7 || ''}
                        </td>

                        {/* Actual (latest data) */}
                        <td
                          className="text-center align-top opif-editable-cell"
                          contentEditable={canEditActual}
                          suppressContentEditableWarning={true}
                          onBlur={(e) =>
                            handleCellBlur(row.id!, 'actual', e.currentTarget.textContent || '')
                          }
                        >
                          {row.actual || ''}
                        </td>

                        {/* Semi-Annual Physical Targets */}
                        <td
                          className="text-center align-top opif-editable-cell"
                          contentEditable={canEditTarget}
                          suppressContentEditableWarning={true}
                          onBlur={(e) =>
                            handleCellBlur(row.id!, 'semi', e.currentTarget.textContent || '')
                          }
                        >
                          {row.semi || ''}
                        </td>

                        {/* Physical Targets / Accomplishments by Quarter */}
                        {row.specialSpan ? (
                          <>
                            <td
                              className="text-center align-top opif-editable-cell"
                              contentEditable={canEditTarget}
                              suppressContentEditableWarning={true}
                              onBlur={(e) =>
                                handleCellBlur(row.id!, 'q1t', e.currentTarget.textContent || '')
                              }
                            >
                              {row.q1t || ''}
                            </td>
                            <td
                              className="text-center align-top opif-editable-cell"
                              contentEditable={canEditActual}
                              suppressContentEditableWarning={true}
                              onBlur={(e) =>
                                handleCellBlur(row.id!, 'q1a', e.currentTarget.textContent || '')
                              }
                            >
                              {row.q1a || ''}
                            </td>
                            <td
                              className="bg-yellow text-center align-top opif-editable-cell"
                              contentEditable={canEditTarget}
                              suppressContentEditableWarning={true}
                              onBlur={(e) =>
                                handleCellBlur(row.id!, 'q1p', e.currentTarget.textContent || '')
                              }
                            >
                              {row.q1p || ''}
                            </td>
                            <td
                              colSpan={row.specialSpan}
                              className="bg-yellow text-center align-top opif-editable-cell"
                              contentEditable={canEditTarget}
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
                                contentEditable={canEditTarget}
                                suppressContentEditableWarning={true}
                                onBlur={(e) =>
                                  handleCellBlur(row.id!, `${q}t` as keyof OpifIndicator, e.currentTarget.textContent || '')
                                }
                              >
                                {row[`${q}t` as keyof OpifIndicator] || ''}
                              </td>
                              <td
                                className="text-center align-top opif-editable-cell"
                                contentEditable={canEditActual}
                                suppressContentEditableWarning={true}
                                onBlur={(e) =>
                                  handleCellBlur(row.id!, `${q}a` as keyof OpifIndicator, e.currentTarget.textContent || '')
                                }
                              >
                                {row[`${q}a` as keyof OpifIndicator] || ''}
                              </td>
                              <td
                                className="bg-yellow text-center align-top opif-editable-cell"
                                contentEditable={canEditTarget}
                                suppressContentEditableWarning={true}
                                onBlur={(e) =>
                                  handleCellBlur(row.id!, `${q}p` as keyof OpifIndicator, e.currentTarget.textContent || '')
                                }
                              >
                                {row[`${q}p` as keyof OpifIndicator] || ''}
                              </td>
                            </React.Fragment>
                          ))
                        )}

                        {/* Actions column (print-hide) */}
                        {canEditThisSection && (
                          <td className="print-hide text-center" style={{ border: 'none' }}>
                            <button
                              onClick={() => handleDeleteRow(row.id!)}
                              className="p-1 text-red-500 hover:text-red-700 transition"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {/* Add Row Button at the bottom of each Section */}
                  {canEditThisSection && (
                    <tr className="print-hide">
                      <td
                        colSpan={22}
                        className="text-center p-2.5 bg-slate-50 border-2 border-dashed border-slate-300"
                      >
                        <button
                          onClick={() => handleAddRow(secKey)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Row to {sectionNames[secKey]}
                        </button>
                      </td>
                    </tr>
                  )}
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
    </div>
  );
}
