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
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardHome() {
  const {
    currentUser,
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

  return (
    <div className="space-y-6">
      {/* Welcome & Department Clearance Banner (Light Premium) */}
      <div className="bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(37,99,235,0.10)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />
        <div className="p-5 sm:p-7 bg-gradient-to-br from-blue-50/45 via-white to-slate-50/40 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200/90 shadow-xs p-1.5 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon_LGUMalungon/LGU_LOGO1.png"
                alt="Municipality of Malungon Seal"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Municipality of Malungon
              </h2>
              <p className="text-slate-600 text-xs md:text-sm max-w-xl leading-relaxed">
                Municipal Economic Enterprise Development Office • Role-Based Portal
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  RBAC Security Active
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                  {secMeta.badge} {secMeta.shortName}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-6 min-w-[260px] space-y-2 tabular-nums">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-500 font-medium">Active Account:</span>
              <span className="font-bold text-slate-900">
                {currentUser?.full_name || currentUser?.username || 'Guest'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-500 font-medium">Assigned Section:</span>
              <span className="font-semibold text-slate-800">
                {secMeta.name} ({currentSec})
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs pt-1.5 border-t border-slate-200/75">
              <span className="text-slate-500 font-medium">Clearance:</span>
              <span className="font-bold text-emerald-700">
                {isAdmin ? 'Full Unrestricted (ALL)' : `Siloed to Section ${currentSec}`}
              </span>
            </div>
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
