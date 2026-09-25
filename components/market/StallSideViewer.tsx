'use client';

import React, { useState, useEffect } from 'react';
import { Stall, StallTenant, ComplianceStatus } from '@/lib/types';
import { useMeedo } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  base64ToBlobUrl,
  readFileAsDataUrl,
  formatFileSize,
  storeDocumentInDB,
  getDocumentFromDB,
} from '@/lib/documents';
import {
  Store,
  FileText,
  History,
  Edit,
  Plus,
  Save,
  Camera,
  User,
  FileCheck,
  Zap,
  X,
  CheckCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Upload,
  Maximize2,
  ExternalLink,
  Download,
  Trash2,
  Eye,
  FileWarning,
} from 'lucide-react';

interface StallSideViewerProps {
  stall: Stall | null;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_PHOTO_BYTES = 1 * 1024 * 1024; // 1 MB (1,048,576 bytes)

export const StallSideViewer: React.FC<StallSideViewerProps> = ({ stall, isOpen, onClose }) => {
  const { updateStallTenant, addStallTenant } = useMeedo();

  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tenant profile fields
  const tenant = stall?.current_tenant;
  const [owner, setOwner] = useState(tenant?.stall_owner || '');
  const [operator, setOperator] = useState(tenant?.operator || '');
  const [lob, setLob] = useState(tenant?.line_of_business || '');
  const [period, setPeriod] = useState(tenant?.period_index || 1);
  const [compliance, setCompliance] = useState<ComplianceStatus>(tenant?.compliance_status || 'Non-Compliant');
  const [extraInfo, setExtraInfo] = useState(tenant?.additional_info || '');

  // Profile photo state (< 1MB enforced)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSize, setPhotoSize] = useState<number | null>(null);

  // Contract of Lease PDF state
  const [leaseDocUrl, setLeaseDocUrl] = useState<string | null>(null);
  const [leaseDocName, setLeaseDocName] = useState<string | null>(null);
  const [leaseDocSize, setLeaseDocSize] = useState<number | null>(null);
  const [leaseDocError, setLeaseDocError] = useState<string | null>(null);

  // Mayor's Business Permit PDF state
  const [permitDocUrl, setPermitDocUrl] = useState<string | null>(null);
  const [permitDocName, setPermitDocName] = useState<string | null>(null);
  const [permitDocSize, setPermitDocSize] = useState<number | null>(null);
  const [permitDocError, setPermitDocError] = useState<string | null>(null);

  // Full-screen PDF viewer modal state
  const [fullViewPdf, setFullViewPdf] = useState<{
    url: string;
    title: string;
    filename: string;
  } | null>(null);

  // Reset form when selected stall changes
  useEffect(() => {
    if (stall) {
      const cur = stall.current_tenant;
      setOwner(cur?.stall_owner || '');
      setOperator(cur?.operator || '');
      setLob(cur?.line_of_business || '');
      setPeriod(cur?.period_index || 1);
      setCompliance(cur?.compliance_status || 'Non-Compliant');
      setExtraInfo(cur?.additional_info || '');

      setPhotoUrl(cur?.photo_url || null);
      setPhotoError(null);
      setPhotoSize(null);

      setLeaseDocUrl(cur?.lease_doc_url || null);
      setLeaseDocName(cur?.lease_doc_name || (cur?.lease_doc_url ? 'Contract_of_Lease.pdf' : null));
      setLeaseDocSize(null);
      setLeaseDocError(null);

      setPermitDocUrl(cur?.permit_doc_url || null);
      setPermitDocName(cur?.permit_doc_name || (cur?.permit_doc_url ? 'Mayors_Business_Permit.pdf' : null));
      setPermitDocSize(null);
      setPermitDocError(null);

      setFullViewPdf(null);
      setIsEditing(false);
      setIsAdding(false);
      setSaveSuccess(false);

      // Check IndexedDB cache for documents if missing in current tenant
      if (stall.stall_no) {
        if (!cur?.lease_doc_url) {
          getDocumentFromDB(`lease_${stall.stall_no}`).then((cached) => {
            if (cached) {
              setLeaseDocUrl(cached);
              setLeaseDocName('Contract_of_Lease.pdf');
            }
          });
        }
        if (!cur?.permit_doc_url) {
          getDocumentFromDB(`permit_${stall.stall_no}`).then((cached) => {
            if (cached) {
              setPermitDocUrl(cached);
              setPermitDocName('Mayors_Business_Permit.pdf');
            }
          });
        }
      }
    }
  }, [stall]);

  // Handle Escape key to close Full View modal first, then drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullViewPdf) {
          setFullViewPdf(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullViewPdf, isOpen, onClose]);

