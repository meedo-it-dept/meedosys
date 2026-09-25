'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, X } from '@/components/icons';

interface InventoryConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  department: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  currentStock: number;
  receivedBy?: string;
  date: string;
  releasingOfficer: string;
  remarks?: string;
  isSubmitting?: boolean;
}

export const InventoryConfirmDialog: React.FC<InventoryConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Supply Release',
  department,
  itemName,
  description,
  quantity,
  unit,
  currentStock,
  receivedBy,
  date,
  releasingOfficer,
  remarks,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  const stockAfter = Math.max(0, currentStock - quantity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* SweetAlert2 Style Icon Header */}
        <div className="pt-6 pb-2 px-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center text-amber-500 mb-3 shadow-inner">
            <AlertTriangle className="w-8 h-8 animate-pulse text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Please verify the requisition details before deducting municipal supply records.
          </p>
        </div>

        {/* Breakdown Card */}
        <div className="px-6 py-3">
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Requisitioning Dept:</span>
              <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {department}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-slate-500 font-medium">Item & Specs:</span>
              <span className="font-bold text-slate-900 text-right">
                {itemName}
                {description ? <span className="block text-[11px] font-normal text-slate-500">{description}</span> : null}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Quantity to Release:</span>
              <span className="font-bold text-blue-600 text-sm">
                {quantity} {unit}
              </span>
            </div>

            {/* Stock Math Breakdown */}
            <div className="bg-white rounded-lg p-2.5 border border-slate-200 flex items-center justify-between text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">CURRENT STOCK</span>
                <span className="font-semibold text-slate-700">{currentStock} {unit}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">DEDUCTION</span>
                <span className="font-semibold text-rose-600">-{quantity} {unit}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">REMAINING</span>
                <span className={`font-bold ${stockAfter <= 5 ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {stockAfter} {unit}
                </span>
              </div>
            </div>

            {receivedBy && (
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Received By:</span>
                <span className="font-semibold text-slate-800">{receivedBy}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Releasing Officer:</span>
              <span className="font-medium text-slate-700">{releasingOfficer}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Transaction Date:</span>
              <span className="font-medium text-slate-700">{date}</span>
            </div>

            {remarks && (
              <div className="pt-1.5 border-t border-slate-200/60 text-[11px]">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Remarks:</span>
                <span className="text-slate-600 italic">{remarks}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <span>Releasing...</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Yes, Confirm Release</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
