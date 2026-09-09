'use client';

import React from 'react';
import { useMeedo } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsersRound, CheckCircle, Ban, Trash2, ShieldCheck } from 'lucide-react';

export default function UserManagementPage() {
  const { users, updateUserStatus } = useMeedo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System User Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Portal: Manage enterprise staff accounts, departmental section assignments, and approvals.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">System Role</th>
                <th className="py-2.5 px-3">Assigned Section</th>
                <th className="py-2.5 px-3">Account Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id || u.username} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {u.username[0].toUpperCase()}
                    </span>
                    {u.username}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={u.role === 'Admin' ? 'info' : 'neutral'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">
                    Section {u.section}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant={
                        u.status === 'Approved'
                          ? 'success'
                          : u.status === 'Blocked'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1.5">
                    {u.role !== 'Admin' && (
                      <>
                        {u.status !== 'Approved' && (
                          <button
                            onClick={() => updateUserStatus(u.username, 'approve')}
                            className="text-xs text-emerald-600 font-semibold hover:underline"
                          >
                            Approve
                          </button>
                        )}
                        {u.status === 'Approved' && (
                          <button
                            onClick={() => updateUserStatus(u.username, 'block')}
                            className="text-xs text-amber-600 font-semibold hover:underline"
                          >
                            Block
                          </button>
                        )}
                        <button
                          onClick={() => updateUserStatus(u.username, 'delete')}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </>
                    )}
                    {u.role === 'Admin' && (
                      <span className="text-[11px] text-slate-400 italic">Super Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
