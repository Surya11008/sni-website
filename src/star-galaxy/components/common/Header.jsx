import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Star,
  Users,
  LogOut,
  User,
  Target,
  BarChart3,
  MoreHorizontal,
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

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'admin' || currentUser?.id === 'surya11008';
  const leadershipRoles = ['GL', 'UL', 'PTS', 'TS', 'PBCL', 'DEA', '(D) OS', 'OS', 'manager'];
  const isLeader = leadershipRoles.includes(currentUser?.role) || (Array.isArray(currentUser?.assignedMembers) && currentUser.assignedMembers.length > 0);

  const pendingApprovalsCount = (data?.users || []).filter(u => {
    if (!u || u.role === 'ADMIN' || u.role === 'admin' || u.id === 'surya11008') return false;
    const s = (u.status || '').toLowerCase().trim();
    return (s === 'pending' || s === 'waiting') && s !== 'approved';
  }).length;

  // Determine which members can be managed/viewed in the dropdown
  let availableMembers = [];
  if (isAdmin) {
    availableMembers = data.users.filter(u => u.status === 'approved');
  } else if (isLeader) {
    const assignedIds = Array.isArray(currentUser.assignedMembers) ? currentUser.assignedMembers : [];
    availableMembers = data.users.filter(u =>
      (u.id === currentUser.id ||
       assignedIds.includes(u.id) ||
       u.assignedManagerId === currentUser.id ||
       (Array.isArray(u.assignedManagerIds) && u.assignedManagerIds.includes(currentUser.id))) &&
      u.status === 'approved'
    );
  } else {
    // Regular member can only manage themselves
    availableMembers = currentUser ? [currentUser] : [];
  }

  // Regular members always see their own stars in header
  const targetMemberId = (isAdmin || isLeader)
    ? selectedMemberId
    : currentUser?.id;
  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
  const starsBreakdown = getMemberStarsBreakdown(targetMemberId);

  // Desktop Navigation Tabs
  const navTabs = [
    { id: 'activities', label: t('navActivities') || 'Activities', icon: Target },
    { id: 'status', label: t('navStatus') || 'Status', icon: BarChart3 },
    { id: 'more', label: t('navMore') || 'More', icon: MoreHorizontal },
    { id: 'settings', label: t('navSettings') || 'Settings', icon: Settings },
  ];

  if (isAdmin) {
    navTabs.push({ id: 'admin', label: t('navAdmin') || 'Admin', icon: ShieldCheck });
  }

  return (
    <header className="sticky top-[58px] sm:top-[64px] z-40 bg-white/95 backdrop-blur-md border-b-2 border-indigo-200/80 shadow-xs px-3 sm:px-6 md:px-8 py-2.5 sm:py-3">
      {/* Main Top Header: Logo on Left, Desktop Nav in Center, Stars, Language & Logout on Right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Title: ONE SINGLE LINE, NO "WELCOME TO" */}
        <div className="flex items-center gap-1.5 sm:gap-2 select-none">
          <span className="text-xl sm:text-2xl animate-cute-wiggle inline-block">⭐</span>
          <span className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wider leading-none drop-shadow-xs whitespace-nowrap">
            {t('starGalaxy') || 'STAR GALAXY'}
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
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md scale-105'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'home' && unreadNoticeCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title={`${unreadNoticeCount} new notice`} />
                )}
                {tab.id === 'news' && unreadNewsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" title={`${unreadNewsCount} new post`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Live Stars Badge, Language Globe Selector & Logout Button at the far right */}
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto md:ml-0">
          {/* 👑 Pending User Approvals Alert Badge for Admin */}
          {isAdmin && pendingApprovalsCount > 0 && (
            <button
              type="button"
              onClick={() => setShowPendingApprovalsModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-2.5 sm:px-3 py-1 rounded-full text-xs font-black shadow-xs transition-all active:scale-95 animate-pulse cursor-pointer border border-amber-300"
              title="Review Pending User Registration Approvals"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>{pendingApprovalsCount}</span>
              <span className="hidden sm:inline">Approvals</span>
            </button>
          )}

          {/* Live Stars Badge */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-100 border border-amber-300 px-2.5 sm:px-3 py-1 rounded-full shadow-xs">
            <Star className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-amber-400 text-amber-500 animate-spin-slow" />
            <span className="font-black text-amber-800 text-xs sm:text-base">
              {starsBreakdown.totalStars}
            </span>
            <span className="text-xs text-amber-700 font-semibold hidden sm:inline">
              {t('stars') || 'Stars'}
            </span>
          </div>

          {/* 🌐 Globe Language Selector Button */}
          <LanguageSwitcher showTranslateBadge={false} />

          {/* 🚪 Logout Button (Right side last) */}
          <button
            onClick={logout}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-2xs"
            title={t('logout') || 'Logout'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('logout') || 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* Subheader: User Name, 11:59:59 PM Live Countdown Timer (Visible at all times), and Member Selector (Admin/Leader only) */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Display User Name & Role */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
          <strong className="text-slate-800 font-bold text-xs sm:text-sm">{currentUser?.name}</strong>
          <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px]">
            {currentUser?.role || 'MEM'}
          </span>
        </div>

        {/* ⏰ Live 11:59:59 PM Midnight Clock (Always visible at the top as requested!) */}
        <TodayDeadlineCountdown variant="compact" />

        {/* Managing Member Selector (Visible ONLY for Admin and Leaders) */}
        {(isAdmin || isLeader) && (
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-slate-500 font-medium hidden sm:inline">
              {isAdmin ? (t('viewingManaging') || 'Managing:') : (t('assignedManager') || 'Assigned Member:')}
            </span>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-2xs"
            >
              {availableMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.id === currentUser.id ? `(${t('myself') || 'Myself'})` : `[${m.role || 'MEM'}]`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Regular Member View Indicator */}
        {!isAdmin && !isLeader && (
          <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            ✓ {t('viewingPersonal') || 'Personal Status'}
          </div>
        )}
      </div>
    </header>
  );
}
