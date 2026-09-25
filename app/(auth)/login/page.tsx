'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMeedo } from '@/lib/store';
import { Store, ShieldCheck, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    username: 'admin',
    label: 'Municipal Administrator (Superuser)',
    badge: '👑 ALL SECTIONS',
    desc: 'Unrestricted municipal access across all 6 enterprise sections & User Management',
    border: 'border-purple-200 hover:border-purple-500 hover:bg-purple-50/40',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useMeedo();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuickUser, setActiveQuickUser] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const success = login(username);
      setLoading(false);
      if (success) {
        router.push('/');
      } else {
        setError('Invalid username, Guard ID, or account is pending approval.');
      }
    }, 350);
  };

  const handleQuickLogin = (uname: string) => {
    setUsername(uname);
    setPassword('demo123');
    setError('');
    setActiveQuickUser(uname);
    setLoading(true);

    setTimeout(() => {
      const success = login(uname);
      setLoading(false);
      setActiveQuickUser(null);
      if (success) {
        router.push('/');
      } else {
        setError(`Failed to sign in as ${uname}.`);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Top Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center p-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://drive.google.com/thumbnail?id=1pd-9dhfan3PD5325kYwZGudUcEgVtKnu&sz=w1000"
                alt="MEEDO Market Logo"
                width={56}
                height={56}
                style={{ maxWidth: '56px', maxHeight: '56px', objectFit: 'contain' }}
                className="w-full h-full object-contain brightness-110 drop-shadow"
              />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white mb-1">
                MEEDOSys Enterprise v2.0 • RBAC Enforced
              </span>
              <h1 className="text-2xl font-black tracking-tight">Municipality of Malungon</h1>
              <p className="text-xs text-blue-100 font-medium">
                Municipal Economic Enterprise Development Office • Role-Based Authentication
              </p>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end text-xs text-blue-100">
            <span className="font-semibold text-white">6 Municipal Enterprise Sections</span>
            <span>Strict Departmental Clearance</span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-8">
          {/* Left Column: Traditional Form */}
          <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
            <div>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" /> Sign In to Your Account
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your assigned username, personnel ID, or Guard ID.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username or Guard ID
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g. admin, market_staff, or G-101"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && !activeQuickUser ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <p className="text-[11px] text-slate-400">
                Market Guards can sign in directly using Guard ID{' '}
                <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  G-101
                </span>{' '}
                or username{' '}
                <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  guard_market
                </span>
              </p>
              <div>
                Need a departmental account?{' '}
                <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                  Register here
                </Link>
              </div>
            </div>
          </div>

            {/* Right Column: Administrator Quick Sign-In */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Administrator Quick Sign-In
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sign in with the default Municipal Administrator credentials or use registered credentials on the left:
                  </p>
                </div>
              </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = activeQuickUser === acc.username;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickLogin(acc.username)}
                    disabled={loading}
                    className={`w-full text-left p-3 rounded-xl border bg-white transition-all group relative flex items-start justify-between gap-3 ${acc.border} ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${acc.badgeClass}`}
                        >
                          {acc.badge}
                        </span>
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {acc.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {acc.desc}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>
                          user: <strong className="text-slate-600">{acc.username}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center pt-1">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center gap-1">
                        {isSelected ? 'Signing in...' : 'Sign In'}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
