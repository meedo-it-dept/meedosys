'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMeedo } from '@/lib/store';
import { CemeteryBooking, BurialType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateCemeteryInventory } from '@/lib/cemeteryUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  CalendarDays,
  Plus,
  Trash2,
  Printer,
  MapPin,
  Clock,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar as CalendarIcon,
  Search,
  AlertTriangle,
} from 'lucide-react';

export default function CemeteryBookingsPage() {
  const { cemeteryBookings, addCemeteryBooking, updateCemeteryBooking, deleteCemeteryBooking } = useMeedo();

  // Tab & Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [deceasedName, setDeceasedName] = useState('');
  const [addressBarangay, setAddressBarangay] = useState('Poblacion');
  const [phone, setPhone] = useState('');
  const [burialDate, setBurialDate] = useState(new Date().toISOString().split('T')[0]);
  const [burialTime, setBurialTime] = useState('14:00');
  const [burialType, setBurialType] = useState<BurialType>('Apartment');
  const [amount, setAmount] = useState<number>(2500);

  // Delete Confirmation State
  const [deleteCandidate, setDeleteCandidate] = useState<CemeteryBooking | null>(null);

  // Calendar States
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Table & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Inventory calculation for running balance & helper
  const inventory = useMemo(() => calculateCemeteryInventory(cemeteryBookings), [cemeteryBookings]);

  // Open Modal for New Booking
  const openNewModal = (selectedDate?: string) => {
    setEditingId(null);
    setDeceasedName('');
    setAddressBarangay('Poblacion');
    setPhone('');
    setBurialDate(selectedDate || new Date().toISOString().split('T')[0]);
    setBurialTime('14:00');
    setBurialType('Apartment');
    setAmount(2500);
    setIsModalOpen(true);
  };

  // Open Modal for Editing Booking
  const openEditModal = (booking: CemeteryBooking) => {
    setEditingId(booking.id || null);
    setDeceasedName(booking.deceased_name);
    setAddressBarangay(booking.address_barangay);
    setPhone(booking.phone_number || '');
    setBurialDate(booking.burial_date ? booking.burial_date.split('T')[0].split(' ')[0] : new Date().toISOString().split('T')[0]);
    setBurialTime(booking.burial_time || '14:00');
    setBurialType(booking.burial_type);
    setAmount(booking.amount);
    setIsModalOpen(true);
  };

  // Handle Form Submit (Add or Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!deceasedName.trim() || !burialDate) {
      alert('Name of deceased and burial date are required.');
      return;
    }

    if (editingId) {
      updateCemeteryBooking(editingId, {
        deceased_name: deceasedName.trim(),
        address_barangay: addressBarangay.trim(),
        phone_number: phone.trim(),
        burial_date: burialDate,
        burial_time: burialTime,
        burial_type: burialType,
        amount: Number(amount) || 0,
      });
    } else {
      addCemeteryBooking({
        deceased_name: deceasedName.trim(),
        address_barangay: addressBarangay.trim(),
        phone_number: phone.trim(),
        burial_date: burialDate,
        burial_time: burialTime,
        burial_type: burialType,
        amount: Number(amount) || 0,
      });
    }

    setIsModalOpen(false);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (deleteCandidate && deleteCandidate.id) {
      deleteCemeteryBooking(deleteCandidate.id);
      setDeleteCandidate(null);
    }
  };

  // Filtered & Paginated Table Data
  const filteredBookings = useMemo(() => {
    return cemeteryBookings.filter((b) => {
      const matchSearch =
        b.deceased_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.address_barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.phone_number && b.phone_number.includes(searchTerm));
      const matchType = filterType === 'All' || b.burial_type === filterType;
      return matchSearch && matchType;
    });
  }, [cemeteryBookings, searchTerm, filterType]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const currentPagedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  // Calendar Days Calculation
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const formattedMonth = String(month + 1).padStart(2, '0');
      const formattedDay = String(i).padStart(2, '0');
      days.push({
        day: i,
        isCurrentMonth: true,
        dateStr: `${year}-${formattedMonth}-${formattedDay}`,
      });
    }

    // Next month filler days (fill up to 35 or 42 cells)
    const remaining = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const formattedMonth = String(month + 2 > 12 ? 1 : month + 2).padStart(2, '0');
      const formattedDay = String(i).padStart(2, '0');
      const targetYear = month + 2 > 12 ? year + 1 : year;
      days.push({
        day: i,
        isCurrentMonth: false,
        dateStr: `${targetYear}-${formattedMonth}-${formattedDay}`,
      });
    }

    return days;
  }, [calendarDate]);

  // Group Bookings by Date string (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map: Record<string, CemeteryBooking[]> = {};
    cemeteryBookings.forEach((b) => {
      const dStr = b.burial_date ? b.burial_date.split('T')[0].split(' ')[0] : '';
      if (dStr) {
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push(b);
      }
    });
    return map;
  }, [cemeteryBookings]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* View Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Cemetery Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section C: Burial scheduling, plot allocations, and municipal records.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button variant="primary" size="sm" onClick={() => openNewModal()}>
            <Plus className="w-4 h-4 mr-1.5" /> Book New Burial
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" /> Print Schedule
          </Button>
        </div>
      </div>

      {/* Navigation Submenu Tabs matching Legacy Layout */}
      <div className="flex border-b border-slate-200 bg-slate-50/60 rounded-t-lg p-1 gap-1">
        <Link
          href="/cemetery/bookings"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-white text-emerald-700 shadow-sm border border-slate-200/80"
        >
          <CalendarIcon className="w-4 h-4 text-emerald-600" />
          Booking Schedule for Burial
        </Link>
        <Link
          href="/cemetery/reports"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors"
        >
          <CalendarDays className="w-4 h-4 text-slate-400" />
          Reports & Running Inventory
        </Link>
      </div>

      {/* Calendar Component Card */}
      <Card className="p-5 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              Burial Schedule Calendar
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any calendar day to schedule a new burial booking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCalendarDate(
                  new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
                )
              }
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800 text-sm min-w-[140px] text-center">
              {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() =>
                setCalendarDate(
                  new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
                )
              }
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCalendarDate(new Date())}
              className="text-xs ml-1"
            >
              Today
            </Button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-t-lg overflow-hidden text-center text-xs font-semibold text-slate-600">
          <div className="bg-slate-50 py-2 text-rose-600">Sun</div>
          <div className="bg-slate-50 py-2">Mon</div>
          <div className="bg-slate-50 py-2">Tue</div>
          <div className="bg-slate-50 py-2">Wed</div>
          <div className="bg-slate-50 py-2">Thu</div>
          <div className="bg-slate-50 py-2">Fri</div>
          <div className="bg-slate-50 py-2 text-emerald-700">Sat</div>
        </div>

        {/* Month Day Cells */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 border-x border-b border-slate-200 rounded-b-lg overflow-hidden">
          {calendarDays.map((cell, idx) => {
            const dayBookings = bookingsByDate[cell.dateStr] || [];
            const isToday =
              new Date().toISOString().split('T')[0] === cell.dateStr;

            return (
              <div
                key={idx}
                onClick={() => openNewModal(cell.dateStr)}
                className={`min-h-[90px] sm:min-h-[105px] p-1.5 flex flex-col justify-between transition-all cursor-pointer select-none ${
                  cell.isCurrentMonth
                    ? isToday
                      ? 'bg-emerald-50/50 hover:bg-emerald-100/50'
                      : 'bg-white hover:bg-slate-50'
                    : 'bg-slate-50/50 text-slate-300 hover:bg-slate-100/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : cell.isCurrentMonth
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-1 overflow-y-auto max-h-[60px]">
                  {dayBookings.slice(0, 2).map((b) => (
                    <div
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(b);
                      }}
                      className="text-[10px] truncate px-1.5 py-0.5 rounded font-medium bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-200 transition-colors"
                      title={`${b.deceased_name} (${b.burial_type}) - Click to edit`}
                    >
                      {b.burial_time && <span className="font-semibold">{b.burial_time} </span>}
                      {b.deceased_name}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-[9px] text-slate-500 font-semibold px-1">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Table Section Below Calendar */}
      <Card className="p-5 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Scheduled Burials Roster</h3>
            <p className="text-xs text-slate-500">
              Complete log of burial bookings with action controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deceased or barangay..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-56"
              />
            </div>

            {/* Burial Type Filter */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
            >
              <option value="All">All Burial Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Bone Vault">Bone Vault</option>
              <option value="Ground">Ground</option>
              <option value="Mausoleum">Mausoleum</option>
              <option value="Transfer of Cadaver">Transfer of Cadaver</option>
              <option value="Exhumation/Removal">Exhumation/Removal</option>
              <option value="Renewal">Renewal</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3.5">Name of the Deceased</th>
                <th className="py-3 px-3.5">Address</th>
                <th className="py-3 px-3.5">Phone number</th>
                <th className="py-3 px-3.5">Date of Burial</th>
                <th className="py-3 px-3.5">Burial Type</th>
                <th className="py-3 px-3.5 text-right">Amount (₱)</th>
                <th className="py-3 px-3.5 text-center no-print" style={{ width: '100px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPagedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No burial bookings found.
                  </td>
                </tr>
              ) : (
                currentPagedItems.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-900">{b.deceased_name}</td>
                    <td className="py-3 px-3.5 text-slate-600">Brgy. {b.address_barangay}</td>
                    <td className="py-3 px-3.5 text-slate-600 font-mono">{b.phone_number || '—'}</td>
                    <td className="py-3 px-3.5 text-slate-700">
                      <div className="font-semibold">{formatDate(b.burial_date)}</div>
                      {b.burial_time && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {b.burial_time}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <Badge variant={b.burial_type === 'Apartment' ? 'info' : 'neutral'}>
                        {b.burial_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-emerald-700">
                      {formatCurrency(b.amount)}
                    </td>
                    <td className="py-3 px-3.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Edit Booking"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(b)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 text-xs text-slate-600 no-print">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-800">
              {filteredBookings.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * itemsPerPage, filteredBookings.length)}
            </span>{' '}
            of <span className="font-bold text-slate-800">{filteredBookings.length}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>
            <span className="px-2 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Booking Modal (Create & Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Burial Booking' : 'New Burial Booking'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1 text-slate-800">Name of the Deceased *</label>
            <input
              type="text"
              required
              value={deceasedName}
              onChange={(e) => setDeceasedName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-800">Date of Burial *</label>
              <input
                type="date"
                required
                value={burialDate}
                onChange={(e) => setBurialDate(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-800">Time</label>
              <input
                type="time"
                value={burialTime}
                onChange={(e) => setBurialTime(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-800">Address (Barangay) *</label>
              <input
                type="text"
                required
                value={addressBarangay}
                onChange={(e) => setAddressBarangay(e.target.value)}
                placeholder="e.g. Poblacion or Malandag"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-800">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XX-XXX-XXXX"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-800">Burial Type *</label>
              <select
                value={burialType}
                onChange={(e) => setBurialType(e.target.value as BurialType)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Apartment">Apartment</option>
                <option value="Bone Vault">Bone Vault</option>
                <option value="Ground">Ground</option>
                <option value="Mausoleum">Mausoleum</option>
                <option value="Transfer of Cadaver">Transfer of Cadaver</option>
                <option value="Exhumation/Removal">Exhumation/Removal</option>
                <option value="Renewal">Renewal</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-slate-800">Fee Amount (₱) *</label>
              <input
                type="number"
                required
                min="0"
                step="50"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contextual Burial Type Helper Text matching Legacy exact wording */}
          {burialType === 'Apartment' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Apartment Running Balance:</strong> Currently{' '}
                  <span className="font-bold text-emerald-800">
                    {inventory.totalApartment}/{inventory.maxApartmentCapacity}
                  </span>{' '}
                  occupied ({inventory.availableApartment} available). Scheduling this booking will be{' '}
                  <strong>
                    Slot #{inventory.totalApartment + (editingId ? 0 : 1)}/
                    {inventory.maxApartmentCapacity}
                  </strong>{' '}
                  ({Math.max(0, inventory.availableApartment - (editingId ? 0 : 1))} remaining).
                </div>
              </div>
            </div>
          )}

          {burialType === 'Ground' && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Ground (Old Tomb):</strong> Currently{' '}
                  <span className="font-bold text-indigo-800">{inventory.totalGround}</span> logged.
                  Scheduling this booking will be{' '}
                  <strong>#{inventory.totalGround + (editingId ? 0 : 1)}</strong>. Ground capacity is{' '}
                  <strong>unlimited</strong>.
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingId ? 'Update Booking' : 'Save Booking'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        title="Delete Booking?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              Are you sure you want to delete the scheduled burial for{' '}
              <strong className="text-slate-900 font-bold">
                {deleteCandidate?.deceased_name}
              </strong>
              ? This action cannot be undone.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setDeleteCandidate(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleConfirmDelete}>
              Yes, delete it!
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
