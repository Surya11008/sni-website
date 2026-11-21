import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import SniTopHeader from './components/common/SniTopHeader';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import PinLockModal from './components/common/PinLockModal';
import AuthPage from './components/auth/AuthPage';
import AdminPendingApprovalsModal from './components/admin/AdminPendingApprovalsModal';

import ActivitiesTab from './components/tabs/ActivitiesTab';
import StatusTab from './components/tabs/StatusTab';
import SettingsTab from './components/tabs/SettingsTab';
import AdminTab from './components/admin/AdminTab';

import {
  playCuteClick,
  speakWelcomeVoice,
} from './utils/soundEffects';

function MainApp() {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    data,
  } = useApp();

  // If user is not logged in, redirect to SNI Master Login page gracefully after session check
  useEffect(() => {
    if (!currentUser) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.replace('/auth.html');
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Connecting to Star Galaxy...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col selection:bg-amber-300">
      {/* Top Header with Desktop Navigation Bar */}
      <Header />

      {/* Main Content Area - Native Full Page Flow */}
      <main className="w-full px-2 sm:px-4 md:px-6 pt-4 pb-24 md:pb-12 min-h-[600px]">
        {activeTab === 'activities' && <ActivitiesTab />}
        {activeTab === 'status' && <StatusTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'admin' && <AdminTab />}
      </main>

      {/* Bottom Navigation for Mobile (hidden on PC/desktop screens) */}
      <BottomNav />

      {/* PIN Security Modal */}
      <PinLockModal />

      {/* 👑 Admin New User Pending Approvals Popup Modal */}
      <AdminPendingApprovalsModal />
    </div>
  );
}

// Module-level guard for welcome voice per page load
let welcomeSpokenThisLoad = false;

// Global Sound & Interaction Handler Wrapper
function GlobalSoundHandler({ children }) {
  useEffect(() => {
    // 🎵 Soft Cute Click Sound on all interactive elements
    const handleGlobalClick = (e) => {
      const target = e.target;
      if (!target) return;

      const clickable = target.closest('button, a, input, select, textarea, [role="button"], label, summary, .cursor-pointer');
      if (clickable) {
        playCuteClick();
      }

      // 🗣️ First Interaction Welcome Voice Greeting ("Welcome to the Star Galaxy!")
      try {
        if (!welcomeSpokenThisLoad) {
          welcomeSpokenThisLoad = true;
          sessionStorage.setItem('star_galaxy_welcome_spoken', 'true');
          speakWelcomeVoice();
        }
      } catch (e) {}
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  return children;
}

export default function StarGalaxyApp({ initialUser }) {
  return (
    <AppProvider initialUser={initialUser}>
      <GlobalSoundHandler>
        <MainApp />
      </GlobalSoundHandler>
    </AppProvider>
  );
}
