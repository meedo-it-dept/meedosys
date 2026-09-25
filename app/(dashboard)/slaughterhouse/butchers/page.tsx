'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMeedo } from '@/lib/store';
import { ButcherProfile } from '@/lib/types';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Filter,
  Beef,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  FileText,
  Building2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  X,
} from '@/components/icons';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const SPECIALIZATIONS = [
  'General',
  'Hogs / Swine',
  'Cattle / Large Animals',
  'Small Ruminants',
  'Poultry',
] as const;

export default function ButcherProfilesPage() {
  const { butchers, addButcher, updateButcher, deleteButcher, resetButchers, slaughterRecords } =
    useMeedo();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [specFilter, setSpecFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingButcher, setEditingButcher] = useState<ButcherProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    butcher_code: string;
    name: string;
    contact_no: string;
    address_barangay: string;
    specialization: ButcherProfile['specialization'];
    health_card_no: string;
    health_card_expiry: string;
    status: 'Active' | 'Inactive';
    remarks: string;
  }>({
    butcher_code: '',
    name: '',
    contact_no: '',
    address_barangay: 'Poblacion',
    specialization: 'General',
    health_card_no: '',
    health_card_expiry: '',
    status: 'Active',
    remarks: '',
  });

  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Open modal for add
  const handleOpenAddModal = () => {
    const nextNum = butchers.length + 1;
    const autoCode = `BTC-${String(nextNum).padStart(3, '0')}`;
    setEditingButcher(null);
    setFormData({
      butcher_code: autoCode,
      name: '',
      contact_no: '',
      address_barangay: 'Poblacion',
      specialization: 'General',
      health_card_no: '',
      health_card_expiry: '',
      status: 'Active',
      remarks: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (b: ButcherProfile) => {
    setEditingButcher(b);
    setFormData({
      butcher_code: b.butcher_code,
      name: b.name,
      contact_no: b.contact_no || '',
      address_barangay: b.address_barangay || 'Poblacion',
      specialization: b.specialization,
      health_card_no: b.health_card_no || '',
      health_card_expiry: b.health_card_expiry || '',
      status: b.status,
      remarks: b.remarks || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveButcher = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Butcher full name is required.');
      return;
    }

    if (!formData.butcher_code.trim()) {
      setFormError('Butcher code is required.');
      return;
    }

    const todayFormatted = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (editingButcher) {
      updateButcher(editingButcher.id, {
        butcher_code: formData.butcher_code.trim(),
        name: formData.name.trim(),
        contact_no: formData.contact_no.trim() || undefined,
        address_barangay: formData.address_barangay.trim() || undefined,
        specialization: formData.specialization,
        health_card_no: formData.health_card_no.trim() || undefined,
        health_card_expiry: formData.health_card_expiry || undefined,
        status: formData.status,
        remarks: formData.remarks.trim() || undefined,
      });
      showToast(`Butcher profile for "${formData.name.trim()}" updated successfully.`);
    } else {
      addButcher({
        butcher_code: formData.butcher_code.trim(),
        name: formData.name.trim(),
        contact_no: formData.contact_no.trim() || undefined,
        address_barangay: formData.address_barangay.trim() || undefined,
        specialization: formData.specialization,
        health_card_no: formData.health_card_no.trim() || undefined,
        health_card_expiry: formData.health_card_expiry || undefined,
        status: formData.status,
        date_registered: todayFormatted,
        remarks: formData.remarks.trim() || undefined,
      });
      showToast(`New butcher "${formData.name.trim()}" accredited successfully.`);
    }

    setIsModalOpen(false);
  };

  // Count livestocks slaughtered per butcher
  const slaughterCountsByButcher = useMemo(() => {
    const counts: Record<string, { totalHeads: number; batches: number }> = {};
    slaughterRecords.forEach((r) => {
      const bKey = r.butcher_id || r.butcher_name;
      if (bKey) {
        if (!counts[bKey]) counts[bKey] = { totalHeads: 0, batches: 0 };
        counts[bKey].totalHeads += r.head_count || 1;
        counts[bKey].batches += 1;
      }
    });
    return counts;
  }, [slaughterRecords]);

  // Filtered Butchers
  const filteredButchers = useMemo(() => {
    return butchers.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (specFilter !== 'ALL' && b.specialization !== specFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          b.name.toLowerCase().includes(q) ||
          b.butcher_code.toLowerCase().includes(q) ||
          (b.contact_no && b.contact_no.toLowerCase().includes(q)) ||
          (b.address_barangay && b.address_barangay.toLowerCase().includes(q)) ||
          (b.health_card_no && b.health_card_no.toLowerCase().includes(q)) ||
          b.specialization.toLowerCase().includes(q) ||
          (b.remarks && b.remarks.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [butchers, statusFilter, specFilter, searchQuery]);

  // Statistics
  const totalCount = butchers.length;
  const activeCount = butchers.filter((b) => b.status === 'Active').length;
  const certifiedCount = butchers.filter((b) => b.health_card_no && b.health_card_no.trim()).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold">{toastMsg}</p>
            <p className="text-[11px] text-slate-400">Slaughterhouse roster updated.</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm text-rose-200 border border-white/10">
                <Beef className="w-3.5 h-3.5 text-rose-300" />
                Section B: Slaughterhouse Operations
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-200">
                Malungon Municipal Abattoir
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Butcher Profiles &amp; Accreditation Roster
            </h1>
            <p className="text-rose-100 text-xs md:text-sm max-w-2xl leading-relaxed">
              Official municipal directory of accredited butchers, health compliance certifications, animal evisceration specializations, and operational assignments for livestock slaughter intake.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleOpenAddModal}
              className="bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs h-11 px-5 rounded-xl shadow-lg shadow-black/10 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-rose-700" />
              <span>Register New Butcher</span>
            </Button>

            <Link
              href="/slaughterhouse"
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-rose-100 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <Beef className="w-4 h-4 text-rose-300" />
              <span>Log Livestock Records</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Accredited
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
              <span className="text-xs text-slate-500 font-medium">Registered butchers</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active On-Duty
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-emerald-700">{activeCount}</span>
              <span className="text-xs text-emerald-600 font-medium">Eligible for intake</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Health Certified
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-blue-700">{certifiedCount}</span>
              <span className="text-xs text-blue-600 font-medium">Valid health cards</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Specialized Lines
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-purple-700">4</span>
              <span className="text-xs text-purple-600 font-medium">Swine, Cattle, Goat, Poultry</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
            <Beef className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Roster Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search butcher name, code, contact, or health card..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer py-1 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Specialization Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Beef className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={specFilter}
                onChange={(e) => setSpecFilter(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer py-1 text-xs"
              >
                <option value="ALL">All Specializations</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {(searchQuery || statusFilter !== 'ALL' || specFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSpecFilter('ALL');
                }}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
              >
                Reset
              </button>
            )}

            <Button
              onClick={handleOpenAddModal}
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-3 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Butcher
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Butcher Name &amp; Contact</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Barangay</th>
                <th className="py-3 px-4">Health Card Compliance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Livestock Logged</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredButchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No accredited butchers found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Adjust your filter criteria or click &quot;Register New Butcher&quot; to enroll personnel.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredButchers.map((b) => {
                  const activity = slaughterCountsByButcher[b.id] || slaughterCountsByButcher[b.name] || { totalHeads: 0, batches: 0 };
                  return (
                    <tr key={b.id} className="hover:bg-rose-50/20 transition-colors group">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {b.butcher_code}
                        </span>
                      </td>

                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{b.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {b.contact_no || <span className="text-slate-400 italic">No mobile phone</span>}
                        </div>
                      </td>

                      {/* Specialization */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200 text-[10px]">
                          {b.specialization}
                        </span>
                      </td>

                      {/* Barangay */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {b.address_barangay || 'Poblacion'}
                      </td>

                      {/* Health Card */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {b.health_card_no ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-semibold text-slate-800 text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{b.health_card_no}</span>
                            </div>
                            {b.health_card_expiry && (
                              <div className="text-[10px] text-slate-500">
                                Expires: {b.health_card_expiry}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Pending Card
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = b.status === 'Active' ? 'Inactive' : 'Active';
                            updateButcher(b.id, { status: newStatus });
                            showToast(`Status updated to ${newStatus} for ${b.name}`);
                          }}
                          title="Click to toggle Active / Inactive"
                          className="cursor-pointer"
                        >
                          {b.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200">
                              <UserX className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Slaughter Activity */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 text-xs">{activity.totalHeads}</span>{' '}
                        <span className="text-[11px] text-slate-500 font-medium">heads</span>
                        <div className="text-[10px] text-slate-400">({activity.batches} batches)</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(b)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Butcher Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(b.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Butcher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total accredited roster: <strong className="text-slate-800">{butchers.length} butchers</strong>
          </span>
          <span className="text-[11px] text-slate-400">
            Malungon Slaughterhouse Section B
          </span>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            role="dialog"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingButcher ? 'Edit Butcher Profile' : 'Accredit New Butcher'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Municipal abattoir personnel and health certification record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveButcher} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Butcher Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.butcher_code}
                    onChange={(e) => setFormData({ ...formData, butcher_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  >
                    <option value="Active">Active (On Duty)</option>
                    <option value="Inactive">Inactive (Off Roster)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Danilo 'Danny' Fernandez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Contact Number</label>
                  <input
                    type="text"
                    placeholder="0917-123-4567"
                    value={formData.contact_no}
                    onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Address / Barangay</label>
                  <input
                    type="text"
                    placeholder="e.g. Poblacion, Malungon"
                    value={formData.address_barangay}
                    onChange={(e) => setFormData({ ...formData, address_barangay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Livestock Specialization</label>
                <select
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                >
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-3">
                <div className="text-[11px] font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  Sanitary &amp; Health Card Compliance
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600 font-semibold">Health Card #</label>
                    <input
                      type="text"
                      placeholder="e.g. HC-2026-0812"
                      value={formData.health_card_no}
                      onChange={(e) => setFormData({ ...formData, health_card_no: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600 font-semibold">Card Expiry Date</label>
                    <input
                      type="date"
                      value={formData.health_card_expiry}
                      onChange={(e) => setFormData({ ...formData, health_card_expiry: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Remarks / Certifications</label>
                <textarea
                  rows={2}
                  placeholder="e.g. NMIS certified, years of experience, shift assignment notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {editingButcher ? 'Update Butcher' : 'Accredit Butcher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Remove Butcher Profile?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this butcher from the accredited registry? Historic slaughter records will retain the butcher name.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteButcher(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('Butcher removed from roster.');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
