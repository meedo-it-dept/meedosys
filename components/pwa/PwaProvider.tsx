'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare } from 'lucide-react';

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  platform: 'ios' | 'android' | 'desktop';
  installApp: () => Promise<boolean>;
  openInstallGuide: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  isOnline: true,
  platform: 'desktop',
  installApp: async () => false,
  openInstallGuide: () => {},
});

export const usePwa = () => useContext(PwaContext);

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // 1. Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);

    if (isIosDevice) {
      setPlatform('ios');
    } else if (isAndroidDevice) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // 2. Detect Standalone / Installed mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Listen for changes in display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // 3. Online/Offline tracking
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 4. Register Service Worker in production/supporting browsers
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }

    // 5. Capture beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[PWA] MEEDOSys successfully installed to home screen!');
    });

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    }
    // If native prompt is not available (like iOS Safari), open the guide modal
    setShowGuideModal(true);
    return false;
  };

  const openInstallGuide = () => {
    setShowGuideModal(true);
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOnline,
        platform,
        installApp,
        openInstallGuide,
      }}
    >
      {children}

      {/* Floating Offline Warning Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 bg-amber-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-bounce">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Offline Mode Active • Using cached records</span>
          </div>
        </div>
      )}

      {/* In-App Installation Instructions Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    Install MEEDOSys App
                  </h3>
                  <p className="text-xs text-slate-500">Municipality of Malungon</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform-Specific Step Guide */}
            <div className="py-4">
              {platform === 'ios' ? (
                <div className="space-y-3.5">
                  <p className="text-xs font-medium text-slate-600">
                    To install on your <strong>iPhone or iPad (Safari)</strong>:
                  </p>
                  <ol className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>
                        Tap the <strong className="text-slate-900">Share</strong> icon{' '}
                        <Share className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" /> at the bottom
                        of Safari.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span>
                        Scroll down and tap{' '}
                        <strong className="text-slate-900">Add to Home Screen</strong>{' '}
                        <PlusSquare className="inline w-3.5 h-3.5 text-slate-700 mx-0.5" />.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span>
                        Tap <strong className="text-slate-900">Add</strong> at the top right. MEEDOSys will now run as a full-screen app!
                      </span>
                    </li>
                  </ol>
                </div>
              ) : platform === 'android' ? (
                <div className="space-y-3.5">
                  <p className="text-xs font-medium text-slate-600">
                    To install on your <strong>Android Phone (Chrome)</strong>:
                  </p>
                  <ol className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>
                        Tap the three dots <strong className="text-slate-900">⋮ menu</strong> in Chrome’s top-right corner.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span>
                        Select <strong className="text-slate-900">Install app</strong> or <strong className="text-slate-900">Add to Home screen</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span>
                        Confirm <strong className="text-slate-900">Install</strong> to add the MEEDOSys icon to your apps list.
                      </span>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <p className="text-xs font-medium text-slate-600">
                    To install on <strong>Desktop (Chrome, Edge)</strong>:
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Click the <strong>Install icon</strong> in the address bar (on the right side next to the bookmark star) or open the browser menu and click <strong>&quot;Install MEEDOSys&quot;</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              {deferredPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    setShowGuideModal(false);
                    installApp();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" /> Install Now
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
};
