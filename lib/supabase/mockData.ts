// =============================================================================
// MEEDOSys v2.0 - Clean Production Data Schema (Zero Mock Data)
// All mock data removed. All lists initialized empty for live Supabase integration.
// =============================================================================

import {
  Stall,
  ElectricBill,
  SlaughterRecord,
  CemeteryBooking,
  Toda,
  TodaMember,
  OpifIndicator,
  CsuDailyReport,
  UserProfile,
  MarketGuard,
  InventoryItem,
  InventoryTransaction,
  ButcherProfile,
} from '../types';

// Default Primary Administrator
export const initialUsers: UserProfile[] = [
  {
    id: 'user_admin_01',
    username: 'admin',
    role: 'Admin',
    section: 'ALL',
    status: 'Approved',
    full_name: 'Municipal Administrator',
    created_at: new Date().toISOString(),
  },
];

// Helper to define physical municipal stalls (all start Vacant with 0 occupants)
const createStall = (stall_no: string, zone: 'wet' | 'dry' | 'old' | 'triangular'): Stall => ({
  stall_no,
  zone,
  status: 'Vacant',
  current_tenant: null,
});

// Full physical stall directory matching the Malungon Public Market layout
export const initialStalls: Stall[] = [
  // --- WET SECTION ---
  // Section G
  createStall('G-01-B', 'wet'),
  createStall('G-01-A', 'wet'),
  createStall('G-02', 'wet'),
  createStall('G-10', 'wet'),
  createStall('G-03', 'wet'),
  createStall('G-11', 'wet'),
  createStall('G-04', 'wet'),
  createStall('G-12', 'wet'),
  createStall('G-05', 'wet'),
  createStall('G-13', 'wet'),
  createStall('G-06', 'wet'),
  createStall('G-14', 'wet'),
  createStall('G-07', 'wet'),
  createStall('G-15', 'wet'),
  createStall('G-08', 'wet'),
  createStall('G-16', 'wet'),
  createStall('G-09', 'wet'),
  createStall('G-17', 'wet'),

  // Section B & I
  createStall('B-01-A', 'wet'),
  createStall('B-01-B', 'wet'),
  createStall('B-02', 'wet'),
  createStall('B-06', 'wet'),
  createStall('B-03', 'wet'),
  createStall('B-07', 'wet'),
  createStall('B-04', 'wet'),
  createStall('B-08', 'wet'),
  createStall('B-05', 'wet'),
  createStall('B-09', 'wet'),
  createStall('I-01', 'wet'),
  createStall('I-05', 'wet'),
  createStall('I-02', 'wet'),
  createStall('I-06', 'wet'),
  createStall('I-03', 'wet'),
  createStall('I-07', 'wet'),
  createStall('I-04', 'wet'),
  createStall('I-08', 'wet'),

  // Section A & C
  createStall('A-01-A', 'wet'),
  createStall('A-01-B', 'wet'),
  createStall('A-02', 'wet'),
  createStall('A-06', 'wet'),
  createStall('A-03', 'wet'),
  createStall('A-07', 'wet'),
  createStall('A-04', 'wet'),
  createStall('A-08', 'wet'),
  createStall('A-05', 'wet'),
  createStall('A-09', 'wet'),
  createStall('C-01', 'wet'),
  createStall('C-05', 'wet'),
  createStall('C-02', 'wet'),
  createStall('C-06', 'wet'),
  createStall('C-03', 'wet'),
  createStall('C-07', 'wet'),
  createStall('C-04', 'wet'),
  createStall('C-08', 'wet'),

  // Special bottom stalls & Utilities
  createStall('LAND-BANK', 'wet'),
  createStall('MEEDO', 'wet'),
  createStall('E-08', 'wet'),
  createStall('E-09', 'wet'),

  // EF Grid
  createStall('E-01', 'wet'),
  createStall('F-01', 'wet'),
  createStall('E-02', 'wet'),
  createStall('F-02', 'wet'),
  createStall('E-03', 'wet'),
  createStall('F-03', 'wet'),
  createStall('E-04', 'wet'),
  createStall('F-04', 'wet'),
  createStall('E-05', 'wet'),
  createStall('F-05', 'wet'),
  createStall('E-06', 'wet'),
  createStall('F-06', 'wet'),
  createStall('E-07', 'wet'),
  createStall('F-07', 'wet'),

  // --- DRY GOODS SECTION ---
  // Second Floor Wings (D-01 to D-19)
  ...['D-19','D-18','D-17','D-16','D-15','D-14','D-13','D-12','D-11','D-10','D-09','D-08','D-07','D-06','D-05','D-04','D-03','D-02','D-01'].map(id =>
    createStall(id, 'dry')
  ),
  // First Floor Wings (J-01 to J-08 and L-01 to L-09)
  ...['J-08','J-07','J-06','J-05','J-04','J-03','J-02','J-01'].map(id =>
    createStall(id, 'dry')
  ),
  ...['L-09','L-08','L-07','L-06','L-05','L-04','L-03','L-02','L-01'].map(id =>
    createStall(id, 'dry')
  ),

  // --- OLD BUILDING ---
  // Food Terminal (HE-1 to HE-8)
  ...['HE-1','HE-2','HE-3','HE-4','HE-5','HE-6','HE-7','HE-8'].map(id =>
    createStall(id, 'old')
  ),
  // Middle Complex (HE-9 to HE-22)
  ...['HE-9','HE-10','HE-11','HE-12','HE-13','HE-14','HE-15','HE-16','HE-17','HE-18','HE-19','HE-20','HE-21','HE-22'].map(id =>
    createStall(id, 'old')
  ),
  // High End 2nd Floor
  ...['F-10-HE', 'F-09-HE', 'F-08-HE', 'F-07-HE', 'F-06-HE', 'F-05-HE', 'F-01-HE', 'F-02-HE', 'F-03-04-HE'].map(id =>
    createStall(id, 'old')
  ),
  // High End 1st Floor
  ...['F1-08-HE', 'F1-05-HE', 'F1-07-HE', 'F1-04-HE', 'F1-06-HE', 'F1-01-HE', 'F1-03-HE', 'F1-02-HE'].map(id =>
    createStall(id, 'old')
  ),

  // --- TRIANGULAR AREA ---
  // K-group
  ...['K-01', 'K-02', 'K-03', 'K-04', 'K-05', 'K-06-07', 'K-08', 'K-09', 'K-10', 'K-11', 'K-12'].map(id =>
    createStall(id, 'triangular')
  ),
  // Diagonal Staircase (D-20 to D-31)
  ...['D-31', 'D-30', 'D-28-29', 'D-27', 'D-26', 'D-25', 'D-24', 'D-23', 'D-22', 'D-21', 'D-20'].map(id =>
    createStall(id, 'triangular')
  ),
  // Bottom Row (H-01 to H-15)
  ...['H-01', 'H-02-03', 'H-04-05', 'H-06', 'H-07', 'H-08-09', 'H-10-11', 'H-12-13', 'H-14-15'].map(id =>
    createStall(id, 'triangular')
  ),
];

// All data lists initialized completely empty for real municipal records
export const initialElectricBills: ElectricBill[] = [];

export const initialButchers: ButcherProfile[] = [];

export const initialSlaughterRecords: SlaughterRecord[] = [];

export const initialCemeteryBookings: CemeteryBooking[] = [];

export const initialTodas: Toda[] = [];

export const initialTodaMembers: TodaMember[] = [];

export const initialOpifIndicators: OpifIndicator[] = [];

export const initialCsuReports: CsuDailyReport[] = [];

export const initialMarketGuards: MarketGuard[] = [];

export const initialInventoryItems: InventoryItem[] = [];

export const initialInventoryTransactions: InventoryTransaction[] = [];
