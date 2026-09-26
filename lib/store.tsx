'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  UserProfile,
  UserRole,
  UserSection,
  UserStatus,
  Stall,
  ElectricBill,
  SlaughterRecord,
  CemeteryBooking,
  Toda,
  TodaMember,
  OpifIndicator,
  CsuDailyReport,
  StallTenant,
  MarketGuard,
  InventoryItem,
  InventoryTransaction,
  ButcherProfile,
  MonitoringRecord,
  formatAdditionalInfo,
} from './types';
import {
  initialUsers,
  initialStalls,
  initialElectricBills,
  initialSlaughterRecords,
  initialCemeteryBookings,
  initialTodas,
  initialTodaMembers,
  initialOpifIndicators,
  initialCsuReports,
  initialMarketGuards,
  initialInventoryItems,
  initialInventoryTransactions,
  initialButchers,
} from './supabase/mockData';
import { isSupabaseConfigured, supabase } from './supabase/client';

interface MeedoContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  authLoading: boolean;
  login: (username: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchSectionUser: (sectionCode: UserSection) => boolean;
  users: UserProfile[];
  updateUserStatus: (username: string, action: 'approve' | 'block' | 'delete') => void;
  updateUserProfile: (username: string, updates: Partial<UserProfile>) => void;
  createUser: (userData: Partial<UserProfile> & { username: string; role: UserRole; section: UserSection }) => { success: boolean; message?: string };
  registerUser: (
    username: string,
    section: string,
    guardId?: string,
    fullName?: string,
    rankTitle?: string,
    password?: string
  ) => { success: boolean; message?: string };
  refreshUsers: () => Promise<void>;

  guards: MarketGuard[];
  addGuard: (guard: MarketGuard) => void;
  updateGuard: (guardId: string, updates: Partial<MarketGuard>) => void;
  deleteGuard: (guardId: string) => void;

  stalls: Stall[];
  updateStallTenant: (stallNo: string, tenant: Partial<StallTenant>) => void;
  addStallTenant: (stallNo: string, tenant: StallTenant) => void;

  monitoringRecords: MonitoringRecord[];
  addMonitoringRecord: (record: MonitoringRecord) => Promise<boolean>;

  electricBills: ElectricBill[];
  addElectricBill: (bill: ElectricBill) => void;
  updateBillStatus: (stallNo: string, status: 'Unpaid' | 'Partial' | 'Fully Paid') => void;

  slaughterRecords: SlaughterRecord[];
  addSlaughterRecord: (record: Omit<SlaughterRecord, 'id' | 'created_at'>) => void;
  addSlaughterBatch: (records: Omit<SlaughterRecord, 'id' | 'created_at'>[]) => void;
  updateSlaughterRecord: (id: string, updates: Partial<SlaughterRecord>) => void;
  deleteSlaughterRecord: (id: string) => void;

  butchers: ButcherProfile[];
  addButcher: (butcher: Omit<ButcherProfile, 'id' | 'created_at'>) => void;
  updateButcher: (id: string, updates: Partial<ButcherProfile>) => void;
  deleteButcher: (id: string) => void;
  resetButchers: () => void;

  cemeteryBookings: CemeteryBooking[];
  addCemeteryBooking: (booking: Omit<CemeteryBooking, 'id' | 'created_at'>) => void;
  updateCemeteryBooking: (id: string, updates: Partial<CemeteryBooking>) => void;
  deleteCemeteryBooking: (id: string) => void;

  todas: Toda[];
  addToda: (toda: Omit<Toda, 'id' | 'created_at'>) => void;
  updateToda: (id: string, updates: Partial<Toda>) => void;
  deleteToda: (id: string) => void;
  todaMembers: TodaMember[];
  addTodaMember: (member: Omit<TodaMember, 'id' | 'created_at'>) => void;
  updateTodaMember: (id: string, updates: Partial<TodaMember>) => void;
  deleteTodaMember: (id: string) => void;

  opifIndicators: OpifIndicator[];
  updateOpifIndicator: (id: string, updates: Partial<OpifIndicator>) => void;
  addOpifIndicator: (indicator: OpifIndicator) => void;
  deleteOpifIndicator: (id: string) => void;
  resetOpifIndicators: () => void;

  csuReports: CsuDailyReport[];
  addCsuReport: (report: Omit<CsuDailyReport, 'id' | 'created_at'>) => void;

  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  releaseInventoryItem: (params: {
    itemId: string;
    department: string;
    quantity: number;
    receivedBy: string;
    dateReceived: string;
    remarks?: string;
  }) => { success: boolean; message?: string };
  stockInInventoryItem: (params: {
    itemId?: string;
    item?: string;
    description?: string;
    unit?: string;
    quantity: number;
    lowStockThreshold?: number;
    dateReceived: string;
    department?: string;
    receivedBy?: string;
    remarks?: string;
  }) => { success: boolean; message?: string };
  adjustInventoryItem: (id: string, newQuantity: number, reason: string) => void;
  returnInventoryItem: (params: {
    itemId: string;
    department: string;
    quantity: number;
    returnedBy: string;
    dateReturned: string;
    remarks?: string;
  }) => { success: boolean; message?: string };
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  resetInventoryData: () => void;

  isLiveSupabase: boolean;
}

const MeedoContext = createContext<MeedoContextType | undefined>(undefined);

