'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMeedo } from '@/lib/store';
import { isApprovedUser } from '@/lib/rbac';
import {
  Building2,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  LogOut,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const {
    currentUser,
    authLoading,
    firebaseGateState,
    registerWithEmail,
    completeFirebaseRegistration,
    loginWithGoogle,
    logout,
  } = useMeedo();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [section, setSection] = useState('A');
  const [guardId, setGuardId] = useState('');
  const [rankTitle, setRankTitle] = useState('SO1');
  const [radioCallSign, setRadioCallSign] = useState('');
  const [defaultArea, setDefaultArea] = useState('General Public Market');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isFirebaseProfileCompletion = firebaseGateState?.mode === 'PROFILE_REQUIRED';

  useEffect(() => {
    if (!authLoading && isApprovedUser(currentUser)) {
      router.push('/');
    }
  }, [authLoading, currentUser, router]);

  useEffect(() => {
    if (isFirebaseProfileCompletion) {
      if (firebaseGateState?.email && !email) setEmail(firebaseGateState.email);
      if (firebaseGateState?.displayName && !fullName) setFullName(firebaseGateState.displayName);
      if (firebaseGateState?.email && !username) {
        const localPart = firebaseGateState.email.split('@')[0]?.replace(/[^a-zA-Z0-9_.-]/g, '') || '';
        setUsername(localPart);
      }
    }
  }, [isFirebaseProfileCompletion, firebaseGateState?.email, firebaseGateState?.displayName]);

  const handleGoogleQuickSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        router.push('/');
      } else if (res.code && res.code !== 'PROFILE_REQUIRED') {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFirebaseProfileCompletion) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    if (section === 'F' && !guardId.trim()) {
      setError('Please provide a Guard ID (e.g. G-101) for Market Guard personnel.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = isFirebaseProfileCompletion
        ? await completeFirebaseRegistration({
            username,
            fullName: fullName.trim() || username.trim(),
            section,
            guardId: section === 'F' ? guardId.trim().toUpperCase() : undefined,
            rankTitle: section === 'F' ? rankTitle.trim() : undefined,
            radioCallSign: section === 'F' ? radioCallSign.trim().toUpperCase() : undefined,
            defaultArea: section === 'F' ? defaultArea.trim() : undefined,
          })
        : await registerWithEmail({
            email: email.trim(),
            password,
            username,
            fullName: fullName.trim() || username.trim(),
            section,
            guardId: section === 'F' ? guardId.trim().toUpperCase() : undefined,
            rankTitle: section === 'F' ? rankTitle.trim() : undefined,
            radioCallSign: section === 'F' ? radioCallSign.trim().toUpperCase() : undefined,
            defaultArea: section === 'F' ? defaultArea.trim() : undefined,
          });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 1600);
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-b from-slate-50 via-blue-50/35 to-slate-100/80">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.05),0_16px_40px_-12px_rgba(15,23,42,0.12)] border border-slate-200/90 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="px-6 py-6 bg-slate-50/70 border-b border-slate-200/80 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center p-1.5 mx-auto mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon_LGUMalungon/LGU_LOGO1.png"
              alt="Municipality of Malungon Seal"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Departmental Staff Registration • Firebase Auth &amp; MEEDOSys
          </p>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {success || firebaseGateState?.mode === 'ACCOUNT_PENDING' ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Registration Submitted</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Your departmental profile is awaiting Administrator approval. Please check back once approved.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  Go to Sign In <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              {isFirebaseProfileCompletion ? (
                <div className="mb-4 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                      Google / Firebase Authenticated
                    </span>
                    <span className="font-semibold text-slate-900 truncate block">
                      {firebaseGateState?.email || firebaseGateState?.displayName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-[11px] font-semibold text-slate-600 hover:text-rose-600 shrink-0"
                  >
                    Switch
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleQuickSignUp}
                    disabled={googleLoading || isSubmitting}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl border border-slate-300 shadow-2xs transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                      />
                    </svg>
                    {googleLoading ? 'Connecting with Google...' : 'Register with Google'}
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
                      <span className="bg-white px-2.5 text-slate-400">or register with email</span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {!isFirebaseProfileCompletion && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="name@malungon.gov.ph"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g. Roberto Alcantara"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Assigned Department / Section
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="A">Section A: Market Management</option>
                    <option value="B">Section B: Slaughterhouse</option>
                    <option value="C">Section C: Cemetery Management</option>
                    <option value="D">Section D: Transport Terminal</option>
                    <option value="E">Section E: Executive / OPIF</option>
                    <option value="F">Section F: Peace &amp; Order (Market Guard)</option>
                  </select>
                </div>

                {section === 'F' && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Market Guard Official Credentials
                    </div>
                    <p className="text-[11px] text-blue-700/80">
                      Your Guard ID links directly to the daily security blotter and shift roster.
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
                      <div>
                        <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                          Radio Call Sign <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={radioCallSign}
                          onChange={(e) => setRadioCallSign(e.target.value)}
                          placeholder="e.g. EAGLE-1"
                          className="w-full px-3 py-1.5 text-xs font-mono font-bold uppercase border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                        Designated Sector <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <select
                        value={defaultArea}
                        onChange={(e) => setDefaultArea(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="General Public Market">General Public Market</option>
                        <option value="Wet Market Section">Wet Market Section</option>
                        <option value="Dry Goods & Perimeter">Dry Goods &amp; Perimeter</option>
                        <option value="Whole Market / Main Hall">Whole Market / Main Hall</option>
                        <option value="Terminal & Unloading Bay">Terminal &amp; Unloading Bay</option>
                        <option value="Commercial Plaza & Gates">Commercial Plaza &amp; Gates</option>
                        <option value="Market General Security">Market General Security</option>
                      </select>
                    </div>
                  </div>
                )}

                {!isFirebaseProfileCompletion && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password <span className="text-slate-400 font-normal">(min. 6 characters)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full pl-3.5 pr-11 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-slate-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full pl-3.5 pr-11 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4 text-slate-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || googleLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Registration...' : 'Register Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
