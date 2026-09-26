'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMeedo } from '@/lib/store';
import { SECTIONS_META } from '@/lib/rbac';
import { UserSection } from '@/lib/types';
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
  Package,
  UserCheck,
  Smartphone,
} from '@/components/icons';
import { usePwa } from '@/components/pwa/PwaProvider';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, isLiveSupabase, switchSectionUser } = useMeedo();
  const { isInstalled, openInstallGuide } = usePwa();

  const [marketOpen, setMarketOpen] = useState(true);
  const [slaughterOpen, setSlaughterOpen] = useState(true);
  const [transportOpen, setTransportOpen] = useState(true);
  const [cemeteryOpen, setCemeteryOpen] = useState(true);

  const role = currentUser?.role;
  const section = currentUser?.section;

  // Role-Based Section Visibility
  const canAccessSection = (sec: string) => {
    if (!currentUser) return false;
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
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center p-1 border border-slate-100 shadow-sm flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://drive.google.com/thumbnail?id=1uiTfp9Sak_EdeurZ20zMm_FttQiKQmTc&sz=w1000"
              alt="Malungon Municipal Logo"
              width={40}
              height={40}
              style={{ maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }}
              className="w-full h-full object-contain logo-blend"
            />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              MEEDO Malungon
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
                  <Link
                    href="/market/opif"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/market/opif') }
                    )}
                  >
                    <BarChart3 className="w-4 h-4 text-blue-500" /> OPIF Scorecard
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Section B: Slaughterhouse */}
          {canAccessSection('B') && (
            <div>
              <button
                onClick={() => setSlaughterOpen(!slaughterOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Beef className="w-4 h-4 text-rose-500" /> Slaughterhouse
                </span>
                <ChevronDown
                  className={cn('w-4 h-4 text-slate-400 transition-transform', {
                    '-rotate-90': !slaughterOpen,
                  })}
                />
              </button>

              {slaughterOpen && (
                <div className="pl-6 pt-1 space-y-1">
                  <Link
                    href="/slaughterhouse"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/slaughterhouse') }
                    )}
                  >
                    Operations &amp; Records
                  </Link>
                  <Link
                    href="/slaughterhouse/butchers"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/slaughterhouse/butchers') }
                    )}
                  >
                    <UserCheck className="w-4 h-4 text-rose-500" /> Butcher Profiles
                  </Link>
                  <Link
                    href="/slaughterhouse/opif"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/slaughterhouse/opif') }
                    )}
                  >
                    <BarChart3 className="w-4 h-4 text-rose-500" /> OPIF Scorecard
                  </Link>
                </div>
              )}
            </div>
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
                  <Link
                    href="/cemetery/opif"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/cemetery/opif') }
                    )}
                  >
                    <BarChart3 className="w-4 h-4 text-purple-500" /> OPIF Scorecard
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
                  <Link
                    href="/transport/opif"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors',
                      { 'bg-blue-50 text-blue-600 font-medium': isActive('/transport/opif') }
                    )}
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-500" /> OPIF Scorecard
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Section F: Peace & Order (Market Guard Desk) */}
          {canAccessSection('F') && (
            <Link
              href="/csu"
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors',
                { 'bg-blue-50 text-blue-600 font-semibold': isActive('/csu') }
              )}
            >
              <ShieldAlert className="w-4 h-4 text-red-600" /> Peace & Order (Market Guard)
            </Link>
          )}

          {/* Admin Management, Central OPIF & Municipal Inventory */}
          {role === 'Admin' && (
            <div className="pt-2 mt-2 border-t border-slate-200/70 space-y-1">
              <div className="px-3 mb-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Administration
              </div>
              <Link
                href="/inventory"
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors',
                  { 'bg-blue-50 text-blue-600 font-semibold': isActive('/inventory') }
                )}
              >
                <Package className="w-4 h-4 text-amber-600" /> Inventory & Supplies
              </Link>
              <Link
                href="/opif"
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors',
                  { 'bg-blue-50 text-blue-600 font-semibold': pathname === '/opif' }
                )}
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" /> Central OPIF (Admin)
              </Link>
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
              <Link
                href="/admin/pwa"
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors',
                  { 'bg-blue-50 text-blue-600 font-semibold': isActive('/admin/pwa') }
                )}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" /> Mobile & PWA Guide
              </Link>
            </div>
          )}
        </nav>

        {/* User Profile & Footer Controls */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-semibold text-xs text-slate-800 truncate">
                {currentUser ? (currentUser.full_name || currentUser.username) : 'Guest User'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium truncate">
                {currentUser?.section && SECTIONS_META[currentUser.section]
                  ? `${SECTIONS_META[currentUser.section].badge} ${SECTIONS_META[currentUser.section].shortName}`
                  : `${role || 'Staff'} • Section ${section || 'N/A'}`}
              </span>
            </div>
            <Badge variant={isLiveSupabase ? 'success' : 'neutral'}>
              {isLiveSupabase ? 'Live' : 'Demo'}
            </Badge>
          </div>

          {/* Quick RBAC Switcher for Fast Testing */}
          <div className="my-2.5 pt-2 border-t border-slate-200/60">
            <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
              Switch Test Section
            </label>
            <select
              value={currentUser?.section || 'ALL'}
              onChange={(e) => {
                const targetSec = e.target.value as UserSection;
                const ok = switchSectionUser(targetSec);
                const meta = SECTIONS_META[targetSec as keyof typeof SECTIONS_META];
                if (ok && meta) {
                  router.push(meta.defaultPath);
                  onClose();
                }
              }}
              className="w-full text-[11px] bg-white border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-slate-300"
            >
              <option value="ALL">👑 Admin (Central OPIF & All Access)</option>
              <option value="A">🏬 Section A • Market Staff</option>
              <option value="B">🥩 Section B • Slaughterhouse</option>
              <option value="C">⚰️ Section C • Cemetery Staff</option>
              <option value="D">🚐 Section D • Transport Staff</option>
              <option value="F">🛡️ Section F • Market Guard</option>
            </select>
          </div>

          {/* In-App PWA Install Trigger when browsing on mobile web */}
          {!isInstalled && (
            <button
              type="button"
              onClick={() => {
                openInstallGuide();
                onClose();
              }}
              className="w-full mb-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600" /> Install Mobile App
            </button>
          )}

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
