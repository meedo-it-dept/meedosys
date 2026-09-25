'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  FileSpreadsheet,
  Building2,
  CalendarDays,
  Printer,
} from '@/components/icons';
import { InventoryTransaction, InventoryTransactionType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface TransactionHistoryTableProps {
  transactions: InventoryTransaction[];
}

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({ transactions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Extract unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.department_section) set.add(t.department_section);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Dept filter
      if (selectedDept !== 'ALL' && t.department_section !== selectedDept) {
        return false;
      }
      // Type filter
      if (selectedType !== 'ALL' && t.transaction_type !== selectedType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          t.item_name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.department_section.toLowerCase().includes(q) ||
          (t.received_by && t.received_by.toLowerCase().includes(q)) ||
          t.released_by.toLowerCase().includes(q) ||
          (t.remarks && t.remarks.toLowerCase().includes(q)) ||
          t.transaction_date.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [transactions, selectedDept, selectedType, searchQuery]);

  const getTypeBadge = (type: InventoryTransactionType) => {
    switch (type) {
      case 'Release':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowUpRight className="w-3 h-3 text-blue-600" />
            Release
          </span>
        );
      case 'Stock In':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
            Stock In
          </span>
        );
      case 'Adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Filter className="w-3 h-3 text-amber-600" />
            Adjustment
          </span>
        );
      case 'Return':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            Return
          </span>
        );
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by item, person, department, or remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Print */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer py-1 text-xs"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer py-1 text-xs"
            >
              <option value="ALL">All Types</option>
              <option value="Stock In">Stock In</option>
              <option value="Release">Release</option>
              <option value="Adjustment">Adjustment</option>
              <option value="Return">Return</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            title="Print Audit Trail"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Department / Section</th>
              <th className="py-3 px-4">Item & Description</th>
              <th className="py-3 px-4 text-center">Qty / Unit</th>
              <th className="py-3 px-4">Received By</th>
              <th className="py-3 px-4">Releasing Officer</th>
              <th className="py-3 px-4">Remarks / Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <History className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No inventory transactions found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search criteria or filter options
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                    {t.transaction_date}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{getTypeBadge(t.transaction_type)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {t.department_section}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{t.item_name}</div>
                    {t.description && (
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{t.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className="font-extrabold text-slate-800 text-sm">{t.quantity}</span>{' '}
                    <span className="text-slate-500 font-medium">{t.unit}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                    {t.received_by || <span className="text-slate-400 italic">N/A</span>}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                    {t.released_by}
                  </td>
                  <td className="py-3 px-4 text-slate-600 italic max-w-xs">
                    {t.remarks || <span className="text-slate-300 not-italic">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-700">{filtered.length}</strong> of{' '}
          <strong className="text-slate-700">{transactions.length}</strong> transactions
        </span>
        <span className="text-[11px] text-slate-400">
          Immutable Municipal Supplies Audit Trail
        </span>
      </div>
    </div>
  );
};
