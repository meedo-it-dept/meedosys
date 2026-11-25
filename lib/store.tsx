'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  sendEmailVerification,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
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
  MarketCalendarEvent,
  GuardShiftSession,
  InventoryItem,
  InventoryTransaction,
  ButcherProfile,
  MonitoringRecord,
  AuditLog,
  formatAdditionalInfo,
} from './types';
import {
  Permission,
  hasPermission,
  isAdminUser,
  isApprovedUser,
} from './rbac';
import {
  firebaseAuth,
  googleProvider,
  isFirebaseConfigured,
  mapFirebaseAuthError,
  provisionFirebaseEmailUser,
  sendUserPasswordReset,
} from './firebase/client';
import {
  initialStalls,
  initialElectricBills,
  initialSlaughterRecords,
  initialCemeteryBookings,
  initialTodas,
  initialTodaMembers,
  initialOpifIndicators,
  initialCsuReports,
  initialMarketGuards,
  initialMarketCalendarEvents,
  initialInventoryItems,
  initialInventoryTransactions,
  initialButchers,
} from './supabase/mockData';
import {
  isPocketBaseConfigured,
  pb,
  pbClient,
  toPbId,
  isPocketBaseConfigured as isSupabaseConfigured,
  pbClient as supabase,
} from './pocketbase/client';

const normalizeOpifRow = (raw: any): OpifIndicator => ({
  ...raw,
  id: raw.id,
  section: (raw.section || raw.division || 'A') as OpifIndicator['section'],
  col3: raw.col3 ?? '',
  col4: raw.col4 ?? raw.major_output ?? '',
  col5: raw.col5 ?? raw.indicator_code ?? '',
  col6: raw.col6 ?? raw.indicator_name ?? raw.indicator ?? '',
  col7: String(raw.col7 ?? raw.annual_target ?? raw.annual ?? ''),
  actual: String(raw.actual ?? raw.actual_annual ?? ''),
  semi: String(raw.semi ?? raw.semi_annual_target ?? ''),
  q1t: String(raw.q1t ?? raw.q1_target ?? ''),
  q1a: String(raw.q1a ?? raw.q1_actual ?? ''),
  q1p: String(raw.q1p ?? raw.q1_percent ?? ''),
  q2t: String(raw.q2t ?? raw.q2_target ?? ''),
  q2a: String(raw.q2a ?? raw.q2_actual ?? ''),
  q2p: String(raw.q2p ?? raw.q2_percent ?? ''),
  q3t: String(raw.q3t ?? raw.q3_target ?? ''),
  q3a: String(raw.q3a ?? raw.q3_actual ?? ''),
  q3p: String(raw.q3p ?? raw.q3_percent ?? ''),
  q4t: String(raw.q4t ?? raw.q4_target ?? ''),
  q4a: String(raw.q4a ?? raw.q4_actual ?? ''),
  q4p: String(raw.q4p ?? raw.q4_percent ?? ''),
});

const toOpifPbPayload = (ind: Partial<OpifIndicator>, includeId = false, sortOrder?: number): Record<string, any> => {
  const toNum = (v: any) => {
    const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const payload: Record<string, any> = {
    section: ind.section || 'A',
    division: ind.section || 'A',
    major_output: ind.col4 || ind.major_final_output || '',
    indicator_code: ind.col5 || '',
    indicator_name: ind.col6 || ind.performance_indicator || '',
    col3: ind.col3 || '',
    col4: ind.col4 || '',
    col5: ind.col5 || '',
    col6: ind.col6 || '',
    col7: ind.col7 || '',
    annual_target: toNum(ind.col7),
    actual: ind.actual || '',
    semi: ind.semi || '',
    q1t: ind.q1t || '',
    q1a: ind.q1a || '',
    q1p: ind.q1p || '',
    q2t: ind.q2t || '',
    q2a: ind.q2a || '',
    q2p: ind.q2p || '',
    q3t: ind.q3t || '',
    q3a: ind.q3a || '',
    q3p: ind.q3p || '',
    q4t: ind.q4t || '',
    q4a: ind.q4a || '',
    q4p: ind.q4p || '',
    q1_target: toNum(ind.q1t),
    q1_actual: toNum(ind.q1a),
    q2_target: toNum(ind.q2t),
    q2_actual: toNum(ind.q2a),
    q3_target: toNum(ind.q3t),
    q3_actual: toNum(ind.q3a),
    q4_target: toNum(ind.q4t),
    q4_actual: toNum(ind.q4a),
    year: ind.year || new Date().getFullYear(),
    specialSpan: ind.specialSpan || 0,
    specialText: ind.specialText || '',
    spanCol3: ind.spanCol3 || 0,
    spanCol4: ind.spanCol4 || 0,
    spanCol5: ind.spanCol5 || 0,
  };
  if (sortOrder !== undefined) payload.sort_order = sortOrder;
  if (includeId && ind.id) payload.id = toPbId(ind.id);
  return payload;
};

const sanitizeUserProfile = (raw: any): UserProfile => ({
  id: raw.id,
  username: String(raw.username || '').trim(),
  email: raw.email || undefined,
  firebase_uid: raw.firebase_uid || undefined,
  auth_provider: raw.auth_provider || undefined,
  photo_url: raw.photo_url || undefined,
  role: (raw.role || 'Staff') as UserRole,
  section: (raw.section || 'A') as UserSection,
  status: (raw.status || 'Pending') as UserStatus,
  guard_id: raw.guard_id || undefined,
  full_name: raw.full_name || undefined,
  rank_title: raw.rank_title || undefined,
  radio_call_sign: raw.radio_call_sign || undefined,
  default_area: raw.default_area || undefined,
  created_at: raw.created_at || raw.created || undefined,
  updated_at: raw.updated_at || raw.updated || undefined,
});

const generateRandomInternalPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(28);
    crypto.getRandomValues(arr);
    return Array.from(arr, (n) => chars[n % chars.length]).join('');
  }
  let out = '';
  for (let i = 0; i < 28; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

const extractPbErrorMessage = (err: any, fallback: string): string => {
  const fieldErrors = err?.response?.data || err?.data?.data;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstKey = Object.keys(fieldErrors)[0];
    const firstMsg = firstKey && fieldErrors[firstKey]?.message;
    if (firstMsg) return `${firstKey}: ${firstMsg}`;
  }
  return err?.response?.message || err?.message || fallback;
};

const applyCollectionRealtime = <T extends { id?: string }>(
  setter: React.Dispatch<React.SetStateAction<T[]>>,
  storageKey: string | null,
  payload: any,
  transform?: (row: any) => T
) => {
  const mapRow = (r: any) => (transform ? transform(r) : (r as T));
  if (payload.eventType === 'INSERT' && payload.new) {
    const item = mapRow(payload.new);
    setter((prev) => {
      if (prev.some((x) => x.id === item.id)) {
        const updated = prev.map((x) => (x.id === item.id ? { ...x, ...item } : x));
        if (storageKey) try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
        return updated;
      }
      const updated = [item, ...prev];
      if (storageKey) try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
      return updated;
    });
  } else if (payload.eventType === 'UPDATE' && payload.new) {
    const item = mapRow(payload.new);
    setter((prev) => {
      const updated = prev.map((x) => (x.id === item.id ? { ...x, ...item } : x));
      if (storageKey) try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
      return updated;
    });
  } else if (payload.eventType === 'DELETE') {
    const oldId = (payload.old as any)?.id;
    if (oldId) {
      setter((prev) => {
        const updated = prev.filter((x) => x.id !== oldId);
        if (storageKey) try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  }
};

export interface FirebaseAuthGateState {
  mode:
    | 'PROFILE_REQUIRED'
    | 'ACCOUNT_PENDING'
    | 'ACCOUNT_BLOCKED'
    | 'ACCOUNT_INACTIVE'
    | 'EMAIL_VERIFICATION_REQUIRED'
    | 'ACCOUNT_CONFLICT';
  email?: string;
  displayName?: string;
  provider?: string;
  emailVerified?: boolean;
  message: string;
}

export interface FirebaseRegistrationInput {
  username: string;
  section: string;
  guardId?: string;
  fullName?: string;
  rankTitle?: string;
  radioCallSign?: string;
  defaultArea?: string;
}

interface MeedoContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  authLoading: boolean;
  firebaseGateState: FirebaseAuthGateState | null;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; code?: string; message?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; code?: string; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; code?: string; message?: string }>;
  registerWithEmail: (
    params: FirebaseRegistrationInput & { email: string; password: string }
  ) => Promise<{ success: boolean; code?: string; message?: string }>;
  completeFirebaseRegistration: (
    params: FirebaseRegistrationInput
  ) => Promise<{ success: boolean; code?: string; message?: string }>;
  linkExistingAccount: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; code?: string; message?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; message?: string }>;
  retryFirebaseSession: () => Promise<{ success: boolean; code?: string; message?: string }>;
  logout: () => Promise<void>;
  users: UserProfile[];
  updateUserStatus: (username: string, action: 'approve' | 'block' | 'delete') => Promise<{ success: boolean; message?: string }>;
  updateUserProfile: (username: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  createUser: (userData: Partial<UserProfile> & { username: string; role: UserRole; section: UserSection; email?: string }) => Promise<{ success: boolean; message?: string }>;
  registerUser: (
    username: string,
    section: string,
    guardId?: string,
    fullName?: string,
    rankTitle?: string,
    password?: string,
    radioCallSign?: string,
    defaultArea?: string,
    email?: string
  ) => Promise<{ success: boolean; code?: string; message?: string }>;
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
  updateBillStatus: (stallNo: string, status: 'Unpaid' | 'Partial' | 'Fully Paid', billId?: string) => void;

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
  updateCsuReport: (id: string, updates: Partial<CsuDailyReport>) => void;
  requestBlotterCorrection: (reportId: string, reason: string) => void;
  approveBlotterReport: (reportId: string, reviewerNotes?: string) => void;

  marketCalendarEvents: MarketCalendarEvent[];
  addCalendarEvent: (
    event: Omit<MarketCalendarEvent, 'id' | 'created_at'>,
    bypassConflict?: boolean
  ) => { success: boolean; message?: string; conflict?: MarketCalendarEvent };
  updateCalendarEvent: (
    id: string,
    updates: Partial<MarketCalendarEvent>,
    bypassConflict?: boolean
  ) => { success: boolean; message?: string; conflict?: MarketCalendarEvent };
  deleteCalendarEvent: (id: string) => void;
  checkScheduleConflict: (
    guardId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeEventId?: string
  ) => MarketCalendarEvent | null;

  activeShiftSession: GuardShiftSession | null;
  activeShiftSessions: Record<string, GuardShiftSession>;
  getActiveShiftSession: (guardId?: string) => GuardShiftSession | null;
  startGuardShift: (eventDetails?: Partial<GuardShiftSession>) => GuardShiftSession;
  logPatrolCheck: (area: string, notes: string, guardIdOverride?: string) => void;
  endGuardShift: (turnoverNotes?: string, summaryActivities?: string, guardIdOverride?: string) => CsuDailyReport;

  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  releaseInventoryItem: (params: {
    itemId: string;
    department: string;
    quantity: number;
    receivedBy: string;
    dateReceived: string;
    remarks?: string;
  }) => Promise<{ success: boolean; message?: string }>;
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
  }) => Promise<{ success: boolean; message?: string }>;
  adjustInventoryItem: (id: string, newQuantity: number, reason: string) => Promise<{ success: boolean; message?: string }>;
  returnInventoryItem: (params: {
    itemId: string;
    department: string;
    quantity: number;
    returnedBy: string;
    dateReturned: string;
    remarks?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  resetInventoryData: () => void;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string | Record<string, any>, usernameOverride?: string) => void;

  isLivePocketBase: boolean;
  isLiveSupabase: boolean;
}

const MeedoContext = createContext<MeedoContextType | undefined>(undefined);

