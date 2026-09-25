'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Boxes,
  ArrowDownLeft,
  AlertCircle,
  Package,
  CalendarDays,
  UserCheck,
  FileText,
  Building2,
} from '@/components/icons';
import { InventoryItem, InventoryDepartment } from '@/lib/types';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  releasingOfficer: string;
  initialMode?: 'existing' | 'new';
  onStockInSuccess: (params: {
    itemId?: string;
    item?: string;
    description?: string;
    unit?: string;
    quantity: number;
    lowStockThreshold?: number;
    dateReceived: string;
    department?: string;
    receivedBy?: string;
    remarks?: string;
  }) => { success: boolean; message?: string };
}

const COMMON_UNITS = ['Ream', 'Box', 'Roll', 'Piece', 'Pack', 'Bottle', 'Gallon', 'Set', 'Pair', 'Booklet'];

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  items,
  releasingOfficer,
  initialMode = 'existing',
  onStockInSuccess,
}) => {
  const [mode, setMode] = useState<'existing' | 'new'>(initialMode);

  // Existing item mode state
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  // New item mode state
  const [newItemName, setNewItemName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newUnit, setNewUnit] = useState<string>('Piece');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  // Common state
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [dateReceived, setDateReceived] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('Supply Officer Santos');
  const [department, setDepartment] = useState<string>('MEEDO');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'existing');
      const today = new Date().toISOString().split('T')[0];
      setDateReceived(today);
      if (items.length > 0 && !selectedItemId) {
        setSelectedItemId(items[0].id);
      }
      setErrorMsg('');
      if (initialMode === 'new') {
        setNewItemName('');
        setNewDescription('');
        setQuantity(10);
      }
    }
  }, [isOpen, initialMode, items, selectedItemId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const qtyNum = typeof quantity === 'number' ? quantity : parseInt(quantity as string, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Quantity to stock in must be greater than zero.');
      return;
    }

    if (!dateReceived) {
      setErrorMsg('Please specify the date received.');
      return;
    }

    const formattedDate = new Date(dateReceived).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (mode === 'existing') {
      if (!selectedItemId) {
        setErrorMsg('Please select an item to replenish.');
        return;
      }

      const res = onStockInSuccess({
        itemId: selectedItemId,
        quantity: qtyNum,
        dateReceived: formattedDate,
        department,
        receivedBy: receivedBy.trim(),
        remarks: remarks.trim() || 'Inventory Stock Replenishment',
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to replenish stock.');
      }
    } else {
      if (!newItemName.trim()) {
        setErrorMsg('Item name is required.');
        return;
      }

      const finalUnit = newUnit === 'Other' ? customUnit.trim() : newUnit;
      if (!finalUnit) {
        setErrorMsg('Please select or specify a unit of measure.');
        return;
      }

      const res = onStockInSuccess({
        item: newItemName.trim(),
        description: newDescription.trim(),
        unit: finalUnit,
        quantity: qtyNum,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        dateReceived: formattedDate,
        department,
        receivedBy: receivedBy.trim(),
        remarks: remarks.trim() || 'Initial inventory intake',
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to create new item.');
      }
    }
  };

  const selectedExistingItem = items.find((i) => i.id === selectedItemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Stock-In Supplies / New Item</h2>
              <p className="text-xs text-slate-400">
                Replenish existing stocks or register a new supply item into the inventory catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Switch */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setMode('existing');
                setErrorMsg('');
              }}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                mode === 'existing'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              Replenish Existing Stock
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('new');
                setErrorMsg('');
              }}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                mode === 'new'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Catalog Item
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {mode === 'existing' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  Select Catalog Item to Replenish <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.item} — {i.description} (Current: {i.quantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedExistingItem && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">Current Stock</span>
                    <span className="text-base font-extrabold text-emerald-800">
                      {selectedExistingItem.quantity} {selectedExistingItem.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Unit of Measure</span>
                    <span className="text-xs font-semibold text-slate-700">{selectedExistingItem.unit}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Disinfectant Alcohol 70%"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Specification / Description</label>
                <input
                  type="text"
                  placeholder="e.g. 1 Gallon, Isopropyl with Moisturizer"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">
                    Unit of Measure <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value="Other">Other (Custom)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Low Stock Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {newUnit === 'Other' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Specify Custom Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. Bundle, Sack, Meter"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Quantity to Stock In */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Quantity Received <span className="text-rose-500">*</span></span>
              {mode === 'existing' && selectedExistingItem && (
                <span className="text-[11px] text-emerald-700 font-semibold">
                  New total will be: {(selectedExistingItem.quantity + (typeof quantity === 'number' ? quantity : 0))} {selectedExistingItem.unit}
                </span>
              )}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="e.g. 50"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Date & Received By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                Date Received <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                Inspected / Received By
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Supply custodian name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Supplier / Purchase Order / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. PO #2026-09-041, LGU Central Procurement"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2"
            >
              <ArrowDownLeft className="w-4 h-4" />
              {mode === 'existing' ? 'Confirm Stock In' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
