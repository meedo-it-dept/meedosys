'use client';

import React from 'react';
import { StallGrid } from '@/components/market/StallGrid';

export default function MarketMapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Market Layout & Tenancy</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Visual stall assignment and digital contract management across all 4 market zones.
        </p>
      </div>

      <StallGrid />
    </div>
  );
}
