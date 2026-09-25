'use client';

import React, { useState } from 'react';
import { X, Filter, AlertTriangle, ArrowRight, CheckCircle2 } from '@/components/icons';
import { InventoryItem } from '@/lib/types';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onAdjust: (id: string, newQuantity: number, reason: string) => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  onClose,
  item,
  onAdjust,
}) => {
  const [newQty, setNewQty] = useState<number | ''>(item ? item.quantity : 0);
  const [reason, setReason] = useState<string>('Physical count reconciliation');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen || !item) return null;

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyVal = typeof newQty === 'number' ? newQty : parseInt(newQty as string, 10);
    if (isNaN(qtyVal) || qtyVal < 0) {
      setErrorMsg('Stock count cannot be negative.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please specify the audit or adjustment rationale.');
      return;
    }

    onAdjust(item.id, qtyVal, reason.trim());
    onClose();
  };

  const currentVal = item.quantity;
  const targetVal = typeof newQty === 'number' ? newQty : 0;
  const difference = targetVal - currentVal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">Adjust Physical Stock Count</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleAdjust} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Target Item</div>
            <div className="font-bold text-slate-900 text-sm">{item.item}</div>
            <div className="text-slate-500">{item.description}</div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Current</span>
              <span className="text-sm font-bold text-slate-700">{currentVal} {item.unit}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Adjustment</span>
              <span className={`text-sm font-bold ${difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {difference >= 0 ? `+${difference}` : difference} {item.unit}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">New Balance</span>
              <span className="text-sm font-extrabold text-blue-700">{targetVal} {item.unit}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">
              New Counted Physical Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={newQty}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                setNewQty(val);
                setErrorMsg('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">
              Adjustment Reason / Audit Notes <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual inventory audit reconciliation"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
