'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMeedo } from '@/lib/store';
import {
  Store,
  MapPin,
  CalendarCheck,
  Zap,
  LineChart,
  Beef,
  CalendarDays,
  Bus,
  Users,
  BarChart3,
  FileSignature,
  ShieldAlert,
  UsersRound,
  ChevronDown,
  LogOut,
  RefreshCw,
  Building2,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { currentUser, logout, isLiveSupabase } = useMeedo();

  const [marketOpen, setMarketOpen] = useState(true);
  const [transportOpen, setTransportOpen] = useState(true);
  const [cemeteryOpen, setCemeteryOpen] = useState(true);

  const role = currentUser?.role || 'Admin';
  const section = currentUser?.section || 'ALL';

  // Role-Based Section Visibility
  const canAccessSection = (sec: string) => {
    if (role === 'Admin' || section === 'ALL') return true;
    return section === sec;
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              MEEDO Malungon
            </h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enterprise Office
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 text-sm">
          {/* Section A: Market Management */}
          {canAccessSection('A') && (
            <div>
              <button
                onClick={() => setMarketOpen(!marketOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-blue-600" /> Market Management
                </span>
                <ChevronDown
                  className={cn('w-4 h-4 text-slate-400 transition-transform', {
                    '-rotate-90': !marketOpen,
                  })}
                />
              </button>

              {marketOpen && (
                <div className="pl-6 pt-1 space-y-1">
                  <Link
                    href="/market/map"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/market/map') }
                    )}
                  >
                    <MapPin className="w-4 h-4" /> Market Map
                  </Link>
                  <Link
                    href="/market/monitoring"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/market/monitoring') }
                    )}
                  >
                    <CalendarCheck className="w-4 h-4" /> Monthly Monitoring
                  </Link>
                  <Link
                    href="/market/billing"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/market/billing') }
                    )}
                  >
                    <Zap className="w-4 h-4 text-amber-500" /> Electric Bills
                  </Link>
                  <Link
                    href="/market/reports"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/market/reports') }
                    )}
                  >
                    <LineChart className="w-4 h-4" /> Reports & CSV
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Section B: Slaughterhouse */}
          {canAccessSection('B') && (
            <Link
              href="/slaughterhouse"
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors',
                { 'bg-blue-50 text-blue-600 font-semibold': isActive('/slaughterhouse') }
              )}
            >
              <Beef className="w-4 h-4 text-rose-500" /> Slaughterhouse
            </Link>
          )}

          {/* Section C: Cemetery Management */}
          {canAccessSection('C') && (
            <div>
              <button
                onClick={() => setCemeteryOpen(!cemeteryOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-purple-500" /> Cemetery Management
                </span>
                <ChevronDown
                  className={cn('w-4 h-4 text-slate-400 transition-transform', {
                    '-rotate-90': !cemeteryOpen,
                  })}
                />
              </button>

              {cemeteryOpen && (
                <div className="pl-6 pt-1 space-y-1">
                  <Link
                    href="/cemetery/bookings"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/cemetery/bookings') }
                    )}
                  >
                    Burial Schedule
                  </Link>
                  <Link
                    href="/cemetery/reports"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/cemetery/reports') }
                    )}
                  >
                    Monthly Reports
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Section D: Transport Terminal */}
          {canAccessSection('D') && (
            <div>
              <button
                onClick={() => setTransportOpen(!transportOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Bus className="w-4 h-4 text-emerald-500" /> Transport Terminal
                </span>
                <ChevronDown
                  className={cn('w-4 h-4 text-slate-400 transition-transform', {
                    '-rotate-90': !transportOpen,
                  })}
                />
              </button>

              {transportOpen && (
                <div className="pl-6 pt-1 space-y-1">
                  <Link
                    href="/transport/todas"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/transport/todas') }
                    )}
                  >
                    List of TODA
                  </Link>
                  <Link
                    href="/transport/members"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/transport/members') }
                    )}
                  >
                    Driver Members Profile
                  </Link>
                  <Link
                    href="/transport/reports"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/transport/reports') }
                    )}
                  >
                    Demographic Reports
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Section E: OPIF Scorecard (All Enterprise Divisions) */}
          <Link
            href="/opif"
            onClick={onClose}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors',
              { 'bg-blue-50 text-blue-600 font-semibold': isActive('/opif') }
            )}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" /> OPIF Scorecard
          </Link>

          {/* Section F: Peace & Order (CSU Desk) */}
          {canAccessSection('F') && (
            <Link
              href="/csu"
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors',
                { 'bg-blue-50 text-blue-600 font-semibold': isActive('/csu') }
              )}
            >
              <ShieldAlert className="w-4 h-4 text-red-600" /> Peace & Order (CSU)
            </Link>
          )}

          {/* User Management (Admin Only) */}
          {role === 'Admin' && (
            <Link
              href="/admin/users"
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors',
                { 'bg-blue-50 text-blue-600 font-semibold': isActive('/admin/users') }
              )}
            >
              <UsersRound className="w-4 h-4 text-purple-600" /> User Management
            </Link>
          )}
        </nav>

        {/* User Profile & Footer Controls */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-slate-800">
                {currentUser ? currentUser.username : 'Guest User'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {role} • Section {section}
              </span>
            </div>
            <Badge variant={isLiveSupabase ? 'success' : 'neutral'}>
              {isLiveSupabase ? 'Supabase Live' : 'Demo Local'}
            </Badge>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};
