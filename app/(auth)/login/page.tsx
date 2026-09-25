'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMeedo } from '@/lib/store';
import { KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useMeedo();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const success = login(username.trim());
      setLoading(false);
      if (success) {
        router.push('/');
      } else {
        setError('Invalid username, Guard ID, or account is pending approval.');
      }
    }, 350);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Top Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex flex-col items-center text-center">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center p-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm mb-3">
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
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white mb-2">
            MEEDOSys Enterprise v2.0 • RBAC Enforced
          </span>
          <h1 className="text-2xl font-black tracking-tight">Municipality of Malungon</h1>
          <p className="text-xs text-blue-100 font-medium mt-1">
            Municipal Economic Enterprise Development Office
          </p>
        </div>

        {/* Content Form */}
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" /> Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your assigned username, personnel credentials, or Guard ID.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
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
                placeholder="e.g. admin or your username"
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
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Strict Departmental Clearance Enforced</span>
            </div>
            <div>
              Need a departmental account?{' '}
              <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
