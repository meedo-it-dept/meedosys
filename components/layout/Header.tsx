'use client';

import React from 'react';
import { Menu, RefreshCw } from '@/components/icons';
import { useMeedo } from '@/lib/store';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { currentUser } = useMeedo();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 lg:hidden no-print">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center">
        <span className="text-sm font-bold text-slate-800">MEEDOSys v2.0</span>
        <span className="text-[10px] text-slate-500 font-medium">Municipality of Malungon</span>
      </div>

      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
        {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
      </div>
    </header>
  );
};
