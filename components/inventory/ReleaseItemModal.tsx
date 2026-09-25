'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  ArrowUpRight,
  AlertCircle,
  Building2,
  CalendarDays,
  UserCheck,
  FileText,
  Search,
} from '@/components/icons';
import { InventoryItem, InventoryDepartment } from '@/lib/types';
import { InventoryConfirmDialog } from './InventoryConfirmDialog';

interface ReleaseItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  releasingOfficer: string;
  onReleaseSuccess: (params: {
    itemId: string;
    department: string;
    quantity: number;
    receivedBy: string;
    dateReceived: string;
    remarks?: string;
  }) => { success: boolean; message?: string };
  preselectedItemId?: string;
}

const DEPARTMENTS: InventoryDepartment[] = [
  'Market Office',
  'Slaughterhouse',
  'Cemetery',
  'TODA',
  'MEEDO',
  "Mayor's Office",
  'Other Offices',
];

export const ReleaseItemModal: React.FC<ReleaseItemModalProps> = ({
  isOpen,
  onClose,
  items,
  releasingOfficer,
  onReleaseSuccess,
  preselectedItemId,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('Market Office');
  const [customDept, setCustomDept] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>(preselectedItemId || '');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [dateReceived, setDateReceived] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize today's date formatted nicely or as YYYY-MM-DD
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDateReceived(today);
      if (preselectedItemId) {
        setSelectedItemId(preselectedItemId);
      } else if (!selectedItemId && items.length > 0) {
        setSelectedItemId(items[0].id);
      }
      setErrorMsg('');
      setQuantity(1);
    }
  }, [isOpen, preselectedItemId, items]);

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === selectedItemId);
  const effectiveDept = selectedDept === 'Other Offices' && customDept.trim() ? customDept.trim() : selectedDept;

  const handleValidateAndPromptConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!effectiveDept) {
      setErrorMsg('Please select or specify a department.');
      return;
    }

    if (!currentItem) {
      setErrorMsg('Please select an item to release.');
      return;
    }

    const qtyNum = typeof quantity === 'number' ? quantity : parseInt(quantity as string, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Quantity must be greater than 0.');
      return;
    }

    if (qtyNum > currentItem.quantity) {
      setErrorMsg(
        `Quantity cannot exceed available stock (${currentItem.quantity} ${currentItem.unit} remaining).`
      );
      return;
    }

    if (!receivedBy.trim()) {
      setErrorMsg('Please enter the name of the personnel receiving the item.');
      return;
    }

    if (!dateReceived) {
      setErrorMsg('Please select the date received.');
      return;
    }

    // Passed validation, open sweetalert confirmation modal
    setIsConfirmOpen(true);
  };

  const handleExecuteRelease = () => {
    if (!currentItem) return;
    const qtyNum = typeof quantity === 'number' ? quantity : parseInt(quantity as string, 10);

    setIsSubmitting(true);

    const formattedDate = new Date(dateReceived).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const result = onReleaseSuccess({
      itemId: currentItem.id,
      department: effectiveDept,
      quantity: qtyNum,
      receivedBy: receivedBy.trim(),
      dateReceived: formattedDate,
      remarks: remarks.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsConfirmOpen(false);
      onClose();
    } else {
      setErrorMsg(result.message || 'Failed to release item.');
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">Request / Release Item</h2>
                <p className="text-xs text-slate-400">
                  Issue municipal supplies to LGU departments and sections
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

          {/* Form Content */}
          <form onSubmit={handleValidateAndPromptConfirm} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Department / Section Searchable Dropdown */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Department / Section <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {selectedDept === 'Other Offices' && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Specify other office / department name..."
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>
              )}
            </div>

            {/* Item Dropdown */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                Select Supply Item <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="" disabled>
                  -- Select item from catalog --
                </option>
                {items.map((i) => (
                  <option key={i.id} value={i.id} disabled={i.quantity <= 0}>
                    {i.item} ({i.description}) — Available: {i.quantity} {i.unit} {i.quantity <= 0 ? '[OUT OF STOCK]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Auto-Populated Preview Box */}
            {currentItem && (
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Description</span>
                  <span className="font-semibold text-slate-800 truncate block">{currentItem.description}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit (Read-only)</span>
                  <span className="font-semibold text-slate-800 block">{currentItem.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Stock</span>
                  <span
                    className={`font-extrabold text-sm block ${
                      currentItem.quantity <= 5 ? 'text-amber-600' : 'text-emerald-700'
                    }`}
                  >
                    {currentItem.quantity} {currentItem.unit}
                  </span>
                </div>
              </div>
            )}

            {/* Quantity Input with Realtime Feedback */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700">
                  Quantity to Release <span className="text-rose-500">*</span>
                </label>
                {currentItem && (
                  <span className="text-[11px] text-slate-500">
                    Max allowed: <span className="font-bold text-slate-700">{currentItem.quantity} {currentItem.unit}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={currentItem ? currentItem.quantity : undefined}
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                    setQuantity(val);
                    setErrorMsg('');
                  }}
                  placeholder="Enter quantity"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                {currentItem && (
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400 pointer-events-none">
                    {currentItem.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Received By & Date Received Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  Received By <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Full name of recipient"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Releasing Officer (Auto-populated from logged-in user) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 flex items-center justify-between">
                <span>Releasing Officer (Auto-assigned)</span>
                <span className="text-[10px] text-blue-600 font-semibold uppercase">Logged-in Personnel</span>
              </label>
              <div className="px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-lg text-slate-700 font-semibold">
                {releasingOfficer}
              </div>
            </div>

            {/* Remarks Optional */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Remarks / Purpose (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Specific usage, requisition purpose, or special instructions..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
              />
            </div>

            {/* Modal Actions */}
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
                disabled={!currentItem || currentItem.quantity <= 0}
                className="px-5 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                Release Item
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {currentItem && (
        <InventoryConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleExecuteRelease}
          title="Confirm Supply Requisition Release"
          department={effectiveDept}
          itemName={currentItem.item}
          description={currentItem.description}
          quantity={typeof quantity === 'number' ? quantity : parseInt(quantity as string, 10) || 0}
          unit={currentItem.unit}
          currentStock={currentItem.quantity}
          receivedBy={receivedBy}
          date={dateReceived}
          releasingOfficer={releasingOfficer}
          remarks={remarks}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
};