  // 1. Handle profile image upload with strict < 1MB enforcement
  const handleImageUpload = (file: File) => {
    setPhotoError(null);

    // Validation: Image type only
    if (!file.type.startsWith('image/')) {
      setPhotoError('Invalid file type. Please upload a valid image (JPG, PNG, or WebP).');
      return;
    }

    // Validation: Enforce strictly less than 1MB
    if (file.size > MAX_PHOTO_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setPhotoError(`Selected file is ${sizeMb} MB. Profile photo must be less than 1 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 500; // Optimal high-res square avatar

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedData = canvas.toDataURL('image/jpeg', 0.88);
          setPhotoUrl(compressedData);
          setPhotoSize(file.size);
          if (stall) {
            storeDocumentInDB(`photo_${stall.stall_no}`, compressedData);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 2. Handle Contract of Lease PDF upload
  const handleLeaseUpload = async (file: File) => {
    setLeaseDocError(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setLeaseDocError('Invalid document format. Please upload a PDF file (.pdf) for the Contract of Lease.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setLeaseDocError('Document exceeds 15 MB limit. Please select an optimized PDF.');
      return;
    }

    try {
      const { dataUrl, name, size } = await readFileAsDataUrl(file);
      setLeaseDocUrl(dataUrl);
      setLeaseDocName(name);
      setLeaseDocSize(size);
      if (stall) {
        storeDocumentInDB(`lease_${stall.stall_no}`, dataUrl);
      }
    } catch {
      setLeaseDocError('Failed to process PDF document. Please try again.');
    }
  };

  // 3. Handle Mayor's Business Permit PDF upload
  const handlePermitUpload = async (file: File) => {
    setPermitDocError(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPermitDocError('Invalid document format. Please upload a PDF file (.pdf) for Mayor\'s Business Permit.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setPermitDocError('Document exceeds 15 MB limit. Please select an optimized PDF.');
      return;
    }

    try {
      const { dataUrl, name, size } = await readFileAsDataUrl(file);
      setPermitDocUrl(dataUrl);
      setPermitDocName(name);
      setPermitDocSize(size);
      if (stall) {
        storeDocumentInDB(`permit_${stall.stall_no}`, dataUrl);
      }
    } catch {
      setPermitDocError('Failed to process PDF document. Please try again.');
    }
  };

  if (!isOpen || !stall) return null;

  const handleSave = () => {
    // Automatically suggest compliant status if both lease and permit PDFs are attached
    const resolvedCompliance =
      Boolean(leaseDocUrl) && Boolean(permitDocUrl) ? 'Compliant' : compliance;

    if (isAdding) {
      const newTenant: StallTenant = {
        stall_no: stall.stall_no,
        stall_owner: owner,
        operator: operator || owner,
        line_of_business: lob,
        period_index: (tenant?.period_index || 0) + 1,
        year: new Date().getFullYear(),
        compliance_status: resolvedCompliance,
        additional_info: extraInfo,
        photo_url: photoUrl,
        lease_doc_url: leaseDocUrl,
        permit_doc_url: permitDocUrl,
        lease_doc_name: leaseDocName,
        permit_doc_name: permitDocName,
      };
      addStallTenant(stall.stall_no, newTenant);
    } else {
      updateStallTenant(stall.stall_no, {
        stall_owner: owner,
        operator,
        line_of_business: lob,
        period_index: period,
        compliance_status: resolvedCompliance,
        additional_info: extraInfo,
        photo_url: photoUrl,
        lease_doc_url: leaseDocUrl,
        permit_doc_url: permitDocUrl,
        lease_doc_name: leaseDocName,
        permit_doc_name: permitDocName,
      });
    }

    setCompliance(resolvedCompliance);
    setIsEditing(false);
    setIsAdding(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const isOccupied = stall.status === 'Occupied' || Boolean(owner);

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Side Viewer Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label={`Stall ${stall.stall_no} Details`}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  Stall {stall.stall_no}
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 uppercase tracking-wider">
                  {stall.zone} Zone
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {isOccupied ? `Assigned to ${owner || 'Registered Tenant'}` : 'Currently Vacant'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
            title="Close Viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Vendor Banner Card */}
        <div className="p-5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            {/* Avatar & Upload Overlay */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-100 flex items-center justify-center relative">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt={owner || 'Vendor'} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}

                {/* Upload action overlay */}
                <label className="absolute inset-0 bg-slate-950/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-semibold">Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Status Indicator Dot */}
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] ${
                  compliance === 'Compliant'
                    ? 'bg-emerald-500'
                    : compliance === 'Lacking'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                title={`Compliance: ${compliance}`}
              >
                {compliance === 'Compliant' ? '✓' : '!'}
              </span>
            </div>

            {/* Vendor Headline & Photo Upload Trigger */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {owner || (isOccupied ? 'Registered Tenant' : 'Vacant Stall')}
                </span>
                <Badge
                  variant={
                    compliance === 'Compliant'
                      ? 'success'
                      : compliance === 'Lacking'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {compliance}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 mb-2 truncate">
                {lob || 'No Line of Business specified'}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 cursor-pointer transition-colors shadow-2xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Profile Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl(null);
                      setPhotoSize(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-600 px-1.5 py-1 transition-colors"
                    title="Remove Photo"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Max size: <strong className="text-slate-600">&lt; 1 MB</strong> (PNG, JPG, WebP)
                {photoSize && ` • Current: ${formatFileSize(photoSize)}`}
              </p>
            </div>
          </div>

          {/* Photo Error Notice */}
          {photoError && (
            <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-rose-700 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{photoError}</span>
            </div>
          )}

          {/* Quick Notification Alert */}
          {saveSuccess && (
            <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Stall tenancy details and documents saved successfully!</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 text-sm font-medium shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-3 pt-3 px-3 flex items-center gap-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4" /> Tenancy Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`pb-3 pt-3 px-3 flex items-center gap-2 border-b-2 font-semibold transition-colors relative ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Documents (PDF)
            {(leaseDocUrl || permitDocUrl) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 pt-3 px-3 flex items-center gap-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" /> History
          </button>
        </div>

        {/* Body Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: Tenancy Details */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stall Owner (Registered Tenant)
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing && !isAdding}
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    placeholder="Full name of stall owner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operator / Manager
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing && !isAdding}
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Operator name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Line of Business
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing && !isAdding}
                    value={lob}
                    onChange={(e) => setLob(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. Meat, Dry Goods, Vegetables"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Period Index (Term No.)
                  </label>
                  <input
                    type="number"
                    disabled={!isEditing && !isAdding}
                    value={period}
                    onChange={(e) => setPeriod(parseInt(e.target.value) || 1)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Compliance Status
                  </label>
                  <select
                    disabled={!isEditing && !isAdding}
                    value={compliance}
                    onChange={(e) => setCompliance(e.target.value as any)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                  >
                    <option value="Compliant">Compliant</option>
                    <option value="Lacking">Lacking</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional Notes & Permits
                  </label>
                  <textarea
                    rows={2}
                    disabled={!isEditing && !isAdding}
                    value={extraInfo}
                    onChange={(e) => setExtraInfo(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    placeholder="Special lease conditions, permit numbers, or inspection notes"
                  />
                </div>
              </div>

              {/* Compliance Verification Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Documentary Compliance Audit
                  </h4>
                  <span className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab('documents')}>
                    Manage Documents →
                  </span>
                </div>

                {/* Contract of Lease row */}
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-200/60">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-slate-400" /> Contract of Lease
                  </span>
                  <div className="flex items-center gap-2">
                    {leaseDocUrl ? (
                      <>
                        <Badge variant="success">Verified (PDF)</Badge>
                        <button
                          type="button"
                          onClick={() =>
                            setFullViewPdf({
                              url: leaseDocUrl,
                              title: `Contract of Lease — Stall ${stall.stall_no}`,
                              filename: leaseDocName || `Contract_of_Lease_${stall.stall_no}.pdf`,
                            })
                          }
                          className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </>
                    ) : (
                      <>
                        <Badge variant="danger">Missing PDF</Badge>
                        <button
                          type="button"
                          onClick={() => setActiveTab('documents')}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[11px] transition-colors"
                        >
                          Upload
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Mayor's Business Permit row */}
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-200/60">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" /> Mayor&apos;s Business Permit
                  </span>
                  <div className="flex items-center gap-2">
                    {permitDocUrl ? (
                      <>
                        <Badge variant="success">Active (PDF)</Badge>
                        <button
                          type="button"
                          onClick={() =>
                            setFullViewPdf({
                              url: permitDocUrl,
                              title: `Mayor's Business Permit — Stall ${stall.stall_no}`,
                              filename: permitDocName || `Mayors_Permit_${stall.stall_no}.pdf`,
                            })
                          }
                          className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </>
                    ) : (
                      <>
                        <Badge variant="danger">Missing PDF</Badge>
                        <button
                          type="button"
                          onClick={() => setActiveTab('documents')}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[11px] transition-colors"
                        >
                          Upload
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Electric Meter row */}
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-slate-400" /> Utility Electric Meter
                  </span>
                  <Badge variant="success">Connected</Badge>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Documents (PDF Upload & Interactive Viewer) */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* DOCUMENT 1: Contract of Lease */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Contract of Lease</h4>
                      {leaseDocUrl ? (
                        <Badge variant="success">Verified PDF</Badge>
                      ) : (
                        <Badge variant="warning">Not Uploaded</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Official municipal notarized lease document (PDF)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-blue-200/60">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{leaseDocUrl ? 'Replace PDF' : 'Upload PDF'}</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLeaseUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {leaseDocUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setLeaseDocUrl(null);
                          setLeaseDocName(null);
                        }}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {leaseDocError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-rose-700 animate-in fade-in">
                    <FileWarning className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{leaseDocError}</span>
                  </div>
                )}

                {/* PDF Viewer or Upload Placeholder */}
                {leaseDocUrl ? (
                  <div className="space-y-2">
                    {/* Action Bar */}
                    <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[200px]" title={leaseDocName || 'Contract_of_Lease.pdf'}>
                        📄 {leaseDocName || 'Contract_of_Lease.pdf'}
                        {leaseDocSize ? ` (${formatFileSize(leaseDocSize)})` : ''}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setFullViewPdf({
                              url: leaseDocUrl,
                              title: `Contract of Lease — Stall ${stall.stall_no}`,
                              filename: leaseDocName || `Contract_of_Lease_${stall.stall_no}.pdf`,
                            })
                          }
                          className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Maximize2 className="w-3.5 h-3.5" /> Full View
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(base64ToBlobUrl(leaseDocUrl), '_blank')}
                          className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="Open in new window"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={base64ToBlobUrl(leaseDocUrl)}
                          download={leaseDocName || `Contract_of_Lease_${stall.stall_no}.pdf`}
                          className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Embedded PDF Viewer Frame */}
                    <div className="h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner relative">
                      <iframe
                        src={base64ToBlobUrl(leaseDocUrl)}
                        className="w-full h-full border-0"
                        title="Contract of Lease PDF Preview"
                      />
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center mb-2 transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      Upload Contract of Lease (PDF)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Click to browse or drop municipal lease agreement in PDF format
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleLeaseUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* DOCUMENT 2: Mayor's Business Permit */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Mayor&apos;s Business Permit</h4>
                      {permitDocUrl ? (
                        <Badge variant="success">Active PDF</Badge>
                      ) : (
                        <Badge variant="warning">Not Uploaded</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Current annual operating permit issued by the LGU (PDF)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-emerald-200/60">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{permitDocUrl ? 'Replace PDF' : 'Upload PDF'}</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePermitUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {permitDocUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPermitDocUrl(null);
                          setPermitDocName(null);
                        }}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {permitDocError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-rose-700 animate-in fade-in">
                    <FileWarning className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{permitDocError}</span>
                  </div>
                )}

                {/* PDF Viewer or Upload Placeholder */}
                {permitDocUrl ? (
                  <div className="space-y-2">
                    {/* Action Bar */}
                    <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[200px]" title={permitDocName || 'Mayors_Business_Permit.pdf'}>
                        📄 {permitDocName || 'Mayors_Business_Permit.pdf'}
                        {permitDocSize ? ` (${formatFileSize(permitDocSize)})` : ''}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setFullViewPdf({
                              url: permitDocUrl,
                              title: `Mayor's Business Permit — Stall ${stall.stall_no}`,
                              filename: permitDocName || `Mayors_Permit_${stall.stall_no}.pdf`,
                            })
                          }
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Maximize2 className="w-3.5 h-3.5" /> Full View
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(base64ToBlobUrl(permitDocUrl), '_blank')}
                          className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="Open in new window"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={base64ToBlobUrl(permitDocUrl)}
                          download={permitDocName || `Mayors_Permit_${stall.stall_no}.pdf`}
                          className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Embedded PDF Viewer Frame */}
                    <div className="h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner relative">
                      <iframe
                        src={base64ToBlobUrl(permitDocUrl)}
                        className="w-full h-full border-0"
                        title="Mayor's Business Permit PDF Preview"
                      />
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-400 group-hover:text-emerald-600 flex items-center justify-center mb-2 transition-colors">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                      Upload Mayor&apos;s Business Permit (PDF)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Click to browse or drop annual business operating permit in PDF format
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePermitUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {stall.tenant_history && stall.tenant_history.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Year</th>
                        <th className="py-2.5 px-3">Term</th>
                        <th className="py-2.5 px-3">Owner</th>
                        <th className="py-2.5 px-3">Business Line</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {stall.tenant_history.map((hist, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{hist.year}</td>
                          <td className="py-2.5 px-3 text-slate-600">Period {hist.period_index}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{hist.stall_owner}</td>
                          <td className="py-2.5 px-3 text-slate-500">{hist.line_of_business}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No historical tenancy transfers recorded for this stall.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-end gap-2.5">
          {isEditing || isAdding ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setIsAdding(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1.5" /> Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-1.5" /> Edit Details
              </Button>
              <Button
                variant="success"
                onClick={() => {
                  setIsAdding(true);
                  setOwner('');
                  setOperator('');
                  setLob('');
                  setPhotoUrl(null);
                  setLeaseDocUrl(null);
                  setPermitDocUrl(null);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Tenant
              </Button>
            </>
          )}
        </div>
      </aside>

      {/* FULL VIEW PDF MODAL (Interactive Fullscreen Overlay) */}
      {fullViewPdf && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-md flex flex-col p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={fullViewPdf.title}
        >
          <div className="w-full h-full max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/40">
            {/* Modal Header */}
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold truncate text-white">
                      {fullViewPdf.title}
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      PDF Full View
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {fullViewPdf.filename || 'Municipal Document'} • Stall {stall.stall_no} ({owner || 'Tenant'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={base64ToBlobUrl(fullViewPdf.url)}
                  download={fullViewPdf.filename}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  title="Download PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <button
                  type="button"
                  onClick={() => window.open(base64ToBlobUrl(fullViewPdf.url), '_blank')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Open in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFullViewPdf(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-900/40 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-colors border border-slate-700 ml-2"
                  title="Close Full View (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Full PDF Viewer */}
            <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
              <iframe
                src={base64ToBlobUrl(fullViewPdf.url)}
                className="w-full h-full border-0"
                title={fullViewPdf.title}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
