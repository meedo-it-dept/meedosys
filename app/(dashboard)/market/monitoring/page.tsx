'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMeedo } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parseAdditionalInfo, MonitoringRecord } from '@/lib/types';
import { base64ToBlobUrl, formatFileSize } from '@/lib/documents';
import {
  CalendarCheck,
  Printer,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  MapPin,
  FileText,
  FileCheck,
  Eye,
  ExternalLink,
  Download,
  X,
  Maximize2,
  History,
  Store,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

function MonthlyMonitoringContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stallParam = searchParams.get('stall');

  const { stalls, monitoringRecords, addMonitoringRecord } = useMeedo();

  const [selectedStallNo, setSelectedStallNo] = useState(stallParam || '');
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
  const [remarks, setRemarks] = useState('');
  const [seminars, setSeminars] = useState<string[]>(['Food Safety & Sanitation 2024']);
  const [newSeminar, setNewSeminar] = useState('');
  const [showAckReceipt, setShowAckReceipt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Full-screen PDF viewer modal state
  const [fullViewPdf, setFullViewPdf] = useState<{
    url: string;
    title: string;
    filename: string;
  } | null>(null);

  // Sync selected stall if URL query parameter changes
  useEffect(() => {
    if (stallParam && stalls.length > 0) {
      setSelectedStallNo(stallParam);
    }
  }, [stallParam, stalls]);

  // Keep full-screen PDF keyboard accessible
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullViewPdf) {
        setFullViewPdf(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullViewPdf]);

  const stall = stalls.find(
    (s) => s.stall_no.toUpperCase() === selectedStallNo.toUpperCase()
  );

  const wetStalls = stalls.filter((s) => s.zone === 'wet');
  const dryStalls = stalls.filter((s) => s.zone === 'dry');
  const oldStalls = stalls.filter((s) => s.zone === 'old');
  const triangularStalls = stalls.filter((s) => s.zone === 'triangular');

  // Whenever a stall is selected, pre-populate from stall tenant & historical monitoring
  useEffect(() => {
    if (stall) {
      const tenant = stall.current_tenant;
      if (tenant) {
        const parsed = parseAdditionalInfo(tenant.additional_info);
        setClaygo(parsed.claygo);
        setCctv(parsed.cctv);
        setPalengqr(parsed.palengqr);
        setRemarks(parsed.customNotes || '');

        // If documents are attached, mark them active
        if (tenant.permit_doc_url) {
          setPermitNone(false);
          setPermitDate(new Date().toISOString().split('T')[0]);
        }
        if (tenant.lease_doc_url) {
          setLeaseNone(false);
          setLeaseDate(new Date().toISOString().split('T')[0]);
        }
      } else {
        setClaygo('No');
        setCctv('No');
        setPalengqr('No');
        setRemarks('');
      }

      // Check if stall has previous monitoring entry
      const past = monitoringRecords.find((m) => m.stall_no === stall.stall_no);
      if (past) {
        setGoodwill(past.goodwill || 0);
        setOpStatus(past.operational_status || 'Operational');
        if (past.seminars_attended && past.seminars_attended.length > 0) {
          setSeminars(past.seminars_attended);
        }
      }
    }
  }, [selectedStallNo, stall, monitoringRecords]);

  const handleAddSeminar = () => {
    if (newSeminar.trim()) {
      setSeminars([...seminars, newSeminar.trim()]);
      setNewSeminar('');
    }
  };

  const handleRemoveSeminar = (index: number) => {
    setSeminars(seminars.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStallNo) return;

    setIsSaving(true);
    try {
      const record: MonitoringRecord = {
        stall_no: selectedStallNo,
        monitoring_date: monDate,
        goodwill,
        operational_status: opStatus,
        permit_submitted: !permitNone,
        permit_date: permitNone ? undefined : permitDate,
        lease_submitted: !leaseNone,
        lease_date: leaseNone ? undefined : leaseDate,
        rental_paid: !rentalNone,
        rental_or: rentalNone ? undefined : rentalOr,
        claygo_compliant: claygo,
        cctv_available: cctv,
        palengqr_implemented: palengqr,
        seminars_attended: seminars,
        remarks,
      };

      await addMonitoringRecord(record);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save monitoring entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const stallMonitoringHistory = monitoringRecords.filter(
    (m) => !selectedStallNo || m.stall_no.toUpperCase() === selectedStallNo.toUpperCase()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Stall Monitoring</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational compliance tracking, DILG/LGU sanitation indicators, and tenant acknowledgement receipts.
          </p>
        </div>

        {selectedStallNo && (
          <div className="flex items-center gap-2 no-print flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/market/map?stall=${selectedStallNo}`)}
              className="text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <Store className="w-4 h-4 mr-1.5 text-blue-600" />
              View in Market Blueprint
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAckReceipt(!showAckReceipt)}
            >
              <Printer className="w-4 h-4 mr-1.5 text-slate-600" />
              {showAckReceipt ? 'Hide Receipt' : 'Acknowledgement Receipt'}
            </Button>
          </div>
        )}
      </div>

      {/* Stall Selector & Cross-Module Context Card */}
      <Card className="no-print p-4 sm:p-5 w-full min-w-0 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
          <div className="w-full flex-1 max-w-xl min-w-0">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Select Stall to Monitor
            </label>
            <div className="flex items-center gap-2 w-full min-w-0">
              <select
                value={selectedStallNo}
                onChange={(e) => {
                  setSelectedStallNo(e.target.value);
                  if (e.target.value) {
                    router.replace(`/market/monitoring?stall=${e.target.value}`);
                  } else {
                    router.replace('/market/monitoring');
                  }
                }}
                className="flex-1 w-full min-w-0 max-w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 truncate"
              >
                <option value="">Select a stall...</option>
                {wetStalls.length > 0 && (
                  <optgroup label="🏬 Wet Section">
                    {wetStalls.map((s) => (
                      <option key={s.stall_no} value={s.stall_no}>
                        {s.stall_no} — {s.current_tenant?.stall_owner || 'Vacant'}
                      </option>
                    ))}
                  </optgroup>
                )}
                {dryStalls.length > 0 && (
                  <optgroup label="👕 Dry Goods">
                    {dryStalls.map((s) => (
                      <option key={s.stall_no} value={s.stall_no}>
                        {s.stall_no} — {s.current_tenant?.stall_owner || 'Vacant'}
                      </option>
                    ))}
                  </optgroup>
                )}
                {oldStalls.length > 0 && (
                  <optgroup label="🏛️ Old Building">
                    {oldStalls.map((s) => (
                      <option key={s.stall_no} value={s.stall_no}>
                        {s.stall_no} — {s.current_tenant?.stall_owner || 'Vacant'}
                      </option>
                    ))}
                  </optgroup>
                )}
                {triangularStalls.length > 0 && (
                  <optgroup label="📐 Triangular">
                    {triangularStalls.map((s) => (
                      <option key={s.stall_no} value={s.stall_no}>
                        {s.stall_no} — {s.current_tenant?.stall_owner || 'Vacant'}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {selectedStallNo && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/market/map?stall=${selectedStallNo}`)}
                  title="Open stall in Market Layout side drawer"
                  className="shrink-0 text-xs px-2.5 sm:px-3"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Blueprint
                </Button>
              )}
            </div>
          </div>

          {stall && stall.current_tenant && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/90 rounded-xl w-full md:w-auto min-w-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                {stall.current_tenant.stall_owner.charAt(0) || 'T'}
              </div>
              <div className="text-xs min-w-0">
                <div className="font-bold text-slate-900 truncate">
                  {stall.current_tenant.stall_owner}
                </div>
                <div className="text-slate-500 truncate">
                  {stall.current_tenant.line_of_business || 'General Merchandise'} • {stall.zone.toUpperCase()}
                </div>
              </div>
              <Badge
                variant={stall.current_tenant.compliance_status === 'Compliant' ? 'success' : 'warning'}
                className="shrink-0 ml-auto"
              >
                {stall.current_tenant.compliance_status}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* PRINTABLE ACKNOWLEDGEMENT RECEIPT */}
      {showAckReceipt && stall && (
        <Card className="print-container border-2 border-slate-300 p-4 sm:p-8 max-w-xl mx-auto bg-white shadow-lg w-full min-w-0 overflow-hidden">
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900">
              Municipality of Malungon
            </h1>
            <h2 className="text-[11px] sm:text-xs font-semibold uppercase text-slate-600">
              Municipal Economic Enterprise Development Office (MEEDO)
            </h2>
            <p className="text-base sm:text-lg font-black mt-2 text-blue-900 uppercase">
              Acknowledgement Receipt
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-100 py-1.5 flex-wrap gap-1">
              <span className="text-slate-500 font-semibold">Date of Inspection:</span>
              <strong className="text-slate-800">{monDate}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5 flex-wrap gap-1">
              <span className="text-slate-500 font-semibold">Stall Number:</span>
              <strong className="text-slate-800">{stall.stall_no}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5 flex-wrap gap-1">
              <span className="text-slate-500 font-semibold">Stall Tenant / Owner:</span>
              <strong className="text-slate-800">{stall.current_tenant?.stall_owner || 'N/A'}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5 flex-wrap gap-1">
              <span className="text-slate-500 font-semibold">Line of Business:</span>
              <span className="text-slate-800">{stall.current_tenant?.line_of_business || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5 flex-wrap gap-1">
              <span className="text-slate-500 font-semibold">CLAYGO Compliance:</span>
              <Badge variant={claygo === 'Yes' ? 'success' : 'danger'}>{claygo || 'No'}</Badge>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5 flex-wrap gap-1">
              <span className="text-slate-500 font-semibold">CCTV Available:</span>
              <Badge variant={cctv === 'Yes' ? 'success' : 'danger'}>{cctv || 'No'}</Badge>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5 flex-wrap gap-1">
              <span className="text-slate-500 font-semibold">Paleng-QR Ph Implemented:</span>
              <Badge variant={palengqr === 'Yes' ? 'success' : 'danger'}>{palengqr || 'No'}</Badge>
            </div>
            {remarks && (
              <div className="flex justify-between border-b border-slate-100 py-1.5 flex-wrap gap-1">
                <span className="text-slate-500 font-semibold">Inspector Remarks:</span>
                <span className="text-slate-800 font-medium italic">{remarks}</span>
              </div>
            )}
          </div>

          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between gap-6 text-center text-xs">
            <div>
              <div className="w-36 sm:w-40 border-b border-slate-800 pb-1 mx-auto mb-1">
                {stall.current_tenant?.stall_owner || 'Tenant'}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">Tenant Signature</span>
            </div>
            <div>
              <div className="w-36 sm:w-40 border-b border-slate-800 pb-1 mx-auto mb-1 font-bold">
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
        <form onSubmit={handleSave} className="space-y-6 no-print w-full min-w-0 max-w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
            {/* General Info */}
            <Card className="min-w-0 overflow-hidden">
              <h3 className="font-bold text-slate-800 text-sm mb-3">General Information</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Monitoring</label>
                  <input
                    type="date"
                    value={monDate}
                    onChange={(e) => setMonDate(e.target.value)}
                    required
                    className="w-full min-w-0 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Goodwill Balance (₱)</label>
                  <input
                    type="number"
                    value={goodwill}
                    onChange={(e) => setGoodwill(parseFloat(e.target.value) || 0)}
                    className="w-full min-w-0 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operational Status</label>
                  <select
                    value={opStatus}
                    onChange={(e) => setOpStatus(e.target.value as any)}
                    className="w-full min-w-0 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Non-Operational">Non-Operational</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Compliance & Permits */}
            <Card className="min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm">Permits & Payments</h3>
                <span
                  onClick={() => router.push(`/market/map?stall=${selectedStallNo}`)}
                  className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline"
                >
                  Manage PDFs →
                </span>
              </div>
              <div className="space-y-3.5 text-xs">
                {/* Business Permit */}
                <div>
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      <label className="font-semibold text-slate-700">Mayor&apos;s Permit</label>
                      {stall?.current_tenant?.permit_doc_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setFullViewPdf({
                              url: stall.current_tenant!.permit_doc_url!,
                              title: `Mayor's Business Permit — Stall ${stall.stall_no}`,
                              filename: stall.current_tenant!.permit_doc_name || `Mayors_Permit_${stall.stall_no}.pdf`,
                            })
                          }
                          className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] hover:bg-emerald-100 flex items-center gap-1"
                          title="View attached Mayor's Permit PDF"
                        >
                          <Eye className="w-3 h-3" /> View PDF
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No PDF attached</span>
                      )}
                    </div>
                    <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer whitespace-nowrap">
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
                    className="w-full min-w-0 text-sm px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>

                {/* Contract of Lease */}
                <div>
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      <label className="font-semibold text-slate-700">Contract of Lease</label>
                      {stall?.current_tenant?.lease_doc_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setFullViewPdf({
                              url: stall.current_tenant!.lease_doc_url!,
                              title: `Contract of Lease — Stall ${stall.stall_no}`,
                              filename: stall.current_tenant!.lease_doc_name || `Contract_of_Lease_${stall.stall_no}.pdf`,
                            })
                          }
                          className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] hover:bg-blue-100 flex items-center gap-1"
                          title="View attached Contract of Lease PDF"
                        >
                          <Eye className="w-3 h-3" /> View PDF
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No PDF attached</span>
                      )}
                    </div>
                    <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer whitespace-nowrap">
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
                    className="w-full min-w-0 text-sm px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>

                {/* Stall Rental */}
                <div>
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                    <label className="font-semibold text-slate-700">Stall Rental (O.R. No.)</label>
                    <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer whitespace-nowrap">
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
                    className="w-full min-w-0 text-sm px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>
              </div>
            </Card>

            {/* Operational Sanitation & Digital Checklist */}
            <Card className="min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Operational Sanitation
                </h3>
                <span className="text-[10px] uppercase font-bold text-slate-400">DILG Standards</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CLAYGO Compliance</label>
                  <select
                    value={claygo}
                    onChange={(e) => setClaygo(e.target.value as any)}
                    className="w-full min-w-0 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Yes">Yes (Compliant)</option>
                    <option value="No">No (Non-Compliant)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CCTV Available</label>
                  <select
                    value={cctv}
                    onChange={(e) => setCctv(e.target.value as any)}
                    className="w-full min-w-0 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Yes">Yes (Installed)</option>
                    <option value="No">No (None)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paleng-QR Ph Active</label>
                  <select
                    value={palengqr}
                    onChange={(e) => setPalengqr(e.target.value as any)}
                    className="w-full min-w-0 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Yes">Yes (Active QR)</option>
                    <option value="No">No (Inactive)</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Remarks & Observations Card */}
          <Card>
            <h3 className="font-bold text-slate-800 text-sm mb-2">Inspector Observations & Remarks</h3>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Notes on sanitation conditions, compliance deadlines, verbal warnings, or lease remarks..."
              className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-normal"
            />
          </Card>

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

          {/* Action Row */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              {savedSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-200 font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Monitoring entry logged & synchronized to Supabase!
                  <button
                    type="button"
                    onClick={() => router.push(`/market/map?stall=${selectedStallNo}`)}
                    className="ml-2 text-blue-700 hover:underline flex items-center gap-1"
                  >
                    View in Blueprint →
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/market/map?stall=${selectedStallNo}`)}
              >
                <Store className="w-4 h-4 mr-1.5 text-blue-600" /> Back to Blueprint
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                <Save className="w-4 h-4 mr-1.5" />
                {isSaving ? 'Saving...' : 'Save Monitoring Entry'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* RECENT INSPECTION LOGS TABLE */}
      {stallMonitoringHistory.length > 0 && (
        <Card className="no-print space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              Inspection Log & Audit Trail ({stallMonitoringHistory.length})
            </h3>
            <span className="text-[11px] text-slate-500">Live synced with Supabase</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Stall No</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">CLAYGO</th>
                  <th className="py-2.5 px-3">CCTV</th>
                  <th className="py-2.5 px-3">Paleng-QR</th>
                  <th className="py-2.5 px-3">Goodwill</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stallMonitoringHistory.slice(0, 10).map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {formatDate(m.monitoring_date)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-blue-700">{m.stall_no}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={m.operational_status === 'Operational' ? 'success' : 'danger'}>
                        {m.operational_status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={m.claygo_compliant === 'Yes' ? 'success' : 'danger'}>
                        {m.claygo_compliant || 'No'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={m.cctv_available === 'Yes' ? 'success' : 'neutral'}>
                        {m.cctv_available || 'No'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={m.palengqr_implemented === 'Yes' ? 'success' : 'neutral'}>
                        {m.palengqr_implemented || 'No'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{formatCurrency(m.goodwill || 0)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/market/map?stall=${m.stall_no}`)}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                      >
                        Inspect Stall →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* FULL VIEW PDF MODAL */}
      {fullViewPdf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {fullViewPdf.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate font-mono">
                    {fullViewPdf.filename}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const blobUrl = base64ToBlobUrl(fullViewPdf.url);
                    window.open(blobUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  title="Open PDF in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Tab</span>
                </button>

                <a
                  href={base64ToBlobUrl(fullViewPdf.url)}
                  download={fullViewPdf.filename}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  title="Download PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <button
                  type="button"
                  onClick={() => setFullViewPdf(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                  title="Close PDF viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF iframe viewer */}
            <div className="flex-1 bg-slate-800 relative min-h-0">
              <iframe
                src={`${base64ToBlobUrl(fullViewPdf.url)}#toolbar=1&navpanes=1`}
                className="w-full h-full border-0"
                title={fullViewPdf.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MonthlyMonitoringPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-semibold text-sm">
          Loading Monthly Stall Monitoring...
        </div>
      }
    >
      <MonthlyMonitoringContent />
    </Suspense>
  );
}
