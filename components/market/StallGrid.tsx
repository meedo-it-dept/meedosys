'use client';

import React, { useState } from 'react';
import { Stall, StallZone } from '@/lib/types';
import { useMeedo } from '@/lib/store';
import { User, Search } from 'lucide-react';
import { StallSideViewer } from './StallSideViewer';

export const StallGrid: React.FC = () => {
  const { stalls } = useMeedo();

  const [activeZone, setActiveZone] = useState<StallZone>('triangular');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Occupied' | 'Vacant'>('all');
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);

  // Keep selected stall in sync with store updates
  const activeStall = selectedStall
    ? stalls.find((s) => s.stall_no === selectedStall.stall_no) || selectedStall
    : null;

  const zones: { id: StallZone; label: string }[] = [
    { id: 'wet', label: 'Wet Section' },
    { id: 'dry', label: 'Dry Goods' },
    { id: 'old', label: 'Old Building' },
    { id: 'triangular', label: 'Triangular' },
  ];

  // Helper to render an individual stall matching legacy HTML/CSS exactly
  const renderStall = (
    id: string,
    customClass = '',
    style?: React.CSSProperties
  ) => {
    const isSpecial = id === 'LAND-BANK' || id === 'MEEDO';
    const stall = stalls.find((s) => s.stall_no === id);
    const isOccupied = stall?.status === 'Occupied';
    const owner = stall?.current_tenant?.stall_owner || '';

    const term = searchTerm.toLowerCase().trim();
    const safeOwner = owner.toLowerCase();
    const matchesSearch =
      term === '' ||
      id.toLowerCase().includes(term) ||
      safeOwner.includes(term);
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'Occupied' && isOccupied) ||
      (filterStatus === 'Vacant' && !isOccupied);

    const isDimmed =
      (!matchesSearch || !matchesFilter) &&
      (term !== '' || filterStatus !== 'all');

    if (isSpecial) {
      return (
        <button
          key={id}
          type="button"
          onClick={() => {
            if (stall) {
              setSelectedStall(stall);
            } else {
              setSelectedStall({
                stall_no: id,
                zone: 'wet',
                status: 'Occupied',
                current_tenant: {
                  stall_no: id,
                  stall_owner: id,
                  operator: id,
                  line_of_business: 'Financial / Municipal Office',
                  period_index: 1,
                  year: 2026,
                  compliance_status: 'Compliant',
                },
              });
            }
          }}
          title={id}
          style={style}
          className={`w-[170px] h-[170px] bg-[#e0e7ff] border-2 border-[#a5b4fc] text-[#4338ca] font-extrabold text-base rounded-md flex items-center justify-center transition-all hover:shadow-md select-none ${
            isDimmed ? 'opacity-25 grayscale' : ''
          } ${customClass}`}
        >
          {id}
        </button>
      );
    }

    const isSelected = selectedStall?.stall_no === id;

    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          if (stall) {
            setSelectedStall(stall);
          } else {
            setSelectedStall({
              stall_no: id,
              zone: activeZone,
              status: 'Vacant',
              current_tenant: null,
            });
          }
        }}
        title={isOccupied ? `${id} - Occupied by ${owner}` : `${id} (Vacant)`}
        style={style}
        className={`min-h-[44px] px-2 py-1 rounded-[6px] border text-center transition-all flex flex-col items-center justify-center font-bold text-xs relative select-none hover:-translate-y-0.5 hover:shadow-sm ${
          isOccupied
            ? 'bg-[#d1fae5] border-[#34d399] text-[#064e3b]'
            : 'bg-white border-[#d1d5db] text-[#64748b]'
        } ${isSelected ? 'ring-2 ring-blue-600 ring-offset-1 shadow-md z-10 scale-[1.03]' : ''} ${
          isDimmed ? 'opacity-25 grayscale' : ''
        } ${customClass}`}
      >
        <span className="leading-tight truncate w-full px-0.5">{id}</span>
        {isOccupied && <User className="w-3.5 h-3.5 text-[#065f46] mt-0.5 flex-shrink-0" />}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls Bar matching Legacy Index.html */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-wrap gap-4 justify-between items-center">
        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">
          Market Layout
        </h2>

        {/* Tab Group matching .tab-group & .tab-btn */}
        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex items-center gap-1 overflow-x-auto">
          {zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setActiveZone(z.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${
                activeZone === z.id
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filter matching #mainSearchContainer */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-[280px]">
          <div className="relative w-full max-w-[260px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stall or owner..."
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Occupied">Occupied</option>
            <option value="Vacant">Vacant</option>
          </select>
        </div>
      </div>

      {/* Main Canvas Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm overflow-x-auto min-h-[520px]">
        {/* ========================================================================= */}
        {/* 1. WET SECTION PHYSICAL MAP                                              */}
        {/* ========================================================================= */}
        {activeZone === 'wet' && (
          <div className="min-w-[950px] space-y-7 p-2">
            {/* Top 3 Section Boxes */}
            <div className="grid grid-cols-3 gap-6">
              {/* SECTION G */}
              <div className="border border-slate-200/90 p-4 bg-white rounded-xl shadow-xs">
                <div className="text-center font-extrabold text-slate-800 text-xs tracking-wider uppercase mb-3.5">
                  SECTION G
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {renderStall('G-01-B')}
                  {renderStall('G-01-A')}
                  {renderStall('G-02')}
                  {renderStall('G-10')}
                  {renderStall('G-03')}
                  {renderStall('G-11')}
                  {renderStall('G-04')}
                  {renderStall('G-12')}
                  {renderStall('G-05')}
                  {renderStall('G-13')}
                  {renderStall('G-06')}
                  {renderStall('G-14')}
                  {renderStall('G-07')}
                  {renderStall('G-15')}
                  {renderStall('G-08')}
                  {renderStall('G-16')}
                  {renderStall('G-09')}
                  {renderStall('G-17')}
                </div>
              </div>

              {/* SECTION B & I */}
              <div className="border border-slate-200/90 p-4 bg-white rounded-xl shadow-xs">
                <div className="text-center font-extrabold text-slate-800 text-xs tracking-wider uppercase mb-3.5">
                  SECTION B & I
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {renderStall('B-01-A')}
                  {renderStall('B-01-B')}
                  {renderStall('B-02')}
                  {renderStall('B-06')}
                  {renderStall('B-03')}
                  {renderStall('B-07')}
                  {renderStall('B-04')}
                  {renderStall('B-08')}
                  {renderStall('B-05')}
                  {renderStall('B-09')}
                  {renderStall('I-01')}
                  {renderStall('I-05')}
                  {renderStall('I-02')}
                  {renderStall('I-06')}
                  {renderStall('I-03')}
                  {renderStall('I-07')}
                  {renderStall('I-04')}
                  {renderStall('I-08')}
                </div>
              </div>

              {/* SECTION A & C */}
              <div className="border border-slate-200/90 p-4 bg-white rounded-xl shadow-xs">
                <div className="text-center font-extrabold text-slate-800 text-xs tracking-wider uppercase mb-3.5">
                  SECTION A & C
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {renderStall('A-01-A')}
                  {renderStall('A-01-B')}
                  {renderStall('A-02')}
                  {renderStall('A-06')}
                  {renderStall('A-03')}
                  {renderStall('A-07')}
                  {renderStall('A-04')}
                  {renderStall('A-08')}
                  {renderStall('A-05')}
                  {renderStall('A-09')}
                  {renderStall('C-01')}
                  {renderStall('C-05')}
                  {renderStall('C-02')}
                  {renderStall('C-06')}
                  {renderStall('C-03')}
                  {renderStall('C-07')}
                  {renderStall('C-04')}
                  {renderStall('C-08')}
                </div>
              </div>
            </div>

            {/* Bottom Special Stalls, Utility Stack & EF Grid */}
            <div className="flex gap-6 items-start">
              {renderStall('LAND-BANK')}
              {renderStall('MEEDO')}

              {/* Utility Stack */}
              <div className="flex flex-col gap-2 w-[150px]">
                {renderStall('E-08', 'h-[46px]')}
                {renderStall('E-09', 'h-[46px]')}
                <div className="h-[44px] bg-[#f8fafc] border border-slate-300 rounded-[6px] flex items-center justify-center font-extrabold text-xs text-slate-600 select-none">
                  CR
                </div>
                <div className="h-[44px] bg-[#f8fafc] border border-slate-300 rounded-[6px] flex items-center justify-center font-extrabold text-[11px] text-slate-600 select-none">
                  ELECTRICAL
                </div>
              </div>

              {/* EF Grid */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                {['01', '02', '03', '04', '05', '06', '07'].map((n) => (
                  <React.Fragment key={n}>
                    {renderStall(`E-${n}`)}
                    {renderStall(`F-${n}`)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. DRY GOODS PHYSICAL MAP                                                */}
        {/* ========================================================================= */}
        {activeZone === 'dry' && (
          <div className="min-w-[950px] space-y-9 p-2">
            {/* Second Floor */}
            <div className="space-y-3">
              <div className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                SECOND FLOOR
              </div>
              <div className="flex items-center gap-5">
                {/* Left Wing D-19 to D-10 */}
                <div className="flex gap-1.5 flex-1">
                  {['D-19', 'D-18', 'D-17', 'D-16', 'D-15', 'D-14', 'D-13', 'D-12', 'D-11', 'D-10'].map((id) =>
                    renderStall(id, 'flex-1 min-w-[48px]')
                  )}
                </div>

                {/* Right Wing D-09 to D-01 */}
                <div className="flex gap-1.5 flex-1">
                  {['D-09', 'D-08', 'D-07', 'D-06', 'D-05', 'D-04', 'D-03', 'D-02', 'D-01'].map((id) =>
                    renderStall(id, 'flex-1 min-w-[48px]')
                  )}
                </div>
              </div>
            </div>

            {/* Dashed Divider Line */}
            <div className="border-b-2 border-dashed border-slate-200 my-6" />

            {/* First Floor */}
            <div className="space-y-3">
              <div className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                FIRST FLOOR
              </div>
              <div className="flex items-center gap-4">
                {/* Left Wing CR + J-08 to J-01 */}
                <div className="flex gap-1.5 flex-1">
                  <div className="w-12 min-h-[44px] bg-[#f8fafc] border border-slate-300 rounded-[6px] flex items-center justify-center font-extrabold text-xs text-slate-600 select-none flex-shrink-0">
                    CR
                  </div>
                  {['J-08', 'J-07', 'J-06', 'J-05', 'J-04', 'J-03', 'J-02', 'J-01'].map((id) =>
                    renderStall(id, 'flex-1 min-w-[44px]')
                  )}
                </div>

                {/* Vertical Striped Stairs Block */}
                <div
                  className="w-12 py-2 bg-slate-100 border border-slate-300 rounded-[6px] text-center font-black text-xs text-slate-500 tracking-widest leading-4 select-none flex-shrink-0"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, transparent, transparent 4px, #e2e8f0 4px, #e2e8f0 8px)',
                  }}
                >
                  S<br />T<br />A<br />I<br />R<br />S
                </div>

                {/* Right Wing L-09 to L-01 */}
                <div className="flex gap-1.5 flex-1">
                  {['L-09', 'L-08', 'L-07', 'L-06', 'L-05', 'L-04', 'L-03', 'L-02', 'L-01'].map((id) =>
                    renderStall(id, 'flex-1 min-w-[44px]')
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. OLD BUILDING PHYSICAL MAP                                             */}
        {/* ========================================================================= */}
        {activeZone === 'old' && (
          <div className="min-w-[950px] space-y-9 p-2">
            {/* Top Row: Food Terminal & Middle Complex */}
            <div className="flex gap-8 items-start">
              {/* Food Terminal */}
              <div className="w-[260px] flex-shrink-0">
                <div className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-2.5 text-center">
                  FOOD TERMINAL
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {['HE-1', 'HE-3', 'HE-5', 'HE-7', 'HE-2', 'HE-4', 'HE-6', 'HE-8'].map((id) =>
                    renderStall(id)
                  )}
                </div>
              </div>

              {/* Middle Complex */}
              <div className="flex-1">
                <div className="grid grid-cols-3 gap-6">
                  {/* Block 1 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {renderStall('HE-9', 'col-span-2')}
                    {renderStall('HE-10')}
                    {renderStall('HE-11')}
                    {renderStall('HE-12', 'col-span-2')}
                  </div>
                  {/* Block 2 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {renderStall('HE-13', 'col-span-2')}
                    {renderStall('HE-14')}
                    {renderStall('HE-16')}
                    {renderStall('HE-15')}
                    {renderStall('HE-17')}
                  </div>
                  {/* Block 3 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {renderStall('HE-18', 'col-span-2')}
                    {renderStall('HE-19')}
                    {renderStall('HE-20')}
                    {renderStall('HE-21')}
                    {renderStall('HE-22')}
                  </div>
                </div>
              </div>
            </div>

            {/* High-End Section Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs">
              <div className="text-center font-extrabold text-sm text-slate-900 tracking-wider mb-6">
                OLD BUILDING-HIGH END
              </div>

              <div className="space-y-7">
                {/* 2nd Floor */}
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-700 mb-2.5 uppercase tracking-wider">
                    2ND FLOOR
                  </div>
                  <div className="flex items-end justify-center gap-1.5">
                    <div className="flex gap-1.5">
                      {['F-10-HE', 'F-09-HE', 'F-08-HE', 'F-07-HE', 'F-06-HE', 'F-05-HE'].map((id) =>
                        renderStall(id, 'w-[70px]')
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 w-[70px]">
                      {renderStall('F-01-HE')}
                      {renderStall('F-02-HE')}
                      {renderStall('F-03-04-HE')}
                    </div>
                  </div>
                </div>

                {/* 1st Floor */}
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-700 mb-2.5 uppercase tracking-wider">
                    1ST FLOOR
                  </div>
                  <div className="flex items-start justify-center gap-8">
                    {/* Block 1 */}
                    <div className="w-[140px] flex flex-col gap-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        {renderStall('F1-08-HE')}
                        <div className="min-h-[44px] bg-[#f8fafc] border border-slate-300 rounded-[6px] flex items-center justify-center font-bold text-xs text-slate-600 select-none">
                          CR-HE
                        </div>
                      </div>
                      {renderStall('F1-05-HE')}
                    </div>

                    {/* Block 2 */}
                    <div className="w-[70px] flex flex-col gap-1.5">
                      {renderStall('F1-07-HE')}
                      {renderStall('F1-04-HE')}
                    </div>

                    {/* Block 3 */}
                    <div className="w-[140px] flex flex-col gap-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        {renderStall('F1-06-HE')}
                        {renderStall('F1-01-HE')}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {renderStall('F1-03-HE')}
                        {renderStall('F1-02-HE')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TRIANGULAR AREA PHYSICAL MAP (Pixel-perfect replica)                  */}
        {/* ========================================================================= */}
        {activeZone === 'triangular' && (
          <div className="min-w-[980px] flex gap-7 p-2">
            {/* Left Column: Utility + K-Group */}
            <div className="w-[140px] flex flex-col gap-5 flex-shrink-0">
              {/* Utility Box: CR + ELECTRIC ROOM + GUARDS */}
              <div className="border border-slate-300 bg-white rounded-md grid grid-cols-[50px_1fr] grid-rows-2 h-[72px] overflow-hidden text-slate-700 select-none shadow-xs">
                <div className="row-span-2 border-r border-slate-300 grid place-items-center font-bold text-xs bg-slate-50 text-slate-600">
                  CR
                </div>
                <div className="flex items-center pl-2 font-extrabold text-[9.5px] text-slate-600 border-b border-slate-300 uppercase leading-none">
                  ELECTRIC ROOM
                </div>
                <div className="flex items-center pl-2 font-extrabold text-[8.5px] text-slate-500 uppercase leading-none">
                  GUARDS
                </div>
              </div>

              {/* K Stalls Group 1: K-01 to K-05 + K-06-07 */}
              <div className="flex flex-col gap-1.5">
                {['K-01', 'K-02', 'K-03', 'K-04', 'K-05'].map((id) => renderStall(id))}
                {renderStall('K-06-07', 'h-[80px]')}
              </div>

              {/* K Stalls Group 2: K-08 to K-12 */}
              <div className="flex flex-col gap-1.5 mt-3">
                {['K-08', 'K-09', 'K-10', 'K-11', 'K-12'].map((id) => renderStall(id))}
              </div>
            </div>

            {/* Right Main Grid: Diagonal Staircase + Gate + Bottom H Stalls */}
            <div
              className="relative flex-1 min-w-[900px] pr-12"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(39, 1fr)',
                gridTemplateRows: 'repeat(11, 44px) 210px 60px',
                gap: '4px',
              }}
            >
              {/* Diagonal Staircase Stalls D-31 to D-20 */}
              {renderStall('D-31', '', { gridArea: '1 / 1 / 2 / 6' })}
              {renderStall('D-30', '', { gridArea: '2 / 4 / 3 / 9' })}
              {renderStall('D-28-29', '', { gridArea: '3 / 7 / 4 / 15' })}
              {renderStall('D-27', '', { gridArea: '4 / 13 / 5 / 18' })}
              {renderStall('D-26', '', { gridArea: '5 / 16 / 6 / 21' })}
              {renderStall('D-25', '', { gridArea: '6 / 19 / 7 / 24' })}
              {renderStall('D-24', '', { gridArea: '7 / 22 / 8 / 27' })}
              {renderStall('D-23', '', { gridArea: '8 / 25 / 9 / 30' })}
              {renderStall('D-22', '', { gridArea: '9 / 28 / 10 / 33' })}
              {renderStall('D-21', '', { gridArea: '10 / 31 / 11 / 36' })}
              {renderStall('D-20', '', { gridArea: '11 / 34 / 12 / 39' })}

              {/* Row 12 is transparent vertical spacing (210px) */}
              <div style={{ gridArea: '12 / 1 / 13 / 40' }} />

              {/* Row 13 is the bottom perimeter row of H stalls */}
              {renderStall('H-01', '', { gridArea: '13 / 2 / 14 / 8' })}
              {renderStall('H-02-03', '', { gridArea: '13 / 8 / 14 / 12' })}
              {renderStall('H-04-05', '', { gridArea: '13 / 12 / 14 / 16' })}
              {renderStall('H-06', '', { gridArea: '13 / 16 / 14 / 18' })}
              {renderStall('H-07', '', { gridArea: '13 / 18 / 14 / 20' })}
              {renderStall('H-08-09', '', { gridArea: '13 / 20 / 14 / 26' })}
              {renderStall('H-10-11', '', { gridArea: '13 / 26 / 14 / 32' })}
              {renderStall('H-12-13', '', { gridArea: '13 / 32 / 14 / 36' })}
              {renderStall('H-14-15', '', { gridArea: '13 / 36 / 14 / 40' })}

              {/* Gate Marker matching Legacy */}
              <div className="absolute top-0 right-0 w-[42px] h-[120px] bg-slate-50 border-2 border-dashed border-slate-300 rounded-[6px] grid place-items-center font-black text-xs text-slate-400 tracking-widest select-none">
                GATE
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tenancy & Stall Detail Side Viewer */}
      <StallSideViewer
        stall={activeStall}
        isOpen={Boolean(selectedStall)}
        onClose={() => setSelectedStall(null)}
      />
    </div>
  );
};
