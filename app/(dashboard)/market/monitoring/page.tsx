'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, Printer, Save, CheckCircle2, Plus, Trash2 } from 'lucide-react';

export default function MonthlyMonitoringPage() {
  const { stalls } = useMeedo();

  const [selectedStallNo, setSelectedStallNo] = useState('');
  const [monDate, setMonDate] = useState(new Date().toISOString().split('T')[0]);
  const [goodwill, setGoodwill] = useState(0);
  const [opStatus, setOpStatus] = useState<'Operational' | 'Non-Operational'>('Operational');
  const [permitDate, setPermitDate] = useState('');
  const [permitNone, setPermitNone] = useState(false);
  const [leaseDate, setLeaseDate] = useState('');
  const [leaseNone, setLeaseNone] = useState(false);
  const [rentalOr, setRentalOr] = useState('');
  const [rentalNone, setRentalNone] = useState(false);
  const [claygo, setClaygo] = useState<'Yes' | 'No' | ''>('Yes');
  const [cctv, setCctv] = useState<'Yes' | 'No' | ''>('Yes');
  const [palengqr, setPalengqr] = useState<'Yes' | 'No' | ''>('Yes');
  const [seminars, setSeminars] = useState<string[]>(['Food Safety & Sanitation 2024']);
  const [newSeminar, setNewSeminar] = useState('');
  const [showAckReceipt, setShowAckReceipt] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const stall = stalls.find((s) => s.stall_no === selectedStallNo);

  const handleAddSeminar = () => {
    if (newSeminar.trim()) {
      setSeminars([...seminars, newSeminar.trim()]);
      setNewSeminar('');
    }
  };

  const handleRemoveSeminar = (index: number) => {
    setSeminars(seminars.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Stall Monitoring</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational compliance tracking, permit submissions, and tenant acknowledgement receipts.
          </p>
        </div>

        {selectedStallNo && (
          <div className="flex items-center gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAckReceipt(!showAckReceipt)}
            >
              <Printer className="w-4 h-4 mr-1.5 text-blue-600" />
              {showAckReceipt ? 'Hide Receipt' : 'View Acknowledgement Receipt'}
            </Button>
          </div>
        )}
      </div>

      {/* Stall Selector */}
      <Card className="no-print">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Select Stall to Monitor</label>
        <select
          value={selectedStallNo}
          onChange={(e) => setSelectedStallNo(e.target.value)}
          className="w-full md:w-96 text-sm px-3.5 py-2 border border-slate-300 rounded-lg bg-white"
        >
          <option value="">Select a stall...</option>
          {stalls.map((s) => (
            <option key={s.stall_no} value={s.stall_no}>
              {s.stall_no} - {s.current_tenant?.stall_owner || 'Vacant'} ({s.zone.toUpperCase()})
            </option>
          ))}
        </select>
      </Card>

      {/* PRINTABLE ACKNOWLEDGEMENT RECEIPT */}
      {showAckReceipt && stall && (
        <Card className="print-container border-2 border-slate-300 p-8 max-w-xl mx-auto bg-white shadow-lg">
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-base font-bold uppercase tracking-wider text-slate-900">
              Municipality of Malungon
            </h1>
            <h2 className="text-xs font-semibold uppercase text-slate-600">
              Municipal Economic Enterprise Development Office (MEEDO)
            </h2>
            <p className="text-lg font-black mt-2 text-blue-900 uppercase">
              Acknowledgement Receipt
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-semibold">Date of Inspection:</span>
              <strong className="text-slate-800">{monDate}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-semibold">Stall Number:</span>
              <strong className="text-slate-800">{stall.stall_no}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-semibold">Stall Tenant / Owner:</span>
              <strong className="text-slate-800">{stall.current_tenant?.stall_owner || 'N/A'}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-semibold">Line of Business:</span>
              <span className="text-slate-800">{stall.current_tenant?.line_of_business || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-semibold">CLAYGO Compliance:</span>
              <Badge variant={claygo === 'Yes' ? 'success' : 'danger'}>{claygo || 'No'}</Badge>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500 font-semibold">Paleng-QR Ph Implemented:</span>
              <Badge variant={palengqr === 'Yes' ? 'success' : 'danger'}>{palengqr || 'No'}</Badge>
            </div>
          </div>

          <div className="mt-12 pt-8 flex justify-between text-center text-xs">
            <div>
              <div className="w-40 border-b border-slate-800 pb-1 mx-auto mb-1">
                {stall.current_tenant?.stall_owner || 'Tenant'}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">Tenant Signature</span>
            </div>
            <div>
              <div className="w-40 border-b border-slate-800 pb-1 mx-auto mb-1 font-bold">
                MEEDO Inspector
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">Inspecting Officer</span>
            </div>
          </div>

          <div className="mt-6 text-center no-print">
            <Button variant="primary" size="sm" onClick={handlePrintReceipt}>
              <Printer className="w-4 h-4 mr-1.5" /> Print Receipt Now
            </Button>
          </div>
        </Card>
      )}

      {/* MONITORING FORM */}
      {selectedStallNo && (
        <form onSubmit={handleSave} className="space-y-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* General Info */}
            <Card>
              <h3 className="font-bold text-slate-800 text-sm mb-3">General Information</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Monitoring</label>
                  <input
                    type="date"
                    value={monDate}
                    onChange={(e) => setMonDate(e.target.value)}
                    required
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Goodwill Balance (₱)</label>
                  <input
                    type="number"
                    value={goodwill}
                    onChange={(e) => setGoodwill(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operational Status</label>
                  <select
                    value={opStatus}
                    onChange={(e) => setOpStatus(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Non-Operational">Non-Operational</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Compliance & Permits */}
            <Card>
              <h3 className="font-bold text-slate-800 text-sm mb-3">Permits & Payments</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700">Business Permit</label>
                    <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permitNone}
                        onChange={(e) => setPermitNone(e.target.checked)}
                      />
                      No Submission
                    </label>
                  </div>
                  <input
                    type="date"
                    disabled={permitNone}
                    value={permitDate}
                    onChange={(e) => setPermitDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700">Contract of Lease</label>
                    <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={leaseNone}
                        onChange={(e) => setLeaseNone(e.target.checked)}
                      />
                      No Submission
                    </label>
                  </div>
                  <input
                    type="date"
                    disabled={leaseNone}
                    value={leaseDate}
                    onChange={(e) => setLeaseDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700">Stall Rental (O.R. No.)</label>
                    <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rentalNone}
                        onChange={(e) => setRentalNone(e.target.checked)}
                      />
                      No Payment
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={rentalNone}
                    value={rentalOr}
                    onChange={(e) => setRentalOr(e.target.value)}
                    placeholder="Official Receipt No."
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>
              </div>
            </Card>

            {/* Operational Checks */}
            <Card>
              <h3 className="font-bold text-slate-800 text-sm mb-3">Operational Sanitation</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CLAYGO Compliance</label>
                  <select
                    value={claygo}
                    onChange={(e) => setClaygo(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CCTV Available</label>
                  <select
                    value={cctv}
                    onChange={(e) => setCctv(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paleng-QR Ph Active</label>
                  <select
                    value={palengqr}
                    onChange={(e) => setPalengqr(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Seminars Card */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">Seminars Attended</h3>
              <Badge variant="info">Total: {seminars.length}</Badge>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSeminar}
                onChange={(e) => setNewSeminar(e.target.value)}
                placeholder="e.g. Food Handlers Seminar 2024"
                className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddSeminar}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {seminars.map((sem, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium"
                >
                  {sem}
                  <button
                    type="button"
                    onClick={() => handleRemoveSeminar(idx)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-3 items-center">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Monitoring entry recorded successfully!
              </span>
            )}
            <Button type="submit" variant="primary">
              <Save className="w-4 h-4 mr-1.5" /> Save Monitoring Entry
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
