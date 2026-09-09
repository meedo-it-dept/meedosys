'use client';

import React from 'react';
import Link from 'next/link';
import { useMeedo } from '@/lib/store';
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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardHome() {
  const { currentUser, stalls, electricBills, slaughterRecords, cemeteryBookings, todas } = useMeedo();

  const occupiedStalls = stalls.filter((s) => s.status === 'Occupied').length;
  const occupancyRate = stalls.length ? Math.round((occupiedStalls / stalls.length) * 100) : 0;
  const totalUnpaidBills = electricBills.filter((b) => b.status === 'Unpaid').length;

  const modules = [
    {
      title: 'Market Stalls & Tenancy',
      section: 'Section A',
      desc: `${occupiedStalls} / ${stalls.length} Stalls Occupied (${occupancyRate}%)`,
      icon: Store,
      color: 'text-blue-600 bg-blue-50',
      href: '/market/map',
    },
    {
      title: 'Electric Utility Billing',
      section: 'Section A',
      desc: `${totalUnpaidBills} Pending utility collections`,
      icon: Zap,
      color: 'text-amber-500 bg-amber-50',
      href: '/market/billing',
    },
    {
      title: 'Slaughterhouse Mgt.',
      section: 'Section B',
      desc: `${slaughterRecords.length} Livestock transactions recorded`,
      icon: Beef,
      color: 'text-rose-500 bg-rose-50',
      href: '/slaughterhouse',
    },
    {
      title: 'Cemetery Management',
      section: 'Section C',
      desc: `${cemeteryBookings.length} Scheduled burial plots`,
      icon: CalendarDays,
      color: 'text-purple-500 bg-purple-50',
      href: '/cemetery/bookings',
    },
    {
      title: 'Transport Terminal',
      section: 'Section D',
      desc: `${todas.length} Registered TODA associations`,
      icon: Bus,
      color: 'text-emerald-500 bg-emerald-50',
      href: '/transport/todas',
    },
    {
      title: 'OPIF Performance Scorecard',
      section: 'Section E',
      desc: 'Annual targets vs actual municipal delivery',
      icon: BarChart3,
      color: 'text-indigo-600 bg-indigo-50',
      href: '/opif',
    },
    {
      title: 'Peace & Order (CSU Desk)',
      section: 'Section F',
      desc: 'Digital daily guard shift reports & blotter',
      icon: ShieldAlert,
      color: 'text-red-600 bg-red-50',
      href: '/csu',
    },
    {
      title: 'User Management',
      section: 'Admin',
      desc: 'Manage departmental roles and approvals',
      icon: UsersRound,
      color: 'text-slate-600 bg-slate-100',
      href: '/admin/users',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
              MEEDOSys Enterprise v2.0
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Municipality of Malungon
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Municipal Economic Enterprise Development Office • Modern Cloud Management System
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 px-3 py-1.5 rounded-lg font-medium">
              Signed in as: <strong className="text-white">{currentUser?.username || 'Admin'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Enterprise Division Cards */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Enterprise Divisions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.title} href={m.href}>
                <Card className="hover:border-blue-500 hover:shadow-md transition-all group h-full flex flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="neutral">{m.section}</Badge>
                    </div>
                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-base">
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                  </div>
                  <div className="pt-4 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                    Launch Module <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
