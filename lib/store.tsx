'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  UserProfile,
  Stall,
  ElectricBill,
  SlaughterRecord,
  CemeteryBooking,
  Toda,
  TodaMember,
  OpifIndicator,
  CsuDailyReport,
  StallTenant,
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
} from './supabase/mockData';
import { isSupabaseConfigured, supabase } from './supabase/client';

interface MeedoContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  login: (username: string, role?: string, section?: string) => boolean;
  logout: () => void;
  users: UserProfile[];
  updateUserStatus: (username: string, action: 'approve' | 'block' | 'delete') => void;
  registerUser: (username: string, section: string) => boolean;

  stalls: Stall[];
  updateStallTenant: (stallNo: string, tenant: Partial<StallTenant>) => void;
  addStallTenant: (stallNo: string, tenant: StallTenant) => void;

  electricBills: ElectricBill[];
  addElectricBill: (bill: ElectricBill) => void;
  updateBillStatus: (stallNo: string, status: 'Unpaid' | 'Partial' | 'Fully Paid') => void;

  slaughterRecords: SlaughterRecord[];
  addSlaughterRecord: (record: Omit<SlaughterRecord, 'id' | 'created_at'>) => void;

  cemeteryBookings: CemeteryBooking[];
  addCemeteryBooking: (booking: Omit<CemeteryBooking, 'id' | 'created_at'>) => void;
  deleteCemeteryBooking: (id: string) => void;

  todas: Toda[];
  addToda: (toda: Omit<Toda, 'id' | 'created_at'>) => void;
  todaMembers: TodaMember[];
  addTodaMember: (member: Omit<TodaMember, 'id' | 'created_at'>) => void;

  opifIndicators: OpifIndicator[];
  updateOpifIndicator: (id: string, updates: Partial<OpifIndicator>) => void;
  addOpifIndicator: (indicator: OpifIndicator) => void;
  deleteOpifIndicator: (id: string) => void;

  csuReports: CsuDailyReport[];
  addCsuReport: (report: Omit<CsuDailyReport, 'id' | 'created_at'>) => void;

  isLiveSupabase: boolean;
}

const MeedoContext = createContext<MeedoContextType | undefined>(undefined);

export const MeedoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [stalls, setStalls] = useState<Stall[]>(initialStalls);
  const [electricBills, setElectricBills] = useState<ElectricBill[]>(initialElectricBills);
  const [slaughterRecords, setSlaughterRecords] = useState<SlaughterRecord[]>(initialSlaughterRecords);
  const [cemeteryBookings, setCemeteryBookings] = useState<CemeteryBooking[]>(initialCemeteryBookings);
  const [todas, setTodas] = useState<Toda[]>(initialTodas);
  const [todaMembers, setTodaMembers] = useState<TodaMember[]>(initialTodaMembers);
  const [opifIndicators, setOpifIndicators] = useState<OpifIndicator[]>(initialOpifIndicators);
  const [csuReports, setCsuReports] = useState<CsuDailyReport[]>(initialCsuReports);

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
        if (savedOpif) setOpifIndicators(JSON.parse(savedOpif));

        const savedCsu = localStorage.getItem('meedo_csu');
        if (savedCsu) setCsuReports(JSON.parse(savedCsu));

        const savedUsers = localStorage.getItem('meedo_users');
        if (savedUsers) setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error('Failed to load saved state from localStorage:', e);
      }
    }
  }, []);

  const login = (username: string): boolean => {
    const existing = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      if (existing.status !== 'Approved') {
        alert('Account is pending approval or blocked.');
        return false;
      }
      setCurrentUser(existing);
      localStorage.setItem('meedo_current_user', JSON.stringify(existing));
      return true;
    }
    // Auto-login fallback for testing
    const defaultUser: UserProfile = {
      id: 'usr_' + Date.now(),
      username: username,
      role: username.toLowerCase().includes('admin') ? 'Admin' : 'Staff',
      section: username.toLowerCase().includes('admin') ? 'ALL' : 'A',
      status: 'Approved',
    };
    setCurrentUser(defaultUser);
    localStorage.setItem('meedo_current_user', JSON.stringify(defaultUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('meedo_current_user');
  };

  const registerUser = (username: string, section: string): boolean => {
    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      username,
      role: 'Staff',
      section: section as any,
      status: 'Pending',
      created_at: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('meedo_users', JSON.stringify(updated));
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
        if (s.stall_no === stallNo && s.current_tenant) {
          return {
            ...s,
            current_tenant: { ...s.current_tenant, ...updates },
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
      id: 'sh_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setSlaughterRecords((prev) => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
      return updated;
    });
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

  return (
    <MeedoContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
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
        cemeteryBookings,
        addCemeteryBooking,
        deleteCemeteryBooking,
        todas,
        addToda,
        todaMembers,
        addTodaMember,
        opifIndicators,
        updateOpifIndicator,
        addOpifIndicator,
        deleteOpifIndicator,
        csuReports,
        addCsuReport,
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
