'use client';

import React, { useState } from 'react';
import { Stall, StallZone } from '@/lib/types';
import { useMeedo } from '@/lib/store';
import { Search, Filter, Store, User } from 'lucide-react';
import { StallModal } from './StallModal';

export const StallGrid: React.FC = () => {
  const { stalls } = useMeedo();

  const [activeZone, setActiveZone] = useState<StallZone>('wet');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Occupied' | 'Vacant'>('all');
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);

  const zones: { id: StallZone; label: string }[] = [
    { id: 'wet', label: 'Wet Section' },
    { id: 'dry', label: 'Dry Goods' },
    { id: 'old', label: 'Old Building' },
    { id: 'triangular', label: 'Triangular Area' },
  ];

  // Helper to render an individual stall button matching legacy behavior
  const renderStall = (
    id: string,
    customClass = '',
    style?: React.CSSProperties
  ) => {
    const stall = stalls.find((s) => s.stall_no === id);
    const isOccupied = stall?.status === 'Occupied';
    const owner = stall?.current_tenant?.stall_owner || '';

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      term === '' ||
      id.toLowerCase().includes(term) ||
      owner.toLowerCase().includes(term);
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'Occupied' && isOccupied) ||
      (filterStatus === 'Vacant' && !isOccupied);

    const isDimmed =
      (!matchesSearch || !matchesFilter) &&
      (term !== '' || filterStatus !== 'all');

    return (
      <button
        key={id}
        onClick={() => {
          if (stall) {
            setSelectedStall(stall);
          } else {
            // Virtual stall creation
            setSelectedStall({
              stall_no: id,
              zone: activeZone,
              status: 'Vacant',
              current_tenant: null,
            });
          }
        }}
        title={isOccupied ? `Occupied by: ${owner}` : `${id} (Vacant)`}
        style={style}
        className={`min-h-[44px] p-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center font-bold text-xs relative ${
          isOccupied
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:border-emerald-500 hover:shadow-xs'
            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-white'
        } ${isDimmed ? 'opacity-30 grayscale' : ''} ${customClass}`}
      >
        <span className="leading-tight block truncate w-full px-1">{id}</span>
        {isOccupied && <User className="w-3 h-3 text-emerald-600 mt-0.5" />}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* Zone Switcher & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Zone Buttons */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setActiveZone(z.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeZone === z.id
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stall or tenant..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="Occupied">Occupied Only</option>
            <option value="Vacant">Vacant Only</option>
          </select>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto min-h-[500px]">
        {/* Legend Header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 capitalize text-sm">
              {zones.find((z) => z.id === activeZone)?.label} Physical Map Layout
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-400"></span> Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-slate-50 border border-slate-300"></span> Vacant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-indigo-100 border border-indigo-400"></span> Special Enterprise
            </span>
          </div>
        </div>

        {/* 1. WET SECTION PHYSICAL MAP */}
        {activeZone === 'wet' && (
          <div className="min-w-[900px] space-y-8">
            {/* Top 3 Section Blocks */}
            <div className="grid grid-cols-3 gap-6">
              {/* SECTION G */}
              <div className="border border-slate-200 p-3.5 bg-slate-50/50 rounded-xl shadow-xs">
                <div className="text-center font-bold text-slate-700 text-xs tracking-wider uppercase mb-3">
                  SECTION G
                </div>
                <div className="grid grid-cols-2 gap-1.5">
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
              <div className="border border-slate-200 p-3.5 bg-slate-50/50 rounded-xl shadow-xs">
                <div className="text-center font-bold text-slate-700 text-xs tracking-wider uppercase mb-3">
                  SECTION B & I
                </div>
                <div className="grid grid-cols-2 gap-1.5">
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
              <div className="border border-slate-200 p-3.5 bg-slate-50/50 rounded-xl shadow-xs">
                <div className="text-center font-bold text-slate-700 text-xs tracking-wider uppercase mb-3">
                  SECTION A & C
                </div>
                <div className="grid grid-cols-2 gap-1.5">
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

            {/* Bottom Special Stalls & EF Grid */}
            <div className="flex gap-6 items-start">
              {renderStall('LAND-BANK', 'w-44 h-44 bg-indigo-50 border-indigo-300 text-indigo-900 font-extrabold text-sm')}
              {renderStall('MEEDO', 'w-44 h-44 bg-indigo-50 border-indigo-300 text-indigo-900 font-extrabold text-sm')}

              {/* Utility Stack */}
              <div className="flex flex-col gap-1.5 w-40">
                {renderStall('E-08', 'h-14')}
                {renderStall('E-09', 'h-14')}
                <div className="h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs text-slate-500">
                  CR
                </div>
                <div className="h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-[10px] text-slate-500">
                  ELECTRICAL
                </div>
              </div>

              {/* EF Grid */}
              <div className="flex-1 grid grid-cols-2 gap-1.5">
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

        {/* 2. DRY GOODS PHYSICAL MAP */}
        {activeZone === 'dry' && (
          <div className="min-w-[850px] space-y-8">
            {/* Second Floor */}
            <div>
              <div className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">
                Second Floor Wings
              </div>
              <div className="space-y-2 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-10 gap-1.5">
                  {['D-19', 'D-18', 'D-17', 'D-16', 'D-15', 'D-14', 'D-13', 'D-12', 'D-11', 'D-10'].map((id) =>
                    renderStall(id)
                  )}
                </div>
                <div className="grid grid-cols-9 gap-1.5">
                  {['D-09', 'D-08', 'D-07', 'D-06', 'D-05', 'D-04', 'D-03', 'D-02', 'D-01'].map((id) =>
                    renderStall(id)
                  )}
                </div>
              </div>
            </div>

            <div className="border-b-2 border-dashed border-slate-200 my-4" />

            {/* First Floor */}
            <div>
              <div className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">
                First Floor Wings & Main Staircase
              </div>
              <div className="flex items-center gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                <div className="flex gap-1.5 flex-1">
                  <div className="w-14 min-h-[44px] bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs text-slate-500">
                    CR
                  </div>
                  {['J-08', 'J-07', 'J-06', 'J-05', 'J-04', 'J-03', 'J-02', 'J-01'].map((id) =>
                    renderStall(id)
                  )}
                </div>

                <div className="w-14 py-2 bg-slate-200 border border-slate-300 rounded-lg text-center font-black text-xs text-slate-600 tracking-widest leading-4">
                  S<br />T<br />A<br />I<br />R<br />S
                </div>

                <div className="flex gap-1.5 flex-1">
                  {['L-09', 'L-08', 'L-07', 'L-06', 'L-05', 'L-04', 'L-03', 'L-02', 'L-01'].map((id) =>
                    renderStall(id)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. OLD BUILDING PHYSICAL MAP */}
        {activeZone === 'old' && (
          <div className="min-w-[950px] space-y-8">
            <div className="flex gap-8">
              {/* Food Terminal */}
              <div className="w-72">
                <div className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 text-center">
                  FOOD TERMINAL
                </div>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-50/60 p-3 rounded-xl border border-slate-200">
                  {['HE-1', 'HE-3', 'HE-5', 'HE-7', 'HE-2', 'HE-4', 'HE-6', 'HE-8'].map((id) =>
                    renderStall(id)
                  )}
                </div>
              </div>

              {/* Middle Complex */}
              <div className="flex-1">
                <div className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 text-center">
                  MIDDLE COMPLEX
                </div>
                <div className="grid grid-cols-3 gap-4 bg-slate-50/60 p-3 rounded-xl border border-slate-200">
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

            {/* High-End Section (2nd & 1st Floor) */}
            <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-200">
              <div className="text-center font-extrabold text-sm text-slate-900 mb-4">
                OLD BUILDING - HIGH END
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold text-slate-600 mb-2">2ND FLOOR</div>
                  <div className="flex gap-2">
                    <div className="flex gap-1.5 flex-1">
                      {['F-10-HE', 'F-09-HE', 'F-08-HE', 'F-07-HE', 'F-06-HE', 'F-05-HE'].map((id) =>
                        renderStall(id)
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 w-44">
                      {renderStall('F-01-HE')}
                      {renderStall('F-02-HE')}
                      {renderStall('F-03-04-HE')}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-600 mb-2">1ST FLOOR</div>
                  <div className="flex gap-4">
                    <div className="w-40 flex flex-col gap-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        {renderStall('F1-08-HE')}
                        <div className="h-11 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs text-slate-500">
                          CR-HE
                        </div>
                      </div>
                      {renderStall('F1-05-HE')}
                    </div>

                    <div className="w-24 flex flex-col gap-1.5">
                      {renderStall('F1-07-HE')}
                      {renderStall('F1-04-HE')}
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                      {renderStall('F1-06-HE')}
                      {renderStall('F1-01-HE')}
                      {renderStall('F1-03-HE')}
                      {renderStall('F1-02-HE')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRIANGULAR AREA PHYSICAL MAP */}
        {activeZone === 'triangular' && (
          <div className="min-w-[950px] flex gap-8">
            {/* Left Column Utility & K-group */}
            <div className="w-44 flex flex-col gap-4">
              <div className="border border-slate-200 bg-white rounded-lg p-2 text-xs font-bold space-y-1 text-slate-600 text-center">
                <div className="p-1 bg-slate-100 rounded">CR</div>
                <div className="p-1 bg-slate-100 rounded text-[10px]">ELECTRIC ROOM</div>
                <div className="p-1 bg-slate-100 rounded text-[10px]">GUARDS</div>
              </div>

              <div className="flex flex-col gap-1.5">
                {['K-01', 'K-02', 'K-03', 'K-04', 'K-05'].map((id) => renderStall(id))}
                {renderStall('K-06-07', 'min-h-[60px]')}
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                {['K-08', 'K-09', 'K-10', 'K-11', 'K-12'].map((id) => renderStall(id))}
              </div>
            </div>

            {/* Main Diagonal Staircase Grid */}
            <div className="flex-1 relative bg-slate-50/50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-11 gap-1.5 mb-8">
                {['D-31', 'D-30', 'D-28-29', 'D-27', 'D-26', 'D-25', 'D-24', 'D-23', 'D-22', 'D-21', 'D-20'].map((id) =>
                  renderStall(id, 'h-12')
                )}
              </div>

              {/* Gate Marker */}
              <div className="absolute top-4 right-4 w-12 h-28 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center font-black text-xs text-slate-400">
                GATE
              </div>

              {/* Bottom Row H-01 to H-15 */}
              <div className="pt-20 border-t border-slate-200">
                <div className="font-bold text-slate-700 text-xs mb-2">PERIMETER SECTION H</div>
                <div className="grid grid-cols-9 gap-1.5">
                  {['H-01', 'H-02-03', 'H-04-05', 'H-06', 'H-07', 'H-08-09', 'H-10-11', 'H-12-13', 'H-14-15'].map((id) =>
                    renderStall(id)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <StallModal
        stall={selectedStall}
        isOpen={Boolean(selectedStall)}
        onClose={() => setSelectedStall(null)}
      />
    </div>
  );
};
