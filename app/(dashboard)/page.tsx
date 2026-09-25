'use client';

import React from 'react';
import Link from 'next/link';
import { useMeedo } from '@/lib/store';
import { checkRouteAccess, SECTIONS_META } from '@/lib/rbac';
import { UserSection } from '@/lib/types';
import {
  Store,
  Zap,
  Beef,
  CalendarDays,
  Bus,
  BarChart3,
  ShieldAlert,
  UsersRound,
  ArrowRight,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardHome() {
  const {
    currentUser,
    switchSectionUser,
    stalls,
    electricBills,
    slaughterRecords,
    cemeteryBookings,
    todas,
    inventoryItems,
  } = useMeedo();

  const occupiedStalls = stalls.filter((s) => s.status === 'Occupied').length;
  const occupancyRate = stalls.length ? Math.round((occupiedStalls / stalls.length) * 100) : 0;
  const totalUnpaidBills = electricBills.filter((b) => b.status === 'Unpaid').length;

  const currentSec = currentUser?.section || 'A';
  const secMeta = SECTIONS_META[currentSec] || SECTIONS_META['A'];
  const isAdmin = currentUser?.role === 'Admin' || currentSec === 'ALL';

  const modules = [
    {
      title: 'Market Stalls & Tenancy',
      sectionCode: 'A' as UserSection,
      section: 'Section A',
      desc: `${occupiedStalls} / ${stalls.length} Stalls Occupied (${occupancyRate}%)`,
      icon: Store,
      color: 'text-blue-600 bg-blue-50',
      href: '/market/map',
    },
    {
      title: 'Electric Utility Billing',
      sectionCode: 'A' as UserSection,
      section: 'Section A',
      desc: `${totalUnpaidBills} Pending utility collections`,
      icon: Zap,
      color: 'text-amber-500 bg-amber-50',
      href: '/market/billing',
    },
    {
      title: 'Slaughterhouse Mgt.',
      sectionCode: 'B' as UserSection,
      section: 'Section B',
      desc: `${slaughterRecords.length} Livestock transactions recorded`,
      icon: Beef,
      color: 'text-rose-500 bg-rose-50',
      href: '/slaughterhouse',
    },
    {
      title: 'Cemetery Management',
      sectionCode: 'C' as UserSection,
      section: 'Section C',
      desc: `${cemeteryBookings.length} Scheduled burial plots`,
      icon: CalendarDays,
      color: 'text-purple-500 bg-purple-50',
      href: '/cemetery/bookings',
    },
    {
      title: 'Transport Terminal',
      sectionCode: 'D' as UserSection,
      section: 'Section D',
      desc: `${todas.length} Registered TODA associations`,
      icon: Bus,
      color: 'text-emerald-500 bg-emerald-50',
      href: '/transport/todas',
    },
    {
      title: 'Central OPIF Master',
      sectionCode: 'ALL' as UserSection,
      section: 'Admin',
      desc: 'Master municipal framework & Section E: Admin Services',
      icon: BarChart3,
      color: 'text-indigo-600 bg-indigo-50',
      href: '/opif',
    },
    {
      title: 'Peace & Order (Market Guard)',
      sectionCode: 'F' as UserSection,
      section: 'Section F',
      desc: 'Digital daily guard shift reports & security blotter',
      icon: ShieldAlert,
      color: 'text-red-600 bg-red-50',
      href: '/csu',
    },
    {
      title: 'User Management',
      sectionCode: 'ALL' as UserSection,
      section: 'Admin',
      desc: 'Manage departmental roles and approvals',
      icon: UsersRound,
      color: 'text-slate-600 bg-slate-100',
      href: '/admin/users',
    },
    {
      title: 'Inventory & Supplies',
      sectionCode: 'ALL' as UserSection,
      section: 'Admin',
      desc: `${inventoryItems.length} Registered supplies catalog & requisitions`,
      icon: Package,
      color: 'text-amber-600 bg-amber-50',
      href: '/inventory',
    },
  ];

  const quickSections: { code: UserSection; label: string; icon: string }[] = [
    { code: 'ALL', label: 'Admin (All)', icon: '👑' },
    { code: 'A', label: 'A: Market', icon: '🏬' },
    { code: 'B', label: 'B: Slaughterhouse', icon: '🥩' },
    { code: 'C', label: 'C: Cemetery', icon: '⚰️' },
    { code: 'D', label: 'D: Transport', icon: '🚐' },
    { code: 'F', label: 'F: Market Guard', icon: '🛡️' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Department Clearance Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                RBAC Security Active
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm">
                {secMeta.badge} {secMeta.shortName}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Municipality of Malungon
            </h2>
            <p className="text-blue-100 text-xs md:text-sm max-w-xl leading-relaxed">
              Municipal Economic Enterprise Development Office • Role-Based Portal
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[260px] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-100 font-medium">Active Account:</span>
              <span className="font-bold text-white">
                {currentUser?.full_name || currentUser?.username || 'Guest'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-100 font-medium">Assigned Section:</span>
              <span className="font-semibold text-white">
                {secMeta.name} ({currentSec})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/15">
              <span className="text-blue-100 font-medium">Clearance:</span>
              <span className="font-bold text-emerald-300">
                {isAdmin ? 'Full Unrestricted (ALL)' : `Siloed to Section ${currentSec}`}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Section Switcher Bar for Seamless RBAC Testing */}
        <div className="mt-6 pt-5 border-t border-white/20 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-blue-100 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Switch Section Persona (Testing):</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {quickSections.map((s) => {
              const isActive = (currentUser?.section || 'A') === s.code;
              return (
                <button
                  key={s.code}
                  onClick={() => switchSectionUser(s.code)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-white text-blue-800 font-bold shadow-sm ring-2 ring-blue-300'
                      : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enterprise Division Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Enterprise Divisions</h3>
            <p className="text-xs text-slate-500">
              Only modules corresponding to your assigned section are accessible. Other sections will trigger the RBAC departmental barrier.
            </p>
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            Showing {modules.length} Municipal Modules
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            const access = checkRouteAccess(currentUser, m.href);
            const isAllowed = access.allowed;

            return (
              <Link key={m.title} href={m.href}>
                <Card
                  className={`transition-all group h-full flex flex-col justify-between p-5 relative overflow-hidden ${
                    isAllowed
                      ? 'hover:border-blue-500 hover:shadow-md border-slate-200 bg-white'
                      : 'border-slate-200/90 bg-slate-50/60 hover:border-amber-400 hover:bg-amber-50/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isAllowed ? m.color : 'text-slate-400 bg-slate-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isAllowed ? (
                        <Badge variant="success" className="gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> {m.section}
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="gap-1 text-[11px] bg-amber-50 text-amber-700 border-amber-200">
                          <Lock className="w-3 h-3" /> Siloed
                        </Badge>
                      )}
                    </div>

                    <h4
                      className={`font-semibold text-base transition-colors ${
                        isAllowed
                          ? 'text-slate-900 group-hover:text-blue-600'
                          : 'text-slate-700 group-hover:text-amber-700'
                      }`}
                    >
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-3 flex items-center justify-between text-xs font-semibold">
                    {isAllowed ? (
                      <span className="text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Launch Module <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Access Siloed (Test Barrier)
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
