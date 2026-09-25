'use client';

import React, { Suspense } from 'react';
import OpifScorecardView from '@/components/opif/OpifScorecardView';

export default function CemeteryOpifPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Cemetery OPIF Scorecard...</div>}>
      <OpifScorecardView forcedSection="C" pageTitle="Cemetery Management - OPIF Scorecard" />
    </Suspense>
  );
}
