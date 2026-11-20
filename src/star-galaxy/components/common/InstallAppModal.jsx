import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function InstallAppModal({ isOpen, onClose }) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [activeTab, setActiveTab] = useState('auto'); // 'android' | 'ios'

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone
    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standaloneCheck);

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);
    setActiveTab(isAppleDevice ? 'ios' : 'android');

    // Check prompt
    setHasPrompt(Boolean(window.deferredPWAInstallPrompt));

    const handlePromptAvail = () => setHasPrompt(true);
    const handleInstalled = () => {
      setHasPrompt(false);
      setIsStandalone(true);
    };

    window.addEventListener('star-galaxy-pwa-installable', handlePromptAvail);
    window.addEventListener('star-galaxy-pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('star-galaxy-pwa-installable', handlePromptAvail);
      window.removeEventListener('star-galaxy-pwa-installed', handleInstalled);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (window.deferredPWAInstallPrompt) {
      window.deferredPWAInstallPrompt.prompt();
      try {
        const choice = await window.deferredPWAInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          window.deferredPWAInstallPrompt = null;
          setHasPrompt(false);
          setIsStandalone(true);
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } catch (err) {
        console.error('PWA install error:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-indigo-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-sky-900 p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner">
              ⭐
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide flex items-center gap-1.5">
                <span>Install Star Galaxy App</span>
              </h3>
              <p className="text-xs text-sky-200 font-medium">
                Add to your Phone Home Screen
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer relative z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Status Message if already installed */}
          {isStandalone ? (
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <strong className="block font-bold text-xs">App is Already Installed!</strong>
                <span className="text-[11px] text-emerald-700">
                  You are currently using Star Galaxy in native full-screen app mode.
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Native 1-Click Install Button if browser supports it */}
              {hasPrompt && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-indigo-50 rounded-2xl border-2 border-indigo-300 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-950 text-xs flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span>Direct 1-Click Installation Available</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                      Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Click the button below to immediately download and place Star Galaxy on your phone screen:
                  </p>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>Download & Install Now</span>
                  </button>
                </div>
              )}

              {/* Platform Selector Switch (Android vs iPhone) */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('android')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'android'
                      ? 'bg-white text-indigo-700 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Android (Chrome / Samsung)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ios')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'ios'
                      ? 'bg-white text-indigo-700 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Share className="w-3.5 h-3.5 text-sky-600" />
                  <span>iPhone / iPad (Safari)</span>
                </button>
              </div>

              {/* Step-by-Step Instructions */}
              {activeTab === 'android' ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>How to Install on Android Phone:</span>
                  </h4>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-[11px] text-slate-700 leading-snug">
                        Open <strong className="text-slate-900">Chrome</strong> or <strong className="text-slate-900">Samsung Internet</strong>, then tap the menu icon <strong className="text-indigo-700 font-bold text-xs">(⋮)</strong> at the top right or bottom corner.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="text-[11px] text-slate-700 leading-snug">
                        Look for and tap <strong className="text-indigo-700 font-bold">"Install app"</strong> or <strong className="text-indigo-700 font-bold">"Add to Home screen"</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="text-[11px] text-slate-700 leading-snug">
                        Tap <strong className="text-emerald-700 font-bold">"Install"</strong>. The <strong className="text-slate-900">⭐ Star Galaxy</strong> app icon will now appear on your phone home screen!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>How to Install on iPhone / iPad (Safari):</span>
                  </h4>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-[11px] text-slate-700 leading-snug">
                        Open in <strong className="text-slate-900">Safari</strong> browser, then tap the <strong className="text-sky-700 font-bold">Share button</strong> (square with arrow pointing up <Share className="inline w-3.5 h-3.5" />) at the bottom toolbar.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="text-[11px] text-slate-700 leading-snug">
                        Scroll down the menu list and tap <strong className="text-indigo-700 font-bold">"Add to Home Screen"</strong> (<PlusSquare className="inline w-3.5 h-3.5" />).
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="text-[11px] text-slate-700 leading-snug">
                        Tap <strong className="text-emerald-700 font-bold">"Add"</strong> at the top right corner. Star Galaxy will be installed directly on your home screen like a native App!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* App Features Checklist */}
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-1.5">
                <span className="font-extrabold text-purple-900 text-[11px] block">
                  Why Install as an App?
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-purple-950 font-medium">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>No browser URL bar</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Launches instantly</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Dedicated home icon ⭐</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Fast offline caching</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Got It, Close
          </button>
        </div>
      </div>
    </div>
  );
}
