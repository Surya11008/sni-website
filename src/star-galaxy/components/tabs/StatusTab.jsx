import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Star,
  Trophy,
  Crown,
  Sparkles,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import CompactDateFilter from '../common/CompactDateFilter';
import TodayDeadlineCountdown from '../common/TodayDeadlineCountdown';
import AdminAllStatusFeed from '../admin/AdminAllStatusFeed';

export default function StatusTab() {
  const {
    data,
    getMemberStarsBreakdown,
    getMemberOverallStarsBreakdown,
    currentUser,
    t,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const [adminViewMode, setAdminViewMode] = useState('standings'); // 'standings' | 'all_status'

  // Activity Filter State: 'all' or specific activity id
  const [selectedActivity, setSelectedActivity] = useState('all');

  // Time Scope: 'current' (Selected Date Range) or 'overall' (From Beginning to Present)
  const [timeScope, setTimeScope] = useState('current'); // 'current' | 'overall'

  // 10 Activities list + "All Activities" selector (small & cute pills)
  const activityFilters = [
    { id: 'all', name: 'All Activities', emoji: '⭐' },
    { id: 'simplePreaching', name: 'Preaching', emoji: '📢' },
    { id: 'connections', name: 'Connections', emoji: '🌐' },
    { id: 'fruits', name: 'Fruits', emoji: '🍇' },
    { id: 'lostSheep', name: 'Lost Sheep', emoji: '🐑' },
    { id: 'preachingMeeting', name: 'Preaching Meeting', emoji: '📅' },
    { id: 'worshipArrival', name: 'Worship Arrival', emoji: '⏰' },
    { id: 'education', name: 'Education', emoji: '📚' },
    { id: 'elohimAcademy', name: 'Elohim Academy', emoji: '🏆' },
    { id: 'preachingAcademy', name: 'Preaching Academy', emoji: '📖' },
    { id: 'newSongAcademy', name: 'New Song Academy', emoji: '🎶' },
  ];

  // Retrieve all approved members
  const approvedMembers = (data?.users || []).filter(u => u.status === 'approved');

  // Calculate stars and activity metrics for each approved member
  const memberRankings = approvedMembers.map(member => {
    const breakdown = timeScope === 'overall'
      ? getMemberOverallStarsBreakdown(member.id)
      : getMemberStarsBreakdown(member.id);

    let stars = 0;
    let detail = '';

    if (selectedActivity === 'all') {
      stars = breakdown.totalStars || 0;
      detail = `${timeScope === 'overall' ? 'All-Time' : 'Weekly'} Total Stars`;
    } else if (selectedActivity === 'simplePreaching') {
      stars = breakdown.simplePreaching?.stars || 0;
      detail = `${breakdown.simplePreaching?.count || 0} preaching count`;
    } else if (selectedActivity === 'connections') {
      stars = breakdown.connections?.stars || 0;
      detail = `${breakdown.connections?.count || 0} connections`;
    } else if (selectedActivity === 'fruits') {
      stars = breakdown.fruits?.stars || 0;
      detail = `${breakdown.fruits?.count || 0} fruit persons`;
    } else if (selectedActivity === 'lostSheep') {
      stars = breakdown.lostSheep?.stars || 0;
      detail = `${breakdown.lostSheep?.count || 0} lost sheep`;
    } else if (selectedActivity === 'preachingMeeting') {
      stars = breakdown.preachingMeeting?.stars || 0;
      const onTime = breakdown.preachingMeeting?.count || 0;
      const late = breakdown.preachingMeeting?.lateCount || 0;
      detail = `${onTime} on-time${late > 0 ? `, ${late} late` : ''}`;
    } else if (selectedActivity === 'worshipArrival') {
      stars = breakdown.worshipArrival?.stars || 0;
      const onTime = breakdown.worshipArrival?.count || 0;
      const late = breakdown.worshipArrival?.lateCount || 0;
      detail = `${onTime} on-time${late > 0 ? `, ${late} late` : ''}`;
    } else if (selectedActivity === 'education') {
      stars = breakdown.education?.stars || 0;
      detail = `${breakdown.education?.count || 0} days attended`;
    } else if (selectedActivity === 'elohimAcademy') {
      stars = breakdown.elohimAcademy?.stars || 0;
      detail = `${breakdown.elohimAcademy?.count || 0} steps completed`;
    } else if (selectedActivity === 'preachingAcademy') {
      stars = breakdown.preachingAcademy?.stars || 0;
      detail = `${breakdown.preachingAcademy?.count || 0} books completed`;
    } else if (selectedActivity === 'newSongAcademy') {
      stars = breakdown.newSongAcademy?.stars || 0;
      detail = `${breakdown.newSongAcademy?.count || 0} songs completed`;
    }

    return {
      id: member.id,
      name: member.name, // Real Full Name ONLY (NO NICKNAMES as requested)
      stars,
      detail,
    };
  });

  // Rule: Do NOT show 0 stars ("o stars no need to show")
  // Rule: Sort highest stars on top ("top members names paina ravali")
  const rankedMembers = memberRankings
    .filter(m => m.stars > 0)
    .sort((a, b) => b.stars - a.stars);

  // Total stars accumulated across active members
  const grandTotalActiveStars = rankedMembers.reduce((sum, m) => sum + m.stars, 0);

  const selectedActivityInfo = activityFilters.find(a => a.id === selectedActivity) || activityFilters[0];

  return (
    <div className="space-y-4 pb-20 pt-1 animate-in fade-in duration-300">
      {/* ⏰ Continuous Today 11:59:59 PM Input Deadline Countdown Banner */}
      <TodayDeadlineCountdown variant="banner" />

      {/* 👑 Admin Mode Toggle: Leaderboard vs All Status Feed */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-1.5 rounded-3xl border-2 border-amber-400/40 shadow-md flex items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAdminViewMode('standings')}
            className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              adminViewMode === 'standings'
                ? 'bg-amber-400 text-amber-950 shadow-md font-black scale-101'
                : 'text-sky-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard & Standings</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminViewMode('all_status')}
            className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              adminViewMode === 'all_status'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 shadow-md font-black scale-101'
                : 'text-amber-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>All Members Activity Status Feed</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>
      )}

      {/* Render Admin All Status Feed if Admin selected it */}
      {isAdmin && adminViewMode === 'all_status' ? (
        <AdminAllStatusFeed />
      ) : (
        <>
          {/* 🌟 Top Standings Banner: Total Stars & Time Scope Selector */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-950 text-white rounded-3xl p-4 sm:p-5 border-2 border-amber-300 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-300 animate-bounce" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
                All Members Standings
              </h2>
            </div>
            <p className="text-xs text-sky-200 mt-0.5">
              {timeScope === 'overall' ? '⭐ Overall (From Beginning to Present)' : '📅 Current Date Filter Standings'}
            </p>
          </div>

          {/* Time Scope Toggle: Current Range vs Overall All-Time */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/20 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTimeScope('current')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeScope === 'current'
                  ? 'bg-amber-400 text-amber-950 shadow-xs font-black'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Current Range
            </button>
            <button
              type="button"
              onClick={() => setTimeScope('overall')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeScope === 'overall'
                  ? 'bg-amber-400 text-amber-950 shadow-xs font-black'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Overall (All-Time)
            </button>
          </div>
        </div>

        {/* Date Filter row if timeScope === 'current' */}
        {timeScope === 'current' && (
          <div className="mt-3 pt-3 border-t border-indigo-800/80 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-sky-200 font-semibold">
              Select date period to view standings:
            </span>
            <CompactDateFilter />
          </div>
        )}
      </div>

      {/* 🎛️ Activities Selector: Small & Cute Buttons (paina activites select kosam anni chinnaga kanipinchali) */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border-2 border-indigo-100 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Select Activity Filter:</span>
          </span>
          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
            {selectedActivityInfo.emoji} {selectedActivityInfo.name}
          </span>
        </div>

        {/* Small & Cute Pills Grid / Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none py-1">
          {activityFilters.map(act => {
            const isSelected = selectedActivity === act.id;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => setSelectedActivity(act.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs scale-102 border border-indigo-700'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{act.emoji}</span>
                <span className="text-[11px]">{act.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🏆 Leaderboard Summary Card */}
      <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100 border-2 border-amber-300 rounded-3xl p-3.5 sm:px-5 flex items-center justify-between gap-3 shadow-xs cute-glow-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-xs">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-amber-950">
              {selectedActivityInfo.name} Leaderboard
            </h3>
            <span className="text-[11px] text-amber-800 font-semibold">
              Showing members with stars ({rankedMembers.length} active)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/90 border border-amber-300 px-3 py-1.5 rounded-2xl shadow-2xs font-black text-amber-900 text-xs sm:text-sm">
          <span>{grandTotalActiveStars}</span>
          <Star className="w-4 h-4 fill-amber-400 text-amber-500 animate-spin-slow" />
        </div>
      </div>

      {/* 👥 All Members Total Names & Stars List (Sorted Descending, No 0 Stars, Real Names Only) */}
      <div className="space-y-2">
        {rankedMembers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200 shadow-xs">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-bounce mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Stars Earned Yet</h4>
            <p className="text-xs text-slate-500 mt-1">
              Be the first member to earn stars for {selectedActivityInfo.name}! ⭐
            </p>
          </div>
        ) : (
          rankedMembers.map((member, index) => {
            const rank = index + 1;
            const isTop1 = rank === 1;
            const isTop2 = rank === 2;
            const isTop3 = rank === 3;

            // Medal style for Top 3
            let medalColor = 'bg-slate-100 text-slate-700 border-slate-200';
            let medalIcon = `#${rank}`;
            let rowBg = 'bg-white hover:bg-slate-50 border-slate-200';

            if (isTop1) {
              medalColor = 'bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-amber-950 border-amber-400 font-black shadow-xs';
              medalIcon = '🥇 1';
              rowBg = 'bg-gradient-to-r from-amber-50/90 via-yellow-50/70 to-white border-amber-300 shadow-xs';
            } else if (isTop2) {
              medalColor = 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-900 border-slate-300 font-black shadow-xs';
              medalIcon = '🥈 2';
              rowBg = 'bg-gradient-to-r from-slate-50/90 to-white border-slate-300';
            } else if (isTop3) {
              medalColor = 'bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-amber-100 border-amber-700 font-black shadow-xs';
              medalIcon = '🥉 3';
              rowBg = 'bg-gradient-to-r from-amber-50/40 to-white border-amber-200';
            }

            return (
              <div
                key={member.id}
                className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.01] ${rowBg}`}
              >
                {/* Member Info on Left: Medal + Real Name ONLY (NO NICKNAMES) */}
                <div className="flex items-center gap-3">
                  <div
                    className={`min-w-10 h-10 px-2 rounded-2xl flex items-center justify-center text-xs border ${medalColor}`}
                  >
                    <span>{medalIcon}</span>
                  </div>

                  <div>
                    {/* Real Full Name Only */}
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                        {member.name}
                      </h4>
                      {isTop1 && (
                        <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded-full">
                          Top #1
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                      {member.detail}
                    </span>
                  </div>
                </div>

                {/* Stars Badge on Right */}
                <div className="flex items-center gap-1.5 bg-white/95 border-2 border-slate-200 px-3 py-1.5 rounded-2xl shadow-2xs">
                  <span className="font-black text-amber-800 text-sm sm:text-base">
                    {member.stars}
                  </span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                </div>
              </div>
            );
          })
        )}
      </div>
        </>
      )}
    </div>
  );
}
