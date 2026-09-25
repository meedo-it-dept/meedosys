'use client';

import React, { Suspense } from 'react';
import OpifScorecardView from '@/components/opif/OpifScorecardView';

export default function CentralOpifPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading OPIF Framework...</div>}>
      <OpifScorecardView />
    </Suspense>
  );
}
