'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMeedo } from '@/lib/store';
import { Building2, ArrowRight, ShieldCheck, Shield } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useMeedo();

  const [username, setUsername] = useState('');
  const [section, setSection] = useState('A');
  const [guardId, setGuardId] = useState('');
  const [fullName, setFullName] = useState('');
  const [rankTitle, setRankTitle] = useState('SO1');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (section === 'F' && !guardId.trim()) {
      setError('Please provide a Guard ID (e.g. G-101) for Market Guard personnel.');
      return;
    }

    const ok = registerUser(
      username,
      section,
      section === 'F' ? guardId.trim().toUpperCase() : undefined,
      section === 'F' ? fullName.trim() : undefined,
      section === 'F' ? rankTitle.trim() : undefined
    );
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/20 font-black text-2xl">
            M
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Departmental Staff Registration • MEEDOSys
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium text-center">
            Registration submitted! Awaiting administrator approval. Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Assigned Department / Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"
            >
              <option value="A">Section A: Market Management</option>
              <option value="B">Section B: Slaughterhouse</option>
              <option value="C">Section C: Cemetery Management</option>
              <option value="D">Section D: Transport Terminal</option>
              <option value="E">Section E: Executive / OPIF</option>
              <option value="F">Section F: Peace & Order (Market Guard)</option>
            </select>
          </div>

          {section === 'F' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Shield className="w-4 h-4 text-blue-600" />
                Market Guard Official Credentials
              </div>
              <p className="text-[11px] text-blue-700/80">
                Your Guard ID links directly to the daily security blotter and enables instant sign-in with your badge number.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                  Guard ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={guardId}
                  onChange={(e) => setGuardId(e.target.value)}
                  placeholder="e.g. G-101, G-107"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold uppercase border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                    Full Name (Officer)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Roberto Alcantara"
                    className="w-full px-3 py-1.5 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                    Rank / Designation
                  </label>
                  <input
                    type="text"
                    value={rankTitle}
                    onChange={(e) => setRankTitle(e.target.value)}
                    placeholder="e.g. SO1, SO2, Team Leader"
                    className="w-full px-3 py-1.5 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            Register Account
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
