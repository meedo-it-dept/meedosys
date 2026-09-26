'use client';

import React, { useState, useMemo } from 'react';
import { useMeedo } from '@/lib/store';
import { SECTIONS_META } from '@/lib/rbac';
import { UserProfile, UserRole, UserSection, UserStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UsersRound,
  CheckCircle,
  Ban,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Search,
  RefreshCw,
  Crown,
  KeyRound,
  Eye,
  EyeOff,
  Edit,
  Building2,
  Shield,
  UserCheck,
  Clock,
  X,
  Database,
} from 'lucide-react';

export default function UserManagementPage() {
  const {
    currentUser,
    users,
    updateUserStatus,
    updateUserProfile,
    createUser,
    refreshUsers,
    isLiveSupabase,
  } = useMeedo();

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSection, setFilterSection] = useState<string>('ALL_FILTER');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserProfile | null>(null);

  // Add User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Staff');
  const [newSection, setNewSection] = useState<UserSection>('A');
  const [newStatus, setNewStatus] = useState<UserStatus>('Approved');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newGuardId, setNewGuardId] = useState('');
  const [newRankTitle, setNewRankTitle] = useState('SO1');
  const [newCallSign, setNewCallSign] = useState('EAGLE-1');
  const [newDefaultArea, setNewDefaultArea] = useState('General Public Market');
  const [formError, setFormError] = useState('');

  // Edit User Form State
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Staff');
  const [editSection, setEditSection] = useState<UserSection>('A');
  const [editStatus, setEditStatus] = useState<UserStatus>('Approved');
  const [editGuardId, setEditGuardId] = useState('');
  const [editRankTitle, setEditRankTitle] = useState('');
  const [editCallSign, setEditCallSign] = useState('EAGLE-1');
  const [editDefaultArea, setEditDefaultArea] = useState('General Public Market');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Handle Manual Directory Refresh from Supabase
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUsers();
      setFeedbackMsg({ type: 'success', text: 'Directory successfully synchronized with Supabase live database.' });
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to synchronize with Supabase.' });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Metrics
  const totalUsers = users.length;
  const pendingUsers = users.filter((u) => u.status === 'Pending').length;
  const approvedUsers = users.filter((u) => u.status === 'Approved').length;
  const adminUsers = users.filter((u) => u.role === 'Admin' || u.section === 'ALL').length;

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (u.guard_id && u.guard_id.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      const matchesSection =
        filterSection === 'ALL_FILTER' || u.section === filterSection;

      const matchesStatus =
        filterStatus === 'ALL' || u.status === filterStatus;

      const matchesRole =
        filterRole === 'ALL' || u.role === filterRole;

      return matchesSearch && matchesSection && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, filterSection, filterStatus, filterRole]);

  // Open Edit Modal
  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditFullName(user.full_name || '');
    setEditRole(user.role);
    setEditSection(user.section);
    setEditStatus(user.status);
    setEditGuardId(user.guard_id || '');
    setEditRankTitle(user.rank_title || 'SO1');
    setEditCallSign(user.radio_call_sign || 'EAGLE-1');
    setEditDefaultArea(user.default_area || 'General Public Market');
    setEditPassword('');
    setShowEditPassword(false);
  };

  // Submit Edit Modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updates: Partial<UserProfile> = {
      full_name: editFullName.trim() || undefined,
      role: editRole,
      section: editRole === 'Admin' && editSection === 'ALL' ? 'ALL' : editSection,
      status: editStatus,
      guard_id: editSection === 'F' && editGuardId.trim() ? editGuardId.trim().toUpperCase() : undefined,
      rank_title: editSection === 'F' && editRankTitle.trim() ? editRankTitle.trim() : undefined,
      radio_call_sign: editSection === 'F' && editCallSign.trim() ? editCallSign.trim().toUpperCase() : undefined,
      default_area: editSection === 'F' && editDefaultArea.trim() ? editDefaultArea.trim() : undefined,
    };

    if (editPassword.trim()) {
      updates.password = editPassword.trim();
    }

    updateUserProfile(editingUser.username, updates);
    setFeedbackMsg({
      type: 'success',
      text: `User account "${editingUser.username}" updated and synced successfully.`,
    });
    setEditingUser(null);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Submit Add User Modal
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newUsername.trim()) {
      setFormError('Username is required.');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setFormError('Username is already registered in the directory.');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    if (newSection === 'F' && !newGuardId.trim()) {
      setFormError('Guard ID (e.g. G-101) is required for Section F Market Guard accounts.');
      return;
    }

    const res = createUser({
      username: newUsername.trim(),
      full_name: newFullName.trim() || newUsername.trim(),
      role: newRole,
      section: newRole === 'Admin' && newSection === 'ALL' ? 'ALL' : newSection,
      status: newStatus,
      password: newPassword.trim() || undefined,
      guard_id: newSection === 'F' ? newGuardId.trim().toUpperCase() : undefined,
      rank_title: newSection === 'F' ? newRankTitle.trim() : undefined,
      radio_call_sign: newSection === 'F' ? newCallSign.trim().toUpperCase() : undefined,
      default_area: newSection === 'F' ? newDefaultArea.trim() : undefined,
    });

    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: `New user account "${newUsername.trim()}" created and synced to Supabase directory.`,
      });
      setIsAddModalOpen(false);
      // Reset form
      setNewUsername('');
      setNewFullName('');
      setNewRole('Staff');
      setNewSection('A');
      setNewStatus('Approved');
      setNewPassword('');
      setNewGuardId('');
      setNewRankTitle('SO1');
      setNewCallSign('EAGLE-1');
      setNewDefaultArea('General Public Market');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFormError(res.message || 'Failed to create user account.');
    }
  };

  // Quick Status Actions
  const handleQuickApprove = (username: string) => {
    updateUserStatus(username, 'approve');
    setFeedbackMsg({
      type: 'success',
      text: `User "${username}" has been approved for enterprise system access.`,
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleQuickBlock = (username: string) => {
    updateUserStatus(username, 'block');
    setFeedbackMsg({
      type: 'error',
      text: `User "${username}" has been suspended and blocked from the system.`,
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleDeleteConfirm = () => {
    if (!confirmDeleteUser) return;
    updateUserStatus(confirmDeleteUser.username, 'delete');
    setFeedbackMsg({
      type: 'success',
      text: `User account "${confirmDeleteUser.username}" was permanently deleted.`,
    });
    setConfirmDeleteUser(null);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-blue-600" />
              System User Management
            </h2>
            <Badge variant={isLiveSupabase ? 'success' : 'neutral'} className="text-[10px] gap-1">
              <Database className="w-3 h-3" />
              {isLiveSupabase ? 'Supabase Live Connected' : 'Local Storage Mode'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise RBAC Authority: Manage departmental staff credentials, approve registration requests, and enforce strict section silos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Sync Directory'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className="text-xs font-semibold shadow-xs"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-3"
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Personnel
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <UsersRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalUsers}</span>
            <span className="text-xs text-slate-500">registered accounts</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className={`p-2 rounded-xl ${pendingUsers > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${pendingUsers > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {pendingUsers}
            </span>
            <span className="text-xs text-slate-500">awaiting clearance</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active / Approved
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{approvedUsers}</span>
            <span className="text-xs text-slate-500">in good standing</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Administrators
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-900">{adminUsers}</span>
            <span className="text-xs text-slate-500">superadmin privilege</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search username, name, Guard ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL_FILTER">All Sections & Divisions</option>
              <option value="ALL">👑 Section ALL: Municipal Admin</option>
              <option value="A">🏬 Section A: Market Management</option>
              <option value="B">🥩 Section B: Slaughterhouse</option>
              <option value="C">⚰️ Section C: Cemetery Management</option>
              <option value="D">🚐 Section D: Transport Terminal</option>
              <option value="E">🏢 Section E: Admin Services / OPIF</option>
              <option value="F">🛡️ Section F: Market Guard</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="Approved">Approved (Active)</option>
              <option value="Pending">Pending Approval</option>
              <option value="Blocked">Blocked / Suspended</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Roles (Admin & Staff)</option>
              <option value="Admin">Administrators Only</option>
              <option value="Staff">Department Staff Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">User Account</th>
                <th className="py-3 px-3">System Role</th>
                <th className="py-3 px-3">Assigned Section</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3">Registered / Logged</th>
                <th className="py-3 px-4 text-right">RBAC Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const secMeta = SECTIONS_META[u.section] || SECTIONS_META['A'];
                  const isCurrent = currentUser?.username.toLowerCase() === u.username.toLowerCase();
                  const isSuperAdmin = u.username.toLowerCase() === 'admin';

                  return (
                    <tr
                      key={u.id || u.username}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        u.status === 'Pending' ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* User Account Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-2xs ${
                              u.role === 'Admin'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {u.username[0]}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {u.full_name || 'No full name recorded'}
                              {u.guard_id && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 font-mono text-[10px] border border-blue-200">
                                  🛡️ {u.guard_id} {u.rank_title ? `• ${u.rank_title}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* System Role */}
                      <td className="py-3 px-3">
                        {u.role === 'Admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Crown className="w-3 h-3 text-purple-600" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <UserCheck className="w-3 h-3 text-slate-500" /> Staff
                          </span>
                        )}
                      </td>

                      {/* Assigned Section */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${secMeta.badgeColor}`}
                        >
                          {secMeta.badge} • {secMeta.shortName}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            u.status === 'Approved'
                              ? 'success'
                              : u.status === 'Blocked'
                              ? 'danger'
                              : 'warning'
                          }
                          className="font-bold gap-1"
                        >
                          {u.status === 'Approved' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          {u.status === 'Pending' && <Clock className="w-3 h-3 text-amber-600 animate-spin" />}
                          {u.status === 'Blocked' && <Ban className="w-3 h-3 text-rose-600" />}
                          {u.status}
                        </Badge>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Initial Roster'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Pending Approval Fast-Track Action */}
                          {u.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleQuickApprove(u.username)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors flex items-center gap-1"
                              title="Approve access"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}

                          {/* Block Button */}
                          {u.status === 'Approved' && !isSuperAdmin && !isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleQuickBlock(u.username)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1"
                              title="Suspend user"
                            >
                              <Ban className="w-3.5 h-3.5" /> Block
                            </button>
                          )}

                          {/* Reactivate Blocked User */}
                          {u.status === 'Blocked' && (
                            <button
                              type="button"
                              onClick={() => handleQuickApprove(u.username)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                              title="Re-activate user"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Reactivate
                            </button>
                          )}

                          {/* Edit Role & Section */}
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Edit Role, Section & Permissions"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account */}
                          {!isSuperAdmin && !isCurrent ? (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic px-1">
                              Protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Add New User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" /> Add New Enterprise User
                </h3>
                <p className="text-xs text-slate-500">
                  Create a pre-approved municipal account with assigned departmental clearance.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  placeholder="e.g. maria_market"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Personnel)
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setNewRole(r);
                      if (r === 'Admin') setNewSection('ALL');
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Staff">Department Staff</option>
                    <option value="Admin">Administrator (All Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Section
                  </label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value as UserSection)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ALL">👑 ALL: Municipal Admin</option>
                    <option value="A">🏬 Section A: Market</option>
                    <option value="B">🥩 Section B: Slaughterhouse</option>
                    <option value="C">⚰️ Section C: Cemetery</option>
                    <option value="D">🚐 Section D: Transport</option>
                    <option value="E">🏢 Section E: Admin/OPIF</option>
                    <option value="F">🛡️ Section F: Market Guard</option>
                  </select>
                </div>
              </div>

              {/* Section F Guard Credentials */}
              {newSection === 'F' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" /> Guard Badge & Assignment
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                        Guard ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newGuardId}
                        onChange={(e) => setNewGuardId(e.target.value)}
                        placeholder="e.g. G-101"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                        Rank / Designation
                      </label>
                      <input
                        type="text"
                        value={newRankTitle}
                        onChange={(e) => setNewRankTitle(e.target.value)}
                        placeholder="e.g. SO1, Team Leader"
                        className="w-full px-2.5 py-1.5 text-xs border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/60">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                        Radio Call Sign
                      </label>
                      <input
                        type="text"
                        value={newCallSign}
                        onChange={(e) => setNewCallSign(e.target.value)}
                        placeholder="e.g. EAGLE-1"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                        Assigned Sector / Area
                      </label>
                      <input
                        type="text"
                        value={newDefaultArea}
                        onChange={(e) => setNewDefaultArea(e.target.value)}
                        placeholder="e.g. General Public Market"
                        className="w-full px-2.5 py-1.5 text-xs border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-3 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Approved">Approved (Immediate Active Access)</option>
                  <option value="Pending">Pending (Requires Administrative Review)</option>
                  <option value="Blocked">Blocked (Account Disabled)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create User Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User Role & Section */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-600" /> Edit User Clearance & Role
                </h3>
                <p className="text-xs text-slate-500">
                  Modifying account permissions for <strong className="text-slate-800 font-mono">{editingUser.username}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Officer or staff full name"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setEditRole(r);
                      if (r === 'Admin') setEditSection('ALL');
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Staff">Department Staff</option>
                    <option value="Admin">Administrator (All Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Section
                  </label>
                  <select
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value as UserSection)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ALL">👑 ALL: Municipal Admin</option>
                    <option value="A">🏬 Section A: Market</option>
                    <option value="B">🥩 Section B: Slaughterhouse</option>
                    <option value="C">⚰️ Section C: Cemetery</option>
                    <option value="D">🚐 Section D: Transport</option>
                    <option value="E">🏢 Section E: Admin/OPIF</option>
                    <option value="F">🛡️ Section F: Market Guard</option>
                  </select>
                </div>
              </div>

              {/* Section F Details */}
              {editSection === 'F' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" /> Guard Badge & Assignment
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                        Guard ID
                      </label>
                      <input
                        type="text"
                        value={editGuardId}
                        onChange={(e) => setEditGuardId(e.target.value)}
                        placeholder="e.g. G-101"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                        Rank / Designation
                      </label>
                      <input
                        type="text"
                        value={editRankTitle}
                        onChange={(e) => setEditRankTitle(e.target.value)}
                        placeholder="e.g. SO1, Team Leader"
                        className="w-full px-2.5 py-1.5 text-xs border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/60">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                        Radio Call Sign
                      </label>
                      <input
                        type="text"
                        value={editCallSign}
                        onChange={(e) => setEditCallSign(e.target.value)}
                        placeholder="e.g. EAGLE-1"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                        Assigned Sector / Area
                      </label>
                      <input
                        type="text"
                        value={editDefaultArea}
                        onChange={(e) => setEditDefaultArea(e.target.value)}
                        placeholder="e.g. General Public Market"
                        className="w-full px-2.5 py-1.5 text-xs border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Approved">Approved (Active Enterprise Access)</option>
                  <option value="Pending">Pending (Awaiting Clearance)</option>
                  <option value="Blocked">Blocked / Suspended (Access Denied)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Reset Password <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave empty to keep current password"
                    className="w-full pl-3 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    tabIndex={-1}
                    aria-label={showEditPassword ? 'Hide password' : 'Show password'}
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete User */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Confirm Account Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete user{' '}
                <strong className="text-slate-800 font-mono">@{confirmDeleteUser.username}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteUser(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
