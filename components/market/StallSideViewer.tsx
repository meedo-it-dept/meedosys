'use client';

import React, { useState, useEffect } from 'react';
import { Stall, StallTenant, ComplianceStatus } from '@/lib/types';
import { useMeedo } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  XCircle,
  Building2,
  Calendar,
} from 'lucide-react';

interface StallSideViewerProps {
  stall: Stall | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StallSideViewer: React.FC<StallSideViewerProps> = ({ stall, isOpen, onClose }) => {
  const { updateStallTenant, addStallTenant } = useMeedo();

  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const tenant = stall?.current_tenant;

  const [owner, setOwner] = useState(tenant?.stall_owner || '');
  const [operator, setOperator] = useState(tenant?.operator || '');
  const [lob, setLob] = useState(tenant?.line_of_business || '');
  const [period, setPeriod] = useState(tenant?.period_index || 1);
  const [compliance, setCompliance] = useState<ComplianceStatus>(tenant?.compliance_status || 'Non-Compliant');
  const [extraInfo, setExtraInfo] = useState(tenant?.additional_info || '');

  // Reset form when selected stall changes
  useEffect(() => {
    if (stall) {
      setOwner(stall.current_tenant?.stall_owner || '');
      setOperator(stall.current_tenant?.operator || '');
      setLob(stall.current_tenant?.line_of_business || '');
      setPeriod(stall.current_tenant?.period_index || 1);
      setCompliance(stall.current_tenant?.compliance_status || 'Non-Compliant');
      setExtraInfo(stall.current_tenant?.additional_info || '');
      setPhotoUrl(stall.current_tenant?.photo_url || null);
      setIsEditing(false);
      setIsAdding(false);
      setSaveSuccess(false);
    }
  }, [stall]);

  // Handle client-side compressed image upload
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400; // Optimal for avatar

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
          const compressedData = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressedData);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !stall) return null;

  const handleSave = () => {
    if (isAdding) {
      const newTenant: StallTenant = {
        stall_no: stall.stall_no,
        stall_owner: owner,
        operator: operator || owner,
        line_of_business: lob,
        period_index: (tenant?.period_index || 0) + 1,
        year: new Date().getFullYear(),
        compliance_status: compliance,
        additional_info: extraInfo,
        photo_url: photoUrl,
      };
      addStallTenant(stall.stall_no, newTenant);
    } else {
      updateStallTenant(stall.stall_no, {
        stall_owner: owner,
        operator,
        line_of_business: lob,
        period_index: period,
        compliance_status: compliance,
        additional_info: extraInfo,
        photo_url: photoUrl,
      });
    }

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
        {/* Header */}
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
                  <img src={photoUrl} alt={owner || 'Vendor'} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
                {/* Upload action overlay */}
                <label className="absolute inset-0 bg-slate-950/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
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

            {/* Vendor Headline */}
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

              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 cursor-pointer transition-colors">
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
            </div>
          </div>

          {/* Quick Notification Alert */}
          {saveSuccess && (
            <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Stall tenancy details and profile saved successfully!</span>
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
            className={`pb-3 pt-3 px-3 flex items-center gap-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Documents
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
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Documentary Compliance Audit
                </h4>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-slate-400" /> Contract of Lease
                  </span>
                  <Badge variant={compliance === 'Compliant' ? 'success' : 'danger'}>
                    {compliance === 'Compliant' ? 'Verified' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" /> Business Permit
                  </span>
                  <Badge variant={compliance === 'Compliant' ? 'success' : 'danger'}>
                    {compliance === 'Compliant' ? 'Active' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-slate-400" /> Utility Electric Meter
                  </span>
                  <Badge variant="success">Connected</Badge>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Contract of Lease</h4>
                    <p className="text-xs text-slate-500">Official municipal notarized lease document</p>
                  </div>
                  <Badge variant="info">Archived</Badge>
                </div>
                <div className="h-28 border border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center text-xs text-slate-400">
                  <FileText className="w-7 h-7 text-slate-300 mb-1" />
                  <span>Digital Contract on File</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Mayor&apos;s Business Permit</h4>
                    <p className="text-xs text-slate-500">Current annual operating permit</p>
                  </div>
                  <Badge variant="success">Verified</Badge>
                </div>
                <div className="h-28 border border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center text-xs text-slate-400">
                  <FileCheck className="w-7 h-7 text-emerald-400 mb-1" />
                  <span>Permit Valid for Calendar Year 2026</span>
                </div>
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
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Tenant
              </Button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
