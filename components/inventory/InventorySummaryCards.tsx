'use client';

import React from 'react';
import { Package, Boxes, AlertTriangle, ArrowUpRight } from '@/components/icons';
import { InventoryItem, InventoryTransaction } from '@/lib/types';

interface InventorySummaryCardsProps {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  onFilterLowStock?: () => void;
}

export const InventorySummaryCards: React.FC<InventorySummaryCardsProps> = ({
  items,
  transactions,
  onFilterLowStock,
}) => {
  const totalItemsCount = items.length;
  const totalStockCount = items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  
  const lowStockItems = items.filter(
    (i) => i.quantity > 0 && i.quantity <= (i.low_stock_threshold || 5)
  );
  const outOfStockItems = items.filter((i) => i.quantity === 0);
  const criticalCount = lowStockItems.length + outOfStockItems.length;

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  // Count transactions today of type 'Release'
  const todayReleases = transactions.filter(
    (t) => t.transaction_type === 'Release' && t.transaction_date === today
  );
  const todayReleasesQty = todayReleases.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Items */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Supply Catalog
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900">{totalItemsCount}</span>
            <span className="text-xs text-slate-500 font-medium">Distinct items</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
          <Package className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Total Stock Units */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Stock on Hand
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-emerald-700">{totalStockCount.toLocaleString()}</span>
            <span className="text-xs text-emerald-600 font-medium">Available units</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
          <Boxes className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Low / Out of Stock Alert */}
      <div
        onClick={onFilterLowStock}
        className={`bg-white rounded-2xl p-4 border shadow-xs flex items-center justify-between transition-all ${
          criticalCount > 0
            ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400 cursor-pointer'
            : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Low / Depleted Stock
            </p>
            {criticalCount > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                Attention
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-extrabold ${criticalCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {criticalCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {outOfStockItems.length > 0 ? `${outOfStockItems.length} out of stock` : 'Requires restock'}
            </span>
          </div>
        </div>
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shadow-xs ${
          criticalCount > 0 ? 'bg-amber-100/70 border-amber-200 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-400'
        }`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Today's Releases */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Today&apos;s Requisitions
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-blue-700">{todayReleases.length}</span>
            <span className="text-xs text-blue-600 font-medium">
              ({todayReleasesQty} units released)
            </span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
          <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
