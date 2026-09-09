'use client';

import React, { useState } from 'react';
import { useMeedo } from '@/lib/store';
import { CemeteryBooking, BurialType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { CalendarDays, Plus, Trash2, Printer, MapPin, Clock } from 'lucide-react';

export default function CemeteryBookingsPage() {
  const { cemeteryBookings, addCemeteryBooking, deleteCemeteryBooking } = useMeedo();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deceasedName, setDeceasedName] = useState('');
  const [addressBarangay, setAddressBarangay] = useState('Poblacion');
  const [phone, setPhone] = useState('');
  const [burialDate, setBurialDate] = useState(new Date().toISOString().split('T')[0]);
  const [burialTime, setBurialTime] = useState('14:00');
  const [burialType, setBurialType] = useState<BurialType>('Apartment');
  const [amount, setAmount] = useState(2500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCemeteryBooking({
      deceased_name: deceasedName,
      address_barangay: addressBarangay,
      phone_number: phone,
      burial_date: burialDate,
      burial_time: burialTime,
      burial_type: burialType,
      amount,
    });
    setIsModalOpen(false);
    setDeceasedName('');
    setPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cemetery Booking Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Section C: Burial scheduling, plot allocations, and automated calendar notifications.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Book New Burial
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" /> Print Schedule
          </Button>
        </div>
      </div>

      {/* Bookings Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cemeteryBookings.map((b) => (
          <Card key={b.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-slate-900 text-sm">{b.deceased_name}</h4>
                <Badge variant="info">{b.burial_type}</Badge>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mt-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{formatDate(b.burial_date)}</span>
                  {b.burial_time && (
                    <span className="text-slate-500">at {b.burial_time}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Brgy. {b.address_barangay}</span>
                </div>

                {b.phone_number && (
                  <div className="text-[11px] text-slate-500">
                    Contact: <strong className="text-slate-700">{b.phone_number}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="font-bold text-emerald-700 text-xs">{formatCurrency(b.amount)}</span>
              <button
                onClick={() => b.id && deleteCemeteryBooking(b.id)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors no-print"
                title="Cancel booking"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Booking Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Burial Booking">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1">Name of the Deceased</label>
            <input
              type="text"
              required
              value={deceasedName}
              onChange={(e) => setDeceasedName(e.target.value)}
              placeholder="Full name of deceased"
              className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">Date of Burial</label>
              <input
                type="date"
                required
                value={burialDate}
                onChange={(e) => setBurialDate(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Time</label>
              <input
                type="time"
                value={burialTime}
                onChange={(e) => setBurialTime(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">Address (Barangay)</label>
              <input
                type="text"
                required
                value={addressBarangay}
                onChange={(e) => setAddressBarangay(e.target.value)}
                placeholder="e.g. Poblacion or Malandag"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Contact Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XX-XXX-XXXX"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">Burial Type</label>
              <select
                value={burialType}
                onChange={(e) => setBurialType(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
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
              <label className="block mb-1">Fee Amount (₱)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-blue-700"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