export const MeedoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [stalls, setStalls] = useState<Stall[]>(initialStalls);
  const [electricBills, setElectricBills] = useState<ElectricBill[]>(initialElectricBills);
  const [slaughterRecords, setSlaughterRecords] = useState<SlaughterRecord[]>(initialSlaughterRecords);
  const [butchers, setButchers] = useState<ButcherProfile[]>(initialButchers);
  const [cemeteryBookings, setCemeteryBookings] = useState<CemeteryBooking[]>(initialCemeteryBookings);
  const [todas, setTodas] = useState<Toda[]>(initialTodas);
  const [todaMembers, setTodaMembers] = useState<TodaMember[]>(initialTodaMembers);
  const [opifIndicators, setOpifIndicators] = useState<OpifIndicator[]>(initialOpifIndicators);
  const [csuReports, setCsuReports] = useState<CsuDailyReport[]>(initialCsuReports);
  const [guards, setGuards] = useState<MarketGuard[]>(initialMarketGuards);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(initialInventoryTransactions);
  const [monitoringRecords, setMonitoringRecords] = useState<MonitoringRecord[]>([]);

  // Initialize from Supabase and clean up legacy mock data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // One-time wipe of old mock data from previous demo sessions
        if (localStorage.getItem('meedo_clean_slate_v4') !== 'true') {
          localStorage.removeItem('meedo_stalls');
          localStorage.removeItem('meedo_bills');
          localStorage.removeItem('meedo_slaughter');
          localStorage.removeItem('meedo_cemetery');
          localStorage.removeItem('meedo_todas');
          localStorage.removeItem('meedo_members');
          localStorage.removeItem('meedo_opif');
          localStorage.removeItem('meedo_csu');
          localStorage.removeItem('meedo_guards');
          localStorage.removeItem('meedo_inventory_items');
          localStorage.removeItem('meedo_inventory_transactions');
          localStorage.removeItem('meedo_butchers');
          localStorage.removeItem('meedo_users');
          localStorage.setItem('meedo_clean_slate_v4', 'true');
        }

        const savedUser = localStorage.getItem('meedo_current_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

        const savedUsersStr = localStorage.getItem('meedo_users');
        if (savedUsersStr) {
          try {
            const parsed = JSON.parse(savedUsersStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setUsers(parsed);
            }
          } catch (e) {}
        }

        if (isSupabaseConfigured && supabase) {
          // Fetch live production data from Supabase
          const fetchSupabase = async () => {
            const client = supabase;
            if (!client) return;
            try {
              const [
                tenantsRes,
                billsRes,
                slaughterRes,
                cemRes,
                todasRes,
                membersRes,
                opifRes,
                csuRes,
                invItemsRes,
                invTxRes,
                butchersRes,
                profilesRes,
                auditRes,
                monitoringRes,
              ] = await Promise.all([
                client.from('stall_tenants').select('*'),
                client.from('electric_bills').select('*'),
                client.from('slaughter_records').select('*'),
                client.from('cemetery_bookings').select('*'),
                client.from('todas').select('*'),
                client.from('toda_members').select('*'),
                client.from('opif_indicators').select('*'),
                client.from('csu_daily_reports').select('*'),
                client.from('inventory_items').select('*'),
                client.from('inventory_transactions').select('*'),
                client.from('butchers').select('*'),
                client.from('profiles').select('*'),
                client.from('audit_logs').select('*').order('created_at', { ascending: true }),
                client.from('monitoring_records').select('*').order('monitoring_date', { ascending: false }),
              ]);

              if (billsRes.data) setElectricBills(billsRes.data);
              if (slaughterRes.data) setSlaughterRecords(slaughterRes.data);
              if (cemRes.data) setCemeteryBookings(cemRes.data);
              if (todasRes.data) setTodas(todasRes.data);
              if (membersRes.data) setTodaMembers(membersRes.data);
              if (opifRes.data) setOpifIndicators(opifRes.data);
              if (csuRes.data) setCsuReports(csuRes.data);
              if (invItemsRes.data) setInventoryItems(invItemsRes.data);
              if (invTxRes.data) setInventoryTransactions(invTxRes.data);
              if (butchersRes.data) setButchers(butchersRes.data);
              if (monitoringRes.data) setMonitoringRecords(monitoringRes.data);

              if (tenantsRes.data) {
                const tenantMap = new Map();
                tenantsRes.data.forEach((t: any) => {
                  if (t.is_current) tenantMap.set(t.stall_no, t);
                });
                setStalls((prev) =>
                  prev.map((s) => ({
                    ...s,
                    status: (tenantMap.has(s.stall_no) ? 'Occupied' : 'Vacant') as any,
                    current_tenant: tenantMap.get(s.stall_no) || null,
                  }))
                );
              }

              // Consolidate users directory from initial seeds, local cache, profiles, and audit log events
              const userMap = new Map<string, UserProfile>();
              initialUsers.forEach((u) => userMap.set(u.username.toLowerCase(), u));

              const cachedUsers = localStorage.getItem('meedo_users');
              if (cachedUsers) {
                try {
                  const parsed = JSON.parse(cachedUsers);
                  if (Array.isArray(parsed)) {
                    parsed.forEach((u: UserProfile) => {
                      if (u && u.username) {
                        const existing = userMap.get(u.username.toLowerCase()) || {};
                        userMap.set(u.username.toLowerCase(), { ...existing, ...u });
                      }
                    });
                  }
                } catch (e) {}
              }

              if (profilesRes.data && profilesRes.data.length > 0) {
                profilesRes.data.forEach((p: any) => {
                  if (p && p.username) {
                    const existing = userMap.get(p.username.toLowerCase()) || {};
                    userMap.set(p.username.toLowerCase(), { ...existing, ...p });
                  }
                });
              }

              if (auditRes.data && auditRes.data.length > 0) {
                auditRes.data.forEach((log: any) => {
                  try {
                    const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                    if (!details) return;
                    if (log.action === 'USER_REGISTERED' || log.action === 'USER_CREATED_BY_ADMIN') {
                      const u = details.user || details;
                      if (u && u.username) {
                        const existing = userMap.get(u.username.toLowerCase()) || {};
                        userMap.set(u.username.toLowerCase(), { ...existing, ...u });
                      }
                    } else if (log.action === 'USER_APPROVED') {
                      const un = (details.target_username || details.username || '').toLowerCase();
                      if (un && userMap.has(un)) {
                        const curr = userMap.get(un)!;
                        userMap.set(un, { ...curr, status: 'Approved' });
                      }
                    } else if (log.action === 'USER_BLOCKED') {
                      const un = (details.target_username || details.username || '').toLowerCase();
                      if (un && userMap.has(un)) {
                        const curr = userMap.get(un)!;
                        userMap.set(un, { ...curr, status: 'Blocked' });
                      }
                    } else if (log.action === 'USER_DELETED') {
                      const un = (details.target_username || details.username || '').toLowerCase();
                      if (un) userMap.delete(un);
                    } else if (log.action === 'USER_PROFILE_UPDATED') {
                      const un = (details.target_username || details.username || '').toLowerCase();
                      if (un && userMap.has(un) && details.updates) {
                        const curr = userMap.get(un)!;
                        userMap.set(un, { ...curr, ...details.updates });
                      }
                    }
                  } catch (e) {}
                });
              }

              const consolidated = Array.from(userMap.values());
              setUsers(consolidated);
              localStorage.setItem('meedo_users', JSON.stringify(consolidated));
            } catch (err) {
              console.warn('Supabase sync note:', err);
            }
          };
          fetchSupabase();
        } else {
          // Local storage fallback if offline
          const savedStalls = localStorage.getItem('meedo_stalls');
          if (savedStalls) setStalls(JSON.parse(savedStalls));

          const savedBills = localStorage.getItem('meedo_bills');
          if (savedBills) setElectricBills(JSON.parse(savedBills));

          const savedSlaughter = localStorage.getItem('meedo_slaughter');
          if (savedSlaughter) setSlaughterRecords(JSON.parse(savedSlaughter));

          const savedCem = localStorage.getItem('meedo_cemetery');
          if (savedCem) setCemeteryBookings(JSON.parse(savedCem));

          const savedTodas = localStorage.getItem('meedo_todas');
          if (savedTodas) setTodas(JSON.parse(savedTodas));

          const savedMembers = localStorage.getItem('meedo_members');
          if (savedMembers) setTodaMembers(JSON.parse(savedMembers));

          const savedOpif = localStorage.getItem('meedo_opif');
          if (savedOpif) setOpifIndicators(JSON.parse(savedOpif));

          const savedCsu = localStorage.getItem('meedo_csu');
          if (savedCsu) setCsuReports(JSON.parse(savedCsu));

          const savedGuards = localStorage.getItem('meedo_guards');
          if (savedGuards) setGuards(JSON.parse(savedGuards));

          const savedInvItems = localStorage.getItem('meedo_inventory_items');
          if (savedInvItems) setInventoryItems(JSON.parse(savedInvItems));

          const savedInvTx = localStorage.getItem('meedo_inventory_transactions');
          if (savedInvTx) setInventoryTransactions(JSON.parse(savedInvTx));

          const savedButchers = localStorage.getItem('meedo_butchers');
          if (savedButchers) setButchers(JSON.parse(savedButchers));

          const savedUsers = localStorage.getItem('meedo_users');
          if (savedUsers) setUsers(JSON.parse(savedUsers));

          const savedMonitoring = localStorage.getItem('meedo_monitoring_records');
          if (savedMonitoring) setMonitoringRecords(JSON.parse(savedMonitoring));
        }
      } catch (e) {
        console.error('Failed to load saved state:', e);
      } finally {
        setAuthLoading(false);
      }
    }
  }, []);

  const addGuard = (guard: MarketGuard) => {
    setGuards((prev) => {
      const exists = prev.some((g) => g.guard_id.toUpperCase() === guard.guard_id.toUpperCase());
      const updated = exists
        ? prev.map((g) => (g.guard_id.toUpperCase() === guard.guard_id.toUpperCase() ? guard : g))
        : [...prev, guard];
      localStorage.setItem('meedo_guards', JSON.stringify(updated));
      return updated;
    });
  };

  const updateGuard = (guardId: string, updates: Partial<MarketGuard>) => {
    setGuards((prev) => {
      const updated = prev.map((g) =>
        g.guard_id.toUpperCase() === guardId.toUpperCase() ? { ...g, ...updates } : g
      );
      localStorage.setItem('meedo_guards', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteGuard = (guardId: string) => {
    setGuards((prev) => {
      const updated = prev.filter((g) => g.guard_id.toUpperCase() !== guardId.toUpperCase());
      localStorage.setItem('meedo_guards', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUsers = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const [profilesRes, auditRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: true }),
      ]);

      const userMap = new Map<string, UserProfile>();
      initialUsers.forEach((u) => userMap.set(u.username.toLowerCase(), u));

      const localUsers = localStorage.getItem('meedo_users');
      if (localUsers) {
        try {
          const parsed = JSON.parse(localUsers);
          if (Array.isArray(parsed)) {
            parsed.forEach((u: UserProfile) => {
              if (u && u.username) {
                userMap.set(u.username.toLowerCase(), {
                  ...userMap.get(u.username.toLowerCase()),
                  ...u,
                });
              }
            });
          }
        } catch (e) {}
      }

      if (profilesRes.data && profilesRes.data.length > 0) {
        profilesRes.data.forEach((p: any) => {
          if (p && p.username) {
            const existing = userMap.get(p.username.toLowerCase()) || {};
            userMap.set(p.username.toLowerCase(), { ...existing, ...p });
          }
        });
      }

      if (auditRes.data && auditRes.data.length > 0) {
        auditRes.data.forEach((log: any) => {
          try {
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            if (!details) return;
            if (log.action === 'USER_REGISTERED' || log.action === 'USER_CREATED_BY_ADMIN') {
              const u = details.user || details;
              if (u && u.username) {
                const existing = userMap.get(u.username.toLowerCase()) || {};
                userMap.set(u.username.toLowerCase(), { ...existing, ...u });
              }
            } else if (log.action === 'USER_APPROVED') {
              const un = (details.target_username || details.username || '').toLowerCase();
              if (un && userMap.has(un)) {
                const curr = userMap.get(un)!;
                userMap.set(un, { ...curr, status: 'Approved' });
              }
            } else if (log.action === 'USER_BLOCKED') {
              const un = (details.target_username || details.username || '').toLowerCase();
              if (un && userMap.has(un)) {
                const curr = userMap.get(un)!;
                userMap.set(un, { ...curr, status: 'Blocked' });
              }
            } else if (log.action === 'USER_DELETED') {
              const un = (details.target_username || details.username || '').toLowerCase();
              if (un) userMap.delete(un);
            } else if (log.action === 'USER_PROFILE_UPDATED') {
              const un = (details.target_username || details.username || '').toLowerCase();
              if (un && userMap.has(un) && details.updates) {
                const curr = userMap.get(un)!;
                userMap.set(un, { ...curr, ...details.updates });
              }
            }
          } catch (e) {}
        });
      }

      const mergedUsers = Array.from(userMap.values());
      setUsers(mergedUsers);
      localStorage.setItem('meedo_users', JSON.stringify(mergedUsers));
    } catch (err) {
      console.warn('Failed to refresh users directory from Supabase:', err);
    }
  };

  const login = (
    identifier: string,
    passwordInput?: string
  ): { success: boolean; message?: string } => {
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, message: 'Please enter your username or Guard ID.' };
    }

    const existing = users.find(
      (u) =>
        u.username.toLowerCase() === trimmed ||
        (u.guard_id && u.guard_id.toLowerCase() === trimmed)
    );

    if (existing) {
      if (existing.status === 'Pending') {
        return {
          success: false,
          message: 'Account approval pending. Please contact the MEEDO Office to activate your departmental credentials.',
        };
      }
      if (existing.status === 'Blocked') {
        return {
          success: false,
          message: 'Account suspended. This user account has been deactivated by the Administrator.',
        };
      }

      // Password verification: if account has a designated password, check it
      if (existing.password && passwordInput !== undefined) {
        if (existing.password !== passwordInput.trim()) {
          return {
            success: false,
            message: 'Invalid password. Please enter the correct password for this account.',
          };
        }
      }

      setCurrentUser(existing);
      localStorage.setItem('meedo_current_user', JSON.stringify(existing));

      if (isSupabaseConfigured && supabase) {
        supabase
          .from('audit_logs')
          .insert({
            username: existing.username,
            action: 'USER_LOGIN',
            details: JSON.stringify({
              role: existing.role,
              section: existing.section,
              timestamp: new Date().toISOString(),
            }),
          })
          .then();
      }

      return { success: true };
    }

    // Check if identifier matches a registered guard from the roster (e.g. G-101, G-102...)
    const matchedGuard = guards.find((g) => g.guard_id.toLowerCase() === trimmed);
    if (matchedGuard) {
      const guardUser: UserProfile = {
        id: 'usr_guard_' + matchedGuard.guard_id,
        username: matchedGuard.guard_id,
        role: 'Staff',
        section: 'F',
        status: 'Approved',
        guard_id: matchedGuard.guard_id,
        full_name: matchedGuard.guard_name,
        rank_title: matchedGuard.rank_title,
      };
      setCurrentUser(guardUser);
      localStorage.setItem('meedo_current_user', JSON.stringify(guardUser));
      return { success: true };
    }

    return {
      success: false,
      message: 'Invalid credentials. User or Guard ID does not exist in the MEEDOSys registry.',
    };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('meedo_current_user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const switchSectionUser = (sectionCode: UserSection): boolean => {
    const target = users.find(
      (u) =>
        (sectionCode === 'ALL'
          ? u.role === 'Admin' || u.section === 'ALL'
          : u.section === sectionCode) && u.status === 'Approved'
    );
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('meedo_current_user', JSON.stringify(target));
      return true;
    }
    return false;
  };

  const registerUser = (
    username: string,
    section: string,
    guardId?: string,
    fullName?: string,
    rankTitle?: string,
    password?: string
  ): { success: boolean; message?: string } => {
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      return { success: false, message: 'Username is required.' };
    }

    const exists = users.some(
      (u) => u.username.toLowerCase() === trimmedUser.toLowerCase()
    );
    if (exists) {
      return { success: false, message: 'This username is already registered. Please choose another.' };
    }

    const cleanGuardId = guardId ? guardId.trim().toUpperCase() : undefined;
    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      username: trimmedUser,
      role: 'Staff',
      section: section as UserSection,
      status: 'Pending',
      password: password?.trim() || undefined,
      guard_id: cleanGuardId,
      full_name: fullName ? fullName.trim() : trimmedUser,
      rank_title: rankTitle ? rankTitle.trim() : undefined,
      created_at: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('meedo_users', JSON.stringify(updatedUsers));

    // Sync to Supabase audit logs
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('audit_logs')
        .insert({
          username: newUser.username,
          action: 'USER_REGISTERED',
          details: JSON.stringify({
            user: newUser,
            timestamp: new Date().toISOString(),
          }),
        })
        .then();
    }

    // If registering under Section F with Guard ID, ensure it exists in guards roster
    if (section === 'F' && cleanGuardId) {
      setGuards((prev) => {
        const existingIndex = prev.findIndex(
          (g) => g.guard_id.toUpperCase() === cleanGuardId
        );
        let updatedRoster: MarketGuard[];
        if (existingIndex >= 0) {
          updatedRoster = prev.map((g, i) =>
            i === existingIndex
              ? {
                  ...g,
                  guard_name: fullName?.trim() || g.guard_name,
                  rank_title: rankTitle?.trim() || g.rank_title,
                }
              : g
          );
        } else {
          updatedRoster = [
            ...prev,
            {
              guard_id: cleanGuardId,
              guard_name: fullName?.trim() || trimmedUser,
              rank_title: rankTitle?.trim() || 'SO1',
              default_area: 'Market General Security',
              status: 'Active',
            },
          ];
        }
        localStorage.setItem('meedo_guards', JSON.stringify(updatedRoster));
        return updatedRoster;
      });
    }

    return { success: true };
  };

  const updateUserStatus = (username: string, action: 'approve' | 'block' | 'delete') => {
    let updated: UserProfile[];
    if (action === 'delete') {
      updated = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
    } else {
      updated = users.map((u) =>
        u.username.toLowerCase() === username.toLowerCase()
          ? { ...u, status: action === 'approve' ? 'Approved' : 'Blocked' }
          : u
      );
    }
    setUsers(updated);
    localStorage.setItem('meedo_users', JSON.stringify(updated));

    // Update active currentUser session if matching
    if (currentUser?.username.toLowerCase() === username.toLowerCase()) {
      if (action === 'delete' || action === 'block') {
        setCurrentUser(null);
        localStorage.removeItem('meedo_current_user');
      } else {
        const updatedSelf = { ...currentUser, status: 'Approved' as const };
        setCurrentUser(updatedSelf);
        localStorage.setItem('meedo_current_user', JSON.stringify(updatedSelf));
      }
    }

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('audit_logs')
        .insert({
          username: currentUser?.username || 'admin',
          action: action === 'approve' ? 'USER_APPROVED' : action === 'block' ? 'USER_BLOCKED' : 'USER_DELETED',
          details: JSON.stringify({
            target_username: username,
            action,
            timestamp: new Date().toISOString(),
          }),
        })
        .then();

      if (action === 'delete') {
        supabase.from('profiles').delete().ilike('username', username).then();
      } else {
        supabase
          .from('profiles')
          .update({ status: action === 'approve' ? 'Approved' : 'Blocked' })
          .ilike('username', username)
          .then();
      }
    }
  };

  const updateUserProfile = (username: string, updates: Partial<UserProfile>) => {
    const updated = users.map((u) => {
      if (u.username.toLowerCase() === username.toLowerCase()) {
        return { ...u, ...updates, updated_at: new Date().toISOString() };
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem('meedo_users', JSON.stringify(updated));

    if (currentUser?.username.toLowerCase() === username.toLowerCase()) {
      const updatedSelf = { ...currentUser, ...updates };
      setCurrentUser(updatedSelf);
      localStorage.setItem('meedo_current_user', JSON.stringify(updatedSelf));
    }

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('audit_logs')
        .insert({
          username: currentUser?.username || 'admin',
          action: 'USER_PROFILE_UPDATED',
          details: JSON.stringify({
            target_username: username,
            updates,
            timestamp: new Date().toISOString(),
          }),
        })
        .then();

      const profilePayload: any = {};
      if (updates.role) profilePayload.role = updates.role;
      if (updates.section) profilePayload.section = updates.section;
      if (updates.status) profilePayload.status = updates.status;

      if (Object.keys(profilePayload).length > 0) {
        supabase.from('profiles').update(profilePayload).ilike('username', username).then();
      }
    }
  };

  const createUser = (
    userData: Partial<UserProfile> & { username: string; role: UserRole; section: UserSection }
  ): { success: boolean; message?: string } => {
    const trimmedUser = userData.username.trim();
    if (!trimmedUser) {
      return { success: false, message: 'Username is required.' };
    }

    if (users.some((u) => u.username.toLowerCase() === trimmedUser.toLowerCase())) {
      return { success: false, message: 'A user with this username already exists.' };
    }

    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      username: trimmedUser,
      role: userData.role || 'Staff',
      section: userData.section || 'A',
      status: userData.status || 'Approved',
      password: userData.password?.trim() || undefined,
      guard_id: userData.guard_id?.trim().toUpperCase() || undefined,
      full_name: userData.full_name?.trim() || trimmedUser,
      rank_title: userData.rank_title?.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('meedo_users', JSON.stringify(updatedUsers));

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('audit_logs')
        .insert({
          username: currentUser?.username || 'admin',
          action: 'USER_CREATED_BY_ADMIN',
          details: JSON.stringify({
            created_by: currentUser?.username || 'admin',
            user: newUser,
            timestamp: new Date().toISOString(),
          }),
        })
        .then();
    }

    return { success: true };
  };

  const updateStallTenant = (stallNo: string, updates: Partial<StallTenant>) => {
    setStalls((prev) => {
      const updated = prev.map((s) => {
        if (s.stall_no === stallNo) {
          const current = s.current_tenant || {
            stall_no: stallNo,
            stall_owner: updates.stall_owner || '',
            operator: updates.operator || '',
            line_of_business: updates.line_of_business || '',
            period_index: updates.period_index || 1,
            year: new Date().getFullYear(),
            compliance_status: updates.compliance_status || 'Non-Compliant',
          };
          const hasOwner = Boolean(updates.stall_owner ?? current.stall_owner);
          return {
            ...s,
            status: hasOwner ? ('Occupied' as const) : s.status,
            current_tenant: { ...current, ...updates },
          };
        }
        return s;
      });
      try {
        localStorage.setItem('meedo_stalls', JSON.stringify(updated));
      } catch (err) {
        console.warn('localStorage quota reached, retaining tenant metadata:', err);
      }
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const payload: Record<string, any> = {};
          if (updates.stall_owner !== undefined) payload.stall_owner = updates.stall_owner;
          if (updates.operator !== undefined) payload.operator = updates.operator;
          if (updates.line_of_business !== undefined) payload.line_of_business = updates.line_of_business;
          if (updates.period_index !== undefined) payload.period_index = updates.period_index;
          if (updates.year !== undefined) payload.year = updates.year;
          if (updates.compliance_status !== undefined) payload.compliance_status = updates.compliance_status;
          if (updates.photo_url !== undefined) payload.photo_url = updates.photo_url;
          if (updates.lease_doc_url !== undefined) payload.lease_doc_url = updates.lease_doc_url;
          if (updates.permit_doc_url !== undefined) payload.permit_doc_url = updates.permit_doc_url;
          if (updates.additional_info !== undefined) payload.additional_info = updates.additional_info;
          payload.is_current = true;

          const res = await client
            .from('stall_tenants')
            .update(payload)
            .eq('stall_no', stallNo);

          if (res.error) {
            console.warn('Supabase tenant update error:', res.error.message);
          } else {
            console.log('Saved to Supabase stall_tenants for stall:', stallNo);
          }
        } catch (e) {
          console.warn('Supabase tenant update notice:', e);
        }
      })();
    }
  };

  const addStallTenant = (stallNo: string, tenant: StallTenant) => {
    setStalls((prev) => {
      const updated = prev.map((s) => {
        if (s.stall_no === stallNo) {
          const history = s.current_tenant
            ? [s.current_tenant, ...(s.tenant_history || [])]
            : s.tenant_history || [];
          return {
            ...s,
            status: 'Occupied' as const,
            current_tenant: tenant,
            tenant_history: history,
          };
        }
        return s;
      });
      try {
        localStorage.setItem('meedo_stalls', JSON.stringify(updated));
      } catch (err) {
        console.warn('localStorage quota notice:', err);
      }
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const res = await client.from('stall_tenants').insert({
            stall_no: stallNo,
            stall_owner: tenant.stall_owner,
            operator: tenant.operator || null,
            line_of_business: tenant.line_of_business || null,
            period_index: tenant.period_index || 1,
            year: tenant.year || new Date().getFullYear(),
            compliance_status: tenant.compliance_status || 'Non-Compliant',
            photo_url: tenant.photo_url || null,
            lease_doc_url: tenant.lease_doc_url || null,
            permit_doc_url: tenant.permit_doc_url || null,
            additional_info: tenant.additional_info || null,
            is_current: true,
          });
          if (res.error) console.warn('Supabase tenant insert error:', res.error.message);
        } catch (e) {
          console.warn('Supabase tenant add notice:', e);
        }
      })();
    }
  };

  const addMonitoringRecord = async (record: MonitoringRecord): Promise<boolean> => {
    const newRecord: MonitoringRecord = {
      ...record,
      id: record.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mon_${Date.now()}`),
      created_at: record.created_at || new Date().toISOString(),
    };

    setMonitoringRecords((prev) => {
      const updated = [newRecord, ...prev];
      try {
        localStorage.setItem('meedo_monitoring_records', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage quota warning:', e);
      }
      return updated;
    });

    // Sync sanitation compliance and notes back to current tenant
    const serializedInfo = formatAdditionalInfo(
      record.claygo_compliant,
      record.cctv_available,
      record.palengqr_implemented,
      record.remarks
    );
    updateStallTenant(record.stall_no, {
      additional_info: serializedInfo,
      compliance_status:
        record.claygo_compliant === 'Yes' && record.palengqr_implemented === 'Yes'
          ? 'Compliant'
          : 'Non-Compliant',
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const payload: Record<string, any> = {
          stall_no: record.stall_no,
          monitoring_date: record.monitoring_date,
          goodwill: record.goodwill || 0,
          operational_status: record.operational_status,
          permit_submitted: Boolean(record.permit_submitted),
          permit_date: record.permit_date || null,
          lease_submitted: Boolean(record.lease_submitted),
          lease_date: record.lease_date || null,
          rental_paid: Boolean(record.rental_paid),
          rental_or: record.rental_or || null,
          claygo_compliant: record.claygo_compliant || 'No',
          cctv_available: record.cctv_available || 'No',
          palengqr_implemented: record.palengqr_implemented || 'No',
          seminars_attended: record.seminars_attended || [],
          electric_bill_amount: record.electric_bill_amount || 0,
          electric_bill_status: record.electric_bill_status || 'Unpaid',
          electric_bill_due_date: record.electric_bill_due_date || null,
        };
        const res = await supabase.from('monitoring_records').insert(payload);
        if (res.error) {
          console.warn('Supabase monitoring insert warning:', res.error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Supabase monitoring insert error:', err);
        return false;
      }
    }
    return true;
  };

  const addElectricBill = (bill: ElectricBill) => {
    setElectricBills((prev) => {
      const updated = [bill, ...prev];
      localStorage.setItem('meedo_bills', JSON.stringify(updated));
      return updated;
    });
  };

  const updateBillStatus = (stallNo: string, status: 'Unpaid' | 'Partial' | 'Fully Paid') => {
    setElectricBills((prev) => {
      const updated = prev.map((b) => (b.stall_no === stallNo ? { ...b, status } : b));
      localStorage.setItem('meedo_bills', JSON.stringify(updated));
      return updated;
    });
  };

  const addSlaughterRecord = (record: Omit<SlaughterRecord, 'id' | 'created_at'>) => {
    const newRecord: SlaughterRecord = {
      ...record,
      id: 'sh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
    };
    setSlaughterRecords((prev) => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
      return updated;
    });
  };

  const addSlaughterBatch = (records: Omit<SlaughterRecord, 'id' | 'created_at'>[]) => {
    const now = Date.now();
    const newRecords: SlaughterRecord[] = records.map((record, index) => ({
      ...record,
      id: `sh_${now}_${index}_${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    }));
    setSlaughterRecords((prev) => {
      const updated = [...newRecords, ...prev];
      localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
      return updated;
    });
  };

  const updateSlaughterRecord = (id: string, updates: Partial<SlaughterRecord>) => {
    setSlaughterRecords((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSlaughterRecord = (id: string) => {
    setSlaughterRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
      return updated;
    });
  };

  const addButcher = (butcher: Omit<ButcherProfile, 'id' | 'created_at'>) => {
    const newBtc: ButcherProfile = {
      ...butcher,
      id: 'btc_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setButchers((prev) => {
      const updated = [newBtc, ...prev];
      localStorage.setItem('meedo_butchers', JSON.stringify(updated));
      return updated;
    });
  };

  const updateButcher = (id: string, updates: Partial<ButcherProfile>) => {
    setButchers((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      localStorage.setItem('meedo_butchers', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteButcher = (id: string) => {
    setButchers((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      localStorage.setItem('meedo_butchers', JSON.stringify(updated));
      return updated;
    });
  };

  const resetButchers = () => {
    setButchers([]);
    localStorage.removeItem('meedo_butchers');
  };

  const addCemeteryBooking = (booking: Omit<CemeteryBooking, 'id' | 'created_at'>) => {
    const newBooking: CemeteryBooking = {
      ...booking,
      id: 'cem_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setCemeteryBookings((prev) => {
      const updated = [newBooking, ...prev];
      localStorage.setItem('meedo_cemetery', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCemeteryBooking = (id: string, updates: Partial<CemeteryBooking>) => {
    setCemeteryBookings((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      localStorage.setItem('meedo_cemetery', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCemeteryBooking = (id: string) => {
    setCemeteryBookings((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      localStorage.setItem('meedo_cemetery', JSON.stringify(updated));
      return updated;
    });
  };

  const addToda = (toda: Omit<Toda, 'id' | 'created_at'>) => {
    const newToda: Toda = {
      ...toda,
      id: 'toda_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setTodas((prev) => {
      const updated = [newToda, ...prev];
      localStorage.setItem('meedo_todas', JSON.stringify(updated));
      return updated;
    });
  };

  const updateToda = (id: string, updates: Partial<Toda>) => {
    setTodas((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem('meedo_todas', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteToda = (id: string) => {
    setTodas((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      localStorage.setItem('meedo_todas', JSON.stringify(updated));
      return updated;
    });
  };

  const addTodaMember = (member: Omit<TodaMember, 'id' | 'created_at'>) => {
    const newMember: TodaMember = {
      ...member,
      id: 'mem_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setTodaMembers((prev) => {
      const updated = [newMember, ...prev];
      localStorage.setItem('meedo_members', JSON.stringify(updated));
      return updated;
    });
  };

  const updateTodaMember = (id: string, updates: Partial<TodaMember>) => {
    setTodaMembers((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
      localStorage.setItem('meedo_members', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTodaMember = (id: string) => {
    setTodaMembers((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      localStorage.setItem('meedo_members', JSON.stringify(updated));
      return updated;
    });
  };

  const updateOpifIndicator = (id: string, updates: Partial<OpifIndicator>) => {
    setOpifIndicators((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      localStorage.setItem('meedo_opif', JSON.stringify(updated));
      return updated;
    });
  };

  const addOpifIndicator = (indicator: OpifIndicator) => {
    setOpifIndicators((prev) => {
      const updated = [...prev, indicator];
      localStorage.setItem('meedo_opif', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteOpifIndicator = (id: string) => {
    setOpifIndicators((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      localStorage.setItem('meedo_opif', JSON.stringify(updated));
      return updated;
    });
  };

  const resetOpifIndicators = () => {
    setOpifIndicators(initialOpifIndicators);
    localStorage.setItem('meedo_opif', JSON.stringify(initialOpifIndicators));
  };

  const addCsuReport = (report: Omit<CsuDailyReport, 'id' | 'created_at'>) => {
    const newReport: CsuDailyReport = {
      ...report,
      id: 'csu_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setCsuReports((prev) => {
      const updated = [newReport, ...prev];
      localStorage.setItem('meedo_csu', JSON.stringify(updated));
      return updated;
    });
  };

  const releaseInventoryItem = (params: {
    itemId: string;
    department: string;
    quantity: number;
    receivedBy: string;
    dateReceived: string;
    remarks?: string;
  }): { success: boolean; message?: string } => {
    if (currentUser?.role !== 'Admin' && currentUser?.section !== 'ALL') {
      return { success: false, message: 'Administrator privilege required for inventory release.' };
    }
    const item = inventoryItems.find((i) => i.id === params.itemId);
    if (!item) {
      return { success: false, message: 'Item not found in inventory.' };
    }
    if (params.quantity <= 0) {
      return { success: false, message: 'Release quantity must be greater than zero.' };
    }
    if (params.quantity > item.quantity) {
      return {
        success: false,
        message: `Requested quantity (${params.quantity} ${item.unit}) exceeds available stock (${item.quantity} ${item.unit}).`,
      };
    }

    const updatedQty = item.quantity - params.quantity;
    const nowIso = new Date().toISOString();

    const updatedItems = inventoryItems.map((i) =>
      i.id === item.id
        ? {
            ...i,
            quantity: updatedQty,
            updated_at: nowIso,
          }
        : i
    );
    setInventoryItems(updatedItems);
    localStorage.setItem('meedo_inventory_items', JSON.stringify(updatedItems));

    const releasingOfficer =
      currentUser?.full_name || currentUser?.username || 'Authorized Property Officer';

    const newTx: InventoryTransaction = {
      id: 'tx_' + Date.now(),
      inventory_item_id: item.id,
      item_name: item.item,
      description: item.description,
      department_section: params.department,
      transaction_type: 'Release',
      quantity: params.quantity,
      unit: item.unit,
      received_by: params.receivedBy,
      released_by: releasingOfficer,
      transaction_date: params.dateReceived,
      remarks: params.remarks || undefined,
      created_at: nowIso,
    };

    const updatedTx = [newTx, ...inventoryTransactions];
    setInventoryTransactions(updatedTx);
    localStorage.setItem('meedo_inventory_transactions', JSON.stringify(updatedTx));

    return { success: true };
  };

  const stockInInventoryItem = (params: {
    itemId?: string;
    item?: string;
    description?: string;
    unit?: string;
    quantity: number;
    lowStockThreshold?: number;
    dateReceived: string;
    department?: string;
    receivedBy?: string;
    remarks?: string;
  }): { success: boolean; message?: string } => {
    if (currentUser?.role !== 'Admin' && currentUser?.section !== 'ALL') {
      return { success: false, message: 'Administrator privilege required for stock replenishment.' };
    }
    if (params.quantity <= 0) {
      return { success: false, message: 'Stock In quantity must be greater than zero.' };
    }

    const nowIso = new Date().toISOString();
    const releasingOfficer =
      currentUser?.full_name || currentUser?.username || 'Authorized Property Officer';

    let targetItemName = '';
    let targetDesc = '';
    let targetUnit = '';
    let targetItemId = params.itemId || '';

    let updatedItems: InventoryItem[];

    if (params.itemId) {
      const existing = inventoryItems.find((i) => i.id === params.itemId);
      if (!existing) {
        return { success: false, message: 'Item specified for stock replenishment not found.' };
      }
      targetItemName = existing.item;
      targetDesc = existing.description;
      targetUnit = existing.unit;
      updatedItems = inventoryItems.map((i) =>
        i.id === params.itemId
          ? {
              ...i,
              quantity: i.quantity + params.quantity,
              date_received: params.dateReceived || i.date_received,
              updated_at: nowIso,
            }
          : i
      );
    } else {
      if (!params.item || !params.unit) {
        return { success: false, message: 'Item name and unit are required for new inventory items.' };
      }
      targetItemId = 'inv_' + Date.now();
      targetItemName = params.item.trim();
      targetDesc = params.description || '';
      targetUnit = params.unit.trim();

      const newItem: InventoryItem = {
        id: targetItemId,
        item: targetItemName,
        description: targetDesc,
        unit: targetUnit,
        quantity: params.quantity,
        low_stock_threshold: params.lowStockThreshold ?? 5,
        date_received: params.dateReceived,
        created_at: nowIso,
        updated_at: nowIso,
      };
      updatedItems = [newItem, ...inventoryItems];
    }

    setInventoryItems(updatedItems);
    localStorage.setItem('meedo_inventory_items', JSON.stringify(updatedItems));

    const newTx: InventoryTransaction = {
      id: 'tx_' + Date.now(),
      inventory_item_id: targetItemId,
      item_name: targetItemName,
      description: targetDesc,
      department_section: params.department || 'MEEDO',
      transaction_type: 'Stock In',
      quantity: params.quantity,
      unit: targetUnit,
      received_by: params.receivedBy || 'Supply Custodian',
      released_by: releasingOfficer,
      transaction_date: params.dateReceived,
      remarks: params.remarks || 'Stock In Replenishment',
      created_at: nowIso,
    };

    const updatedTx = [newTx, ...inventoryTransactions];
    setInventoryTransactions(updatedTx);
    localStorage.setItem('meedo_inventory_transactions', JSON.stringify(updatedTx));

    return { success: true };
  };

  const adjustInventoryItem = (id: string, newQuantity: number, reason: string) => {
    if (currentUser?.role !== 'Admin' && currentUser?.section !== 'ALL') {
      console.warn('Unauthorized: Administrator privilege required for inventory adjustment.');
      return;
    }
    const item = inventoryItems.find((i) => i.id === id);
    if (!item) return;

    const diff = newQuantity - item.quantity;
    const nowIso = new Date().toISOString();
    const releasingOfficer =
      currentUser?.full_name || currentUser?.username || 'Authorized Property Officer';

    const updatedItems = inventoryItems.map((i) =>
      i.id === id ? { ...i, quantity: Math.max(0, newQuantity), updated_at: nowIso } : i
    );
    setInventoryItems(updatedItems);
    localStorage.setItem('meedo_inventory_items', JSON.stringify(updatedItems));

    const newTx: InventoryTransaction = {
      id: 'tx_' + Date.now(),
      inventory_item_id: item.id,
      item_name: item.item,
      description: item.description,
      department_section: 'MEEDO Property Office',
      transaction_type: 'Adjustment',
      quantity: Math.abs(diff),
      unit: item.unit,
      received_by: 'Inventory Audit',
      released_by: releasingOfficer,
      transaction_date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      remarks: `Manual reconciliation (${diff >= 0 ? '+' : ''}${diff}): ${reason}`,
      created_at: nowIso,
    };

    const updatedTx = [newTx, ...inventoryTransactions];
    setInventoryTransactions(updatedTx);
    localStorage.setItem('meedo_inventory_transactions', JSON.stringify(updatedTx));
  };

  const returnInventoryItem = (params: {
    itemId: string;
    department: string;
    quantity: number;
    returnedBy: string;
    dateReturned: string;
    remarks?: string;
  }): { success: boolean; message?: string } => {
    if (currentUser?.role !== 'Admin' && currentUser?.section !== 'ALL') {
      return { success: false, message: 'Administrator privilege required for inventory return.' };
    }
    const item = inventoryItems.find((i) => i.id === params.itemId);
    if (!item) return { success: false, message: 'Item not found.' };
    if (params.quantity <= 0) return { success: false, message: 'Quantity must be greater than zero.' };

    const nowIso = new Date().toISOString();
    const releasingOfficer =
      currentUser?.full_name || currentUser?.username || 'Authorized Property Officer';

    const updatedItems = inventoryItems.map((i) =>
      i.id === item.id
        ? { ...i, quantity: i.quantity + params.quantity, updated_at: nowIso }
        : i
    );
    setInventoryItems(updatedItems);
    localStorage.setItem('meedo_inventory_items', JSON.stringify(updatedItems));

    const newTx: InventoryTransaction = {
      id: 'tx_' + Date.now(),
      inventory_item_id: item.id,
      item_name: item.item,
      description: item.description,
      department_section: params.department,
      transaction_type: 'Return',
      quantity: params.quantity,
      unit: item.unit,
      received_by: releasingOfficer,
      released_by: params.returnedBy,
      transaction_date: params.dateReturned,
      remarks: params.remarks || 'Surplus or unused supply returned to inventory',
      created_at: nowIso,
    };

    const updatedTx = [newTx, ...inventoryTransactions];
    setInventoryTransactions(updatedTx);
    localStorage.setItem('meedo_inventory_transactions', JSON.stringify(updatedTx));

    return { success: true };
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    if (currentUser?.role !== 'Admin' && currentUser?.section !== 'ALL') {
      console.warn('Unauthorized: Administrator privilege required for inventory updates.');
      return;
    }
    setInventoryItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
      );
      localStorage.setItem('meedo_inventory_items', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteInventoryItem = (id: string) => {
    if (currentUser?.role !== 'Admin' && currentUser?.section !== 'ALL') {
      console.warn('Unauthorized: Administrator privilege required for inventory deletion.');
      return;
    }
    setInventoryItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('meedo_inventory_items', JSON.stringify(updated));
      return updated;
    });
  };

  const resetInventoryData = () => {
    if (currentUser?.role !== 'Admin' && currentUser?.section !== 'ALL') {
      console.warn('Unauthorized: Administrator privilege required to reset inventory.');
      return;
    }
    setInventoryItems(initialInventoryItems);
    setInventoryTransactions(initialInventoryTransactions);
    localStorage.setItem('meedo_inventory_items', JSON.stringify(initialInventoryItems));
    localStorage.setItem('meedo_inventory_transactions', JSON.stringify(initialInventoryTransactions));
  };

  return (
    <MeedoContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authLoading,
        login,
        logout,
        switchSectionUser,
        users,
        updateUserStatus,
        updateUserProfile,
        createUser,
        registerUser,
        refreshUsers,
        stalls,
        updateStallTenant,
        addStallTenant,
        monitoringRecords,
        addMonitoringRecord,
        electricBills,
        addElectricBill,
        updateBillStatus,
        slaughterRecords,
        addSlaughterRecord,
        addSlaughterBatch,
        updateSlaughterRecord,
        deleteSlaughterRecord,
        butchers,
        addButcher,
        updateButcher,
        deleteButcher,
        resetButchers,
        cemeteryBookings,
        addCemeteryBooking,
        updateCemeteryBooking,
        deleteCemeteryBooking,
        todas,
        addToda,
        updateToda,
        deleteToda,
        todaMembers,
        addTodaMember,
        updateTodaMember,
        deleteTodaMember,
        opifIndicators,
        updateOpifIndicator,
        addOpifIndicator,
        deleteOpifIndicator,
        resetOpifIndicators,
        csuReports,
        addCsuReport,
        guards,
        addGuard,
        updateGuard,
        deleteGuard,
        inventoryItems,
        inventoryTransactions,
        releaseInventoryItem,
        stockInInventoryItem,
        adjustInventoryItem,
        returnInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        resetInventoryData,
        isLiveSupabase: isSupabaseConfigured,
      }}
    >
      {children}
    </MeedoContext.Provider>
  );
};

export const useMeedo = () => {
  const context = useContext(MeedoContext);
  if (!context) {
    throw new Error('useMeedo must be used within a MeedoProvider');
  }
  return context;
};