export const MeedoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseGateState, setFirebaseGateState] = useState<FirebaseAuthGateState | null>(null);
  const authFlowInProgressRef = useRef(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stalls, setStalls] = useState<Stall[]>(isPocketBaseConfigured ? [] : initialStalls);
  const [electricBills, setElectricBills] = useState<ElectricBill[]>(isPocketBaseConfigured ? [] : initialElectricBills);
  const [slaughterRecords, setSlaughterRecords] = useState<SlaughterRecord[]>(isPocketBaseConfigured ? [] : initialSlaughterRecords);
  const [butchers, setButchers] = useState<ButcherProfile[]>(isPocketBaseConfigured ? [] : initialButchers);
  const [cemeteryBookings, setCemeteryBookings] = useState<CemeteryBooking[]>(isPocketBaseConfigured ? [] : initialCemeteryBookings);
  const [todas, setTodas] = useState<Toda[]>(isPocketBaseConfigured ? [] : initialTodas);
  const [todaMembers, setTodaMembers] = useState<TodaMember[]>(isPocketBaseConfigured ? [] : initialTodaMembers);
  const [opifIndicators, setOpifIndicators] = useState<OpifIndicator[]>(isPocketBaseConfigured ? [] : initialOpifIndicators);
  const [csuReports, setCsuReports] = useState<CsuDailyReport[]>(isPocketBaseConfigured ? [] : initialCsuReports);
  const [guards, setGuards] = useState<MarketGuard[]>(isPocketBaseConfigured ? [] : initialMarketGuards);
  const [marketCalendarEvents, setMarketCalendarEvents] = useState<MarketCalendarEvent[]>(isPocketBaseConfigured ? [] : initialMarketCalendarEvents);
  const [activeShiftSession, setActiveShiftSession] = useState<GuardShiftSession | null>(null);
  const [activeShiftSessions, setActiveShiftSessions] = useState<Record<string, GuardShiftSession>>({});
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(isPocketBaseConfigured ? [] : initialInventoryItems);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(isPocketBaseConfigured ? [] : initialInventoryTransactions);
  const [monitoringRecords, setMonitoringRecords] = useState<MonitoringRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const requirePermission = (permission: Permission, targetSection?: UserSection): boolean => {
    if (hasPermission(currentUser, permission, targetSection)) return true;
    console.warn(
      `[RBAC] Denied action "${permission}" for user "${currentUser?.username || 'anonymous'}" (${currentUser?.role || 'None'}/${currentUser?.section || 'None'}).`
    );
    return false;
  };

  const exchangeFirebaseSession = async (
    fbUser: FirebaseUser
  ): Promise<{ success: boolean; code?: string; message?: string }> => {
    if (!isPocketBaseConfigured) {
      return {
        success: false,
        code: 'PB_UNCONFIGURED',
        message: 'Authentication backend server is not configured.',
      };
    }

    try {
      const idToken = await fbUser.getIdToken(true);
      const res = await pb.send('/api/meedo/firebase-auth', {
        method: 'POST',
        body: { idToken },
        requestKey: null,
      });

      if (res?.token && res?.record) {
        pb.authStore.save(res.token, res.record);
        const profile = sanitizeUserProfile(res.record);
        setCurrentUser(profile);
        setFirebaseGateState(null);
        localStorage.setItem('meedo_current_user', JSON.stringify(profile));
        localStorage.removeItem('meedo_users');
        return { success: true };
      }

      pb.authStore.clear();
      setCurrentUser(null);
      return {
        success: false,
        code: 'EXCHANGE_FAILED',
        message: 'Unable to establish an authenticated session.',
      };
    } catch (err: any) {
      const errBody = err?.response || err?.data || {};
      const code = String(errBody?.code || '');
      const message =
        errBody?.message ||
        (!err?.status
          ? 'Unable to connect to authentication server. Please ensure PocketBase is running.'
          : 'Authentication verification failed.');

      pb.authStore.clear();
      setCurrentUser(null);
      localStorage.removeItem('meedo_current_user');

      if (
        code === 'PROFILE_REQUIRED' ||
        code === 'ACCOUNT_PENDING' ||
        code === 'ACCOUNT_BLOCKED' ||
        code === 'ACCOUNT_INACTIVE' ||
        code === 'EMAIL_VERIFICATION_REQUIRED' ||
        code === 'ACCOUNT_CONFLICT'
      ) {
        setFirebaseGateState({
          mode: code as FirebaseAuthGateState['mode'],
          email: errBody?.firebaseUser?.email || errBody?.email || fbUser.email || undefined,
          displayName: errBody?.firebaseUser?.displayName || fbUser.displayName || undefined,
          provider: errBody?.firebaseUser?.provider || undefined,
          emailVerified: fbUser.emailVerified,
          message,
        });
      } else {
        setFirebaseGateState(null);
      }

      return { success: false, code: code || 'AUTH_ERROR', message };
    }
  };

  // Restore and validate Firebase Auth -> PocketBase session (never pre-fetch DB before authentication)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    // Purge legacy plaintext user directory cache from prior client builds
    localStorage.removeItem('meedo_users');

    if (localStorage.getItem('meedo_clean_csu_and_users_v7') !== 'true') {
      localStorage.removeItem('meedo_active_guard_session');
      localStorage.removeItem('meedo_guard_shift_sessions');
      setActiveShiftSession(null);
      setActiveShiftSessions({});
      localStorage.setItem('meedo_clean_csu_and_users_v7', 'true');
    }

    if (isPocketBaseConfigured) {
      const savedActiveSessions = localStorage.getItem('meedo_guard_shift_sessions');
      if (savedActiveSessions) {
        try {
          const parsed = JSON.parse(savedActiveSessions);
          if (parsed && typeof parsed === 'object') {
            setActiveShiftSessions(parsed);
          }
        } catch {}
      }

      const savedActiveSession = localStorage.getItem('meedo_active_guard_session');
      if (savedActiveSession) {
        try {
          const parsed = JSON.parse(savedActiveSession);
          if (parsed && parsed.status && parsed.status !== 'ENDED') {
            setActiveShiftSession(parsed);
            if (parsed.guard_id) {
              setActiveShiftSessions((prev) => ({ ...prev, [parsed.guard_id]: parsed }));
            }
          }
        } catch {}
      }

      if (!isFirebaseConfigured || !firebaseAuth) {
        pb.authStore.clear();
        localStorage.removeItem('meedo_current_user');
        setCurrentUser(null);
        setFirebaseGateState(null);
        setAuthLoading(false);
        return;
      }

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        if (cancelled) return;

        if (!fbUser) {
          pb.authStore.clear();
          localStorage.removeItem('meedo_current_user');
          setCurrentUser(null);
          setUsers([]);
          setFirebaseGateState(null);
          setAuthLoading(false);
          return;
        }

        if (authFlowInProgressRef.current) {
          return;
        }

        try {
          if (
            pb.authStore.isValid &&
            pb.authStore.record &&
            pb.authStore.record.firebase_uid === fbUser.uid
          ) {
            try {
              const refreshed = await pb.collection('profiles').authRefresh({ requestKey: null });
              const rec = refreshed?.record;
              if (rec && rec.status === 'Approved') {
                const profile = sanitizeUserProfile(rec);
                if (!cancelled) {
                  setCurrentUser(profile);
                  setFirebaseGateState(null);
                  localStorage.setItem('meedo_current_user', JSON.stringify(profile));
                }
                return;
              }
            } catch {
              // Token invalidated or expired; fall through to re-exchange via Firebase ID token
            }
          }

          await exchangeFirebaseSession(fbUser);
        } catch (err) {
          console.error('Failed to synchronize Firebase Auth session:', err);
          pb.authStore.clear();
          localStorage.removeItem('meedo_current_user');
          if (!cancelled) setCurrentUser(null);
        } finally {
          if (!cancelled) setAuthLoading(false);
        }
      });

      return () => {
        cancelled = true;
        unsubscribe();
      };
    } else {
      // Offline non-PocketBase fallback mode (never auto-login initialUsers[0])
      try {
        const savedUser = localStorage.getItem('meedo_current_user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed && parsed.username && parsed.status === 'Approved') {
              setCurrentUser(sanitizeUserProfile(parsed));
            } else {
              localStorage.removeItem('meedo_current_user');
            }
          } catch {
            localStorage.removeItem('meedo_current_user');
          }
        }

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
        const savedMonitoring = localStorage.getItem('meedo_monitoring_records');
        if (savedMonitoring) setMonitoringRecords(JSON.parse(savedMonitoring));
        const savedCalendar = localStorage.getItem('meedo_calendar_events');
        if (savedCalendar) setMarketCalendarEvents(JSON.parse(savedCalendar));
      } catch (e) {
        console.error('Failed to restore local session state:', e);
      } finally {
        setAuthLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }
  }, []);

  // Fetch section- and role-authorized data ONLY after authentication
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUser?.id || !pb.authStore.isValid || !isApprovedUser(currentUser)) {
      return;
    }

    const client = supabase;
    const isAdmin = currentUser.role === 'Admin' || currentUser.section === 'ALL';
    const sec = currentUser.section;
    const canA = isAdmin || sec === 'A';
    const canB = isAdmin || sec === 'B';
    const canC = isAdmin || sec === 'C';
    const canD = isAdmin || sec === 'D';
    const canF = isAdmin || sec === 'F';
    const canOpif = isAdmin || ['A', 'B', 'C', 'D', 'E'].includes(sec);

    const fetchAuthorizedData = async () => {
      const emptyRes = { data: null, error: null };
      const runIf = (cond: boolean, fn: () => PromiseLike<any>) =>
        cond ? fn : () => Promise.resolve(emptyRes);

      try {
        // Run in bounded batches of 4 so Ngrok/PocketBase connections never drop under a 17-request burst
        const tasks: Array<() => PromiseLike<any>> = [
          runIf(canA, () => client.from('stalls').select('*')),
          runIf(canA, () => client.from('stall_tenants').select('*')),
          runIf(canA, () => client.from('electric_bills').select('*')),
          runIf(canA, () => client.from('monitoring_records').select('*').order('monitoring_date', { ascending: false })),
          runIf(canB, () => client.from('slaughter_records').select('*')),
          runIf(canB, () => client.from('butchers').select('*')),
          runIf(canC, () => client.from('cemetery_bookings').select('*')),
          runIf(canD, () => client.from('todas').select('*')),
          runIf(canD, () => client.from('toda_members').select('*')),
          runIf(canOpif, () => client.from('opif_indicators').select('*')),
          runIf(canF, () => client.from('csu_daily_reports').select('*')),
          runIf(canF, () => client.from('market_guards').select('*')),
          runIf(canF, () => client.from('market_calendar_events').select('*').order('date', { ascending: true })),
          runIf(isAdmin, () => client.from('inventory_items').select('*')),
          runIf(isAdmin, () => client.from('inventory_transactions').select('*')),
          runIf(isAdmin, () => client.from('profiles').select('*')),
          runIf(isAdmin, () => client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500)),
        ];

        const results: any[] = [];
        for (let i = 0; i < tasks.length; i += 4) {
          const chunk = await Promise.all(tasks.slice(i, i + 4).map((fn) => fn()));
          results.push(...chunk);
        }

        const [
          stallsRes,
          tenantsRes,
          billsRes,
          monitoringRes,
          slaughterRes,
          butchersRes,
          cemRes,
          todasRes,
          membersRes,
          opifRes,
          csuRes,
          guardsRes,
          calendarRes,
          invItemsRes,
          invTxRes,
          profilesRes,
          auditRes,
        ] = results;

        if (billsRes.data) setElectricBills(billsRes.data);
        if (monitoringRes.data) setMonitoringRecords(monitoringRes.data);
        if (slaughterRes.data) setSlaughterRecords(slaughterRes.data);
        if (butchersRes.data) setButchers(butchersRes.data);
        if (cemRes.data) setCemeteryBookings(cemRes.data);
        if (todasRes.data) setTodas(todasRes.data);
        if (membersRes.data) setTodaMembers(membersRes.data);
        if (opifRes.data && opifRes.data.length > 0) {
          const sortedOpif = [...opifRes.data]
            .sort((a: any, b: any) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
            .map(normalizeOpifRow);
          setOpifIndicators(sortedOpif);
        }
        if (csuRes.data) {
          const liveCsu = csuRes.data.filter((r: any) => Boolean(r && r.report_date));
          setCsuReports(liveCsu);

          const inProgressReports = liveCsu.filter((r: any) => !r.is_locked);
          if (inProgressReports.length > 0) {
            const restoredSessions: Record<string, GuardShiftSession> = {};
            inProgressReports.forEach((r: any) => {
              const firstGuard = r.personnel_data?.[0];
              const guardId = firstGuard?.guard_id || 'G-101';
              restoredSessions[guardId] = {
                id: 'shift_sess_' + (r.id || Date.now()),
                calendar_event_id: r.calendar_event_id,
                guard_id: guardId,
                guard_name: firstGuard?.guard_name || r.prep_name,
                facility: 'Public Market Main',
                area: r.area_covered,
                shift_name: r.shift,
                call_sign: 'EAGLE-1',
                status: 'ON_DUTY',
                time_in: firstGuard?.time_in || '06:00',
                date: r.report_date,
                patrol_logs: firstGuard?.patrol_logs || [],
              };
            });
            setActiveShiftSessions((prev) => ({ ...restoredSessions, ...prev }));
          }
        }
        if (invItemsRes.data) setInventoryItems(invItemsRes.data);
        if (invTxRes.data) setInventoryTransactions(invTxRes.data);
        if (auditRes.data) setAuditLogs(auditRes.data);

        if (profilesRes.data) {
          setUsers(profilesRes.data.map(sanitizeUserProfile));
        } else {
          setUsers([currentUser]);
        }

        if (guardsRes.data) {
          const liveGuards: MarketGuard[] = [...guardsRes.data.filter((g: any) => Boolean(g && g.guard_id))];
          if (profilesRes?.data) {
            profilesRes.data
              .filter((p: any) => p && p.section === 'F')
              .forEach((p: any) => {
                const guardId = p.guard_id || `G-${String(p.username || '').trim().toUpperCase()}`;
                const exists = liveGuards.some(
                  (g: any) => g.guard_id.toUpperCase() === guardId.toUpperCase()
                );
                if (!exists) {
                  liveGuards.push({
                    guard_id: guardId,
                    guard_name: p.full_name || p.username,
                    rank_title: p.rank_title || 'SO1',
                    default_area: p.default_area || 'General Public Market',
                    radio_call_sign: p.radio_call_sign || 'EAGLE-1',
                    assigned_facility: 'Public Market Main',
                    current_shift: '1st Shift (06:00 - 14:00)',
                    status: 'Active',
                  });
                }
              });
          }
          setGuards(liveGuards);
        }

        if (calendarRes.data) {
          const liveCalendar = calendarRes.data.filter((e: any) => Boolean(e && e.id !== 'evt_shift_01'));
          setMarketCalendarEvents(liveCalendar);
        }

        if (tenantsRes.data || stallsRes.data) {
          const groupedTenants = new Map<string, StallTenant[]>();
          (tenantsRes.data || []).forEach((t: any) => {
            if (!t?.stall_no) return;
            const list = groupedTenants.get(t.stall_no) || [];
            list.push(t);
            groupedTenants.set(t.stall_no, list);
          });

          const dbStallMap = new Map<string, any>();
          (stallsRes.data || []).forEach((st: any) => {
            if (st?.stall_no) dbStallMap.set(st.stall_no, st);
          });

          const inferZone = (stallNo: string): Stall['zone'] => {
            const s = stallNo.toUpperCase();
            if (s.startsWith('W')) return 'wet';
            if (s.startsWith('O')) return 'old';
            if (s.startsWith('T')) return 'triangular';
            return 'dry';
          };

          const allStallNos = Array.from(
            new Set([
              ...initialStalls.map((s) => s.stall_no),
              ...Array.from(dbStallMap.keys()),
              ...Array.from(groupedTenants.keys()),
            ])
          );

          const initialStallMap = new Map(initialStalls.map((s) => [s.stall_no, s]));

          const mergedStalls: Stall[] = allStallNos.map((stallNo) => {
            const seedStall = initialStallMap.get(stallNo);
            const pbStall = dbStallMap.get(stallNo);
            const rows = groupedTenants.get(stallNo) || [];

            const sortedRows = [...rows].sort((a: any, b: any) => {
              if (Boolean(b.is_current) !== Boolean(a.is_current)) {
                return b.is_current ? 1 : -1;
              }
              const yDiff = Number(b.year || 0) - Number(a.year || 0);
              if (yDiff !== 0) return yDiff;
              return Number(b.period_index || 0) - Number(a.period_index || 0);
            });

            const currentRow = sortedRows.find((t) => Boolean(t.is_current)) || sortedRows[0] || null;
            const historyRows = currentRow ? sortedRows.filter((t) => t !== currentRow) : sortedRows;
            const hasOwner = Boolean(currentRow?.stall_owner && String(currentRow.stall_owner).trim());
            const resolvedStatus: Stall['status'] = hasOwner
              ? 'Occupied'
              : pbStall?.status === 'Occupied' && currentRow
              ? 'Occupied'
              : 'Vacant';

            return {
              stall_no: stallNo,
              zone: (pbStall?.zone || seedStall?.zone || inferZone(stallNo)) as Stall['zone'],
              status: resolvedStatus,
              current_tenant: currentRow,
              tenant_history: historyRows,
            };
          });

          setStalls(mergedStalls);
        }
      } catch (err) {
        console.warn('PocketBase sync note:', err);
      }
    };

    fetchAuthorizedData();
  }, [currentUser?.id, currentUser?.role, currentUser?.section, currentUser?.status]);

  // Authenticated section-scoped Realtime PocketBase Sync
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client || !currentUser?.id || !pb.authStore.isValid || !isApprovedUser(currentUser)) return;

    const isAdmin = currentUser.role === 'Admin' || currentUser.section === 'ALL';
    const sec = currentUser.section;
    const channel = client.channel('meedo-realtime-global');

    if (isAdmin || sec === 'B') {
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'butchers' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newBtc = payload.new as ButcherProfile;
            setButchers((prev) => {
              if (prev.some((b) => b.id === newBtc.id || b.butcher_code === newBtc.butcher_code)) {
                return prev.map((b) => (b.id === newBtc.id ? { ...b, ...newBtc } : b));
              }
              const updated = [newBtc, ...prev];
              localStorage.setItem('meedo_butchers', JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedBtc = payload.new as ButcherProfile;
            setButchers((prev) => {
              const updated = prev.map((b) => (b.id === updatedBtc.id ? { ...b, ...updatedBtc } : b));
              localStorage.setItem('meedo_butchers', JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              setButchers((prev) => {
                const updated = prev.filter((b) => b.id !== oldId);
                localStorage.setItem('meedo_butchers', JSON.stringify(updated));
                return updated;
              });
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'slaughter_records' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as SlaughterRecord;
            setSlaughterRecords((prev) => {
              if (prev.some((r) => r.id === newRecord.id)) return prev;
              const updated = [newRecord, ...prev];
              localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as SlaughterRecord;
            setSlaughterRecords((prev) => {
              const updated = prev.map((r) => (r.id === updatedRecord.id ? { ...r, ...updatedRecord } : r));
              localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              setSlaughterRecords((prev) => {
                const updated = prev.filter((r) => r.id !== oldId);
                localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
                return updated;
              });
            }
          }
        });
    }

    if (isAdmin || sec === 'F') {
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'csu_daily_reports' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReport = payload.new as CsuDailyReport;
            setCsuReports((prev) => {
              if (prev.some((r) => r.id === newReport.id)) return prev;
              const updated = [newReport, ...prev];
              localStorage.setItem('meedo_csu', JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as CsuDailyReport;
            setCsuReports((prev) => {
              const list = prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r));
              localStorage.setItem('meedo_csu', JSON.stringify(list));
              return list;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              setCsuReports((prev) => {
                const list = prev.filter((r) => r.id !== oldId);
                localStorage.setItem('meedo_csu', JSON.stringify(list));
                return list;
              });
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'market_calendar_events' }, (payload) =>
          applyCollectionRealtime(setMarketCalendarEvents, 'meedo_calendar_events', payload)
        );
    }

    if (isAdmin) {
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLog = payload.new as AuditLog;
            setAuditLogs((prev) => {
              if (prev.some((l) => l.id === newLog.id)) return prev;
              return [newLog, ...prev];
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, (payload) =>
          applyCollectionRealtime(setInventoryItems, 'meedo_inventory_items', payload)
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_transactions' }, (payload) =>
          applyCollectionRealtime(setInventoryTransactions, 'meedo_inventory_transactions', payload)
        );
    }

    if (isAdmin || sec === 'A') {
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'electric_bills' }, (payload) =>
          applyCollectionRealtime(setElectricBills, 'meedo_bills', payload)
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'monitoring_records' }, (payload) =>
          applyCollectionRealtime(setMonitoringRecords, 'meedo_monitoring_records', payload)
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stall_tenants' }, (payload) => {
          const rec = (payload.new || payload.old) as StallTenant | null;
          if (!rec?.stall_no) return;
          setStalls((prev) =>
            prev.map((st) => {
              if (st.stall_no !== rec.stall_no) return st;
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                if (rec.is_current) {
                  return { ...st, status: rec.stall_owner ? 'Occupied' : st.status, current_tenant: { ...st.current_tenant, ...rec } };
                }
              }
              return st;
            })
          );
        });
    }

    if (isAdmin || sec === 'C') {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'cemetery_bookings' }, (payload) =>
        applyCollectionRealtime(setCemeteryBookings, 'meedo_cemetery', payload)
      );
    }

    if (isAdmin || sec === 'D') {
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'todas' }, (payload) =>
          applyCollectionRealtime(setTodas, 'meedo_todas', payload)
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'toda_members' }, (payload) =>
          applyCollectionRealtime(setTodaMembers, 'meedo_members', payload)
        );
    }

    if (isAdmin || ['A', 'B', 'C', 'D', 'E'].includes(sec)) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'opif_indicators' }, (payload) =>
        applyCollectionRealtime(setOpifIndicators, 'meedo_opif', payload, normalizeOpifRow)
      );
    }

    channel.subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [currentUser?.id, currentUser?.role, currentUser?.section, currentUser?.status]);

  const addGuard = (guard: MarketGuard) => {
    if (!requirePermission('csu:manage_guards')) return;
    setGuards((prev) => {
      const exists = prev.some((g) => g.guard_id.toUpperCase() === guard.guard_id.toUpperCase());
      const updated = exists
        ? prev.map((g) => (g.guard_id.toUpperCase() === guard.guard_id.toUpperCase() ? guard : g))
        : [...prev, guard];
      localStorage.setItem('meedo_guards', JSON.stringify(updated));
      return updated;
    });
    if (isSupabaseConfigured && supabase) {
      supabase.from('market_guards').upsert(guard).then();
      addAuditLog('GUARD_ROSTER_UPDATED', {
        guard_id: guard.guard_id,
        guard_name: guard.guard_name,
        rank_title: guard.rank_title,
        assigned_facility: guard.assigned_facility,
        summary: `Added/upserted market guard: ${guard.guard_name} (${guard.guard_id}) - ${guard.rank_title}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const updateGuard = (guardId: string, updates: Partial<MarketGuard>) => {
    if (!requirePermission('csu:manage_guards')) return;
    const existing = guards.find((g) => g.guard_id.toUpperCase() === guardId.toUpperCase());
    setGuards((prev) => {
      const updated = prev.map((g) =>
        g.guard_id.toUpperCase() === guardId.toUpperCase() ? { ...g, ...updates } : g
      );
      localStorage.setItem('meedo_guards', JSON.stringify(updated));
      return updated;
    });
    if (isSupabaseConfigured && supabase) {
      supabase.from('market_guards').update(updates).eq('guard_id', guardId).then();
      addAuditLog('GUARD_PROFILE_UPDATED', {
        guard_id: guardId,
        guard_name: updates.guard_name || existing?.guard_name,
        updated_fields: Object.keys(updates),
        summary: `Updated profile for guard ${updates.guard_name || existing?.guard_name || guardId}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const deleteGuard = (guardId: string) => {
    if (!requirePermission('csu:manage_guards')) return;
    const existing = guards.find((g) => g.guard_id.toUpperCase() === guardId.toUpperCase());
    setGuards((prev) => {
      const updated = prev.filter((g) => g.guard_id.toUpperCase() !== guardId.toUpperCase());
      localStorage.setItem('meedo_guards', JSON.stringify(updated));
      return updated;
    });
    if (isSupabaseConfigured && supabase) {
      supabase.from('market_guards').delete().eq('guard_id', guardId).then();
      addAuditLog('GUARD_PROFILE_DELETED', {
        guard_id: guardId,
        guard_name: existing?.guard_name || 'Unknown Guard',
        summary: `Deleted guard profile: ${existing?.guard_name || guardId}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const syncSectionFGuardRoster = (user: {
    guard_id?: string;
    full_name?: string;
    username: string;
    rank_title?: string;
    radio_call_sign?: string;
    default_area?: string;
  }) => {
    const cleanGuardId = user.guard_id?.trim().toUpperCase();
    if (!cleanGuardId) return;
    const cleanName = user.full_name?.trim() || user.username;
    const cleanRank = user.rank_title?.trim() || 'SO1';
    const cleanCall = user.radio_call_sign?.trim().toUpperCase() || 'EAGLE-1';
    const cleanArea = user.default_area?.trim() || 'General Public Market';

    setGuards((prev) => {
      const idx = prev.findIndex((g) => g.guard_id.toUpperCase() === cleanGuardId);
      if (idx >= 0) {
        return prev.map((g, i) =>
          i === idx
            ? {
                ...g,
                guard_name: cleanName,
                rank_title: cleanRank || g.rank_title,
                radio_call_sign: cleanCall || g.radio_call_sign,
                default_area: cleanArea || g.default_area,
              }
            : g
        );
      }
      return [
        ...prev,
        {
          guard_id: cleanGuardId,
          guard_name: cleanName,
          rank_title: cleanRank,
          default_area: cleanArea,
          radio_call_sign: cleanCall,
          assigned_facility: 'Public Market Main',
          current_shift: '1st Shift (06:00 - 14:00)',
          status: 'Active',
        },
      ];
    });

    if (isSupabaseConfigured && supabase && pb.authStore.isValid) {
      supabase
        .from('market_guards')
        .upsert(
          {
            guard_id: cleanGuardId,
            guard_name: cleanName,
            rank_title: cleanRank,
            default_area: cleanArea,
            radio_call_sign: cleanCall,
            assigned_facility: 'Public Market Main',
            current_shift: '1st Shift (06:00 - 14:00)',
            status: 'Active',
          },
          { onConflict: 'guard_id' }
        )
        .then();
    }
  };

  const refreshUsers = async (): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) return;
    if (!pb.authStore.isValid) {
      throw new Error('Authentication session expired. Please sign in again.');
    }
    if (!hasPermission(currentUser, 'users:manage')) {
      throw new Error('Administrator privilege required to synchronize directory.');
    }
    try {
      const profilesRes = await supabase.from('profiles').select('*');
      if (profilesRes.error) {
        console.error('Failed to query profiles:', profilesRes.error);
        throw profilesRes.error;
      }
      const nextUsers = (profilesRes.data || []).map(sanitizeUserProfile);
      setUsers(nextUsers);
      localStorage.removeItem('meedo_users');
    } catch (err) {
      console.warn('Failed to refresh users directory from PocketBase:', err);
      throw err;
    }
  };

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; code?: string; message?: string }> => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return { success: false, message: 'Please enter your email address.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }
    if (!isFirebaseConfigured || !firebaseAuth) {
      return { success: false, message: 'Firebase Authentication is not configured.' };
    }

    authFlowInProgressRef.current = true;
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
      return await exchangeFirebaseSession(cred.user);
    } catch (err: any) {
      return { success: false, code: err?.code, message: mapFirebaseAuthError(err) };
    } finally {
      authFlowInProgressRef.current = false;
      setAuthLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; code?: string; message?: string }> => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return { success: false, message: 'Firebase Authentication is not configured.' };
    }

    authFlowInProgressRef.current = true;
    try {
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      return await exchangeFirebaseSession(cred.user);
    } catch (err: any) {
      return { success: false, code: err?.code, message: mapFirebaseAuthError(err) };
    } finally {
      authFlowInProgressRef.current = false;
      setAuthLoading(false);
    }
  };

  const login = async (
    identifier: string,
    passwordInput?: string
  ): Promise<{ success: boolean; code?: string; message?: string }> => {
    return loginWithEmail(identifier, passwordInput || '');
  };

  const submitFirebaseProfileRegistration = async (
    fbUser: FirebaseUser,
    params: FirebaseRegistrationInput
  ): Promise<{ success: boolean; code?: string; message?: string }> => {
    if (!isPocketBaseConfigured) {
      return { success: false, message: 'Registration server is not configured.' };
    }

    const trimmedUser = params.username.trim();
    if (!trimmedUser || trimmedUser.length < 2) {
      return { success: false, message: 'Username must be at least 2 characters long.' };
    }
    if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(params.section)) {
      return { success: false, message: 'Public registration is restricted to departmental staff sections (A–F).' };
    }
    const cleanGuardId = params.section === 'F' ? (params.guardId || '').trim().toUpperCase() : '';
    if (params.section === 'F' && !cleanGuardId) {
      return { success: false, message: 'Guard ID is required for Section F Market Guard registration.' };
    }

    try {
      const idToken = await fbUser.getIdToken(true);
      const res = await pb.send('/api/meedo/firebase-register', {
        method: 'POST',
        body: {
          idToken,
          username: trimmedUser,
          full_name: (params.fullName || fbUser.displayName || trimmedUser).trim(),
          section: params.section,
          guard_id: cleanGuardId,
          rank_title: params.section === 'F' ? (params.rankTitle || 'SO1').trim() : '',
          radio_call_sign: params.section === 'F' ? (params.radioCallSign || '').trim().toUpperCase() : '',
          default_area: params.section === 'F' ? (params.defaultArea || 'General Public Market').trim() : '',
        },
        requestKey: null,
      });

      pb.authStore.clear();
      setCurrentUser(null);
      localStorage.removeItem('meedo_current_user');
      setFirebaseGateState({
        mode: 'ACCOUNT_PENDING',
        email: fbUser.email || undefined,
        displayName: (params.fullName || fbUser.displayName || trimmedUser).trim(),
        emailVerified: fbUser.emailVerified,
        message: res?.message || 'Registration submitted! Awaiting Administrator approval.',
      });
      return {
        success: true,
        code: res?.code || 'ACCOUNT_PENDING',
        message: res?.message || 'Registration submitted! Awaiting Administrator approval.',
      };
    } catch (err: any) {
      const errBody = err?.response || err?.data || {};
      return {
        success: false,
        code: errBody?.code,
        message: errBody?.message || extractPbErrorMessage(err, 'Registration failed. Please try again.'),
      };
    }
  };

  const registerWithEmail = async (
    params: FirebaseRegistrationInput & { email: string; password: string }
  ): Promise<{ success: boolean; code?: string; message?: string }> => {
    const cleanEmail = params.email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!params.password || params.password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    const trimmedUser = params.username.trim();
    if (!trimmedUser || trimmedUser.length < 2) {
      return { success: false, message: 'Username is required (at least 2 characters).' };
    }
    if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(params.section)) {
      return { success: false, message: 'Public registration is restricted to departmental staff sections (A–F).' };
    }
    if (params.section === 'F' && !params.guardId?.trim()) {
      return { success: false, message: 'Please provide a Guard ID (e.g. G-101) for Market Guard personnel.' };
    }
    if (!isFirebaseConfigured || !firebaseAuth) {
      return { success: false, message: 'Firebase Authentication is not configured.' };
    }

    authFlowInProgressRef.current = true;
    let newlyCreatedUser: FirebaseUser | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, params.password);
      newlyCreatedUser = cred.user;
      const cleanName = (params.fullName || trimmedUser).trim();
      await updateFirebaseProfile(cred.user, { displayName: cleanName }).catch(() => {});
      await sendEmailVerification(cred.user).catch(() => {});

      const regResult = await submitFirebaseProfileRegistration(cred.user, params);
      if (!regResult.success) {
        // Prevent dangling Firebase accounts when PocketBase rejects duplicate username / Guard ID
        await newlyCreatedUser.delete().catch(() => {});
        await firebaseSignOut(firebaseAuth).catch(() => {});
        setFirebaseGateState(null);
        return regResult;
      }
      return regResult;
    } catch (err: any) {
      return { success: false, code: err?.code, message: mapFirebaseAuthError(err) };
    } finally {
      authFlowInProgressRef.current = false;
      setAuthLoading(false);
    }
  };

  const completeFirebaseRegistration = async (
    params: FirebaseRegistrationInput
  ): Promise<{ success: boolean; code?: string; message?: string }> => {
    const fbUser = firebaseAuth?.currentUser;
    if (!fbUser) {
      return { success: false, message: 'Please sign in with Firebase or Google first.' };
    }
    authFlowInProgressRef.current = true;
    try {
      return await submitFirebaseProfileRegistration(fbUser, params);
    } finally {
      authFlowInProgressRef.current = false;
      setAuthLoading(false);
    }
  };

  const linkExistingAccount = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; code?: string; message?: string }> => {
    const fbUser = firebaseAuth?.currentUser;
    if (!fbUser) {
      return { success: false, message: 'Please sign in with Google or Email first.' };
    }
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      return { success: false, message: 'Existing username (or Guard ID) and password are required.' };
    }

    authFlowInProgressRef.current = true;
    try {
      const idToken = await fbUser.getIdToken(true);
      const res = await pb.send('/api/meedo/firebase-link', {
        method: 'POST',
        body: { idToken, identifier: cleanId, password },
        requestKey: null,
      });

      if (res?.token && res?.record) {
        pb.authStore.save(res.token, res.record);
        const profile = sanitizeUserProfile(res.record);
        setCurrentUser(profile);
        setFirebaseGateState(null);
        localStorage.setItem('meedo_current_user', JSON.stringify(profile));
        localStorage.removeItem('meedo_users');
        return { success: true };
      }

      return { success: false, message: res?.message || 'Unable to link account.' };
    } catch (err: any) {
      const errBody = err?.response || err?.data || {};
      const code = String(errBody?.code || '');
      const message = errBody?.message || extractPbErrorMessage(err, 'Unable to link existing account.');
      if (code === 'ACCOUNT_PENDING' || code === 'ACCOUNT_BLOCKED') {
        setFirebaseGateState({
          mode: code,
          email: fbUser.email || undefined,
          displayName: fbUser.displayName || undefined,
          emailVerified: fbUser.emailVerified,
          message,
        });
      }
      return { success: false, code, message };
    } finally {
      authFlowInProgressRef.current = false;
      setAuthLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await sendUserPasswordReset(email);
      return {
        success: true,
        message: `Password reset email sent to ${email.trim()}. Please check your inbox and spam folder.`,
      };
    } catch (err: any) {
      return { success: false, message: mapFirebaseAuthError(err) };
    }
  };

  const resendVerificationEmail = async (): Promise<{ success: boolean; message?: string }> => {
    const fbUser = firebaseAuth?.currentUser;
    if (!fbUser) {
      return { success: false, message: 'No active Firebase user session found.' };
    }
    try {
      await sendEmailVerification(fbUser);
      return {
        success: true,
        message: `Verification email sent to ${fbUser.email || 'your address'}.`,
      };
    } catch (err: any) {
      return { success: false, message: mapFirebaseAuthError(err) };
    }
  };

  const retryFirebaseSession = async (): Promise<{ success: boolean; code?: string; message?: string }> => {
    const fbUser = firebaseAuth?.currentUser;
    if (!fbUser) {
      setFirebaseGateState(null);
      return { success: false, message: 'Please sign in again.' };
    }
    authFlowInProgressRef.current = true;
    try {
      await fbUser.reload().catch(() => {});
      return await exchangeFirebaseSession(fbUser);
    } finally {
      authFlowInProgressRef.current = false;
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    authFlowInProgressRef.current = false;
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth).catch(() => {});
    }
    pb.authStore.clear();
    setCurrentUser(null);
    setUsers([]);
    setFirebaseGateState(null);
    setActiveShiftSession(null);
    setActiveShiftSessions({});
    if (typeof window !== 'undefined') {
      const keysToClear = [
        'meedo_current_user',
        'meedo_users',
        'meedo_active_guard_session',
        'meedo_guard_shift_sessions',
        'meedo_stalls',
        'meedo_bills',
        'meedo_slaughter',
        'meedo_butchers',
        'meedo_cemetery',
        'meedo_todas',
        'meedo_members',
        'meedo_opif',
        'meedo_csu',
        'meedo_guards',
        'meedo_calendar_events',
        'meedo_inventory_items',
        'meedo_inventory_transactions',
        'meedo_monitoring_records',
      ];
      keysToClear.forEach((k) => localStorage.removeItem(k));
      window.location.href = '/login';
    }
  };

  const registerUser = async (
    username: string,
    section: string,
    guardId?: string,
    fullName?: string,
    rankTitle?: string,
    password?: string,
    radioCallSign?: string,
    defaultArea?: string,
    email?: string
  ): Promise<{ success: boolean; code?: string; message?: string }> => {
    if (!email || !email.trim()) {
      return { success: false, message: 'Email address is required for Firebase registration.' };
    }
    return registerWithEmail({
      email,
      password: password || '',
      username,
      section,
      guardId,
      fullName,
      rankTitle,
      radioCallSign,
      defaultArea,
    });
  };

  const updateUserStatus = async (
    username: string,
    action: 'approve' | 'block' | 'delete'
  ): Promise<{ success: boolean; message?: string }> => {
    if (!hasPermission(currentUser, 'users:manage')) {
      return { success: false, message: 'Administrator privilege required.' };
    }

    const targetUser = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser?.id) {
      return { success: false, message: `User "${username}" was not found.` };
    }
    if (targetUser.username.toLowerCase() === 'admin' && action !== 'approve') {
      return { success: false, message: 'Root administrator account cannot be blocked or deleted.' };
    }
    const targetId = toPbId(targetUser.id);

    if (isSupabaseConfigured && supabase) {
      const { error } =
        action === 'delete'
          ? await supabase.from('profiles').delete().eq('id', targetId)
          : await supabase
              .from('profiles')
              .update({
                status: action === 'approve' ? 'Approved' : 'Blocked',
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetId);

      if (error) {
        const msg = extractPbErrorMessage(error, 'Failed to update user status in database.');
        console.error('PocketBase profile status sync error:', error);
        return { success: false, message: msg };
      }

      supabase
        .from('audit_logs')
        .insert({
          username: currentUser?.username || 'admin',
          action: action === 'approve' ? 'USER_APPROVED' : action === 'block' ? 'USER_BLOCKED' : 'USER_DELETED',
          details: JSON.stringify({
            target_id: targetId,
            target_username: targetUser.username,
            action,
            timestamp: new Date().toISOString(),
          }),
        })
        .then();
    }

    setUsers((prev) =>
      action === 'delete'
        ? prev.filter((u) => u.id !== targetUser.id)
        : prev.map((u) =>
            u.id === targetUser.id
              ? { ...u, status: action === 'approve' ? 'Approved' : 'Blocked' }
              : u
          )
    );

    if (action === 'approve' && targetUser.section === 'F' && targetUser.guard_id) {
      syncSectionFGuardRoster(targetUser);
    }

    if (currentUser?.id === targetUser.id || currentUser?.username.toLowerCase() === username.toLowerCase()) {
      if (action === 'delete' || action === 'block') {
        await logout();
      } else {
        const updatedSelf = { ...currentUser, status: 'Approved' as const };
        setCurrentUser(updatedSelf);
        localStorage.setItem('meedo_current_user', JSON.stringify(updatedSelf));
      }
    }

    return { success: true };
  };

  const updateUserProfile = async (
    username: string,
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; message?: string }> => {
    if (!hasPermission(currentUser, 'users:manage')) {
      return { success: false, message: 'Administrator privilege required.' };
    }

    const targetUser = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser?.id) {
      return { success: false, message: `User "${username}" was not found.` };
    }
    if (
      targetUser.username.toLowerCase() === 'admin' &&
      ((updates.role && updates.role !== 'Admin') || (updates.status && updates.status !== 'Approved'))
    ) {
      return { success: false, message: 'Root administrator account cannot be demoted or suspended.' };
    }

    const targetId = toPbId(targetUser.id);
    const { password: _ignoredPassword, ...safeUpdates } = updates;
    const cleanEmail =
      safeUpdates.email !== undefined ? safeUpdates.email.trim() : undefined;
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const pbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (safeUpdates.username !== undefined) {
      const trimmedName = safeUpdates.username.trim();
      pbPayload.username = trimmedName;
      pbPayload.username_lower = trimmedName.toLowerCase();
    }
    if (cleanEmail !== undefined) {
      pbPayload.email = cleanEmail;
      pbPayload.emailVisibility = true;
    }
    if (safeUpdates.role !== undefined) pbPayload.role = safeUpdates.role;
    if (safeUpdates.section !== undefined) pbPayload.section = safeUpdates.section;
    if (safeUpdates.status !== undefined) pbPayload.status = safeUpdates.status;
    if (safeUpdates.full_name !== undefined) pbPayload.full_name = safeUpdates.full_name;
    if (safeUpdates.guard_id !== undefined) pbPayload.guard_id = safeUpdates.guard_id;
    if (safeUpdates.rank_title !== undefined) pbPayload.rank_title = safeUpdates.rank_title;
    if (safeUpdates.radio_call_sign !== undefined) pbPayload.radio_call_sign = safeUpdates.radio_call_sign;
    if (safeUpdates.default_area !== undefined) pbPayload.default_area = safeUpdates.default_area;

    if (isPocketBaseConfigured) {
      try {
        await pb.collection('profiles').update(targetId, pbPayload, { requestKey: null });
      } catch (err: any) {
        const msg = extractPbErrorMessage(err, 'Failed to update profile in PocketBase.');
        console.error('PocketBase profile update sync error:', err);
        return { success: false, message: msg };
      }

      const effectiveGuardId = safeUpdates.guard_id ?? targetUser.guard_id;
      if (effectiveGuardId) {
        const guardUpdates: Partial<MarketGuard> = {};
        if (safeUpdates.full_name) guardUpdates.guard_name = safeUpdates.full_name;
        if (safeUpdates.rank_title) guardUpdates.rank_title = safeUpdates.rank_title;
        if (safeUpdates.radio_call_sign) guardUpdates.radio_call_sign = safeUpdates.radio_call_sign;
        if (safeUpdates.default_area) guardUpdates.default_area = safeUpdates.default_area;

        if (Object.keys(guardUpdates).length > 0 && supabase) {
          setGuards((prev) =>
            prev.map((g) =>
              g.guard_id.toUpperCase() === effectiveGuardId.toUpperCase()
                ? { ...g, ...guardUpdates }
                : g
            )
          );
          supabase
            .from('market_guards')
            .update(guardUpdates)
            .eq('guard_id', effectiveGuardId)
            .then();
        }
      }

      if (supabase) {
        supabase
          .from('audit_logs')
          .insert({
            username: currentUser?.username || 'admin',
            action: 'USER_PROFILE_UPDATED',
            details: JSON.stringify({
              target_id: targetId,
              target_username: targetUser.username,
              updates: { ...safeUpdates, email: cleanEmail },
              timestamp: new Date().toISOString(),
            }),
          })
          .then();
      }
    }

    const updatedFields: Partial<UserProfile> = {
      ...safeUpdates,
      ...(cleanEmail !== undefined ? { email: cleanEmail || undefined } : {}),
      updated_at: pbPayload.updated_at,
    };

    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, ...updatedFields } : u))
    );

    if (currentUser?.id === targetUser.id || currentUser?.username.toLowerCase() === username.toLowerCase()) {
      const updatedSelf = { ...currentUser, ...updatedFields };
      setCurrentUser(updatedSelf);
      localStorage.setItem('meedo_current_user', JSON.stringify(updatedSelf));
    }

    return { success: true };
  };

  const createUser = async (
    userData: Partial<UserProfile> & { username: string; role: UserRole; section: UserSection; email?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    if (!hasPermission(currentUser, 'users:manage')) {
      return { success: false, message: 'Administrator privilege required.' };
    }

    const trimmedUser = userData.username.trim();
    if (!trimmedUser) {
      return { success: false, message: 'Username is required.' };
    }

    const cleanEmail = (userData.email || '').trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: 'A valid email address is required for Firebase Authentication.' };
    }

    const rawPassword = (userData.password || '').trim();
    if (rawPassword && rawPassword.length < 6) {
      return { success: false, message: 'Firebase password must be at least 6 characters long.' };
    }

    if (users.some((u) => u.username.toLowerCase() === trimmedUser.toLowerCase())) {
      return { success: false, message: 'A user with this username already exists.' };
    }
    if (users.some((u) => u.email && u.email.toLowerCase() === cleanEmail.toLowerCase())) {
      return { success: false, message: 'A user with this email address already exists.' };
    }

    const cleanGuardId = userData.section === 'F' && userData.guard_id ? userData.guard_id.trim().toUpperCase() : undefined;
    const cleanFullName = userData.full_name ? userData.full_name.trim() : trimmedUser;
    const cleanRankTitle = userData.section === 'F' && userData.rank_title ? userData.rank_title.trim() : undefined;
    const cleanCallSign = userData.section === 'F' ? (userData.radio_call_sign?.trim().toUpperCase() || 'EAGLE-1') : undefined;
    const cleanDefaultArea = userData.section === 'F' ? (userData.default_area?.trim() || 'General Public Market') : undefined;
    const nowIso = new Date().toISOString();
    const pbUserId = toPbId('usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));

    let firebaseUid = '';
    let authProvider = 'firebase_google';
    if (rawPassword) {
      try {
        const fbRes = await provisionFirebaseEmailUser(cleanEmail, rawPassword, cleanFullName);
        firebaseUid = fbRes.uid;
        authProvider = 'firebase_email';
      } catch (fbErr: any) {
        return { success: false, message: mapFirebaseAuthError(fbErr) };
      }
    }

    let createdUser: UserProfile = sanitizeUserProfile({
      id: pbUserId,
      username: trimmedUser,
      email: cleanEmail,
      firebase_uid: firebaseUid || undefined,
      auth_provider: authProvider,
      role: userData.role || 'Staff',
      section: userData.section || 'A',
      status: userData.status || 'Approved',
      guard_id: cleanGuardId,
      full_name: cleanFullName,
      rank_title: cleanRankTitle,
      radio_call_sign: cleanCallSign,
      default_area: cleanDefaultArea,
      created_at: nowIso,
    });

    if (isPocketBaseConfigured) {
      try {
        const internalPassword = generateRandomInternalPassword();
        const createdRec = await pb.collection('profiles').create(
          {
            id: pbUserId,
            username: createdUser.username,
            username_lower: createdUser.username.toLowerCase(),
            email: cleanEmail,
            emailVisibility: true,
            verified: true,
            firebase_uid: firebaseUid,
            auth_provider: authProvider,
            role: createdUser.role,
            section: createdUser.section,
            status: createdUser.status,
            full_name: createdUser.full_name || '',
            password: internalPassword,
            passwordConfirm: internalPassword,
            guard_id: createdUser.guard_id || '',
            rank_title: createdUser.rank_title || '',
            radio_call_sign: createdUser.radio_call_sign || '',
            default_area: createdUser.default_area || '',
            created_at: nowIso,
          },
          { requestKey: null }
        );
        createdUser = sanitizeUserProfile(createdRec);
      } catch (err: any) {
        const msg = extractPbErrorMessage(err, 'Failed to create user profile.');
        console.error('Error creating PocketBase profile:', err);
        return { success: false, message: msg };
      }

      if (supabase) {
        try {
          await supabase.from('audit_logs').insert({
            username: currentUser?.username || 'admin',
            action: 'USER_CREATED_BY_ADMIN',
            details: JSON.stringify({
              created_by: currentUser?.username || 'admin',
              user: createdUser,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (auditErr) {
          console.warn('Audit log write warning after user create:', auditErr);
        }
      }
    }

    setUsers((prev) => [...prev, createdUser]);

    if (createdUser.section === 'F' && cleanGuardId) {
      syncSectionFGuardRoster(createdUser);
    }

    return { success: true };
  };

  const updateStallTenant = (stallNo: string, updates: Partial<StallTenant>) => {
    if (!requirePermission('market:write')) return;
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
          if (updates.lease_doc_name !== undefined) payload.lease_doc_name = updates.lease_doc_name;
          if (updates.permit_doc_name !== undefined) payload.permit_doc_name = updates.permit_doc_name;
          if (updates.additional_info !== undefined) payload.additional_info = updates.additional_info;
          payload.is_current = true;

          // Update active tenant row, or create one if modifying a vacant/unlinked stall
          let res = await client
            .from('stall_tenants')
            .update(payload)
            .eq('stall_no', stallNo)
            .eq('is_current', true);

          const hasUpdatedRows = Array.isArray(res.data) ? res.data.length > 0 : Boolean(res.data);
          if (!res.error && !hasUpdatedRows) {
            const insertPayload = {
              id: toPbId(`tenant_cur_${stallNo}_${Date.now()}`),
              stall_no: stallNo,
              stall_owner: (payload.stall_owner || 'Vacant / Pending Owner').trim() || 'Vacant / Pending Owner',
              operator: payload.operator || '',
              line_of_business: payload.line_of_business || '',
              period_index: payload.period_index || 1,
              year: String(payload.year || new Date().getFullYear()),
              compliance_status: payload.compliance_status || 'Non-Compliant',
              ...payload,
              is_current: true,
            };
            res = await client.from('stall_tenants').insert(insertPayload);
          }

          if (updates.stall_owner !== undefined) {
            const nextStatus = String(updates.stall_owner || '').trim() ? 'Occupied' : 'Vacant';
            const stallRes = await client.from('stalls').update({ status: nextStatus }).eq('stall_no', stallNo);
            if (stallRes.error) {
              console.warn('PocketBase stall status update error:', stallRes.error.message);
            }
          }

          if (res.error) {
            console.error('PocketBase tenant update error:', res.error.message);
          } else {
            const auditActor = currentUser?.username || currentUser?.full_name || 'Market Staff';
            const changedFields = Object.keys(payload).filter((k) => k !== 'is_current');
            const auditRes = await client
              .from('audit_logs')
              .insert({
                username: auditActor,
                action: 'STALL_TENANT_UPDATED',
                details: JSON.stringify({
                  stall_no: stallNo,
                  updated_fields: changedFields,
                  timestamp: new Date().toISOString(),
                }),
              });
            if (auditRes.error) {
              console.warn('PocketBase tenant audit log warning:', auditRes.error.message);
            }
          }
        } catch (e) {
          console.warn('PocketBase tenant update notice:', e);
        }
      })();
    }
  };

  const addStallTenant = (stallNo: string, tenant: StallTenant) => {
    if (!requirePermission('market:write')) return;
    const pbTenantId = toPbId(tenant.id || `tenant_${stallNo}_${Date.now()}`);
    const tenantWithId: StallTenant = { ...tenant, id: pbTenantId, is_current: true };
    setStalls((prev) => {
      const updated = prev.map((s) => {
        if (s.stall_no === stallNo) {
          const history = s.current_tenant
            ? [{ ...s.current_tenant, is_current: false }, ...(s.tenant_history || [])]
            : s.tenant_history || [];
          return {
            ...s,
            status: 'Occupied' as const,
            current_tenant: tenantWithId,
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
          await client
            .from('stall_tenants')
            .update({ is_current: false })
            .eq('stall_no', stallNo)
            .eq('is_current', true);

          const res = await client.from('stall_tenants').insert({
            id: pbTenantId,
            stall_no: stallNo,
            stall_owner: tenant.stall_owner,
            operator: tenant.operator || null,
            line_of_business: tenant.line_of_business || null,
            period_index: tenant.period_index || 1,
            year: String(tenant.year || new Date().getFullYear()),
            compliance_status: tenant.compliance_status || 'Non-Compliant',
            photo_url: tenant.photo_url || null,
            lease_doc_url: tenant.lease_doc_url || null,
            permit_doc_url: tenant.permit_doc_url || null,
            lease_doc_name: tenant.lease_doc_name || null,
            permit_doc_name: tenant.permit_doc_name || null,
            additional_info: tenant.additional_info || null,
            is_current: true,
          });
          await client.from('stalls').update({ status: 'Occupied' }).eq('stall_no', stallNo);
          if (res.error) {
            console.warn('PocketBase tenant insert error:', res.error.message);
          } else {
            const auditActor = currentUser?.username || currentUser?.full_name || 'Market Staff';
            client
              .from('audit_logs')
              .insert({
                username: auditActor,
                action: 'STALL_TENANT_ADDED',
                details: JSON.stringify({
                  stall_no: stallNo,
                  stall_owner: tenant.stall_owner,
                  line_of_business: tenant.line_of_business || null,
                  compliance_status: tenant.compliance_status,
                  timestamp: new Date().toISOString(),
                }),
              })
              .then();
          }
        } catch (e) {
          console.warn('PocketBase tenant add notice:', e);
        }
      })();
    }
  };

  const addMonitoringRecord = async (record: MonitoringRecord): Promise<boolean> => {
    if (!requirePermission('market:write')) return false;
    const newRecord: MonitoringRecord = {
      ...record,
      id: toPbId(record.id || `mon_${record.stall_no}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
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
        const auditActor = currentUser?.username || currentUser?.full_name || 'Market Staff';
        const payload: Record<string, any> = {
          id: newRecord.id,
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
          remarks: record.remarks || null,
          created_by: auditActor,
        };
        const res = await supabase.from('monitoring_records').insert(payload);
        if (res.error) {
          console.warn('PocketBase monitoring insert warning:', res.error.message);
          return false;
        }
        supabase
          .from('audit_logs')
          .insert({
            username: auditActor,
            action: 'MONITORING_ENTRY_SAVED',
            details: JSON.stringify({
              stall_no: record.stall_no,
              monitoring_date: record.monitoring_date,
              operational_status: record.operational_status,
              claygo_compliant: record.claygo_compliant,
              cctv_available: record.cctv_available,
              palengqr_implemented: record.palengqr_implemented,
              remarks: record.remarks || null,
              timestamp: new Date().toISOString(),
            }),
          })
          .then();
        return true;
      } catch (err) {
        console.warn('PocketBase monitoring insert error:', err);
        return false;
      }
    }
    return true;
  };

  const addElectricBill = (bill: ElectricBill) => {
    if (!requirePermission('market:write')) return;
    const newBill: ElectricBill = {
      ...bill,
      id: toPbId(bill.id || `bill_${bill.stall_no}_${bill.due_date || Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
      created_at: bill.created_at || new Date().toISOString(),
    };
    setElectricBills((prev) => {
      const updated = [newBill, ...prev];
      try {
        localStorage.setItem('meedo_bills', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const res = await client.from('electric_bills').insert({
            id: newBill.id,
            stall_no: newBill.stall_no,
            owner_name: newBill.owner_name || '',
            due_date: newBill.due_date || '',
            disconnection_date: newBill.disconnection_date || '',
            prev_reading: Number(newBill.prev_reading) || 0,
            curr_reading: Number(newBill.curr_reading) || 0,
            consumption: Number(newBill.consumption) || 0,
            rate_per_kwh: Number(newBill.rate_per_kwh) || 0,
            arrears: Number(newBill.arrears) || 0,
            bill_amount: Number(newBill.bill_amount) || 0,
            meter_reset: Boolean(newBill.meter_reset),
            status: newBill.status || 'Unpaid',
            created_at: newBill.created_at,
          });
          if (res.error) {
            console.warn('PocketBase electric bill insert error:', res.error.message);
          } else {
            addAuditLog('ELECTRIC_BILL_CREATED', {
              bill_id: newBill.id,
              stall_no: newBill.stall_no,
              owner_name: newBill.owner_name,
              consumption: newBill.consumption,
              bill_amount: newBill.bill_amount,
              due_date: newBill.due_date,
              status: newBill.status,
              summary: `Recorded electric bill for ${newBill.stall_no}: ${newBill.consumption} kWh (₱${Number(newBill.bill_amount || 0).toLocaleString()})`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('PocketBase electric bill insert notice:', e);
        }
      })();
    }
  };

  const updateBillStatus = (
    stallNo: string,
    status: 'Unpaid' | 'Partial' | 'Fully Paid',
    billId?: string
  ) => {
    if (!requirePermission('market:write')) return;
    setElectricBills((prev) => {
      const updated = prev.map((b) =>
        billId ? (b.id === billId ? { ...b, status } : b) : b.stall_no === stallNo ? { ...b, status } : b
      );
      try {
        localStorage.setItem('meedo_bills', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const query = billId
            ? client.from('electric_bills').update({ status }).eq('id', billId)
            : client.from('electric_bills').update({ status }).eq('stall_no', stallNo);
          const res = await query;
          if (res.error) {
            console.warn('PocketBase electric bill status update error:', res.error.message);
          } else {
            addAuditLog('ELECTRIC_BILL_STATUS_UPDATED', {
              bill_id: billId || null,
              stall_no: stallNo,
              status,
              summary: `Updated electric bill status for ${stallNo}${billId ? ` (${billId})` : ''} to ${status}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('PocketBase electric bill status update notice:', e);
        }
      })();
    }
  };

  const addAuditLog = (
    action: string,
    details: string | Record<string, any>,
    usernameOverride?: string
  ) => {
    if (!isApprovedUser(currentUser) && !usernameOverride) return;
    const actor =
      usernameOverride || currentUser?.username || currentUser?.full_name || 'System Staff';
    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
    const tempLog: AuditLog = {
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      username: actor,
      action,
      details: detailsStr,
      created_at: new Date().toISOString(),
    };

    setAuditLogs((prev) => [tempLog, ...prev]);

    const client = supabase;
    if (isSupabaseConfigured && client) {
      client
        .from('audit_logs')
        .insert({
          username: actor,
          action,
          details: detailsStr,
        })
        .select()
        .then(({ data, error }) => {
          if (error) {
            console.error(`Error logging audit action (${action}) to Supabase:`, error);
          } else if (data && data[0]) {
            setAuditLogs((prev) =>
              prev.map((l) => (l.id === tempLog.id ? (data[0] as AuditLog) : l))
            );
          }
        });
    }
  };

  const addSlaughterRecord = (record: Omit<SlaughterRecord, 'id' | 'created_at'>) => {
    if (!requirePermission('slaughterhouse:write')) return;
    const tempId = 'sh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newRecord: SlaughterRecord = {
      ...record,
      id: tempId,
      created_at: new Date().toISOString(),
    };
    setSlaughterRecords((prev) => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const fullPayload: any = {
        client_id: record.client_id,
        client_name: record.client_name,
        contact_no: record.contact_no || null,
        or_number: record.or_number || null,
        status: record.status || 'Private',
        livestock_type: record.livestock_type,
        head_count: Number(record.head_count) || 1,
        amount: Number(record.amount) || 0,
        address: record.address || null,
        kilos: record.kilos ? Number(record.kilos) : null,
        butcher_id: record.butcher_id || null,
        butcher_name: record.butcher_name || null,
      };

      const basePayload: any = {
        client_id: record.client_id,
        client_name: record.client_name,
        contact_no: record.contact_no || null,
        or_number: record.or_number || null,
        status: record.status || 'Private',
        livestock_type: record.livestock_type,
        head_count: Number(record.head_count) || 1,
        amount: Number(record.amount) || 0,
      };

      client
        .from('slaughter_records')
        .insert(fullPayload)
        .select()
        .then(({ data, error }) => {
          if (error && error.code === 'PGRST204') {
            client
              .from('slaughter_records')
              .insert(basePayload)
              .select()
              .then(({ data: fbData, error: fbError }) => {
                if (fbError) {
                  console.error('Error inserting slaughter record to Supabase:', fbError);
                } else if (fbData && fbData[0]) {
                  const realId = fbData[0].id;
                  setSlaughterRecords((prev) =>
                    prev.map((r) => (r.id === tempId ? { ...r, id: realId } : r))
                  );
                }
              });
          } else if (error) {
            console.error('Error inserting slaughter record to Supabase:', error);
          } else if (data && data[0]) {
            const realId = data[0].id;
            setSlaughterRecords((prev) =>
              prev.map((r) => (r.id === tempId ? { ...r, id: realId } : r))
            );
          }
        });

      // Write to public.audit_logs in Supabase
      addAuditLog('SLAUGHTER_LIVESTOCK_LOGGED', {
        client_id: record.client_id,
        client_name: record.client_name,
        livestock_type: record.livestock_type,
        head_count: Number(record.head_count) || 1,
        amount: Number(record.amount) || 0,
        or_number: record.or_number || null,
        status: record.status || 'Private',
        butcher_name: record.butcher_name || null,
        kilos: record.kilos ? Number(record.kilos) : null,
        address: record.address || null,
        summary: `Logged livestock intake for ${record.client_name} - ${record.head_count} head(s) of ${record.livestock_type} (₱${(Number(record.amount) || 0).toLocaleString()}). OR: ${record.or_number || 'N/A'}. Butcher: ${record.butcher_name || 'N/A'}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const addSlaughterBatch = (records: Omit<SlaughterRecord, 'id' | 'created_at'>[]) => {
    if (!requirePermission('slaughterhouse:write')) return;
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

    const client = supabase;
    if (isSupabaseConfigured && client && records.length > 0) {
      const fullBatch = records.map((record) => ({
        client_id: record.client_id,
        client_name: record.client_name,
        contact_no: record.contact_no || null,
        or_number: record.or_number || null,
        status: record.status || 'Private',
        livestock_type: record.livestock_type,
        head_count: Number(record.head_count) || 1,
        amount: Number(record.amount) || 0,
        address: record.address || null,
        kilos: record.kilos ? Number(record.kilos) : null,
        butcher_id: record.butcher_id || null,
        butcher_name: record.butcher_name || null,
      }));

      const baseBatch = records.map((record) => ({
        client_id: record.client_id,
        client_name: record.client_name,
        contact_no: record.contact_no || null,
        or_number: record.or_number || null,
        status: record.status || 'Private',
        livestock_type: record.livestock_type,
        head_count: Number(record.head_count) || 1,
        amount: Number(record.amount) || 0,
      }));

      client
        .from('slaughter_records')
        .insert(fullBatch)
        .select()
        .then(({ data, error }) => {
          if (error && error.code === 'PGRST204') {
            client
              .from('slaughter_records')
              .insert(baseBatch)
              .select()
              .then(({ data: fbData, error: fbError }) => {
                if (fbError) {
                  console.error('Error inserting slaughter batch fallback:', fbError);
                } else if (fbData && fbData.length > 0) {
                  setSlaughterRecords((prev) => {
                    let cur = [...prev];
                    fbData.forEach((row: any, i: number) => {
                      if (newRecords[i]) {
                        cur = cur.map((r) => (r.id === newRecords[i].id ? { ...r, id: row.id } : r));
                      }
                    });
                    return cur;
                  });
                }
              });
          } else if (error) {
            console.error('Error inserting slaughter batch to Supabase:', error);
          } else if (data && data.length > 0) {
            setSlaughterRecords((prev) => {
              let cur = [...prev];
              data.forEach((row: any, i: number) => {
                if (newRecords[i]) {
                  cur = cur.map((r) => (r.id === newRecords[i].id ? { ...r, id: row.id } : r));
                }
              });
              return cur;
            });
          }
        });

      // Write to public.audit_logs in Supabase
      const totalHeads = records.reduce((acc, r) => acc + (Number(r.head_count) || 0), 0);
      const totalAmount = records.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      const livestockTypes = Array.from(new Set(records.map((r) => r.livestock_type))).join(', ');
      const butcherNames = Array.from(new Set(records.map((r) => r.butcher_name).filter(Boolean))).join(', ');

      addAuditLog('SLAUGHTER_BATCH_LOGGED', {
        client_id: records[0]?.client_id,
        client_name: records[0]?.client_name,
        total_items: records.length,
        total_heads: totalHeads,
        total_amount: totalAmount,
        or_number: records[0]?.or_number || null,
        status: records[0]?.status || 'Private',
        livestock_types: livestockTypes,
        butchers: butcherNames || 'None',
        address: records[0]?.address || null,
        items: records.map((r) => ({
          livestock_type: r.livestock_type,
          head_count: Number(r.head_count) || 1,
          kilos: r.kilos ? Number(r.kilos) : null,
          amount: Number(r.amount) || 0,
          butcher: r.butcher_name || null,
        })),
        summary: `Batch intake logged for ${records[0]?.client_name}: ${totalHeads} total heads across ${records.length} item(s). Total fee: ₱${totalAmount.toLocaleString()}. OR: ${records[0]?.or_number || 'N/A'}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const updateSlaughterRecord = (id: string, updates: Partial<SlaughterRecord>) => {
    if (!requirePermission('slaughterhouse:write')) return;
    const existing = slaughterRecords.find((r) => r.id === id);
    setSlaughterRecords((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const cleanUpdates: any = { ...updates };
      delete cleanUpdates.id;
      delete cleanUpdates.created_at;

      client
        .from('slaughter_records')
        .update(cleanUpdates)
        .eq('id', id)
        .then(({ error }) => {
          if (error && error.code === 'PGRST204') {
            const baseUpdates: any = {};
            if (updates.client_id !== undefined) baseUpdates.client_id = updates.client_id;
            if (updates.client_name !== undefined) baseUpdates.client_name = updates.client_name;
            if (updates.contact_no !== undefined) baseUpdates.contact_no = updates.contact_no;
            if (updates.or_number !== undefined) baseUpdates.or_number = updates.or_number;
            if (updates.status !== undefined) baseUpdates.status = updates.status;
            if (updates.livestock_type !== undefined) baseUpdates.livestock_type = updates.livestock_type;
            if (updates.head_count !== undefined) baseUpdates.head_count = Number(updates.head_count);
            if (updates.amount !== undefined) baseUpdates.amount = Number(updates.amount);

            client.from('slaughter_records').update(baseUpdates).eq('id', id).then();
          } else if (error) {
            console.error('Error updating slaughter record in Supabase:', error);
          }
        });

      // Write to public.audit_logs in Supabase
      addAuditLog('SLAUGHTER_RECORD_UPDATED', {
        record_id: id,
        client_name: updates.client_name || existing?.client_name,
        livestock_type: updates.livestock_type || existing?.livestock_type,
        head_count: updates.head_count !== undefined ? Number(updates.head_count) : existing?.head_count,
        amount: updates.amount !== undefined ? Number(updates.amount) : existing?.amount,
        updated_fields: Object.keys(updates),
        summary: `Updated slaughter record (${id}) for ${updates.client_name || existing?.client_name || 'client'}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const deleteSlaughterRecord = (id: string) => {
    if (!requirePermission('slaughterhouse:write')) return;
    const existing = slaughterRecords.find((r) => r.id === id);
    setSlaughterRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem('meedo_slaughter', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (isSupabaseConfigured && client) {
      client
        .from('slaughter_records')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting slaughter record in Supabase:', error);
        });

      // Write to public.audit_logs in Supabase
      addAuditLog('SLAUGHTER_RECORD_DELETED', {
        record_id: id,
        client_name: existing?.client_name || 'Unknown Client',
        livestock_type: existing?.livestock_type,
        head_count: existing?.head_count,
        amount: existing?.amount,
        or_number: existing?.or_number,
        summary: `Deleted slaughter record (${id}) for ${existing?.client_name || 'client'}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const addButcher = (butcher: Omit<ButcherProfile, 'id' | 'created_at'>) => {
    if (!requirePermission('slaughterhouse:write')) return;
    const validDate = butcher.date_registered
      ? (butcher.date_registered.includes('-') && !isNaN(Date.parse(butcher.date_registered))
          ? butcher.date_registered
          : new Date(butcher.date_registered).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0];

    const newBtc: ButcherProfile = {
      ...butcher,
      id: 'btc_' + Date.now(),
      created_at: new Date().toISOString(),
      health_card_expiry: butcher.health_card_expiry || undefined,
      date_registered: validDate,
    };
    setButchers((prev) => {
      const updated = [newBtc, ...prev];
      localStorage.setItem('meedo_butchers', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const dbPayload = {
        id: newBtc.id,
        butcher_code: newBtc.butcher_code,
        name: newBtc.name,
        contact_no: newBtc.contact_no || null,
        address_barangay: newBtc.address_barangay || null,
        specialization: newBtc.specialization || 'General',
        health_card_no: newBtc.health_card_no || null,
        health_card_expiry: newBtc.health_card_expiry || null,
        status: newBtc.status || 'Active',
        date_registered: newBtc.date_registered,
        remarks: newBtc.remarks || null,
        created_at: newBtc.created_at,
      };

      client
        .from('butchers')
        .insert(dbPayload)
        .then(({ error }) => {
          if (error) console.error('Error inserting butcher into Supabase:', error);
        });

      // Write to public.audit_logs in Supabase
      addAuditLog('BUTCHER_ACCREDITED', {
        butcher_id: newBtc.id,
        butcher_code: newBtc.butcher_code,
        name: newBtc.name,
        contact_no: newBtc.contact_no || null,
        address_barangay: newBtc.address_barangay || null,
        specialization: newBtc.specialization || 'General',
        health_card_no: newBtc.health_card_no || null,
        health_card_expiry: newBtc.health_card_expiry || null,
        status: newBtc.status || 'Active',
        remarks: newBtc.remarks || null,
        summary: `Accredited new butcher: ${newBtc.name} (${newBtc.butcher_code}) - Specialization: ${newBtc.specialization || 'General'}, Health Card: ${newBtc.health_card_no || 'N/A'}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const updateButcher = (id: string, updates: Partial<ButcherProfile>) => {
    if (!requirePermission('slaughterhouse:write')) return;
    const existing = butchers.find((b) => b.id === id);
    setButchers((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      localStorage.setItem('meedo_butchers', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const dbUpdates: any = { ...updates };
      delete dbUpdates.id;
      delete dbUpdates.created_at;
      if (dbUpdates.health_card_expiry === '') dbUpdates.health_card_expiry = null;
      if (dbUpdates.date_registered && !dbUpdates.date_registered.includes('-')) {
        try {
          dbUpdates.date_registered = new Date(dbUpdates.date_registered).toISOString().split('T')[0];
        } catch (e) {}
      }

      client
        .from('butchers')
        .update(dbUpdates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error updating butcher in Supabase:', error);
        });

      // Write to public.audit_logs in Supabase
      addAuditLog('BUTCHER_PROFILE_UPDATED', {
        butcher_id: id,
        butcher_code: updates.butcher_code || existing?.butcher_code,
        name: updates.name || existing?.name,
        updated_fields: Object.keys(updates),
        status: updates.status || existing?.status,
        summary: `Updated butcher profile (${id})${updates.name || existing?.name ? ' for ' + (updates.name || existing?.name) : ''}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const deleteButcher = (id: string) => {
    if (!requirePermission('slaughterhouse:write')) return;
    const existing = butchers.find((b) => b.id === id);
    setButchers((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      localStorage.setItem('meedo_butchers', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (isSupabaseConfigured && client) {
      client
        .from('butchers')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting butcher in Supabase:', error);
        });

      // Write to public.audit_logs in Supabase
      addAuditLog('BUTCHER_DELISTED', {
        butcher_id: id,
        butcher_code: existing?.butcher_code,
        name: existing?.name || 'Unknown Butcher',
        status: existing?.status,
        summary: `De-listed / deleted butcher profile (${id})${existing?.name ? ' - ' + existing.name : ''}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const resetButchers = () => {
    if (!requirePermission('slaughterhouse:reset')) return;
    const previousCount = butchers.length;
    setButchers([]);
    localStorage.removeItem('meedo_butchers');

    const client = supabase;
    if (isSupabaseConfigured && client) {
      client
        .from('butchers')
        .delete()
        .neq('id', 'placeholder')
        .then(({ error }) => {
          if (error) {
            console.error('Error resetting butchers in Supabase:', error);
          } else {
            // Audit log: record this destructive reset
            addAuditLog('BUTCHER_ROSTER_RESET', {
              records_deleted: previousCount,
              summary: `Full butcher roster reset — ${previousCount} profile(s) deleted from Supabase by ${currentUser?.username || 'admin'}.`,
              timestamp: new Date().toISOString(),
            });
          }
        });
    }
  };

  const addCemeteryBooking = (booking: Omit<CemeteryBooking, 'id' | 'created_at'>) => {
    if (!requirePermission('cemetery:write')) return;
    const newBooking: CemeteryBooking = {
      ...booking,
      id: toPbId('cem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      created_at: new Date().toISOString(),
    };
    setCemeteryBookings((prev) => {
      const updated = [newBooking, ...prev];
      localStorage.setItem('meedo_cemetery', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const res = await client.from('cemetery_bookings').insert({
            id: newBooking.id,
            deceased_name: newBooking.deceased_name,
            address_barangay: newBooking.address_barangay,
            phone_number: newBooking.phone_number || null,
            burial_date: newBooking.burial_date,
            burial_time: newBooking.burial_time || null,
            burial_type: newBooking.burial_type,
            amount: Number(newBooking.amount) || 0,
            created_at: newBooking.created_at,
          });
          if (res.error) {
            console.warn('Supabase cemetery insert error:', res.error.message);
          } else {
            addAuditLog('CEMETERY_BOOKING_ADDED', {
              booking_id: newBooking.id,
              deceased_name: newBooking.deceased_name,
              address_barangay: newBooking.address_barangay,
              burial_date: newBooking.burial_date,
              burial_type: newBooking.burial_type,
              amount: newBooking.amount,
              summary: `New burial booking: ${newBooking.deceased_name} (${newBooking.burial_type}) on ${newBooking.burial_date}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase cemetery insert notice:', e);
        }
      })();
    }
  };

  const updateCemeteryBooking = (id: string, updates: Partial<CemeteryBooking>) => {
    if (!requirePermission('cemetery:write')) return;
    const existing = cemeteryBookings.find((b) => b.id === id);
    setCemeteryBookings((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      localStorage.setItem('meedo_cemetery', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const payload: any = { ...updates };
      delete payload.id;
      delete payload.created_at;

      (async () => {
        try {
          const res = await client.from('cemetery_bookings').update(payload).eq('id', id);
          if (res.error) {
            console.warn('Supabase cemetery update error:', res.error.message);
          } else {
            addAuditLog('CEMETERY_BOOKING_UPDATED', {
              booking_id: id,
              deceased_name: updates.deceased_name || existing?.deceased_name,
              updated_fields: Object.keys(updates),
              summary: `Updated burial booking for ${updates.deceased_name || existing?.deceased_name || 'Unknown'} (ID: ${id})`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase cemetery update notice:', e);
        }
      })();
    }
  };

  const deleteCemeteryBooking = (id: string) => {
    if (!requirePermission('cemetery:write')) return;
    const existing = cemeteryBookings.find((b) => b.id === id);
    setCemeteryBookings((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      localStorage.setItem('meedo_cemetery', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const res = await client.from('cemetery_bookings').delete().eq('id', id);
          if (res.error) {
            console.warn('Supabase cemetery delete error:', res.error.message);
          } else {
            addAuditLog('CEMETERY_BOOKING_DELETED', {
              booking_id: id,
              deceased_name: existing?.deceased_name || 'Unknown',
              burial_date: existing?.burial_date,
              burial_type: existing?.burial_type,
              amount: existing?.amount,
              summary: `Deleted burial booking for ${existing?.deceased_name || 'Unknown'} (${existing?.burial_type}) on ${existing?.burial_date}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase cemetery delete notice:', e);
        }
      })();
    }
  };

  const addToda = (toda: Omit<Toda, 'id' | 'created_at'>) => {
    if (!requirePermission('transport:write')) return;
    const newToda: Toda = {
      ...toda,
      id: toPbId('toda_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      created_at: new Date().toISOString(),
    };
    setTodas((prev) => {
      const updated = [newToda, ...prev];
      localStorage.setItem('meedo_todas', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const res = await client.from('todas').insert({
            id: newToda.id,
            reg_no: newToda.reg_no,
            name: newToda.name,
            president: newToda.president,
            contact_no: newToda.contact_no || null,
            total_members: Number(newToda.total_members) || 0,
            address: newToda.address || null,
            created_at: newToda.created_at,
          });
          if (res.error) {
            console.warn('Supabase TODA insert error:', res.error.message);
          } else {
            addAuditLog('TODA_REGISTERED', {
              toda_id: newToda.id,
              reg_no: newToda.reg_no,
              name: newToda.name,
              president: newToda.president,
              total_members: newToda.total_members,
              summary: `Registered TODA: ${newToda.name} (Reg #${newToda.reg_no}) - President: ${newToda.president}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase TODA insert notice:', e);
        }
      })();
    }
  };

  const updateToda = (id: string, updates: Partial<Toda>) => {
    if (!requirePermission('transport:write')) return;
    const existing = todas.find((t) => t.id === id);
    setTodas((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem('meedo_todas', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const payload: any = { ...updates };
      delete payload.id;
      delete payload.created_at;

      (async () => {
        try {
          const res = await client.from('todas').update(payload).eq('id', id);
          if (res.error) {
            console.warn('Supabase TODA update error:', res.error.message);
          } else {
            addAuditLog('TODA_UPDATED', {
              toda_id: id,
              name: updates.name || existing?.name,
              reg_no: updates.reg_no || existing?.reg_no,
              updated_fields: Object.keys(updates),
              summary: `Updated TODA info for ${updates.name || existing?.name || 'Unknown TODA'} (ID: ${id})`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase TODA update notice:', e);
        }
      })();
    }
  };

  const deleteToda = (id: string) => {
    if (!requirePermission('transport:write')) return;
    const existing = todas.find((t) => t.id === id);
    setTodas((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      localStorage.setItem('meedo_todas', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const res = await client.from('todas').delete().eq('id', id);
          if (res.error) {
            console.warn('Supabase TODA delete error:', res.error.message);
          } else {
            addAuditLog('TODA_DELETED', {
              toda_id: id,
              name: existing?.name || 'Unknown TODA',
              reg_no: existing?.reg_no,
              president: existing?.president,
              summary: `Deleted TODA record: ${existing?.name || 'Unknown'} (Reg #${existing?.reg_no || 'N/A'})`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase TODA delete notice:', e);
        }
      })();
    }
  };

  const addTodaMember = (member: Omit<TodaMember, 'id' | 'created_at'>) => {
    if (!requirePermission('transport:write')) return;
    const newMember: TodaMember = {
      ...member,
      id: toPbId('mem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      created_at: new Date().toISOString(),
    };
    setTodaMembers((prev) => {
      const updated = [newMember, ...prev];
      localStorage.setItem('meedo_members', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const res = await client.from('toda_members').insert({
            id: newMember.id,
            toda_id: newMember.toda_id || null,
            toda_name: newMember.toda_name,
            last_name: newMember.last_name,
            first_name: newMember.first_name,
            middle_name: newMember.middle_name || null,
            ext_name: newMember.ext_name || null,
            sex: newMember.sex,
            barangay: newMember.barangay,
            municipality: newMember.municipality || 'Malungon',
            contact_no: newMember.contact_no || newMember.contact_number || null,
            id_type: newMember.id_type || null,
            id_number: newMember.id_number || null,
            id_expiry: newMember.id_expiry || null,
            created_at: newMember.created_at,
          });
          if (res.error) {
            console.warn('Supabase TODA member insert error:', res.error.message);
          } else {
            const fullName = `${newMember.first_name} ${newMember.last_name}`;
            addAuditLog('TODA_MEMBER_ADDED', {
              member_id: newMember.id,
              member_name: fullName,
              toda_name: newMember.toda_name,
              barangay: newMember.barangay,
              summary: `Registered driver/operator: ${fullName} under TODA ${newMember.toda_name}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase TODA member insert notice:', e);
        }
      })();
    }
  };

  const updateTodaMember = (id: string, updates: Partial<TodaMember>) => {
    if (!requirePermission('transport:write')) return;
    const existing = todaMembers.find((m) => m.id === id);
    setTodaMembers((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
      localStorage.setItem('meedo_members', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const payload: any = { ...updates };
      delete payload.id;
      delete payload.created_at;

      (async () => {
        try {
          const res = await client.from('toda_members').update(payload).eq('id', id);
          if (res.error) {
            console.warn('Supabase TODA member update error:', res.error.message);
          } else {
            const memberName = updates.first_name || updates.last_name
              ? `${updates.first_name || existing?.first_name || ''} ${updates.last_name || existing?.last_name || ''}`.trim()
              : `${existing?.first_name || ''} ${existing?.last_name || ''}`.trim();
            addAuditLog('TODA_MEMBER_UPDATED', {
              member_id: id,
              member_name: memberName,
              updated_fields: Object.keys(updates),
              summary: `Updated profile for driver/member: ${memberName} (ID: ${id})`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase TODA member update notice:', e);
        }
      })();
    }
  };

  const deleteTodaMember = (id: string) => {
    if (!requirePermission('transport:write')) return;
    const existing = todaMembers.find((m) => m.id === id);
    setTodaMembers((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      localStorage.setItem('meedo_members', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const res = await client.from('toda_members').delete().eq('id', id);
          if (res.error) {
            console.warn('Supabase TODA member delete error:', res.error.message);
          } else {
            const memberName = `${existing?.first_name || ''} ${existing?.last_name || ''}`.trim() || 'Unknown Driver';
            addAuditLog('TODA_MEMBER_DELETED', {
              member_id: id,
              member_name: memberName,
              toda_name: existing?.toda_name,
              summary: `Deleted driver/operator profile: ${memberName} (${existing?.toda_name || 'N/A'})`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase TODA member delete notice:', e);
        }
      })();
    }
  };

  const updateOpifIndicator = (id: string, updates: Partial<OpifIndicator>) => {
    const existing = opifIndicators.find((item) => item.id === id);
    const targetSection = (existing?.section || updates.section || 'A') as UserSection;
    if (!requirePermission('opif:update_own_section', targetSection)) return;
    const safeUpdates = isAdminUser(currentUser)
      ? updates
      : { ...updates, section: existing?.section || (targetSection as OpifIndicator['section']) };
    const merged: OpifIndicator = { ...(existing || ({ section: 'A' } as OpifIndicator)), ...safeUpdates, id };
    setOpifIndicators((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...safeUpdates } : item));
      localStorage.setItem('meedo_opif', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const payload = toOpifPbPayload(merged);
      (async () => {
        try {
          const res = await client.from('opif_indicators').update(payload).eq('id', id);
          if (res.error) {
            console.warn('PocketBase OPIF update error:', res.error.message);
          } else {
            addAuditLog('OPIF_INDICATOR_UPDATED', {
              indicator_id: id,
              section: merged.section,
              indicator_name: merged.col6 || merged.col4,
              updated_fields: Object.keys(safeUpdates),
              summary: `Updated OPIF indicator (${merged.section}): ${merged.col6 || merged.col4 || id}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('PocketBase OPIF update notice:', e);
        }
      })();
    }
  };

  const addOpifIndicator = (indicator: OpifIndicator) => {
    if (!requirePermission('opif:manage_all')) return;
    const newIndicator: OpifIndicator = {
      ...indicator,
      id: toPbId(indicator.id || `opif_${indicator.section}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
    };
    const nextOrder = opifIndicators.length + 1;
    setOpifIndicators((prev) => {
      const updated = [...prev, newIndicator];
      localStorage.setItem('meedo_opif', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const payload = toOpifPbPayload(newIndicator, true, nextOrder);
      (async () => {
        try {
          const res = await client.from('opif_indicators').insert(payload);
          if (res.error) {
            console.warn('PocketBase OPIF insert error:', res.error.message);
          } else {
            addAuditLog('OPIF_INDICATOR_ADDED', {
              indicator_id: newIndicator.id,
              section: newIndicator.section,
              indicator_name: newIndicator.col6 || newIndicator.col4,
              summary: `Added OPIF indicator (${newIndicator.section}): ${newIndicator.col6 || newIndicator.col4 || newIndicator.id}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('PocketBase OPIF insert notice:', e);
        }
      })();
    }
  };

  const deleteOpifIndicator = (id: string) => {
    if (!requirePermission('opif:manage_all')) return;
    const existing = opifIndicators.find((i) => i.id === id);
    setOpifIndicators((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      localStorage.setItem('meedo_opif', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const res = await client.from('opif_indicators').delete().eq('id', id);
          if (res.error) {
            console.warn('PocketBase OPIF delete error:', res.error.message);
          } else {
            addAuditLog('OPIF_INDICATOR_DELETED', {
              indicator_id: id,
              section: existing?.section,
              indicator_name: existing?.col6 || existing?.col4,
              summary: `Deleted OPIF indicator (${existing?.section || 'OPIF'}): ${existing?.col6 || id}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('PocketBase OPIF delete notice:', e);
        }
      })();
    }
  };

  const resetOpifIndicators = () => {
    if (!requirePermission('opif:manage_all')) return;
    const normalizedDefaults = initialOpifIndicators.map((ind, idx) => ({
      ...ind,
      id: toPbId(ind.id || `opif_def_${idx}`),
    }));
    setOpifIndicators(normalizedDefaults);
    localStorage.setItem('meedo_opif', JSON.stringify(normalizedDefaults));

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const existing = await client.from('opif_indicators').select('id');
          for (const row of existing.data || []) {
            if (row?.id) await client.from('opif_indicators').delete().eq('id', row.id);
          }
          const payloads = normalizedDefaults.map((ind, idx) => toOpifPbPayload(ind, true, idx + 1));
          await client.from('opif_indicators').upsert(payloads, { onConflict: 'id' });
          addAuditLog('OPIF_INDICATORS_RESET', {
            count: payloads.length,
            summary: `Reset ${payloads.length} OPIF scorecard indicators to baseline template`,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('PocketBase OPIF reset notice:', e);
        }
      })();
    }
  };

  const addCsuReport = (report: Omit<CsuDailyReport, 'id' | 'created_at'>) => {
    if (!requirePermission('csu:guard_shift')) return;
    const newReport: CsuDailyReport = {
      ...report,
      id: toPbId('csu_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      created_at: new Date().toISOString(),
    };
    setCsuReports((prev) => {
      const updated = [newReport, ...prev];
      localStorage.setItem('meedo_csu', JSON.stringify(updated));
      return updated;
    });
    if (isSupabaseConfigured && supabase) {
      supabase.from('csu_daily_reports').insert(newReport).then();
      addAuditLog('BLOTTER_REPORT_CREATED', {
        report_id: newReport.id,
        report_date: newReport.report_date,
        shift: newReport.shift,
        prep_name: newReport.prep_name,
        summary: `Created security blotter report (${newReport.id}) for shift ${newReport.shift} on ${newReport.report_date}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const updateCsuReport = (id: string, updates: Partial<CsuDailyReport>) => {
    if (!requirePermission('csu:guard_shift')) return;
    const existing = csuReports.find((r) => r.id === id);
    setCsuReports((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      localStorage.setItem('meedo_csu', JSON.stringify(updated));
      return updated;
    });
    if (isSupabaseConfigured && supabase) {
      supabase.from('csu_daily_reports').update(updates).eq('id', id).then();
      addAuditLog('BLOTTER_REPORT_UPDATED', {
        report_id: id,
        report_date: updates.report_date || existing?.report_date,
        updated_fields: Object.keys(updates),
        summary: `Updated security blotter report (${id})`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const requestBlotterCorrection = (reportId: string, reason: string) => {
    if (!requirePermission('csu:guard_shift')) return;
    let updatedReport: CsuDailyReport | null = null;
    setCsuReports((prev) => {
      const updated = prev.map((r) => {
        if (r.id === reportId) {
          const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const userStr = currentUser?.full_name || currentUser?.username || 'Market Guard';
          updatedReport = {
            ...r,
            is_locked: false,
            turnover_notes: `${r.turnover_notes ? r.turnover_notes + '\n\n' : ''}[CORRECTION REQUESTED by ${userStr} at ${timestamp}]: ${reason}`,
          };
          return updatedReport;
        }
        return r;
      });
      localStorage.setItem('meedo_csu', JSON.stringify(updated));
      return updated;
    });
    if (isSupabaseConfigured && supabase && updatedReport) {
      supabase.from('csu_daily_reports').update({
        is_locked: false,
        turnover_notes: (updatedReport as any).turnover_notes,
      }).eq('id', reportId).then();

      addAuditLog('BLOTTER_CORRECTION_REQUESTED', {
        report_id: reportId,
        reason,
        requested_by: currentUser?.full_name || currentUser?.username || 'Market Staff',
        summary: `Requested blotter report unlock/correction for ${reportId}. Reason: ${reason}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const approveBlotterReport = (reportId: string, reviewerNotes?: string) => {
    if (!requirePermission('csu:approve_blotter')) return;
    let updatedReport: CsuDailyReport | null = null;
    setCsuReports((prev) => {
      const updated = prev.map((r) => {
        if (r.id === reportId) {
          const approverName = currentUser?.full_name || 'Market Administrator';
          updatedReport = {
            ...r,
            is_locked: true,
            ver_name: approverName,
            ver_title: 'Market Supervisor / Verified',
            app_name: 'Marife V. Cachuela',
            app_title: 'MEEDO Department Head / Approved',
            turnover_notes: reviewerNotes
              ? `${r.turnover_notes ? r.turnover_notes + '\n\n' : ''}[ADMIN APPROVAL NOTE]: ${reviewerNotes}`
              : r.turnover_notes,
          };
          return updatedReport;
        }
        return r;
      });
      localStorage.setItem('meedo_csu', JSON.stringify(updated));
      return updated;
    });
    if (isSupabaseConfigured && supabase && updatedReport) {
      supabase.from('csu_daily_reports').update({
        is_locked: true,
        ver_name: (updatedReport as any).ver_name,
        ver_title: (updatedReport as any).ver_title,
        app_name: (updatedReport as any).app_name,
        app_title: (updatedReport as any).app_title,
        turnover_notes: (updatedReport as any).turnover_notes,
      }).eq('id', reportId).then();

      addAuditLog('BLOTTER_REPORT_APPROVED', {
        report_id: reportId,
        approved_by: currentUser?.full_name || currentUser?.username || 'Market Administrator',
        reviewer_notes: reviewerNotes || 'Approved without notes',
        summary: `Approved and locked security blotter report (${reportId})`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // ---------------------------------------------------------------------------
  // MARKET OPERATIONS CALENDAR & GUARD CONFLICT ENGINE
  // ---------------------------------------------------------------------------
  const parseTimeToMinutes = (t: string): number => {
    if (!t) return 0;
    const clean = t.replace(/[^\d:]/g, '');
    if (clean.includes(':')) {
      const [h, m] = clean.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    }
    if (clean.length === 4) {
      const h = parseInt(clean.substring(0, 2), 10);
      const m = parseInt(clean.substring(2, 4), 10);
      return (h || 0) * 60 + (m || 0);
    }
    const val = parseInt(clean, 10);
    return isNaN(val) ? 0 : val * 60;
  };

  const isTimeOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
    const sA = parseTimeToMinutes(startA);
    let eA = parseTimeToMinutes(endA);
    const sB = parseTimeToMinutes(startB);
    let eB = parseTimeToMinutes(endB);
    if (eA <= sA) eA += 24 * 60;
    if (eB <= sB) eB += 24 * 60;
    return sA < eB && eA > sB;
  };

  const checkScheduleConflict = (
    guardId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeEventId?: string
  ): MarketCalendarEvent | null => {
    if (!guardId || !date || !startTime || !endTime) return null;
    const conflict = marketCalendarEvents.find((evt) => {
      if (evt.id === excludeEventId) return false;
      if (evt.category !== 'Guard Duty') return false;
      if (evt.date !== date) return false;
      if (!evt.assigned_guard_id) return false;
      if (evt.assigned_guard_id.toUpperCase() !== guardId.toUpperCase()) return false;
      return isTimeOverlap(evt.start_time, evt.end_time, startTime, endTime);
    });
    return conflict || null;
  };

  const addCalendarEvent = (
    event: Omit<MarketCalendarEvent, 'id' | 'created_at'>,
    bypassConflict: boolean = false
  ): { success: boolean; message?: string; conflict?: MarketCalendarEvent } => {
    if (!hasPermission(currentUser, 'csu:manage_calendar')) {
      return { success: false, message: 'Administrator privilege required to create calendar events.' };
    }
    if (event.category === 'Guard Duty' && event.assigned_guard_id && !bypassConflict) {
      const conflict = checkScheduleConflict(
        event.assigned_guard_id,
        event.date,
        event.start_time,
        event.end_time
      );
      if (conflict) {
        return {
          success: false,
          conflict,
          message: `Guard Assignment Conflict: Guard is already scheduled for "${conflict.title}" from ${conflict.start_time} to ${conflict.end_time} on ${event.date}.`,
        };
      }
    }

    const newEvt: MarketCalendarEvent = {
      ...event,
      id: toPbId('evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
      created_at: new Date().toISOString(),
    };

    setMarketCalendarEvents((prev) => {
      const updated = [newEvt, ...prev];
      localStorage.setItem('meedo_calendar_events', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('market_calendar_events').insert(newEvt).then();
      addAuditLog('CALENDAR_EVENT_CREATED', {
        event_id: newEvt.id,
        title: newEvt.title,
        category: newEvt.category,
        date: newEvt.date,
        time: `${newEvt.start_time} - ${newEvt.end_time}`,
        assigned_guard: newEvt.assigned_guard_id || 'None',
        summary: `Created calendar event / guard schedule: "${newEvt.title}" (${newEvt.category}) on ${newEvt.date}`,
        timestamp: new Date().toISOString(),
      });
    }

    return { success: true };
  };

  const updateCalendarEvent = (
    id: string,
    updates: Partial<MarketCalendarEvent>,
    bypassConflict: boolean = false
  ): { success: boolean; message?: string; conflict?: MarketCalendarEvent } => {
    const updateKeys = Object.keys(updates).filter((k) => k !== 'updated_at');
    const isShiftExecutionOnly =
      updateKeys.length > 0 &&
      updateKeys.every((k) => k === 'status' || k === 'blotter_report_id');
    const canUpdate = isShiftExecutionOnly
      ? hasPermission(currentUser, 'csu:guard_shift') || hasPermission(currentUser, 'csu:manage_calendar')
      : hasPermission(currentUser, 'csu:manage_calendar');
    if (!canUpdate) {
      return { success: false, message: 'Administrator privilege required to modify calendar schedules.' };
    }
    const existing = marketCalendarEvents.find((e) => e.id === id);
    if (!existing) return { success: false, message: 'Calendar event not found.' };

    const merged = { ...existing, ...updates };

    if (merged.category === 'Guard Duty' && merged.assigned_guard_id && !bypassConflict) {
      const conflict = checkScheduleConflict(
        merged.assigned_guard_id,
        merged.date,
        merged.start_time,
        merged.end_time,
        id
      );
      if (conflict) {
        return {
          success: false,
          conflict,
          message: `Guard Assignment Conflict: Guard is already scheduled for "${conflict.title}" from ${conflict.start_time} to ${conflict.end_time} on ${merged.date}.`,
        };
      }
    }

    setMarketCalendarEvents((prev) => {
      const updated = prev.map((e) =>
        e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
      );
      localStorage.setItem('meedo_calendar_events', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('market_calendar_events').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).then();
      addAuditLog('CALENDAR_EVENT_UPDATED', {
        event_id: id,
        title: updates.title || existing.title,
        updated_fields: Object.keys(updates),
        summary: `Updated calendar event / schedule: "${updates.title || existing.title}" (${id})`,
        timestamp: new Date().toISOString(),
      });
    }

    return { success: true };
  };

  const deleteCalendarEvent = (id: string) => {
    if (!requirePermission('csu:manage_calendar')) return;
    const existing = marketCalendarEvents.find((e) => e.id === id);
    setMarketCalendarEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem('meedo_calendar_events', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('market_calendar_events').delete().eq('id', id).then();
      addAuditLog('CALENDAR_EVENT_DELETED', {
        event_id: id,
        title: existing?.title || 'Unknown Event',
        date: existing?.date,
        category: existing?.category,
        summary: `Deleted calendar event: "${existing?.title || id}" (${existing?.category || 'N/A'})`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // ---------------------------------------------------------------------------
  // MARKET GUARD OPERATIONAL STATE MACHINE (Supabase Synced & Multi-Guard)
  // ---------------------------------------------------------------------------
  const getActiveShiftSession = (guardId?: string): GuardShiftSession | null => {
    const targetId = (guardId || (currentUser?.role === 'Staff' ? currentUser.guard_id : undefined))?.trim().toUpperCase();
    if (targetId) {
      if (activeShiftSessions && typeof activeShiftSessions === 'object') {
        for (const [key, sess] of Object.entries(activeShiftSessions)) {
          if (
            key.trim().toUpperCase() === targetId &&
            sess &&
            sess.status !== 'ENDED' &&
            sess.guard_id?.trim().toUpperCase() === targetId
          ) {
            return sess;
          }
        }
      }
      if (
        activeShiftSession &&
        activeShiftSession.guard_id?.trim().toUpperCase() === targetId &&
        activeShiftSession.status !== 'ENDED'
      ) {
        return activeShiftSession;
      }
      return null;
    }
    return activeShiftSession && activeShiftSession.status !== 'ENDED' ? activeShiftSession : null;
  };

  const startGuardShift = (eventDetails?: Partial<GuardShiftSession>): GuardShiftSession => {
    if (!requirePermission('csu:guard_shift')) {
      throw new Error('Market Guard or Administrator clearance required to start a shift.');
    }
    const now = new Date();
    const timeIn = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[now.getDay()];

    const targetGuardId =
      eventDetails?.guard_id ||
      currentUser?.guard_id ||
      (currentUser?.role === 'Staff' && currentUser?.username ? currentUser.username : undefined);

    const matchedGuard =
      guards.find(
        (g) =>
          (targetGuardId && g.guard_id.toUpperCase() === targetGuardId.toUpperCase()) ||
          (currentUser?.guard_id && g.guard_id.toUpperCase() === currentUser.guard_id.toUpperCase()) ||
          (currentUser?.username && g.guard_id.toUpperCase() === currentUser.username.toUpperCase()) ||
          (currentUser?.full_name && g.guard_name.toLowerCase() === currentUser.full_name.toLowerCase()) ||
          g.guard_name.toLowerCase().includes((currentUser?.full_name || currentUser?.username || '').toLowerCase())
      ) || {
        guard_id: targetGuardId || 'G-101',
        guard_name: eventDetails?.guard_name || currentUser?.full_name || currentUser?.username || 'Duty Market Guard',
        rank_title: currentUser?.rank_title || 'SO1',
        default_area: 'General Public Market',
        radio_call_sign: currentUser?.radio_call_sign || 'EAGLE-1',
        assigned_facility: 'Public Market Main',
        current_shift: '1st Shift (06:00 - 14:00)',
        status: 'Active',
      };

    const initialLog = {
      time: timeIn,
      area: eventDetails?.area || matchedGuard.default_area || 'Main Gate / Post',
      notes: 'Shift started. Post assumed and communication radio checked.',
    };

    const session: GuardShiftSession = {
      id: 'shift_sess_' + Date.now(),
      calendar_event_id: eventDetails?.calendar_event_id,
      guard_id: matchedGuard.guard_id,
      guard_name: eventDetails?.guard_name || matchedGuard.guard_name,
      facility: eventDetails?.facility || matchedGuard.assigned_facility || 'Public Market Main',
      area: eventDetails?.area || matchedGuard.default_area || 'General Public Market',
      shift_name: eventDetails?.shift_name || matchedGuard.current_shift || '1st Shift (06:00 - 14:00)',
      call_sign: eventDetails?.call_sign || matchedGuard.radio_call_sign || 'EAGLE-1',
      status: 'ON_DUTY',
      time_in: timeIn,
      date: dateStr,
      patrol_logs: [initialLog],
      instructions: eventDetails?.instructions,
    };

    // Store active session in memory and localStorage (multi-guard)
    setActiveShiftSessions((prev) => {
      const updated = { ...prev, [matchedGuard.guard_id]: session };
      localStorage.setItem('meedo_guard_shift_sessions', JSON.stringify(updated));
      return updated;
    });
    setActiveShiftSession(session);
    localStorage.setItem('meedo_active_guard_session', JSON.stringify(session));

    // Create an in-progress draft CsuDailyReport with PocketBase-compatible ID upfront
    const reportId = toPbId(`csu_${matchedGuard.guard_id.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`);
    const initialActivities = `Shift started at ${timeIn}. Area covered: ${session.area}.\nPatrol checks logged (1):\n• ${timeIn} [${initialLog.area}]: ${initialLog.notes}`;

    const draftReport: CsuDailyReport = {
      id: reportId,
      report_date: dateStr,
      day_of_week: dayOfWeek,
      shift: session.shift_name,
      area_covered: session.area,
      summary_activities: initialActivities,
      turnover_notes: '',
      prep_name: session.guard_name,
      prep_title: matchedGuard.rank_title || 'SO1',
      ver_name: 'CSU Supervisor',
      ver_title: 'Chief Security Officer',
      app_name: 'Marife V. Cachuela',
      app_title: 'MEEDO Department Head',
      personnel_data: [
        {
          id: 'guard_duty_' + Date.now(),
          guard_id: matchedGuard.guard_id,
          guard_name: session.guard_name,
          assigned_area: session.area,
          time_in: timeIn,
          time_out: '',
          remarks: 'Active roving (1 check)',
          patrol_logs: [initialLog],
        } as any,
      ],
      incident_data: [],
      violations_data: [],
      lost_found_data: [],
      calendar_event_id: session.calendar_event_id,
      is_locked: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    setCsuReports((prev) => {
      const filtered = prev.filter((r) => r.id !== reportId);
      const updated = [draftReport, ...filtered];
      localStorage.setItem('meedo_csu', JSON.stringify(updated));
      return updated;
    });

    // DIRECT SYNC TO SUPABASE!
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('csu_daily_reports')
        .upsert(draftReport, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error('Supabase error inserting draft shift blotter:', error.message);
          else console.log('✓ Supabase draft shift blotter created for', matchedGuard.guard_name);
        });

      supabase
        .from('audit_logs')
        .insert({
          username: currentUser?.username || session.guard_name,
          action: 'Shift Started',
          details: `Guard ${session.guard_name} (${matchedGuard.guard_id}) clocked in at ${timeIn}. Shift: ${session.shift_name}. Ref: ${reportId}`,
        })
        .then();
    }

    if (eventDetails?.calendar_event_id) {
      updateCalendarEvent(
        eventDetails.calendar_event_id,
        { status: 'Ongoing', blotter_report_id: reportId },
        true
      );
    }

    return session;
  };

  const logPatrolCheck = (area: string, notes: string, guardIdOverride?: string) => {
    if (!requirePermission('csu:guard_shift')) return;
    const targetGuardId =
      guardIdOverride ||
      (currentUser?.role === 'Staff' ? currentUser.guard_id : undefined) ||
      activeShiftSession?.guard_id;

    // Retrieve active session for this guard
    const sess = (targetGuardId && activeShiftSessions[targetGuardId]) || activeShiftSession;
    if (!sess) {
      console.warn('Cannot log patrol check: no active duty session found for guard', targetGuardId);
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const newLog = { time: timeStr, area: area || sess.area, notes };
    const updatedLogs = [...sess.patrol_logs, newLog];

    const updatedSession: GuardShiftSession = {
      ...sess,
      status: 'ON_PATROL',
      patrol_logs: updatedLogs,
    };

    setActiveShiftSessions((prev) => {
      const updated = { ...prev, [sess.guard_id]: updatedSession };
      localStorage.setItem('meedo_guard_shift_sessions', JSON.stringify(updated));
      return updated;
    });
    setActiveShiftSession(updatedSession);
    localStorage.setItem('meedo_active_guard_session', JSON.stringify(updatedSession));

    // Format readable summary activities for audit, report & print preview
    const formattedActivities =
      `Shift started at ${sess.time_in}. Area covered: ${sess.area}.\nPatrol checks logged (${updatedLogs.length}):\n` +
      updatedLogs.map((l) => `• ${l.time} [${l.area}]: ${l.notes}`).join('\n');

    // Resolve target draft report before queuing React state update (safe under React 18 StrictMode)
    const activeReport = csuReports.find(
      (r) =>
        !r.is_locked &&
        (r.prep_name.toLowerCase() === sess.guard_name.toLowerCase() ||
          r.personnel_data?.some((p) => p.guard_id === sess.guard_id))
    );
    const activeReportId = activeReport?.id;
    const targetPersonnelData = activeReport
      ? (activeReport.personnel_data || []).map((p) =>
          p.guard_id === sess.guard_id
            ? {
                ...p,
                remarks: `Active roving (${updatedLogs.length} checks logged)`,
                patrol_logs: updatedLogs,
              }
            : p
        )
      : [];

    if (activeReportId) {
      setCsuReports((prev) => {
        const updated = prev.map((r) =>
          r.id === activeReportId
            ? {
                ...r,
                summary_activities: formattedActivities,
                personnel_data: targetPersonnelData,
                updated_at: now.toISOString(),
              }
            : r
        );
        localStorage.setItem('meedo_csu', JSON.stringify(updated));
        return updated;
      });
    }

    // DIRECT SYNC TO POCKETBASE
    if (isSupabaseConfigured && supabase) {
      if (activeReportId) {
        supabase
          .from('csu_daily_reports')
          .update({
            summary_activities: formattedActivities,
            personnel_data: targetPersonnelData,
            updated_at: now.toISOString(),
          })
          .eq('id', activeReportId)
          .then(({ error }) => {
            if (error) console.error('PocketBase error updating patrol check:', error.message);
          });
      }

      supabase
        .from('audit_logs')
        .insert({
          username: currentUser?.username || sess.guard_name,
          action: 'Patrol Check Logged',
          details: `Guard ${sess.guard_name} (${sess.guard_id}) logged patrol roving check at ${area || sess.area}: ${notes}`,
        })
        .then();
    }
  };

  const endGuardShift = (
    turnoverNotes?: string,
    summaryActivities?: string,
    guardIdOverride?: string
  ): CsuDailyReport => {
    if (!requirePermission('csu:guard_shift')) {
      throw new Error('Market Guard or Administrator clearance required to end a shift.');
    }
    const targetGuardId =
      guardIdOverride ||
      (currentUser?.role === 'Staff' ? currentUser.guard_id : undefined) ||
      activeShiftSession?.guard_id;

    const sess = (targetGuardId && activeShiftSessions[targetGuardId]) || activeShiftSession;
    const now = new Date();
    const timeOut = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dateStr = sess?.date || now.toISOString().split('T')[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[now.getDay()];

    const finalSummary =
      summaryActivities ||
      (sess?.patrol_logs && sess.patrol_logs.length > 0
        ? `Shift roving completed across ${sess.area}. Logged ${sess.patrol_logs.length} patrol checks:\n` +
          sess.patrol_logs.map((l) => `• ${l.time} [${l.area}]: ${l.notes}`).join('\n')
        : 'Roving and monitoring conducted across assigned sector. Maintained peaceful and orderly market environment.');

    const finalTurnover =
      turnoverNotes ||
      'Properly turned over security post, keys, handheld radio, and peace & order logbook to incoming duty shift.';

    // Resolve draft report outside React state updater so targetReport is always initialized synchronously
    const matchedDraft = csuReports.find(
      (r) =>
        !r.is_locked &&
        sess &&
        (r.prep_name.toLowerCase() === sess.guard_name.toLowerCase() ||
          r.personnel_data?.some((p) => p.guard_id === sess.guard_id))
    );

    const targetReport: CsuDailyReport = matchedDraft
      ? {
          ...matchedDraft,
          summary_activities: finalSummary,
          turnover_notes: finalTurnover,
          personnel_data: (matchedDraft.personnel_data || []).map((p) =>
            p.guard_id === sess?.guard_id
              ? { ...p, time_out: timeOut, remarks: 'Completed duty rotation' }
              : p
          ),
          is_locked: true,
          locked_at: now.toISOString(),
          updated_at: now.toISOString(),
        }
      : {
          id: toPbId(`csu_${(sess?.guard_id || 'G101').replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`),
          report_date: dateStr,
          day_of_week: dayOfWeek,
          shift: sess?.shift_name || '1st Shift (06:00 - 14:00)',
          area_covered: sess?.area || 'General Public Market',
          summary_activities: finalSummary,
          turnover_notes: finalTurnover,
          prep_name: sess?.guard_name || currentUser?.full_name || currentUser?.username || 'Duty Market Guard',
          prep_title: 'Market Guard-on-Duty',
          ver_name: 'CSU Supervisor',
          ver_title: 'Chief Security Officer',
          app_name: 'Marife V. Cachuela',
          app_title: 'MEEDO Department Head',
          personnel_data: [
            {
              id: 'guard_duty_' + Date.now(),
              guard_id: sess?.guard_id || currentUser?.guard_id || 'G-101',
              guard_name: sess?.guard_name || currentUser?.full_name || currentUser?.username || 'Duty Market Guard',
              assigned_area: sess?.area || 'General Public Market',
              time_in: sess?.time_in || '06:00',
              time_out: timeOut,
              remarks: 'Completed duty rotation',
              patrol_logs: sess?.patrol_logs || [],
            } as any,
          ],
          incident_data: [],
          violations_data: [],
          lost_found_data: [],
          calendar_event_id: sess?.calendar_event_id,
          is_locked: true,
          locked_at: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        };

    setCsuReports((prev) => {
      const updated = matchedDraft
        ? prev.map((r) => (r.id === matchedDraft.id ? targetReport : r))
        : [targetReport, ...prev.filter((r) => r.id !== targetReport.id)];
      localStorage.setItem('meedo_csu', JSON.stringify(updated));
      return updated;
    });

    // Remove active session for this guard
    if (sess?.guard_id) {
      setActiveShiftSessions((prev) => {
        const copy = { ...prev };
        delete copy[sess.guard_id];
        localStorage.setItem('meedo_guard_shift_sessions', JSON.stringify(copy));
        return copy;
      });
    }
    setActiveShiftSession(null);
    localStorage.removeItem('meedo_active_guard_session');

    // DIRECT SYNC TO POCKETBASE
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('csu_daily_reports')
        .upsert(targetReport, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error('PocketBase error ending shift and saving blotter:', error.message);
        });

      supabase
        .from('audit_logs')
        .insert({
          username: currentUser?.username || sess?.guard_name || 'Market Guard',
          action: 'Shift Ended & Blotter Submitted',
          details: `Guard ${sess?.guard_name} (${sess?.guard_id}) completed shift at ${timeOut}. Blotter ref: ${targetReport.id}`,
        })
        .then();
    }

    if (sess?.calendar_event_id) {
      updateCalendarEvent(
        sess.calendar_event_id,
        { status: 'Completed', blotter_report_id: targetReport.id },
        true
      );
    }

    return targetReport;
  };

  const commitInventoryChange = async (opts: {
    action: string;
    auditDetails: Record<string, any>;
    newTx: InventoryTransaction;
    nextItems: InventoryItem[];
    isNewItem?: boolean;
    newItemObj?: InventoryItem | null;
    itemUpdate?: { id: string; prevQty: number; prevDateReceived?: string; payload: Record<string, any> };
  }): Promise<{ success: boolean; message?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      try {
        if (opts.isNewItem && opts.newItemObj) {
          const itemRes = await client.from('inventory_items').insert(opts.newItemObj);
          if (itemRes.error) {
            return { success: false, message: extractPbErrorMessage(itemRes.error, 'Failed to create inventory item.') };
          }
        } else if (opts.itemUpdate) {
          const itemRes = await client
            .from('inventory_items')
            .update(opts.itemUpdate.payload)
            .eq('id', opts.itemUpdate.id);
          if (itemRes.error) {
            return { success: false, message: extractPbErrorMessage(itemRes.error, 'Failed to update inventory stock.') };
          }
        }

        const txRes = await client.from('inventory_transactions').insert(opts.newTx);
        if (txRes.error) {
          // Best-effort compensation if item write succeeded but transaction log failed
          if (opts.isNewItem && opts.newItemObj) {
            await client.from('inventory_items').delete().eq('id', opts.newItemObj.id);
          } else if (opts.itemUpdate) {
            const rollbackPayload: Record<string, any> = {
              quantity: opts.itemUpdate.prevQty,
              updated_at: new Date().toISOString(),
            };
            if (opts.itemUpdate.prevDateReceived !== undefined) {
              rollbackPayload.date_received = opts.itemUpdate.prevDateReceived;
            }
            await client.from('inventory_items').update(rollbackPayload).eq('id', opts.itemUpdate.id);
          }
          return { success: false, message: extractPbErrorMessage(txRes.error, 'Failed to save inventory transaction.') };
        }
      } catch (err: any) {
        return { success: false, message: extractPbErrorMessage(err, 'Database connection error while saving inventory change.') };
      }
    }

    setInventoryItems(opts.nextItems);
    localStorage.setItem('meedo_inventory_items', JSON.stringify(opts.nextItems));
    const updatedTx = [opts.newTx, ...inventoryTransactions];
    setInventoryTransactions(updatedTx);
    localStorage.setItem('meedo_inventory_transactions', JSON.stringify(updatedTx));

    addAuditLog(opts.action, opts.auditDetails);
    return { success: true };
  };

  const releaseInventoryItem = async (params: {
    itemId: string;
    department: string;
    quantity: number;
    receivedBy: string;
    dateReceived: string;
    remarks?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    if (!hasPermission(currentUser, 'inventory:write')) {
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
      i.id === item.id ? { ...i, quantity: updatedQty, updated_at: nowIso } : i
    );
    const releasingOfficer =
      currentUser?.full_name || currentUser?.username || 'Authorized Property Officer';

    const newTx: InventoryTransaction = {
      id: toPbId('tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
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

    return commitInventoryChange({
      action: 'INVENTORY_RELEASED',
      auditDetails: {
        transaction_id: newTx.id,
        item_id: item.id,
        item_name: item.item,
        quantity: params.quantity,
        unit: item.unit,
        department: params.department,
        received_by: params.receivedBy,
        released_by: releasingOfficer,
        summary: `Released ${params.quantity} ${item.unit} of "${item.item}" to ${params.department} (Received by: ${params.receivedBy})`,
        timestamp: nowIso,
      },
      newTx,
      nextItems: updatedItems,
      itemUpdate: { id: item.id, prevQty: item.quantity, payload: { quantity: updatedQty, updated_at: nowIso } },
    });
  };

  const stockInInventoryItem = async (params: {
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
  }): Promise<{ success: boolean; message?: string }> => {
    if (!hasPermission(currentUser, 'inventory:write')) {
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
    let isNewItem = false;
    let newItemObj: InventoryItem | null = null;
    let existingItemQty = 0;
    let prevDateReceived: string | undefined;

    if (params.itemId) {
      const existing = inventoryItems.find((i) => i.id === params.itemId);
      if (!existing) {
        return { success: false, message: 'Item specified for stock replenishment not found.' };
      }
      targetItemName = existing.item;
      targetDesc = existing.description;
      targetUnit = existing.unit;
      existingItemQty = existing.quantity;
      prevDateReceived = existing.date_received;
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
      isNewItem = true;
      targetItemId = toPbId('inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
      targetItemName = params.item.trim();
      targetDesc = params.description || '';
      targetUnit = params.unit.trim();

      newItemObj = {
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
      updatedItems = [newItemObj, ...inventoryItems];
    }

    const newTx: InventoryTransaction = {
      id: toPbId('tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
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

    return commitInventoryChange({
      action: 'INVENTORY_STOCK_IN',
      auditDetails: {
        transaction_id: newTx.id,
        item_id: targetItemId,
        item_name: targetItemName,
        quantity: params.quantity,
        unit: targetUnit,
        department: params.department || 'MEEDO',
        received_by: params.receivedBy || 'Supply Custodian',
        is_new_item: isNewItem,
        summary: `Replenished stock (+${params.quantity} ${targetUnit}) for "${targetItemName}"`,
        timestamp: nowIso,
      },
      newTx,
      nextItems: updatedItems,
      isNewItem,
      newItemObj,
      itemUpdate: !isNewItem
        ? {
            id: targetItemId,
            prevQty: existingItemQty,
            prevDateReceived,
            payload: {
              quantity: existingItemQty + params.quantity,
              date_received: params.dateReceived,
              updated_at: nowIso,
            },
          }
        : undefined,
    });
  };

  const adjustInventoryItem = async (
    id: string,
    newQuantity: number,
    reason: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!hasPermission(currentUser, 'inventory:write')) {
      return { success: false, message: 'Administrator privilege required for inventory adjustment.' };
    }
    const item = inventoryItems.find((i) => i.id === id);
    if (!item) return { success: false, message: 'Item not found.' };

    const clampedQty = Math.max(0, newQuantity);
    const diff = clampedQty - item.quantity;
    const nowIso = new Date().toISOString();
    const releasingOfficer =
      currentUser?.full_name || currentUser?.username || 'Authorized Property Officer';

    const updatedItems = inventoryItems.map((i) =>
      i.id === id ? { ...i, quantity: clampedQty, updated_at: nowIso } : i
    );

    const newTx: InventoryTransaction = {
      id: toPbId('tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
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

    return commitInventoryChange({
      action: 'INVENTORY_ADJUSTED',
      auditDetails: {
        transaction_id: newTx.id,
        item_id: id,
        item_name: item.item,
        previous_qty: item.quantity,
        new_qty: clampedQty,
        diff,
        reason,
        summary: `Inventory audit adjustment for "${item.item}": ${item.quantity} -> ${clampedQty} ${item.unit} (Reason: ${reason})`,
        timestamp: nowIso,
      },
      newTx,
      nextItems: updatedItems,
      itemUpdate: { id, prevQty: item.quantity, payload: { quantity: clampedQty, updated_at: nowIso } },
    });
  };

  const returnInventoryItem = async (params: {
    itemId: string;
    department: string;
    quantity: number;
    returnedBy: string;
    dateReturned: string;
    remarks?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    if (!hasPermission(currentUser, 'inventory:write')) {
      return { success: false, message: 'Administrator privilege required for inventory return.' };
    }
    const item = inventoryItems.find((i) => i.id === params.itemId);
    if (!item) return { success: false, message: 'Item not found.' };
    if (params.quantity <= 0) return { success: false, message: 'Quantity must be greater than zero.' };

    const nowIso = new Date().toISOString();
    const releasingOfficer =
      currentUser?.full_name || currentUser?.username || 'Authorized Property Officer';
    const nextQty = item.quantity + params.quantity;

    const updatedItems = inventoryItems.map((i) =>
      i.id === item.id ? { ...i, quantity: nextQty, updated_at: nowIso } : i
    );

    const newTx: InventoryTransaction = {
      id: toPbId('tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
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

    return commitInventoryChange({
      action: 'INVENTORY_RETURNED',
      auditDetails: {
        transaction_id: newTx.id,
        item_id: item.id,
        item_name: item.item,
        quantity: params.quantity,
        unit: item.unit,
        department: params.department,
        returned_by: params.returnedBy,
        summary: `Returned supply (+${params.quantity} ${item.unit}) of "${item.item}" from ${params.department} (Returned by: ${params.returnedBy})`,
        timestamp: nowIso,
      },
      newTx,
      nextItems: updatedItems,
      itemUpdate: { id: item.id, prevQty: item.quantity, payload: { quantity: nextQty, updated_at: nowIso } },
    });
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    if (!requirePermission('inventory:write')) return;
    const existing = inventoryItems.find((i) => i.id === id);
    setInventoryItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
      );
      localStorage.setItem('meedo_inventory_items', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      delete payload.id;
      delete payload.created_at;
      (async () => {
        try {
          await client.from('inventory_items').update(payload).eq('id', id);
          addAuditLog('INVENTORY_ITEM_UPDATED', {
            item_id: id,
            item_name: updates.item || existing?.item,
            updated_fields: Object.keys(updates),
            summary: `Updated inventory item details for "${updates.item || existing?.item || id}"`,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Supabase inventory update notice:', e);
        }
      })();
    }
  };

  const deleteInventoryItem = (id: string) => {
    if (!requirePermission('inventory:write')) return;
    const existing = inventoryItems.find((i) => i.id === id);
    setInventoryItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('meedo_inventory_items', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          await client.from('inventory_items').delete().eq('id', id);
          addAuditLog('INVENTORY_ITEM_DELETED', {
            item_id: id,
            item_name: existing?.item || 'Unknown Item',
            summary: `Deleted inventory item: "${existing?.item || id}"`,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Supabase inventory delete notice:', e);
        }
      })();
    }
  };

  const resetInventoryData = () => {
    if (!requirePermission('inventory:write')) return;
    setInventoryItems(initialInventoryItems);
    setInventoryTransactions(initialInventoryTransactions);
    localStorage.setItem('meedo_inventory_items', JSON.stringify(initialInventoryItems));
    localStorage.setItem('meedo_inventory_transactions', JSON.stringify(initialInventoryTransactions));

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          await client.from('inventory_items').upsert(initialInventoryItems);
          await client.from('inventory_transactions').upsert(initialInventoryTransactions);
          addAuditLog('INVENTORY_RESET', {
            summary: `Reset inventory & transaction data to initial baseline by ${currentUser?.username || 'admin'}.`,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Supabase inventory reset notice:', e);
        }
      })();
    }
  };

  return (
    <MeedoContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authLoading,
        firebaseGateState,
        login,
        loginWithEmail,
        loginWithGoogle,
        registerWithEmail,
        completeFirebaseRegistration,
        linkExistingAccount,
        sendPasswordReset,
        resendVerificationEmail,
        retryFirebaseSession,
        logout,
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
        updateCsuReport,
        requestBlotterCorrection,
        approveBlotterReport,
        marketCalendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        checkScheduleConflict,
        activeShiftSession,
        activeShiftSessions,
        getActiveShiftSession,
        startGuardShift,
        logPatrolCheck,
        endGuardShift,
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
        auditLogs,
        addAuditLog,
        isLivePocketBase: isPocketBaseConfigured,
        isLiveSupabase: isPocketBaseConfigured,
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
