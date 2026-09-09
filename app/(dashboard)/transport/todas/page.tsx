'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { Toda } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bus, Plus, Save, Printer } from 'lucide-react';

export default function TodaListPage() {
  const { todas, addToda } = useMeedo();

  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [president, setPresident] = useState('');
  const [contact, setContact] = useState('');
  const [totalMembers, setTotalMembers] = useState(25);
  const [address, setAddress] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToda({
      reg_no: regNo,
      name,
      president,
      contact_no: contact,
      total_members: totalMembers,
      address,
    });
    setSavedSuccess(true);
    setRegNo('');
    setName('');
    setPresident('');
    setContact('');
    setAddress('');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">TODA Association Registry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section D: Registered Tricycle Operators and Drivers Associations in Malungon.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => window.print()} className="no-print">
          <Printer className="w-4 h-4 mr-1.5" /> Print Directory
        </Button>
      </div>

      {/* Registration Form */}
      <Card className="no-print bg-emerald-50/40 border-emerald-200">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <Bus className="w-4 h-4 text-emerald-600" /> Register New TODA Association
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block mb-1">Registration #</label>
              <input
                type="text"
                required
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. TODA-2024-009"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block mb-1">TODA Registered Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full association name"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block mb-1">Association President</label>
              <input
                type="text"
                required
                value={president}
                onChange={(e) => setPresident(e.target.value)}
                placeholder="President full name"
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
              <label className="block mb-1">Total Member Count</label>
              <input
                type="number"
                min="1"
                required
                value={totalMembers}
                onChange={(e) => setTotalMembers(parseInt(e.target.value) || 0)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block mb-1">Terminal Address / Route</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Poblacion Highway"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                TODA registered successfully!
              </span>
            )}
            <Button type="submit" variant="success">
              <Save className="w-4 h-4 mr-1.5" /> Save TODA Entry
            </Button>
          </div>
        </form>
      </Card>

      {/* TODA Directory Table */}
      <Card>
        <h3 className="font-bold text-slate-800 text-sm mb-3">Official Association Roster</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-2.5 px-3">Reg #</th>
                <th className="py-2.5 px-3">Association Name</th>
                <th className="py-2.5 px-3">President</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Members</th>
                <th className="py-2.5 px-3">Terminal Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todas.map((t) => (
                <tr key={t.id || t.reg_no} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{t.reg_no}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{t.name}</td>
                  <td className="py-2.5 px-3 text-slate-800">{t.president}</td>
                  <td className="py-2.5 px-3 text-slate-500">{t.contact_no || '—'}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{t.total_members} Drivers</td>
                  <td className="py-2.5 px-3 text-slate-600">{t.address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
