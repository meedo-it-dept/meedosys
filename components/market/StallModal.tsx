'use client';

import React from 'react';
import { StallSideViewer } from './StallSideViewer';
import { Stall } from '@/lib/types';

interface StallModalProps {
  stall: Stall | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Backward compatibility wrapper.
 * Forwards legacy StallModal usage to modern slide-over StallSideViewer.
 */
export const StallModal: React.FC<StallModalProps> = (props) => {
  return <StallSideViewer {...props} />;
};

export { StallSideViewer };
