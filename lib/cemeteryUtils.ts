import { CemeteryBooking } from './types';

export const MAX_APARTMENT_CAPACITY = 624;

export const CEMETERY_BASELINE: Record<number, { apartment: number; ground: number }> = {
  2023: { apartment: 25, ground: 12 },
  2024: { apartment: 63, ground: 4 },
  2025: { apartment: 62, ground: 9 },
  2026: { apartment: 21, ground: 3 },
};

export interface CemeteryInventoryResult {
  yearly: Record<number, { apartment: number; ground: number }>;
  maxApartmentCapacity: number;
  totalApartment: number;
  totalGround: number;
  availableApartment: number;
  occupancyPercent: string;
  grandTotal: number;
}

export function calculateCemeteryInventory(bookings: CemeteryBooking[]): CemeteryInventoryResult {
  // Clone baseline
  const yearly: Record<number, { apartment: number; ground: number }> = {};
  for (let y = 2023; y <= 2026; y++) {
    yearly[y] = { ...CEMETERY_BASELINE[y] };
  }

  // Add dynamic records
  (bookings || []).forEach((c) => {
    if (!c.burial_date) return;
    let yr = 2026;
    const dateMatch = String(c.burial_date).match(/^(\d{4})/);
    if (dateMatch) {
      yr = parseInt(dateMatch[1], 10);
    } else {
      const d = new Date(c.burial_date);
      if (!isNaN(d.getFullYear())) yr = d.getFullYear();
    }

    if (!yearly[yr]) {
      yearly[yr] = { apartment: 0, ground: 0 };
    }

    const bType = String(c.burial_type || '').trim().toLowerCase();
    if (bType.includes('apartment')) {
      yearly[yr].apartment++;
    } else if (bType.includes('ground') || bType.includes('tomb')) {
      yearly[yr].ground++;
    }
  });

  let totalApartment = 0;
  let totalGround = 0;
  Object.keys(yearly)
    .sort()
    .forEach((yrStr) => {
      const yr = Number(yrStr);
      totalApartment += yearly[yr].apartment;
      totalGround += yearly[yr].ground;
    });

  const availableApartment = Math.max(0, MAX_APARTMENT_CAPACITY - totalApartment);
  const occupancyPercent = ((totalApartment / MAX_APARTMENT_CAPACITY) * 100).toFixed(1);

  return {
    yearly,
    maxApartmentCapacity: MAX_APARTMENT_CAPACITY,
    totalApartment,
    totalGround,
    availableApartment,
    occupancyPercent,
    grandTotal: totalApartment + totalGround,
  };
}
