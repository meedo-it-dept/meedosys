'use client';

import React, { Suspense } from 'react';
import OpifScorecardView from '@/components/opif/OpifScorecardView';

export default function SlaughterhouseOpifPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Slaughterhouse OPIF Scorecard...</div>}>
      <OpifScorecardView forcedSection="B" pageTitle="Slaughterhouse Management - OPIF Scorecard" />
    </Suspense>
  );
}
