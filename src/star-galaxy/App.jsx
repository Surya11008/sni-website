import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import SniTopHeader from './components/common/SniTopHeader';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import PinLockModal from './components/common/PinLockModal';
import AuthPage from './components/auth/AuthPage';
import AdminPendingApprovalsModal from './components/admin/AdminPendingApprovalsModal';
import NotificationBanner from './components/common/NotificationBanner';

import ActivitiesTab from './components/tabs/ActivitiesTab';
import StatusTab from './components/tabs/StatusTab';
import MoreTab from './components/tabs/MoreTab';
import SettingsTab from './components/tabs/SettingsTab';
import AdminTab from './components/admin/AdminTab';

import {
  playCuteClick,
  playNotificationSound,
  speakWelcomeVoice,
} from './utils/soundEffects';

function MainApp() {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    data,
    unviewedNotices,
    unviewedNews,
    markNoticeAsViewed,
    markNewsAsViewed,
  } = useApp();
  const [activeNotification, setActiveNotification] = useState(null);
  const alertedIds = useRef(new Set());

  // 🔔 Real-time Notifications: ONLY trigger if member has NOT viewed the post or notice!
  useEffect(() => {
    if (!currentUser) return;

    // 1. Check unviewed notices
    if (unviewedNotices && unviewedNotices.length > 0) {
      const noticeToAlert = unviewedNotices.find(n => {
        const id = n.id || n._id || n.date;
        return !alertedIds.current.has(id);
      });
      if (noticeToAlert) {
        const id = noticeToAlert.id || noticeToAlert._id || noticeToAlert.date;
        alertedIds.current.add(id);
        setActiveNotification({
          type: 'notice',
          id,
          title: noticeToAlert.title || 'New Notice from Overseer',
          author: 'Overseer',
          item: noticeToAlert,
        });
        playNotificationSound();
        return;
      }
    }

    // 2. Check unviewed news posts
    if (unviewedNews && unviewedNews.length > 0) {
      const postToAlert = unviewedNews.find(p => {
        const id = p.id || p._id || p.timestamp;
        return !alertedIds.current.has(id);
      });
      if (postToAlert) {
        const id = postToAlert.id || postToAlert._id || postToAlert.timestamp;
        alertedIds.current.add(id);
        setActiveNotification({
          type: 'news',
          id,
          title: postToAlert.title || 'New Fellowship Moment',
          author: postToAlert.author || postToAlert.authorName || 'Fellow Member',
          item: postToAlert,
        });
        playNotificationSound();
      }
    }
  }, [unviewedNotices, unviewedNews, currentUser?.id]);

  // Auto-dismiss notification after 7 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  const handleNotificationClick = () => {
    if (!activeNotification) return;
    if (activeNotification.type === 'notice') {
      markNoticeAsViewed(activeNotification.id);
      setActiveTab('activities');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeNotification.type === 'news') {
      markNewsAsViewed(activeNotification.id);
      setActiveTab('activities');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setActiveNotification(null);
  };

  const handleNotificationClose = () => {
    if (!activeNotification) return;
    if (activeNotification.type === 'notice') {
      markNoticeAsViewed(activeNotification.id);
    } else if (activeNotification.type === 'news') {
      markNewsAsViewed(activeNotification.id);
    }
    setActiveNotification(null);
  };

  // If user is not logged in, render the Login / Create ID & Password page first!
  if (!currentUser) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-[#071b3b] via-[#0d2959] to-[#124b91] flex flex-col justify-center overflow-x-hidden">
        <div className="flex-1 flex flex-col justify-center overflow-y-auto w-full my-auto py-4 sm:py-8">
          <AuthPage />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100/80 via-indigo-50/70 to-purple-100/80 text-slate-900 flex flex-col selection:bg-amber-300">
      <div className="flex-1 flex justify-center">
        {/* Universal Responsive Container: compact mobile frame on phone, expansive modern portal on PC */}
        <div className="w-full max-w-md sm:max-w-2xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-white/95 min-h-screen flex flex-col shadow-2xl relative md:border-x-2 border-indigo-200 transition-all">
          {/* Floating In-App Notification Banner */}
          <NotificationBanner
            notification={activeNotification}
            onClose={handleNotificationClose}
            onClick={handleNotificationClick}
          />

          {/* Top Header with Desktop Navigation Bar */}
          <Header />

          {/* Main Content Area */}
          <main className="flex-1 px-3 sm:px-6 md:px-8 pt-3 md:pt-6 pb-24 md:pb-12 overflow-y-auto">
            {activeTab === 'activities' && <ActivitiesTab />}
            {activeTab === 'status' && <StatusTab />}
            {activeTab === 'more' && <MoreTab />}
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
      </div>
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

export default function App() {
  return (
    <AppProvider>
      <GlobalSoundHandler>
        <MainApp />
      </GlobalSoundHandler>
    </AppProvider>
  );
}
