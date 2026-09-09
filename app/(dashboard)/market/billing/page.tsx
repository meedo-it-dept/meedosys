'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ElectricBill } from '@/lib/types';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Printer, Plus, Table as TableIcon, Save, CheckCircle2 } from 'lucide-react';

export default function ElectricBillingPage() {
  const { stalls, electricBills, addElectricBill, updateBillStatus } = useMeedo();

  const [rate, setRate] = useState<number>(15.0);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [discDate, setDiscDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 20);
    return d.toISOString().split('T')[0];
  });

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedStall, setSelectedStall] = useState('');
  const [prevReading, setPrevReading] = useState(0);
  const [currReading, setCurrReading] = useState(0);
  const [arrears, setArrears] = useState(0);
  const [meterReset, setMeterReset] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Batch readings state: map of stallNo -> { prev, curr, arrears }
  const [batchReadings, setBatchReadings] = useState<Record<string, { curr: number }>>({});

  const activeStall = stalls.find((s) => s.stall_no === selectedStall);

  const handleSelectStall = (stallNo: string) => {
    setSelectedStall(stallNo);
    const lastBill = electricBills.find((b) => b.stall_no === stallNo);
    const prev = lastBill ? lastBill.curr_reading : 100;
    setPrevReading(prev);
    setCurrReading(prev);
    setArrears(lastBill && lastBill.status === 'Unpaid' ? lastBill.bill_amount : 0);
  };

  const consumption = meterReset
    ? Math.max(0, currReading)
    : Math.max(0, currReading - prevReading);
  const totalAmount = consumption * rate + arrears;

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStall) return;

    const newBill: ElectricBill = {
      stall_no: selectedStall,
      owner_name: activeStall?.current_tenant?.stall_owner || 'Unknown',
      due_date: dueDate,
      disconnection_date: discDate,
      prev_reading: prevReading,
      curr_reading: currReading,
      consumption,
      rate_per_kwh: rate,
      arrears,
      bill_amount: totalAmount,
      meter_reset: meterReset,
      status: 'Unpaid',
      created_at: new Date().toISOString(),
    };

    addElectricBill(newBill);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveBatchItem = (stallNo: string) => {
    const lastBill = electricBills.find((b) => b.stall_no === stallNo);
    const prev = lastBill ? lastBill.curr_reading : 100;
    const curr = batchReadings[stallNo]?.curr || prev;
    const cons = Math.max(0, curr - prev);
    const bill = cons * rate;
    const stall = stalls.find((s) => s.stall_no === stallNo);

    const newBill: ElectricBill = {
      stall_no: stallNo,
      owner_name: stall?.current_tenant?.stall_owner || 'Unknown',
      due_date: dueDate,
      disconnection_date: discDate,
      prev_reading: prev,
      curr_reading: curr,
      consumption: cons,
      rate_per_kwh: rate,
      arrears: 0,
      bill_amount: bill,
      status: 'Unpaid',
      created_at: new Date().toISOString(),
    };

    addElectricBill(newBill);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Electric Utility Billing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single & batch meter reading calculation, arrears tracking, and two-way status sync.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBatchMode(!isBatchMode)}
          >
            <TableIcon className="w-4 h-4 mr-1.5 text-blue-600" />
            {isBatchMode ? 'Switch to Single Entry' : 'Batch Entry Mode'}
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" /> Print Summary
          </Button>
        </div>
      </div>

      {/* Billing Configuration Card */}
      <Card className="bg-blue-50/50 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1 text-blue-950 font-bold">Rate per kWh (₱)</label>
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
              className="w-full text-sm px-3 py-2 border border-blue-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-blue-950 font-bold">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-blue-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-blue-950 font-bold">Disconnection Date</label>
            <input
              type="date"
              value={discDate}
              onChange={(e) => setDiscDate(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-blue-200 rounded-lg bg-white"
            />
          </div>
        </div>
      </Card>

      {/* SINGLE ENTRY MODE */}
      {!isBatchMode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Generate Single Bill</h3>
            <form onSubmit={handleSaveSingle} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Stall</label>
                <select
                  value={selectedStall}
                  onChange={(e) => handleSelectStall(e.target.value)}
                  required
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Choose a stall...</option>
                  {stalls.map((s) => (
                    <option key={s.stall_no} value={s.stall_no}>
                      {s.stall_no} - {s.current_tenant?.stall_owner || 'Vacant'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStall && (
                <>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                    <span className="block font-semibold">Tenant:</span>
                    <span className="text-sm font-bold text-blue-700">
                      {activeStall?.current_tenant?.stall_owner || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">Previous Reading</label>
                      <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={meterReset}
                          onChange={(e) => setMeterReset(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        Meter Reset
                      </label>
                    </div>
                    <input
                      type="number"
                      value={prevReading}
                      onChange={(e) => setPrevReading(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Reading</label>
                    <input
                      type="number"
                      value={currReading}
                      onChange={(e) => setCurrReading(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Arrears / Unpaid Balance (₱)</label>
                    <input
                      type="number"
                      value={arrears}
                      onChange={(e) => setArrears(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white text-rose-600 font-bold"
                    />
                  </div>

                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>Consumption:</span>
                      <strong className="text-slate-800">{consumption.toFixed(1)} kWh</strong>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-blue-900 border-t border-blue-200/60 pt-1.5 mt-1.5">
                      <span>Total Bill:</span>
                      <span className="text-base text-blue-700 font-extrabold">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  <Button type="submit" variant="primary" className="w-full">
                    <Save className="w-4 h-4 mr-1.5" /> Save Bill
                  </Button>

                  {savedSuccess && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold justify-center">
                      <CheckCircle2 className="w-4 h-4" /> Bill saved successfully!
                    </div>
                  )}
                </>
              )}
            </form>
          </Card>

          {/* Electric Bills Ledger Table */}
          <Card className="lg:col-span-2">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Electric Utility Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-2.5 px-3">Stall No.</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-3">Readings</th>
                    <th className="py-2.5 px-3">Cons.</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {electricBills.map((bill) => (
                    <tr key={bill.id || bill.stall_no} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{bill.stall_no}</td>
                      <td className="py-2.5 px-3 text-slate-700">{bill.owner_name}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {bill.prev_reading} $\rightarrow$ {bill.curr_reading}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{bill.consumption} kWh</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {formatCurrency(bill.bill_amount)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            bill.status === 'Fully Paid'
                              ? 'success'
                              : bill.status === 'Partial'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {bill.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 no-print">
                        {bill.status === 'Unpaid' ? (
                          <button
                            onClick={() => updateBillStatus(bill.stall_no, 'Fully Paid')}
                            className="text-[11px] font-semibold text-emerald-600 hover:underline"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* BATCH ENTRY MODE */}
      {isBatchMode && (
        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Batch Reading Entry</h3>
              <p className="text-xs text-slate-500">Encode readings for all stalls in one continuous table.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-3">Stall No.</th>
                  <th className="py-2.5 px-3">Tenant</th>
                  <th className="py-2.5 px-3">Previous (kWh)</th>
                  <th className="py-2.5 px-3 w-32">Current (kWh)</th>
                  <th className="py-2.5 px-3">Cons (kWh)</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stalls.map((stall) => {
                  const lastBill = electricBills.find((b) => b.stall_no === stall.stall_no);
                  const prev = lastBill ? lastBill.curr_reading : 100;
                  const curr = batchReadings[stall.stall_no]?.curr ?? prev;
                  const cons = Math.max(0, curr - prev);
                  const total = cons * rate;

                  return (
                    <tr key={stall.stall_no} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{stall.stall_no}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {stall.current_tenant?.stall_owner || 'Vacant'}
                      </td>
                      <td className="py-2 px-3 font-mono">{prev}</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={curr}
                          onChange={(e) =>
                            setBatchReadings({
                              ...batchReadings,
                              [stall.stall_no]: { curr: parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="w-24 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold">{cons}</td>
                      <td className="py-2 px-3 font-bold text-blue-700">{formatCurrency(total)}</td>
                      <td className="py-2 px-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveBatchItem(stall.stall_no)}
                        >
                          Save
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
