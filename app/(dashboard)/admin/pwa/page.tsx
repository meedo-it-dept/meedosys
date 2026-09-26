'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { usePwa } from '@/components/pwa/PwaProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  Apple,
  Chrome,
  AlertTriangle,
  Wifi,
  Sparkles,
  ShieldCheck,
  QrCode,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

export default function AdminPwaGuidePage() {
  const { isInstallable, isInstalled, isOnline, platform, installApp, openInstallGuide } = usePwa();
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('android');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const appUrl = 'https://meedosystem.web.app';

  // Automatically default tab to user's detected platform
  useEffect(() => {
    if (platform === 'ios') setActiveTab('ios');
    else if (platform === 'android') setActiveTab('android');
    else setActiveTab('desktop');
  }, [platform]);

  // Generate QR code for mobile scanning
  useEffect(() => {
    QRCode.toDataURL(appUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <Smartphone className="w-5 h-5 text-blue-100" />
            </span>
            <Badge variant="neutral" className="bg-white/20 text-white border-none text-[10px] font-bold">
              Progressive Web App v2.0
            </Badge>
            <Badge variant="neutral" className="bg-emerald-400/20 text-emerald-200 border-none text-[10px] font-bold">
              Offline Capable
            </Badge>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2">
            Mobile App & PWA Installation Guide
          </h1>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            Deploy MEEDOSys directly onto staff smartphones, tablets, and field devices with zero app-store delays, automatic updates, and full-screen performance.
          </p>
        </div>

        {/* Live Install Button for Current Device */}
        <div className="flex items-center gap-2">
          {isInstalled ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Running in App Mode
            </div>
          ) : isInstallable ? (
            <Button
              onClick={installApp}
              className="bg-white hover:bg-slate-50 text-blue-700 font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4 mr-2" /> Install MEEDOSys Now
            </Button>
          ) : (
            <Button
              onClick={openInstallGuide}
              className="bg-white hover:bg-slate-50 text-blue-700 font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Smartphone className="w-4 h-4 mr-2" /> Add to Home Screen
            </Button>
          )}
        </div>
      </div>

      {/* Diagnostics / Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-white border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Device</span>
          <div className="flex items-center gap-2 mt-2">
            {platform === 'ios' ? (
              <span className="text-sm font-bold text-slate-800">Apple iOS (iPhone/iPad)</span>
            ) : platform === 'android' ? (
              <span className="text-sm font-bold text-slate-800">Android Device</span>
            ) : (
              <span className="text-sm font-bold text-slate-800">Desktop / Laptop</span>
            )}
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">App Mode</span>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isInstalled ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            <span className="text-sm font-bold text-slate-800">
              {isInstalled ? 'Installed App (Standalone)' : 'Web Browser'}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Network State</span>
          <div className="flex items-center gap-2 mt-2">
            <Wifi className={`w-4 h-4 ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`} />
            <span className="text-sm font-bold text-slate-800">
              {isOnline ? 'Online (Real-time)' : 'Offline (Cached)'}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service Worker</span>
          <div className="flex items-center gap-2 mt-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">Registered & Active</span>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: QR Code + Installation Step-by-Step */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code & Share Box for Staff */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 bg-white border-slate-200/90 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900 tracking-tight">
                Scan to Install on Mobile
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Have field staff, collectors, or security personnel point their phone camera at this QR code to open MEEDOSys immediately.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block shadow-inner mb-4">
              {qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCodeUrl}
                  alt="Scan MEEDOSys Mobile App QR Code"
                  width={200}
                  height={200}
                  className="mx-auto rounded-lg"
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center text-slate-400 text-xs">
                  Generating QR Code...
                </div>
              )}
            </div>

            <div className="space-y-2 text-left">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-600 truncate">{appUrl}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="w-full text-xs font-semibold"
                >
                  {copied ? 'Copied Link!' : 'Copy App Link'}
                </Button>
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                  title="Open App"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200/60 shadow-xs">
            <h3 className="font-bold text-xs text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Key Benefits for LGU
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>No App Store hassle:</strong> No waiting for Google Play or App Store approvals.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Auto-updating:</strong> Whenever new layouts or rates are deployed, staff get them immediately.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Full-screen UI:</strong> Runs without browser address bars, giving maximum space on mobile screens.</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Right Column: Platform Instructions Tabs */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-6 bg-white border-slate-200/90 shadow-sm">
            {/* Platform Selector Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Step-by-Step Installation Instructions
                </h2>
                <p className="text-xs text-slate-500">
                  Select your device operating system to view exact instructions:
                </p>
              </div>

              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('android')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'android'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Chrome className="w-3.5 h-3.5" /> Android
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ios')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'ios'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" /> iOS (iPhone)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'desktop'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" /> Desktop
                </button>
              </div>
            </div>

            {/* TAB 1: ANDROID */}
            {activeTab === 'android' && (
              <div className="py-4 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-medium">
                  <Chrome className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Supported on <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, and <strong>Samsung Internet</strong> on all Android versions.
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Open in Chrome</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Navigate to <span className="font-mono text-blue-600 font-semibold">{appUrl}</span> using the Google Chrome browser on your Android phone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Tap Browser Menu (⋮)</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Tap the <strong>three vertical dots (⋮)</strong> located at the top-right corner of the Chrome screen, or tap the banner at the bottom that says <em>&quot;Add MEEDOSys to Home screen&quot;</em>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Select &quot;Install app&quot;</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Select <strong>&quot;Install app&quot;</strong> (or <strong>&quot;Add to Home screen&quot;</strong>) from the dropdown list.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Confirm & Launch</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Tap <strong>&quot;Install&quot;</strong> in the confirmation prompt. The MEEDOSys enterprise icon will now appear in your phone’s App Drawer and Home Screen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: APPLE IOS (IPHONE / IPAD) */}
            {activeTab === 'ios' && (
              <div className="py-4 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Important for iOS:</strong> Apple requires using <strong>Safari</strong> to install web apps. Do not use in-app browsers like Facebook or Viber.
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Open in Safari</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Launch <strong>Safari</strong> on your iPhone or iPad and go to{' '}
                        <span className="font-mono text-blue-600 font-semibold">{appUrl}</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Tap the Share Button <Share className="w-3.5 h-3.5 text-blue-600" />
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Tap the <strong>Share icon</strong> (the square with an arrow pointing upward) located at the bottom toolbar of Safari (or top bar on iPad).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Tap &quot;Add to Home Screen&quot; <PlusSquare className="w-3.5 h-3.5 text-slate-700" />
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Scroll down the menu list and tap <strong>&quot;Add to Home Screen&quot;</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Tap &quot;Add&quot;</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Tap <strong>&quot;Add&quot;</strong> in the top-right corner. The MEEDOSys icon will be placed directly onto your iPhone home screen with native full-screen mode enabled!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DESKTOP */}
            {activeTab === 'desktop' && (
              <div className="py-4 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-medium">
                  <Laptop className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Supported on <strong>Google Chrome</strong> and <strong>Microsoft Edge</strong> on Windows 10/11, macOS, and Linux.
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Open in Chrome or Edge</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Visit <span className="font-mono text-blue-600 font-semibold">{appUrl}</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Click the Install App Icon</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Look on the right side of your browser address bar for the <strong>Install Icon</strong> (a computer monitor with a down arrow, or ⊕). Alternatively, click the 3-dots menu &gt; <em>&quot;Install MEEDOSys&quot;</em>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Click &quot;Install&quot;</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Click Install. MEEDOSys will open in its own separate, sleek application window with no browser tabs or URL bars.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Admin FAQ / Troubleshooting Card */}
          <Card className="p-6 bg-white border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" /> Frequently Asked Questions (FAQ)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
                <h4 className="font-bold text-slate-800">
                  How do staff receive software updates on their phones?
                </h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Automatically! Whenever an update is deployed to the system, the Service Worker detects it in the background and refreshes the cache. Staff do not need to download anything from app stores.
                </p>
              </div>

              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
                <h4 className="font-bold text-slate-800">
                  Can inspectors or guards use the app with poor internet connection?
                </h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Yes! The core application shell, stall maps, and recent records are pre-cached locally. When cell signal drops, the app remains responsive and displays an offline indicator.
                </p>
              </div>

              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
                <h4 className="font-bold text-slate-800">
                  How do I uninstall or reset the app?
                </h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  On Android and iOS, simply long-press the MEEDOSys app icon on your home screen and tap &quot;Delete App&quot; or &quot;Uninstall&quot;, just like any native app.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
