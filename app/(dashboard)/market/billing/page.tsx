'use client';

import React, { useState, useMemo } from 'react';
import { useMeedo } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ElectricBill } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Printer,
  Table as TableIcon,
  Save,
  CheckCircle2,
  FileText,
  Lock,
  Unlock,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';

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
  const [printAllMode, setPrintAllMode] = useState(false);
  const [selectedStall, setSelectedStall] = useState('');
  const [prevReading, setPrevReading] = useState(0);
  const [currReading, setCurrReading] = useState(0);
  const [arrears, setArrears] = useState(0);
  const [meterReset, setMeterReset] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Batch readings state: stallNo -> curr reading
  const [batchReadings, setBatchReadings] = useState<Record<string, { curr: number }>>({});

  // Pagination & Filtering for Electric Utility Ledger
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<'all' | 'Unpaid' | 'Partial' | 'Fully Paid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredBills = useMemo(() => {
    return electricBills.filter((bill) => {
      const term = ledgerSearch.toLowerCase().trim();
      const matchesSearch =
        term === '' ||
        bill.stall_no.toLowerCase().includes(term) ||
        (bill.owner_name || '').toLowerCase().includes(term);

      const matchesStatus =
        ledgerStatusFilter === 'all' || bill.status === ledgerStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [electricBills, ledgerSearch, ledgerStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedBills = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredBills.slice(start, start + itemsPerPage);
  }, [filteredBills, safeCurrentPage, itemsPerPage]);

  const activeStall = stalls.find((s) => s.stall_no === selectedStall);

  const handleSelectStall = (stallNo: string) => {
    setSelectedStall(stallNo);
    const lastBill = electricBills.find((b) => b.stall_no === stallNo);
    const prev = lastBill ? lastBill.curr_reading : 100;
    setPrevReading(prev);
    setCurrReading(prev);
    setArrears(lastBill && lastBill.status === 'Unpaid' ? lastBill.bill_amount : 0);
  };

  const handleToggleMeterReset = (checked: boolean) => {
    setMeterReset(checked);
    if (!checked) {
      const lastBill = electricBills.find((b) => b.stall_no === selectedStall);
      const prev = lastBill ? lastBill.curr_reading : 100;
      setPrevReading(prev);
    } else {
      setPrevReading(0);
    }
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
    const curr = batchReadings[stallNo]?.curr ?? prev;
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

  const handlePrintAllSlips = () => {
    setPrintAllMode(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Electric Utility Billing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single & batch meter reading calculation, arrears tracking, and two-way status sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBatchMode(!isBatchMode)}
          >
            <TableIcon className="w-4 h-4 mr-1.5 text-blue-600" />
            {isBatchMode ? 'Switch to Single Entry' : 'Batch Entry Mode'}
          </Button>

          <Button variant="primary" size="sm" onClick={handlePrintAllSlips}>
            <Printer className="w-4 h-4 mr-1.5" /> Print All Slips for Due Date
          </Button>
        </div>
      </div>

      {/* PRINT-ONLY INDIVIDUAL BILLING SLIPS */}
      {printAllMode && (
        <div className="print-only hidden space-y-8">
          {electricBills
            .filter((b) => b.due_date === dueDate)
            .map((b) => (
              <div
                key={b.id || b.stall_no}
                className="p-6 border-2 border-slate-900 rounded-xl max-w-lg mx-auto bg-white mb-8 page-break-inside-avoid"
              >
                <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                  <h3 className="text-sm font-extrabold uppercase text-slate-900 tracking-wider">
                    Municipality of Malungon
                  </h3>
                  <p className="text-[11px] font-bold text-slate-600">
                    Municipal Economic Enterprise Development Office (MEEDO)
                  </p>
                  <p className="text-base font-black text-blue-900 mt-1 uppercase">
                    Electric Utility Billing Statement
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 font-semibold block">Stall Number:</span>
                    <strong className="text-sm text-slate-900">{b.stall_no}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Tenant / Owner:</span>
                    <strong className="text-sm text-slate-900">{b.owner_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Due Date:</span>
                    <strong className="text-rose-700">{formatDate(b.due_date)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Disconnection Date:</span>
                    <strong className="text-slate-800">{b.disconnection_date ? formatDate(b.disconnection_date) : '—'}</strong>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Previous Reading:</span>
                    <strong className="font-mono">{b.prev_reading} kWh</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current Reading:</span>
                    <strong className="font-mono">{b.curr_reading} kWh</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-600">Consumption:</span>
                    <strong>{b.consumption} kWh</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Rate per kWh:</span>
                    <span>₱{b.rate_per_kwh.toFixed(2)}</span>
                  </div>
                  {b.arrears > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Previous Arrears:</span>
                      <strong>{formatCurrency(b.arrears)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-sm font-black text-slate-900">
                    <span>Total Amount Due:</span>
                    <span className="text-blue-800">{formatCurrency(b.bill_amount)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-center text-slate-500 italic">
                  Notice: Please settle your utility bill on or before the due date to avoid service disconnection.
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Billing Configuration Card */}
      <Card className="bg-blue-50/50 border-blue-200 no-print">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
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
                      <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                        Previous Reading (kWh)
                        {!meterReset && <Lock className="w-3 h-3 text-slate-400" />}
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={meterReset}
                          onChange={(e) => handleToggleMeterReset(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Meter Reset</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      value={prevReading}
                      readOnly={!meterReset}
                      tabIndex={!meterReset ? -1 : 0}
                      onChange={(e) => setPrevReading(parseFloat(e.target.value) || 0)}
                      className={`w-full text-sm px-3 py-2 border rounded-lg font-mono transition-all ${
                        !meterReset
                          ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed select-none'
                          : 'bg-white border-amber-300 ring-1 ring-amber-400 text-slate-900 font-bold'
                      }`}
                    />
                    {!meterReset ? (
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Auto-carried from last bill. Check &quot;Meter Reset&quot; to override.
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-semibold">
                        <Unlock className="w-2.5 h-2.5" /> Unlocked for replacement meter baseline.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Current Reading (kWh) <span className="text-blue-600 font-normal text-[11px]">(Active Entry)</span>
                    </label>
                    <input
                      type="number"
                      value={currReading}
                      onChange={(e) => setCurrReading(parseFloat(e.target.value) || 0)}
                      required
                      placeholder="Enter new meter reading..."
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
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
          <Card className="lg:col-span-2 flex flex-col justify-between">
            <div>
              {/* Ledger Header & Search/Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Electric Utility Ledger</h3>
                  <Badge variant="neutral" className="text-[10px]">
                    {filteredBills.length} {filteredBills.length === 1 ? 'Record' : 'Records'}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <div className="relative min-w-[150px] sm:min-w-[170px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => {
                        setLedgerSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search stall or owner..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                    />
                    {ledgerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setLedgerSearch('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <select
                    value={ledgerStatusFilter}
                    onChange={(e) => {
                      setLedgerStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    <option value="all">All Status</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Fully Paid">Fully Paid</option>
                  </select>

                  {/* Rows Per Page */}
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                    title="Rows per page"
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>
              </div>

              {/* Table */}
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
                      <th className="py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedBills.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          No electric utility records found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedBills.map((bill) => (
                        <tr key={bill.id || bill.stall_no} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{bill.stall_no}</td>
                          <td className="py-2.5 px-3 text-slate-700">{bill.owner_name}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">
                            <span>{bill.prev_reading}</span>
                            <span className="mx-1.5 text-slate-400">→</span>
                            <span>{bill.curr_reading}</span>
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
                          <td className="py-2.5 px-3">
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {filteredBills.length > 0 && (
              <div className="pt-4 mt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  Showing{' '}
                  <span className="font-bold text-slate-800">
                    {(safeCurrentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-slate-800">
                    {Math.min(safeCurrentPage * itemsPerPage, filteredBills.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-slate-800">{filteredBills.length}</span> entries
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1.5 h-7 w-7 text-xs flex items-center justify-center"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="text-xs h-7 px-2.5 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </Button>
                  <span className="px-2 font-bold text-slate-700">
                    Page {safeCurrentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="text-xs h-7 px-2.5 flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1.5 h-7 w-7 text-xs flex items-center justify-center"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* BATCH ENTRY MODE */}
      {isBatchMode && (
        <Card className="no-print">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Batch Reading Entry</h3>
              <p className="text-xs text-slate-500">Encode meter readings for all stalls simultaneously.</p>
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
