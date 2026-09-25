'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useMeedo } from '@/lib/store';
import { checkRouteAccess, SECTIONS_META } from '@/lib/rbac';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Home,
  LogOut,
  Building2,
  UserCheck,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, authLoading, logout, switchSectionUser } = useMeedo();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Authentication check: redirect to /login if unauthenticated after state loaded
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  // Loading state while restoring auth from localStorage
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">MEEDOSys Enterprise</h3>
          <p className="text-xs text-slate-500 font-medium">Verifying Department Credentials...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return null;
  }

  // Validate route access according to RBAC rules
  const access = checkRouteAccess(currentUser, pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {access.allowed ? (
            children
          ) : (
            /* Access Denied / RBAC Silo Barrier */
            <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
              <Card className="border-rose-200 bg-white shadow-lg overflow-hidden p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="danger" className="text-[10px]">
                        Access Restricted
                      </Badge>
                      <span className="text-xs font-mono text-slate-400">{pathname}</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Departmental Access Siloed
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {access.reason}
                    </p>
                  </div>
                </div>

                {/* Account vs Required Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-6 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Your Signed-In Account
                    </span>
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      {currentUser.full_name || currentUser.username}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Role: <strong className="text-slate-700">{currentUser.role}</strong> • Section: <strong className="text-slate-700">{currentUser.section} ({SECTIONS_META[currentUser.section]?.shortName || currentUser.section})</strong>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                      Required Clearance
                    </span>
                    <p className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      {access.requiredRole === 'Admin'
                        ? 'Administrator Privilege'
                        : access.requiredSection
                        ? SECTIONS_META[access.requiredSection]?.name
                        : 'Authorized Section'}
                    </p>
                    <p className="text-amber-800/80 text-[11px] mt-0.5">
                      Strict departmental data separation enforced by Municipal Enterprise mandate.
                    </p>
                  </div>
                </div>

                {/* Resolution Navigation Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Link href={SECTIONS_META[currentUser.section]?.defaultPath || '/'}>
                      <Button variant="primary" size="sm">
                        <ArrowRight className="w-4 h-4 mr-1.5" />
                        Go to My Assigned Section ({SECTIONS_META[currentUser.section]?.shortName || 'Home'})
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="outline" size="sm">
                        <Home className="w-4 h-4 mr-1.5" /> Dashboard Home
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSwitchModal(true)}
                      className="text-blue-700 hover:bg-blue-50 text-xs font-semibold"
                    >
                      <Building2 className="w-4 h-4 mr-1" /> Switch Section
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={logout}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs font-semibold"
                    >
                      <LogOut className="w-4 h-4 mr-1" /> Logout
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Switch Section Modal for Testing */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" /> Switch Section (RBAC Testing)
                </h3>
                <p className="text-xs text-slate-500">
                  Select a section to instantly switch active credentials and verify role-based permissions:
                </p>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              {(
                [
                  { code: 'ALL', label: '👑 Administrator (Central OPIF & All Sections)', username: 'admin', path: '/' },
                  { code: 'A', label: '🏬 Section A: Market Management', username: 'market_staff', path: '/market/map' },
                  { code: 'B', label: '🥩 Section B: Slaughterhouse', username: 'slaughter_staff', path: '/slaughterhouse' },
                  { code: 'C', label: '⚰️ Section C: Cemetery Management', username: 'cemetery_staff', path: '/cemetery/bookings' },
                  { code: 'D', label: '🚐 Section D: Transport Terminal', username: 'transport_staff', path: '/transport/todas' },
                  { code: 'F', label: '🛡️ Section F: Market Guard', username: 'guard_market', path: '/csu' },
                ] as const
              ).map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    switchSectionUser(item.code as any);
                    setShowSwitchModal(false);
                    router.push(item.path);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    currentUser.section === item.code
                      ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-950 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[11px] text-slate-500 font-mono">User: {item.username}</div>
                  </div>
                  {currentUser.section === item.code && (
                    <Badge variant="success" className="text-[10px]">
                      Active
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowSwitchModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
