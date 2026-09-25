'use client';

import React, { Suspense } from 'react';
import OpifScorecardView from '@/components/opif/OpifScorecardView';

export default function TransportOpifPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Transport OPIF Scorecard...</div>}>
      <OpifScorecardView forcedSection="D" pageTitle="Transport Terminal - OPIF Scorecard" />
    </Suspense>
  );
}
