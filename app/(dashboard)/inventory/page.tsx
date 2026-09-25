'use client';

import React, { useState, useMemo } from 'react';
import { useMeedo } from '@/lib/store';
import {
  Package,
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  RefreshCw,
  Plus,
  AlertTriangle,
  History,
  CheckCircle2,
  CalendarDays,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Lock,
  ShieldAlert,
} from '@/components/icons';
import { InventorySummaryCards } from '@/components/inventory/InventorySummaryCards';
import { ReleaseItemModal } from '@/components/inventory/ReleaseItemModal';
import { StockInModal } from '@/components/inventory/StockInModal';
import { AdjustStockModal } from '@/components/inventory/AdjustStockModal';
import { TransactionHistoryTable } from '@/components/inventory/TransactionHistoryTable';
import { InventoryItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function InventoryPage() {
  const {
    currentUser,
    inventoryItems,
    inventoryTransactions,
    releaseInventoryItem,
    stockInInventoryItem,
    adjustInventoryItem,
    resetInventoryData,
  } = useMeedo();

  // Defense-in-depth RBAC gatekeeper
  if (currentUser && currentUser.role !== 'Admin' && currentUser.section !== 'ALL') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
        <div className="border border-rose-200 bg-white shadow-lg rounded-2xl p-6 md:p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase mb-2">
              Administrator Access Only
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Municipal Inventory & Supplies Siloed
            </h2>
            <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              Municipal Inventory & Supplies management is restricted to Municipal Administrators only. Departmental staff cannot view or modify municipal supply balances.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Modals state
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [stockInMode, setStockInMode] = useState<'existing' | 'new'>('existing');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<InventoryItem | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');

  // Success toast notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const releasingOfficerName =
    currentUser?.full_name || currentUser?.username || 'Authorized Property Officer';

  // Distinct units
  const availableUnits = useMemo(() => {
    const set = new Set<string>();
    inventoryItems.forEach((i) => {
      if (i.unit) set.add(i.unit);
    });
    return Array.from(set).sort();
  }, [inventoryItems]);

  // Filtered inventory items
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      // Unit filter
      if (unitFilter !== 'ALL' && item.unit !== unitFilter) {
        return false;
      }

      // Status filter
      const threshold = item.low_stock_threshold || 5;
      if (statusFilter === 'OUT' && item.quantity !== 0) return false;
      if (statusFilter === 'LOW' && (item.quantity === 0 || item.quantity > threshold)) return false;
      if (statusFilter === 'NORMAL' && item.quantity <= threshold) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.item.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q) ||
          item.date_received.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [inventoryItems, unitFilter, statusFilter, searchQuery]);

  // Handler for Release
  const handleOpenReleaseModal = (item?: InventoryItem) => {
    setSelectedItemForAction(item || null);
    setIsReleaseModalOpen(true);
  };

  // Handler for Stock In (Replenish Existing)
  const handleOpenStockInModal = (item?: InventoryItem) => {
    setSelectedItemForAction(item || null);
    setStockInMode('existing');
    setIsStockInModalOpen(true);
  };

  // Handler for Adding New Item to Catalog
  const handleOpenAddNewItemModal = () => {
    setSelectedItemForAction(null);
    setStockInMode('new');
    setIsStockInModalOpen(true);
  };

  // Handler for Adjust
  const handleOpenAdjustModal = (item: InventoryItem) => {
    setSelectedItemForAction(item);
    setIsAdjustModalOpen(true);
  };

  const getStockStatusBadge = (item: InventoryItem) => {
    const threshold = item.low_stock_threshold || 5;
    if (item.quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
          Out of Stock
        </span>
      );
    }
    if (item.quantity <= threshold) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Low Stock ({item.quantity} left)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        Normal Stock
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold">{toastMessage}</p>
            <p className="text-[11px] text-slate-400">Inventory balance updated atomically.</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm text-blue-200 border border-white/10">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                Supply & Property Custodianship
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300">
                LGU Malungon Central Registry
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Inventory & Supply Management
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Centrally monitor municipal office supplies, manage departmental requisitions with instant stock deduction, and maintain an immutable audit trail of all supply releases.
            </p>
          </div>

          {/* Action Buttons Header */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Prominent Request / Release Item Button (Requirement #1) */}
            <button
              onClick={() => handleOpenReleaseModal()}
              className="px-5 py-3 rounded-xl font-extrabold text-sm text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2.5"
            >
              <ArrowUpRight className="w-5 h-5 text-white" />
              <span>Request / Release Item</span>
            </button>

            {/* Direct Add New Item to Catalog Button */}
            <button
              onClick={() => handleOpenAddNewItemModal()}
              className="px-4 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Add New Item</span>
            </button>

            {/* Stock-In / Restock Supplies Button */}
            <button
              onClick={() => handleOpenStockInModal()}
              className="px-4 py-3 rounded-xl font-bold text-sm text-slate-200 bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/10 backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Restock Supplies</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Summary Cards */}
      <InventorySummaryCards
        items={inventoryItems}
        transactions={inventoryTransactions}
        onFilterLowStock={() => {
          setActiveTab('inventory');
          setStatusFilter('LOW');
        }}
      />

      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Current Stock Inventory</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {inventoryItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Transactions & Audit Trail</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {inventoryTransactions.length}
            </span>
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            Showing <strong className="text-slate-800">{filteredItems.length}</strong> items in registry
          </div>
        )}
      </div>

      {/* Tab Content 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          {/* Table Filters Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search item name, specs, or unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer py-1 text-xs"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="NORMAL">Normal Stock (&gt; Threshold)</option>
                  <option value="LOW">Low Stock (Needs Restock)</option>
                  <option value="OUT">Out of Stock (Zero)</option>
                </select>
              </div>

              {/* Unit Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer py-1 text-xs"
                >
                  <option value="ALL">All Units</option>
                  {availableUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {(searchQuery || statusFilter !== 'ALL' || unitFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setUnitFilter('ALL');
                  }}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
                >
                  Reset Filters
                </button>
              )}

              {/* Direct Add Item Button */}
              <button
                onClick={handleOpenAddNewItemModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4">Date Received</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="w-9 h-9 text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No inventory items found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Try searching for another term or click &quot;Stock In Supplies&quot; to add items.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Item */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span>{item.item}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {item.description || <span className="text-slate-300 italic">None specified</span>}
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.unit}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-right font-extrabold whitespace-nowrap">
                        <span
                          className={`text-sm ${
                            item.quantity === 0
                              ? 'text-rose-600'
                              : item.quantity <= (item.low_stock_threshold || 5)
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.quantity.toLocaleString()}
                        </span>
                      </td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStockStatusBadge(item)}
                      </td>

                      {/* Date Received */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {item.date_received}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Release Button */}
                          <button
                            onClick={() => handleOpenReleaseModal(item)}
                            disabled={item.quantity <= 0}
                            title="Release this item to a department"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Release</span>
                          </button>

                          {/* Quick Stock-In Button */}
                          <button
                            onClick={() => handleOpenStockInModal(item)}
                            title="Replenish stock for this item"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Stock In</span>
                          </button>

                          {/* Adjust Stock Button */}
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            title="Adjust stock count after audit"
                            className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Total registered catalog supplies:{' '}
              <strong className="text-slate-800">{inventoryItems.length} items</strong>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Low Stock (&le; 5)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Out of Stock (0)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Transaction History & Audit Trail */}
      {activeTab === 'history' && (
        <TransactionHistoryTable transactions={inventoryTransactions} />
      )}

      {/* Release Item Modal */}
      <ReleaseItemModal
        isOpen={isReleaseModalOpen}
        onClose={() => {
          setIsReleaseModalOpen(false);
          setSelectedItemForAction(null);
        }}
        items={inventoryItems}
        releasingOfficer={releasingOfficerName}
        preselectedItemId={selectedItemForAction?.id}
        onReleaseSuccess={(params) => {
          const res = releaseInventoryItem(params);
          if (res.success) {
            showToast(`Successfully released ${params.quantity} item(s) to ${params.department}!`);
          }
          return res;
        }}
      />

      {/* Stock In Modal */}
      <StockInModal
        isOpen={isStockInModalOpen}
        onClose={() => {
          setIsStockInModalOpen(false);
          setSelectedItemForAction(null);
        }}
        items={inventoryItems}
        releasingOfficer={releasingOfficerName}
        initialMode={stockInMode}
        onStockInSuccess={(params) => {
          const res = stockInInventoryItem(params);
          if (res.success) {
            showToast(`Stock replenished successfully!`);
          }
          return res;
        }}
      />

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedItemForAction(null);
        }}
        item={selectedItemForAction}
        onAdjust={(id, newQty, reason) => {
          adjustInventoryItem(id, newQty, reason);
          showToast(`Stock balance adjusted successfully.`);
        }}
      />
    </div>
  );
}
