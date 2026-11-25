'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMeedo } from '@/lib/store';
import { isApprovedUser } from '@/lib/rbac';
import {
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Link2,
  UserPlus,
  Clock,
  Ban,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Building2,
  Shield,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const {
    currentUser,
    authLoading,
    firebaseGateState,
    loginWithEmail,
    loginWithGoogle,
    linkExistingAccount,
    completeFirebaseRegistration,
    sendPasswordReset,
    resendVerificationEmail,
    retryFirebaseSession,
    logout,
  } = useMeedo();

  // Standard email/password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password inline mode
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // PROFILE_REQUIRED mode: 'link' existing MEEDOSys account vs 'register' new profile
  const [profileTab, setProfileTab] = useState<'link' | 'register'>('link');
  const [legacyIdentifier, setLegacyIdentifier] = useState('');
  const [legacyPassword, setLegacyPassword] = useState('');
  const [showLegacyPassword, setShowLegacyPassword] = useState(false);

  // Complete new registration state (for Google / unlinked Firebase users)
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regSection, setRegSection] = useState('A');
  const [regGuardId, setRegGuardId] = useState('');
  const [regRankTitle, setRegRankTitle] = useState('SO1');
  const [regCallSign, setRegCallSign] = useState('');
  const [regDefaultArea, setRegDefaultArea] = useState('General Public Market');

  useEffect(() => {
    if (!authLoading && isApprovedUser(currentUser)) {
      router.push('/');
    }
  }, [authLoading, currentUser, router]);

  useEffect(() => {
    if (firebaseGateState?.mode === 'PROFILE_REQUIRED') {
      if (firebaseGateState.displayName && !regFullName) {
        setRegFullName(firebaseGateState.displayName);
      }
      if (firebaseGateState.email && !regUsername) {
        const localPart = firebaseGateState.email.split('@')[0]?.replace(/[^a-zA-Z0-9_.-]/g, '') || '';
        setRegUsername(localPart);
      }
    }
  }, [firebaseGateState?.mode, firebaseGateState?.displayName, firebaseGateState?.email]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await loginWithEmail(email.trim(), password);
      if (res.success) {
        router.push('/');
      } else if (!res.code || !['PROFILE_REQUIRED', 'ACCOUNT_PENDING', 'ACCOUNT_BLOCKED', 'EMAIL_VERIFICATION_REQUIRED'].includes(res.code)) {
        setError(res.message || 'Invalid email address or password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setNotice('');
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        router.push('/');
      } else if (!res.code || !['PROFILE_REQUIRED', 'ACCOUNT_PENDING', 'ACCOUNT_BLOCKED', 'EMAIL_VERIFICATION_REQUIRED'].includes(res.code)) {
        setError(res.message || 'Google Sign-In failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await sendPasswordReset(resetEmail || email);
      if (res.success) {
        setNotice(res.message || 'Password reset email sent.');
        setResetMode(false);
      } else {
        setError(res.message || 'Failed to send password reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await linkExistingAccount(legacyIdentifier, legacyPassword);
      if (res.success) {
        router.push('/');
      } else {
        setError(res.message || 'Failed to link existing account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await completeFirebaseRegistration({
        username: regUsername,
        fullName: regFullName,
        section: regSection,
        guardId: regSection === 'F' ? regGuardId : undefined,
        rankTitle: regSection === 'F' ? regRankTitle : undefined,
        radioCallSign: regSection === 'F' ? regCallSign : undefined,
        defaultArea: regSection === 'F' ? regDefaultArea : undefined,
      });
      if (!res.success) {
        setError(res.message || 'Failed to submit departmental registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetryStatus = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await retryFirebaseSession();
      if (res.success) {
        router.push('/');
      } else {
        setNotice(res.message || 'Account status checked.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await resendVerificationEmail();
      if (res.success) {
        setNotice(res.message || 'Verification email sent.');
      } else {
        setError(res.message || 'Unable to resend verification email.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 via-blue-50/35 to-slate-100/80">
        <div className="text-center space-y-3 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon_LGUMalungon/LGU_LOGO1.png"
            alt="Municipality of Malungon Seal"
            className="w-12 h-12 object-contain mx-auto"
          />
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">MEEDOSys Enterprise</h3>
          <p className="text-xs text-slate-500 font-medium">Verifying Firebase &amp; Department Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-b from-slate-50 via-blue-50/35 to-slate-100/80">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.05),0_16px_40px_-12px_rgba(15,23,42,0.12)] border border-slate-200/90 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        {/* Top Header */}
        <div className="px-6 py-7 md:px-8 bg-slate-50/70 border-b border-slate-200/80 flex flex-col items-center text-center">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm mb-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon_LGUMalungon/LGU_LOGO1.png"
              alt="Municipality of Malungon Seal"
              width={56}
              height={56}
              style={{ maxWidth: '56px', maxHeight: '56px', objectFit: 'contain' }}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Municipality of Malungon</h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Municipal Economic Enterprise Development Office
          </p>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Firebase Auth • Strict RBAC Enforced
          </span>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {notice}
            </div>
          )}

          {/* GATE 1: PROFILE_REQUIRED (Signed into Firebase, needs Link or Registration) */}
          {firebaseGateState?.mode === 'PROFILE_REQUIRED' ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-0.5">
                  Signed In with Firebase
                </p>
                <p className="font-semibold text-slate-900 truncate">
                  {firebaseGateState.email || firebaseGateState.displayName}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Link an existing MEEDOSys staff/admin profile or register a new departmental request.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setProfileTab('link');
                    setError('');
                  }}
                  className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    profileTab === 'link'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" /> Link Existing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileTab('register');
                    setError('');
                  }}
                  className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    profileTab === 'register'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" /> New Registration
                </button>
              </div>

              {profileTab === 'link' ? (
                <form onSubmit={handleLinkSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Existing Username or Guard ID
                    </label>
                    <input
                      type="text"
                      value={legacyIdentifier}
                      onChange={(e) => setLegacyIdentifier(e.target.value)}
                      required
                      placeholder="e.g. admin or G-101"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Existing MEEDOSys Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLegacyPassword ? 'text' : 'password'}
                        value={legacyPassword}
                        onChange={(e) => setLegacyPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full pl-3.5 pr-11 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLegacyPassword(!showLegacyPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        tabIndex={-1}
                        aria-label={showLegacyPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLegacyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Linking Account...' : 'Link & Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteRegistration} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                      placeholder="Choose a username"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Officer or staff full name"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> Assigned Department / Section
                    </label>
                    <select
                      value={regSection}
                      onChange={(e) => setRegSection(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="A">Section A: Market Management</option>
                      <option value="B">Section B: Slaughterhouse</option>
                      <option value="C">Section C: Cemetery Management</option>
                      <option value="D">Section D: Transport Terminal</option>
                      <option value="E">Section E: Admin Services / OPIF</option>
                      <option value="F">Section F: Peace &amp; Order (Market Guard)</option>
                    </select>
                  </div>

                  {regSection === 'F' && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                        <Shield className="w-4 h-4 text-blue-600" /> Market Guard Badge Details
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                            Guard ID <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={regGuardId}
                            onChange={(e) => setRegGuardId(e.target.value)}
                            placeholder="e.g. G-101"
                            required
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase border border-blue-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                            Rank / Title
                          </label>
                          <input
                            type="text"
                            value={regRankTitle}
                            onChange={(e) => setRegRankTitle(e.target.value)}
                            placeholder="SO1"
                            className="w-full px-2.5 py-1.5 text-xs border border-blue-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                            Radio Call Sign
                          </label>
                          <input
                            type="text"
                            value={regCallSign}
                            onChange={(e) => setRegCallSign(e.target.value)}
                            placeholder="EAGLE-1"
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase border border-blue-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                            Sector
                          </label>
                          <input
                            type="text"
                            value={regDefaultArea}
                            onChange={(e) => setRegDefaultArea(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-blue-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Submitting Request...' : 'Submit Registration Request'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={logout}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out / Switch Firebase Account
              </button>
            </div>
          ) : firebaseGateState ? (
            /* GATE 2: ACCOUNT_PENDING / BLOCKED / EMAIL_VERIFICATION_REQUIRED / CONFLICT */
            <div className="space-y-4 text-center">
              <div
                className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
                  firebaseGateState.mode === 'ACCOUNT_BLOCKED' || firebaseGateState.mode === 'ACCOUNT_CONFLICT'
                    ? 'bg-rose-100 text-rose-600'
                    : firebaseGateState.mode === 'EMAIL_VERIFICATION_REQUIRED'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {firebaseGateState.mode === 'ACCOUNT_BLOCKED' || firebaseGateState.mode === 'ACCOUNT_CONFLICT' ? (
                  <Ban className="w-6 h-6" />
                ) : firebaseGateState.mode === 'EMAIL_VERIFICATION_REQUIRED' ? (
                  <Mail className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {firebaseGateState.mode === 'ACCOUNT_BLOCKED'
                    ? 'Account Suspended'
                    : firebaseGateState.mode === 'EMAIL_VERIFICATION_REQUIRED'
                    ? 'Email Verification Required'
                    : firebaseGateState.mode === 'ACCOUNT_CONFLICT'
                    ? 'Account Linking Conflict'
                    : 'Approval Pending'}
                </h2>
                {firebaseGateState.email && (
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{firebaseGateState.email}</p>
                )}
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {firebaseGateState.message}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {firebaseGateState.mode === 'EMAIL_VERIFICATION_REQUIRED' && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" /> Resend Verification Email
                  </button>
                )}

                {firebaseGateState.mode !== 'ACCOUNT_BLOCKED' && (
                  <button
                    type="button"
                    onClick={handleRetryStatus}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {firebaseGateState.mode === 'EMAIL_VERIFICATION_REQUIRED'
                      ? "I've Verified — Continue"
                      : 'Check Approval Status'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2.5 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out / Switch Account
                </button>
              </div>
            </div>
          ) : resetMode ? (
            /* FORGOT PASSWORD VIEW */
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" /> Reset Password
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered email address and Firebase will send a password reset link.
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="name@malungon.gov.ph"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode(false);
                      setError('');
                    }}
                    className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* STANDARD LOGIN VIEW */
            <>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" /> Sign In to Your Account
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate with your municipal email or Google account.
                </p>
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
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
                {googleLoading ? 'Connecting with Google...' : 'Continue with Google'}
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
                  <span className="bg-white px-2.5 text-slate-400">or sign in with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="name@malungon.gov.ph"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setResetMode(true);
                        setError('');
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-3.5 pr-11 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In with Email'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Existing accounts can sign in with Google/Email to link once</span>
                </div>
                <div>
                  Need a departmental account?{' '}
                  <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                    Register here
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
