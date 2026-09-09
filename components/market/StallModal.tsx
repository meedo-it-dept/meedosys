'use client';

import React, { useState } from 'react';
import { Stall, StallTenant } from '@/lib/types';
import { useMeedo } from '@/lib/store';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, FileText, History, Edit, Plus, Save } from 'lucide-react';

interface StallModalProps {
  stall: Stall | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StallModal: React.FC<StallModalProps> = ({ stall, isOpen, onClose }) => {
  const { updateStallTenant, addStallTenant } = useMeedo();

  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const tenant = stall?.current_tenant;

  const [owner, setOwner] = useState(tenant?.stall_owner || '');
  const [operator, setOperator] = useState(tenant?.operator || '');
  const [lob, setLob] = useState(tenant?.line_of_business || '');
  const [period, setPeriod] = useState(tenant?.period_index || 1);
  const [compliance, setCompliance] = useState(tenant?.compliance_status || 'Non-Compliant');
  const [extraInfo, setExtraInfo] = useState(tenant?.additional_info || '');

  // Reset form when stall changes
  React.useEffect(() => {
    if (stall) {
      setOwner(stall.current_tenant?.stall_owner || '');
      setOperator(stall.current_tenant?.operator || '');
      setLob(stall.current_tenant?.line_of_business || '');
      setPeriod(stall.current_tenant?.period_index || 1);
      setCompliance(stall.current_tenant?.compliance_status || 'Non-Compliant');
      setExtraInfo(stall.current_tenant?.additional_info || '');
      setIsEditing(false);
      setIsAdding(false);
    }
  }, [stall]);

  if (!stall) return null;

  const handleSave = () => {
    if (isAdding) {
      const newTenant: StallTenant = {
        stall_no: stall.stall_no,
        stall_owner: owner,
        operator,
        line_of_business: lob,
        period_index: (tenant?.period_index || 0) + 1,
        year: new Date().getFullYear(),
        compliance_status: compliance as any,
        additional_info: extraInfo,
      };
      addStallTenant(stall.stall_no, newTenant);
    } else {
      updateStallTenant(stall.stall_no, {
        stall_owner: owner,
        operator,
        line_of_business: lob,
        compliance_status: compliance as any,
        additional_info: extraInfo,
      });
    }
    setIsEditing(false);
    setIsAdding(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Stall ${stall.stall_no}`} maxWidth="xl">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5 text-sm font-medium">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Store className="w-4 h-4" /> Tenancy Details
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Documents
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" /> Tenancy History
        </button>
      </div>

      {/* Tab 1: Details */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Occupancy Status</span>
              <span className="text-sm font-bold text-slate-800">{stall.status}</span>
            </div>
            <Badge variant={compliance === 'Compliant' ? 'success' : 'danger'}>
              {compliance}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stall Owner</label>
              <input
                type="text"
                disabled={!isEditing && !isAdding}
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-600"
                placeholder="Owner full name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operator / Manager</label>
              <input
                type="text"
                disabled={!isEditing && !isAdding}
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-600"
                placeholder="Operator name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Line of Business</label>
              <input
                type="text"
                disabled={!isEditing && !isAdding}
                value={lob}
                onChange={(e) => setLob(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-600"
                placeholder="e.g. Fresh Fish, Meat, Dry Goods"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Compliance Status</label>
              <select
                disabled={!isEditing && !isAdding}
                value={compliance}
                onChange={(e) => setCompliance(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-600 bg-white"
              >
                <option value="Compliant">Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
              <input
                type="text"
                disabled={!isEditing && !isAdding}
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-600"
                placeholder="Special notes or permits"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            {isEditing || isAdding ? (
              <>
                <Button variant="ghost" onClick={() => { setIsEditing(false); setIsAdding(false); }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-1.5" /> Edit Details
                </Button>
                <Button variant="success" onClick={() => { setIsAdding(true); setOwner(''); setOperator(''); setLob(''); }}>
                  <Plus className="w-4 h-4 mr-1.5" /> Add New Tenant
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Contract of Lease</h4>
              <p className="text-xs text-slate-500">Official notarized market lease document</p>
            </div>
            <Badge variant="info">Digitally Archived</Badge>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Mayor&apos;s Business Permit</h4>
              <p className="text-xs text-slate-500">Current annual operating permit</p>
            </div>
            <Badge variant="success">Verified Active</Badge>
          </div>
        </div>
      )}

      {/* Tab 3: History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {stall.tenant_history && stall.tenant_history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-2 px-3">Year</th>
                    <th className="py-2 px-3">Period</th>
                    <th className="py-2 px-3">Owner</th>
                    <th className="py-2 px-3">Business Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stall.tenant_history.map((hist, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">{hist.year}</td>
                      <td className="py-2 px-3">Period {hist.period_index}</td>
                      <td className="py-2 px-3">{hist.stall_owner}</td>
                      <td className="py-2 px-3 text-slate-600">{hist.line_of_business}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No historical tenancy transfers recorded for this stall.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
