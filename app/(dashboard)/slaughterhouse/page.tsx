'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { SlaughterRecord, LivestockType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Beef, Printer, Plus, Save, CheckCircle2, Search } from 'lucide-react';

export default function SlaughterhousePage() {
  const { slaughterRecords, addSlaughterRecord } = useMeedo();

  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [contact, setContact] = useState('');
  const [orNumber, setOrNumber] = useState('');
  const [status, setStatus] = useState<'Private' | 'Public'>('Private');
  const [livestockType, setLivestockType] = useState<LivestockType>('Hogs');
  const [headCount, setHeadCount] = useState(1);
  const [amount, setAmount] = useState(150.0);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auto-fill client details when entering existing client ID or Name
  const handleClientNameChange = (name: string) => {
    setClientName(name);
    const existing = slaughterRecords.find(
      (r) => r.client_name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setClientId(existing.client_id);
      setContact(existing.contact_no || '');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClientId = clientId.trim() || `C-${Date.now().toString().slice(-6)}`;

    addSlaughterRecord({
      client_id: finalClientId,
      client_name: clientName,
      contact_no: contact,
      or_number: orNumber,
      status,
      livestock_type: livestockType,
      head_count: headCount,
      amount,
    });

    setSavedSuccess(true);
    setClientName('');
    setContact('');
    setOrNumber('');
    setClientId('');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Analytics
  const totalHeads = slaughterRecords.reduce((sum, r) => sum + r.head_count, 0);
  const totalRevenue = slaughterRecords.reduce((sum, r) => sum + r.amount, 0);
  const hogsCount = slaughterRecords
    .filter((r) => r.livestock_type === 'Hogs')
    .reduce((sum, r) => sum + r.head_count, 0);
  const cattleCount = slaughterRecords
    .filter((r) => r.livestock_type === 'Cow')
    .reduce((sum, r) => sum + r.head_count, 0);

  const filteredRecords = slaughterRecords.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      term === '' ||
      r.client_name.toLowerCase().includes(term) ||
      r.client_id.toLowerCase().includes(term) ||
      (r.or_number || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Slaughterhouse Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section B: Livestock intake logs, meat inspection receipts, and volume throughput analytics.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => window.print()} className="no-print">
          <Printer className="w-4 h-4 mr-1.5" /> Print Inspection Log
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Livestock</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalHeads} Heads</span>
          <span className="text-[11px] text-slate-400 font-medium">Ante-mortem inspected</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Fees Collected</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {formatCurrency(totalRevenue)}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold">Municipal Slaughter Fees</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Hogs / Swine</span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">{hogsCount} Heads</span>
          <span className="text-[11px] text-slate-400 font-medium">Commercial & Private</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Cattle / Large Animals</span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">{cattleCount} Heads</span>
          <span className="text-[11px] text-slate-400 font-medium">Post-mortem verified</span>
        </Card>
      </div>

      {/* Intake Form */}
      <Card className="no-print bg-blue-50/40 border-blue-200">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <Beef className="w-4 h-4 text-blue-600" /> Log Livestock Intake
        </h3>

        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div>
              <label className="block mb-1">Client ID (Auto if blank)</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. C-001201"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block mb-1">Name of Client</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => handleClientNameChange(e.target.value)}
                placeholder="Client or Meat Shop name"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block mb-1">Contact No.</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="09XX-XXX-XXXX"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block mb-1">Official Receipt (O.R. #)</label>
              <input
                type="text"
                value={orNumber}
                onChange={(e) => setOrNumber(e.target.value)}
                placeholder="e.g. OR-882190"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
            <div>
              <label className="block mb-1">Classification</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Private">Private</option>
                <option value="Public">Public</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">Livestock Species</label>
              <select
                value={livestockType}
                onChange={(e) => setLivestockType(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Hogs">Hogs / Swine</option>
                <option value="Chicken">Chicken / Poultry</option>
                <option value="Goat">Goat / Caprine</option>
                <option value="Cow">Cow / Cattle</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">Head Count</label>
              <input
                type="number"
                min="1"
                required
                value={headCount}
                onChange={(e) => setHeadCount(parseInt(e.target.value) || 1)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block mb-1">Total Fee Amount (₱)</label>
              <input
                type="number"
                step="0.5"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-blue-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Intake logged successfully!
              </span>
            )}
            <Button type="submit" variant="primary">
              <Save className="w-4 h-4 mr-1.5" /> Save Intake Record
            </Button>
          </div>
        </form>
      </Card>

      {/* Records Table */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-slate-800 text-sm">Slaughterhouse Inspection Ledger</h3>
          <div className="relative w-full sm:w-64 no-print">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by Client or OR..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Client ID</th>
                <th className="py-2.5 px-3">Client Name</th>
                <th className="py-2.5 px-3">OR #</th>
                <th className="py-2.5 px-3">Species</th>
                <th className="py-2.5 px-3">Heads</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {r.created_at ? formatDate(r.created_at) : 'Today'}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{r.client_id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{r.client_name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{r.or_number || 'Pending'}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">{r.livestock_type}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{r.head_count}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700">{formatCurrency(r.amount)}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={r.status === 'Public' ? 'info' : 'neutral'}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
