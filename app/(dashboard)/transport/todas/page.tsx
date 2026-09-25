'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { Toda } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bus, Plus, Save, Printer, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

export default function TodaListPage() {
  const { todas, addToda, updateToda, deleteToda, todaMembers } = useMeedo();

  const [editingTodaId, setEditingTodaId] = useState<string | null>(null);
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [president, setPresident] = useState('');
  const [contact, setContact] = useState('');
  const [totalMembers, setTotalMembers] = useState(25);
  const [address, setAddress] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [todaToDelete, setTodaToDelete] = useState<Toda | null>(null);

  const handleEdit = (t: Toda) => {
    setEditingTodaId(t.id || null);
    setRegNo(t.reg_no);
    setName(t.name);
    setPresident(t.president);
    setContact(t.contact_no || '');
    setTotalMembers(t.total_members);
    setAddress(t.address || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTodaId(null);
    setRegNo('');
    setName('');
    setPresident('');
    setContact('');
    setTotalMembers(25);
    setAddress('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTodaId) {
      updateToda(editingTodaId, {
        reg_no: regNo,
        name,
        president,
        contact_no: contact,
        total_members: totalMembers,
        address,
      });
      handleCancelEdit();
    } else {
      addToda({
        reg_no: regNo,
        name,
        president,
        contact_no: contact,
        total_members: totalMembers,
        address,
      });
      setRegNo('');
      setName('');
      setPresident('');
      setContact('');
      setAddress('');
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleConfirmDelete = () => {
    if (todaToDelete?.id) {
      deleteToda(todaToDelete.id);
      if (editingTodaId === todaToDelete.id) {
        handleCancelEdit();
      }
      setTodaToDelete(null);
    }
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

      {/* Registration / Edit Form */}
      <Card className="no-print bg-emerald-50/40 border-emerald-200">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-emerald-600" />
            {editingTodaId ? `Edit TODA: ${name}` : 'Register New TODA Association'}
          </span>
          {editingTodaId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-normal"
            >
              <X className="w-3.5 h-3.5" /> Cancel Edit
            </button>
          )}
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

          <div className="flex justify-end gap-3 pt-2 items-center">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                {editingTodaId ? 'TODA updated successfully!' : 'TODA registered successfully!'}
              </span>
            )}
            {editingTodaId && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="success">
              <Save className="w-4 h-4 mr-1.5" /> {editingTodaId ? 'Update TODA' : 'Save TODA Entry'}
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
                <th className="py-2.5 px-3 text-center no-print whitespace-nowrap">Actions</th>
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
                  <td className="py-2.5 px-3 text-center no-print whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(t)}
                        title="Edit TODA"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTodaToDelete(t)}
                        title="Delete TODA"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Alert */}
      {todaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white shadow-xl border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Delete TODA Association?</h4>
                <p className="text-xs text-slate-500">This action will remove the association from the registry.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
              Are you sure you want to delete <strong className="text-slate-900">{todaToDelete.name}</strong> (
              {todaToDelete.reg_no})?
              {todaMembers.filter((m) => m.toda_id === todaToDelete.id || m.toda_name === todaToDelete.name).length >
                0 && (
                <span className="block mt-1 text-rose-600 font-semibold">
                  Warning: This TODA has registered member drivers in the database.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setTodaToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete TODA
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

