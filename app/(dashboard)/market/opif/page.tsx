'use client';

import React, { Suspense } from 'react';
import OpifScorecardView from '@/components/opif/OpifScorecardView';

export default function MarketOpifPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Market OPIF Scorecard...</div>}>
      <OpifScorecardView forcedSection="A" pageTitle="Market Management - OPIF Scorecard" />
    </Suspense>
  );
}
