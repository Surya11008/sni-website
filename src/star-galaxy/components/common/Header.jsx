import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Star,
  Users,
  LogOut,
  User,
  Target,
  BarChart3,
  Settings,
  ShieldCheck,
  Languages,
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import TodayDeadlineCountdown from './TodayDeadlineCountdown';

export default function Header() {
  const {
    currentUser,
    data,
    selectedMemberId,
    setSelectedMemberId,
    getMemberStarsBreakdown,
    logout,
    activeTab,
    setActiveTab,
    setShowPendingApprovalsModal,
    unreadNoticeCount,
    unreadNewsCount,
    t,
  } = useApp();

  const pendingApprovalsCount = (data?.users || []).filter(u => {
    if (!u || u.role === 'admin' || u.id === 'surya11008') return false;
    const s = (u.status || '').toLowerCase().trim();
    return (s === 'pending' || s === 'waiting') && s !== 'approved';
  }).length;

  // Determine which members can be managed/viewed in the dropdown
  let availableMembers = [];
  if (currentUser?.role === 'admin') {
    availableMembers = data.users.filter(u => u.status === 'approved');
  } else if (currentUser?.role === 'manager') {
    const assignedIds = Array.isArray(currentUser.assignedMembers) ? currentUser.assignedMembers : [];
    availableMembers = data.users.filter(u =>
      (u.id === currentUser.id || assignedIds.includes(u.id) || u.assignedManagerId === currentUser.id) &&
      u.status === 'approved'
    );
  } else {
    // Regular member can only manage themselves
    availableMembers = currentUser ? [currentUser] : [];
  }

  // Regular members always see their own stars in header
  const targetMemberId = (currentUser?.role === 'admin' || currentUser?.role === 'manager')
    ? selectedMemberId
    : currentUser?.id;
  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
  const starsBreakdown = getMemberStarsBreakdown(targetMemberId);

  // Desktop Navigation Tabs
  const navTabs = [
    { id: 'activities', label: t('navActivities') || 'Activities', icon: Target },
    { id: 'status', label: t('navStatus') || 'Status', icon: BarChart3 },
    { id: 'settings', label: t('navSettings') || 'Settings', icon: Settings },
  ];

  if (currentUser?.role === 'admin') {
    navTabs.push({ id: 'admin', label: t('navAdmin') || 'Admin', icon: ShieldCheck });
  }

  return (
    <header className="sticky top-[58px] sm:top-[64px] z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xs px-3 sm:px-6 py-2.5 sm:py-3 mb-6 font-sans">
      {/* Main Top Header: Logo on Left, Desktop Nav in Center, Stars, Language & Logout on Right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Title: ONE SINGLE LINE, NO "WELCOME TO" */}
        <div className="flex items-center gap-1.5 sm:gap-2 select-none">
          <span className="text-xl sm:text-2xl animate-cute-wiggle inline-block">⭐</span>
          <span className="text-lg sm:text-xl md:text-2xl font-black text-blue-950 uppercase tracking-wider leading-none drop-shadow-xs whitespace-nowrap flex items-center gap-1.5">
            <span>{t('starGalaxy') || 'STAR GALAXY'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold tracking-normal">
              PRO
            </span>
          </span>
          <span className="text-xl sm:text-2xl animate-cute-wiggle inline-block">⭐</span>
        </div>

        {/* 💻 Desktop Navigation Bar (Visible on Tablet/Laptop/PC screens) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-bold scale-102'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Live Stars Badge, Language Globe Selector & Logout Button at the far right */}
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto md:ml-0">
          {/* 👑 Pending User Approvals Alert Badge for Admin */}
          {currentUser?.role === 'admin' && pendingApprovalsCount > 0 && (
            <button
              type="button"
              onClick={() => setShowPendingApprovalsModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-110 px-2.5 sm:px-3 py-1 rounded-full text-xs font-black shadow-xs transition-all active:scale-95 animate-pulse cursor-pointer border border-blue-400/40"
              title="Review Pending User Registration Approvals"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>{pendingApprovalsCount}</span>
              <span className="hidden sm:inline">Approvals</span>
            </button>
          )}

          {/* Live Stars Badge */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-100 border border-amber-300 px-2.5 sm:px-3 py-1 rounded-full shadow-xs">
            <Star className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-amber-400 text-amber-500 animate-spin-slow" />
            <span className="font-black text-amber-900 text-xs sm:text-base">
              {starsBreakdown.totalStars}
            </span>
            <span className="text-xs text-amber-800 font-semibold hidden sm:inline">
              {t('stars') || 'Stars'}
            </span>
          </div>

          {/* 🌐 Globe Language Selector Button */}
          <LanguageSwitcher showTranslateBadge={false} />
        </div>
      </div>

      {/* Subheader: User Name, 11:59:59 PM Live Countdown Timer (Visible at all times), and Member Selector (Admin/Manager only) */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Display ONLY the user's Name */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
          <strong className="text-slate-800 font-bold text-xs sm:text-sm">{currentUser?.name}</strong>
        </div>

        {/* ⏰ Live 11:59:59 PM Midnight Clock (Always visible at the top as requested!) */}
        <TodayDeadlineCountdown variant="compact" />

        {/* Managing Member Selector (Visible ONLY for Admin and Manager) */}
        {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-slate-500 font-medium hidden sm:inline">
              {currentUser.role === 'admin' ? (t('viewingManaging') || 'Managing:') : (t('assignedManager') || 'Assigned Member:')}
            </span>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-2xs"
            >
              {availableMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.id === currentUser.id ? `(${t('myself') || 'Myself'})` : `(${m.nickname || m.place || m.moreDetails || ''})`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Regular Member View Indicator (Personal view for all non-admins) */}
        {currentUser?.role !== 'admin' && currentUser?.role !== 'manager' && (
          <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            ✓ {t('viewingPersonal') || 'Personal Status'}
          </div>
        )}
      </div>
    </header>
  );
}
