'use client';

import React from 'react';
import { Menu, Smartphone, LogOut } from '@/components/icons';
import { useMeedo } from '@/lib/store';
import { usePwa } from '@/components/pwa/PwaProvider';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { currentUser, logout } = useMeedo();
  const { isInstalled, openInstallGuide } = usePwa();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 lg:hidden no-print">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Open Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center">
        <span className="text-sm font-bold text-slate-800">MEEDOSys v2.0</span>
        <span className="text-[10px] text-slate-500 font-medium">Municipality of Malungon</span>
      </div>

      <div className="flex items-center gap-2">
        {!isInstalled && (
          <button
            onClick={openInstallGuide}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-bold text-[11px] transition-colors shadow-2xs"
            title="Install MEEDOSys Mobile App"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">App</span>
          </button>
        )}

        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0" title={currentUser?.full_name || currentUser?.username}>
          {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
        </div>

        <button
          onClick={logout}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Log Out"
          aria-label="Log Out"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
        </button>
      </div>
    </header>
  );
};
