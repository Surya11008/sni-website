import React, { useState } from 'react';
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

  // If user is not logged in, redirect directly to the ONLY SNI Master Login page
  if (!currentUser) {
    if (typeof window !== 'undefined') {
      window.location.replace('/auth.html');
    }
    return null;
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
