'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { TodaMember } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Save, Printer, AlertTriangle, Edit2, Trash2, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function TodaMembersPage() {
  const { todas, todaMembers, addTodaMember, updateTodaMember, deleteTodaMember } = useMeedo();

  const [selectedTodaId, setSelectedTodaId] = useState(todas[0]?.id || '');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [extName, setExtName] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female'>('Male');
  const [barangay, setBarangay] = useState('Poblacion');
  const [municipality, setMunicipality] = useState('Malungon');
  const [contact, setContact] = useState('');
  const [idType, setIdType] = useState("Driver's License");
  const [idNumber, setIdNumber] = useState('');
  const [idExpiry, setIdExpiry] = useState('2026-12-31');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TodaMember | null>(null);

  const selectedToda = todas.find((t) => t.id === selectedTodaId) || todas[0];

  const filteredMembers = todaMembers.filter(
    (m) => !selectedTodaId || m.toda_id === selectedTodaId || m.toda_name === selectedToda?.name
  );

  const handleEdit = (m: TodaMember) => {
    setEditingMemberId(m.id || null);
    setLastName(m.last_name);
    setFirstName(m.first_name);
    setMiddleName(m.middle_name || '');
    setExtName(m.ext_name || '');
    setSex(m.sex);
    setBarangay(m.barangay);
    setMunicipality(m.municipality);
    setContact(m.contact_no || '');
    setIdType(m.id_type || "Driver's License");
    setIdNumber(m.id_number || '');
    setIdExpiry(m.id_expiry || '2026-12-31');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setLastName('');
    setFirstName('');
    setMiddleName('');
    setExtName('');
    setSex('Male');
    setBarangay('Poblacion');
    setMunicipality('Malungon');
    setContact('');
    setIdType("Driver's License");
    setIdNumber('');
    setIdExpiry('2026-12-31');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToda) return;

    if (editingMemberId) {
      updateTodaMember(editingMemberId, {
        toda_id: selectedToda.id,
        toda_name: selectedToda.name,
        last_name: lastName,
        first_name: firstName,
        middle_name: middleName,
        ext_name: extName,
        sex,
        barangay,
        municipality,
        contact_no: contact,
        id_type: idType,
        id_number: idNumber,
        id_expiry: idExpiry,
      });
      handleCancelEdit();
    } else {
      addTodaMember({
        toda_id: selectedToda.id,
        toda_name: selectedToda.name,
        last_name: lastName,
        first_name: firstName,
        middle_name: middleName,
        ext_name: extName,
        sex,
        barangay,
        municipality,
        contact_no: contact,
        id_type: idType,
        id_number: idNumber,
        id_expiry: idExpiry,
      });
      setLastName('');
      setFirstName('');
      setMiddleName('');
      setIdType("Driver's License");
      setIdNumber('');
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleConfirmDelete = () => {
    if (memberToDelete?.id) {
      deleteTodaMember(memberToDelete.id);
      if (editingMemberId === memberToDelete.id) {
        handleCancelEdit();
      }
      setMemberToDelete(null);
    }
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate).getTime() < new Date().getTime();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Driver Members Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section D: Association member profiling, franchise compliance, and driver license validity.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => window.print()} className="no-print">
          <Printer className="w-4 h-4 mr-1.5" /> Print Member List
        </Button>
      </div>

      {/* Association Picker */}
      <Card className="no-print">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Filter by TODA Association</label>
        <select
          value={selectedTodaId}
          onChange={(e) => setSelectedTodaId(e.target.value)}
          className="w-full md:w-96 text-sm px-3.5 py-2 border border-slate-300 rounded-lg bg-white"
        >
          {todas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.total_members} Members)
            </option>
          ))}
        </select>
      </Card>

      {/* Add / Edit Member Form */}
      <Card className="no-print bg-blue-50/40 border-blue-200">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            {editingMemberId ? (
              <span>
                Edit Member: <strong>{lastName}, {firstName}</strong>
              </span>
            ) : (
              <span>Add Driver Member to {selectedToda?.name}</span>
            )}
          </span>
          {editingMemberId && (
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
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
            <div className="col-span-2 sm:col-span-1">
              <label className="block mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Middle Name</label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Suffix (Jr/Sr)</label>
              <input
                type="text"
                value={extName}
                onChange={(e) => setExtName(e.target.value)}
                placeholder="Jr."
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block mb-1">Barangay Address</label>
              <input
                type="text"
                required
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Municipality</label>
              <input
                type="text"
                required
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Contact Number</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="09XX-XXX-XXXX"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block mb-1">Type of ID</label>
              <input
                type="text"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">ID / License Number</label>
              <input
                type="text"
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g. N02-14-123456"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
            <div>
              <label className="block mb-1">License Expiration Date</label>
              <input
                type="date"
                required
                value={idExpiry}
                onChange={(e) => setIdExpiry(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 items-center">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                {editingMemberId ? 'Member updated successfully!' : 'Member added successfully!'}
              </span>
            )}
            {editingMemberId && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="primary">
              <Save className="w-4 h-4 mr-1.5" /> {editingMemberId ? 'Update Driver Profile' : 'Save Driver Profile'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Driver Members Table */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm">
            Registered Drivers ({filteredMembers.length} Profiles)
          </h3>
          <span className="text-xs text-slate-500">{selectedToda?.name}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-2.5 px-3">Driver Name</th>
                <th className="py-2.5 px-3">Sex</th>
                <th className="py-2.5 px-3">Barangay</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">License Number</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center no-print whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m) => {
                const expired = isExpired(m.id_expiry);
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {m.last_name}, {m.first_name} {m.middle_name} {m.ext_name}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      <span className={m.sex === 'Female' ? 'text-pink-600 font-semibold' : 'text-slate-600'}>
                        {m.sex}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{m.barangay}</td>
                    <td className="py-2.5 px-3 text-slate-500">{m.contact_no || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{m.id_number}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {m.id_expiry ? formatDate(m.id_expiry) : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {expired ? (
                        <Badge variant="danger" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Expired
                        </Badge>
                      ) : (
                        <Badge variant="success">Valid</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center no-print whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(m)}
                          title="Edit Member"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberToDelete(m)}
                          title="Delete Member"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Alert */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white shadow-xl border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Delete Driver Member?</h4>
                <p className="text-xs text-slate-500">This action will remove the driver profile from this TODA.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">
                {memberToDelete.last_name}, {memberToDelete.first_name}
              </strong>{' '}
              ({memberToDelete.id_number})?
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setMemberToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Member
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
