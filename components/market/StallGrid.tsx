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

  const filteredStalls = stalls.filter((stall) => {
    if (stall.zone !== activeZone) return false;

    const matchesStatus =
      filterStatus === 'all' || stall.status === filterStatus;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      term === '' ||
      stall.stall_no.toLowerCase().includes(term) ||
      (stall.current_tenant?.stall_owner || '').toLowerCase().includes(term) ||
      (stall.current_tenant?.line_of_business || '').toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Zone Switcher & Controls */}
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
            <option value="all">All Stalls</option>
            <option value="Occupied">Occupied</option>
            <option value="Vacant">Vacant</option>
          </select>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 capitalize">
              {zones.find((z) => z.id === activeZone)?.label} Map Layout
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-400"></span> Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-slate-50 border border-slate-300"></span> Vacant
            </span>
          </div>
        </div>

        {filteredStalls.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No stalls match the selected search or filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredStalls.map((stall) => {
              const isOccupied = stall.status === 'Occupied';
              return (
                <button
                  key={stall.stall_no}
                  onClick={() => setSelectedStall(stall)}
                  className={`p-3 rounded-xl border text-left transition-all hover:scale-102 hover:shadow-md flex flex-col justify-between h-28 ${
                    isOccupied
                      ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-black text-xs text-slate-800 tracking-tight">
                      {stall.stall_no}
                    </span>
                    {isOccupied && <User className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>

                  <div>
                    <span
                      className={`text-[11px] font-semibold block truncate ${
                        isOccupied ? 'text-emerald-900' : 'text-slate-400'
                      }`}
                    >
                      {stall.current_tenant?.stall_owner || 'Available'}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate">
                      {stall.current_tenant?.line_of_business || 'Click to assign'}
                    </span>
                  </div>
                </button>
              );
            })}
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
