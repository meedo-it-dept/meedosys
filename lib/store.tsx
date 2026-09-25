'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  UserProfile,
  UserSection,
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
  login: (username: string, role?: string, section?: string) => boolean;
  logout: () => void;
  switchSectionUser: (sectionCode: UserSection) => boolean;
  users: UserProfile[];
  updateUserStatus: (username: string, action: 'approve' | 'block' | 'delete') => void;
  registerUser: (
    username: string,
    section: string,
    guardId?: string,
    fullName?: string,
    rankTitle?: string
  ) => boolean;

  guards: MarketGuard[];
  addGuard: (guard: MarketGuard) => void;
  updateGuard: (guardId: string, updates: Partial<MarketGuard>) => void;
  deleteGuard: (guardId: string) => void;

  stalls: Stall[];
  updateStallTenant: (stallNo: string, tenant: Partial<StallTenant>) => void;
  addStallTenant: (stallNo: string, tenant: StallTenant) => void;

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

  // Initialize from LocalStorage for demo persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('meedo_current_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

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
        if (savedOpif) {
          const parsed = JSON.parse(savedOpif);
          if (Array.isArray(parsed) && parsed.length > 0 && ('col3' in parsed[0] || 'col4' in parsed[0])) {
            setOpifIndicators(parsed);
          } else {
            setOpifIndicators(initialOpifIndicators);
            localStorage.setItem('meedo_opif', JSON.stringify(initialOpifIndicators));
          }
        }

        const savedCsu = localStorage.getItem('meedo_csu');
        if (savedCsu) setCsuReports(JSON.parse(savedCsu));

        const savedGuards = localStorage.getItem('meedo_guards');
        if (savedGuards) {
          try {
            setGuards(JSON.parse(savedGuards));
          } catch (e) {
            setGuards(initialMarketGuards);
          }
        }

        const savedInvItems = localStorage.getItem('meedo_inventory_items');
        if (savedInvItems) {
          try {
            const parsed = JSON.parse(savedInvItems);
            if (Array.isArray(parsed) && parsed.some((x: any) => x.id === 'inv_001' || x.item === 'Bond Paper A4')) {
              localStorage.removeItem('meedo_inventory_items');
              localStorage.removeItem('meedo_inventory_transactions');
              setInventoryItems([]);
              setInventoryTransactions([]);
            } else {
              setInventoryItems(parsed);
            }
          } catch (e) {
            setInventoryItems(initialInventoryItems);
          }
        }

        const savedInvTx = localStorage.getItem('meedo_inventory_transactions');
        if (savedInvTx && localStorage.getItem('meedo_inventory_items')) {
          try {
            const parsedTx = JSON.parse(savedInvTx);
            if (Array.isArray(parsedTx) && parsedTx.some((x: any) => x.id === 'tx_001' || x.item_name === 'Bond Paper A4')) {
              localStorage.removeItem('meedo_inventory_transactions');
              setInventoryTransactions([]);
            } else {
              setInventoryTransactions(parsedTx);
            }
          } catch (e) {
            setInventoryTransactions(initialInventoryTransactions);
          }
        }

        const savedButchers = localStorage.getItem('meedo_butchers');
        if (savedButchers) {
          try {
            const parsed = JSON.parse(savedButchers);
            if (Array.isArray(parsed) && parsed.some((b: any) => b.id === 'btc_001' || b.name?.includes('Danilo') || b.butcher_code === 'BTC-001')) {
              localStorage.removeItem('meedo_butchers');
              setButchers([]);
            } else {
              setButchers(parsed);
            }
          } catch (e) {
            setButchers(initialButchers);
          }
        }

        const savedUsers = localStorage.getItem('meedo_users');
        if (savedUsers) {
          try {
            const parsedUsers: UserProfile[] = JSON.parse(savedUsers);
            const userMap = new Map<string, UserProfile>();
            initialUsers.forEach((u) => userMap.set(u.username.toLowerCase(), u));
            parsedUsers.forEach((u) => userMap.set(u.username.toLowerCase(), u));
            setUsers(Array.from(userMap.values()));
          } catch (e) {
            setUsers(initialUsers);
          }
        }
      } catch (e) {
        console.error('Failed to load saved state from localStorage:', e);
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

  const login = (identifier: string): boolean => {
    const trimmed = identifier.trim().toLowerCase();
    const existing = users.find(
      (u) =>
        u.username.toLowerCase() === trimmed ||
        (u.guard_id && u.guard_id.toLowerCase() === trimmed)
    );
    if (existing) {
      if (existing.status !== 'Approved') {
        alert('Account is pending approval or blocked.');
        return false;
      }
      setCurrentUser(existing);
      localStorage.setItem('meedo_current_user', JSON.stringify(existing));
      return true;
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
      return true;
    }

    // Auto-login fallback for testing
    const isGuard = trimmed.startsWith('g-') || trimmed.includes('guard');
    const defaultUser: UserProfile = {
      id: 'usr_' + Date.now(),
      username: identifier,
      role: trimmed.includes('admin') ? 'Admin' : 'Staff',
      section: trimmed.includes('admin') ? 'ALL' : isGuard ? 'F' : 'A',
      status: 'Approved',
      guard_id: isGuard ? identifier.toUpperCase() : undefined,
      full_name: isGuard ? `Guard ${identifier.toUpperCase()}` : undefined,
    };
    setCurrentUser(defaultUser);
    localStorage.setItem('meedo_current_user', JSON.stringify(defaultUser));
    return true;
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
    rankTitle?: string
  ): boolean => {
    const cleanGuardId = guardId ? guardId.trim().toUpperCase() : undefined;
    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      username,
      role: 'Staff',
      section: section as any,
      status: 'Pending',
      guard_id: cleanGuardId,
      full_name: fullName ? fullName.trim() : undefined,
      rank_title: rankTitle ? rankTitle.trim() : undefined,
      created_at: new Date().toISOString(),
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('meedo_users', JSON.stringify(updatedUsers));

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
              guard_name: fullName?.trim() || username,
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
    return true;
  };

  const updateUserStatus = (username: string, action: 'approve' | 'block' | 'delete') => {
    let updated: UserProfile[];
    if (action === 'delete') {
      updated = users.filter((u) => u.username !== username);
    } else {
      updated = users.map((u) =>
        u.username === username
          ? { ...u, status: action === 'approve' ? 'Approved' : 'Blocked' }
          : u
      );
    }
    setUsers(updated);
    localStorage.setItem('meedo_users', JSON.stringify(updated));
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
      localStorage.setItem('meedo_stalls', JSON.stringify(updated));
      return updated;
    });
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
      localStorage.setItem('meedo_stalls', JSON.stringify(updated));
      return updated;
    });
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
        registerUser,
        stalls,
        updateStallTenant,
        addStallTenant,
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
