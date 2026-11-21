import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Star,
  Trophy,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import CompactDateFilter from '../common/CompactDateFilter';
import TodayDeadlineCountdown from '../common/TodayDeadlineCountdown';

export default function StatusTab() {
  const {
    data,
    getMemberStarsBreakdown,
    getMemberOverallStarsBreakdown,
    currentUser,
    setSelectedMemberId,
    setActiveTab,
    t,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin' ||
    currentUser?.email === 'surya11008@sni.org.in' ||
    String(currentUser?.id).toLowerCase() === 'surya11008';

  const [adminViewMode, setAdminViewMode] = useState('standings'); // 'personal' | 'standings'

  // Activity Filter State: 'all' or specific activity id
  const [selectedActivity, setSelectedActivity] = useState('all');

  // Time Scope: 'current' (Selected Date Range) or 'overall' (From Beginning to Present)
  const [timeScope, setTimeScope] = useState('current'); // 'current' | 'overall'

  // Current User Personal Stars Breakdown (100% User-Isolated)
  const myBreakdown = timeScope === 'overall'
    ? getMemberOverallStarsBreakdown(currentUser?.id)
    : getMemberStarsBreakdown(currentUser?.id);

  const myOverallBreakdown = getMemberOverallStarsBreakdown(currentUser?.id);
  const myCycleBreakdown = getMemberStarsBreakdown(currentUser?.id);

  // Retrieve all approved members for Admin rankings
  const approvedMembers = (data?.users || []).filter(u => u.status === 'approved' || u.role === 'admin');

  // Calculate stars and activity metrics for each approved member (for Admin visibility)
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
      detail = `${breakdown.fruits?.count || 0} fruits`;
    } else if (selectedActivity === 'lostSheep') {
      stars = breakdown.lostSheep?.stars || 0;
      detail = `${breakdown.lostSheep?.count || 0} visits`;
    } else if (selectedActivity === 'preachingMeeting') {
      stars = breakdown.preachingMeeting?.stars || 0;
      detail = `${breakdown.preachingMeeting?.count || 0} meetings`;
    } else if (selectedActivity === 'worshipArrival') {
      stars = breakdown.worshipArrival?.stars || 0;
      detail = `${breakdown.worshipArrival?.count || 0} arrivals`;
    } else if (selectedActivity === 'education') {
      stars = breakdown.education?.stars || 0;
      detail = `${breakdown.education?.count || 0} days`;
    } else if (selectedActivity === 'elohimAcademy') {
      stars = breakdown.elohimAcademy?.stars || 0;
      detail = `${breakdown.elohimAcademy?.count || 0} lessons`;
    } else if (selectedActivity === 'preachingAcademy') {
      stars = breakdown.preachingAcademy?.stars || 0;
      detail = `${breakdown.preachingAcademy?.count || 0} lessons`;
    } else if (selectedActivity === 'newSongAcademy') {
      stars = breakdown.newSongAcademy?.stars || 0;
      detail = `${breakdown.newSongAcademy?.count || 0} praises`;
    }

    return {
      ...member,
      stars,
      detail,
    };
  }).sort((a, b) => b.stars - a.stars);

  // 10 Activities list + "All Activities" selector (small & cute pills)
  const activityFilters = [
    { id: 'all', name: 'All Activities', emoji: '⭐' },
    { id: 'simplePreaching', name: 'Preaching', emoji: '📢', data: myBreakdown.simplePreaching },
    { id: 'connections', name: 'Connections', emoji: '🌐', data: myBreakdown.connections },
    { id: 'fruits', name: 'Fruits', emoji: '🍇', data: myBreakdown.fruits },
    { id: 'lostSheep', name: 'Lost Sheep', emoji: '🐑', data: myBreakdown.lostSheep },
    { id: 'preachingMeeting', name: 'Preaching Meeting', emoji: '📅', data: myBreakdown.preachingMeeting },
    { id: 'worshipArrival', name: 'Worship Arrival', emoji: '⏰', data: myBreakdown.worshipArrival },
    { id: 'education', name: 'Education', emoji: '📚', data: myBreakdown.education },
    { id: 'elohimAcademy', name: 'Elohim Academy', emoji: '🏆', data: myBreakdown.elohimAcademy },
    { id: 'preachingAcademy', name: 'Preaching Academy', emoji: '📖', data: myBreakdown.preachingAcademy },
    { id: 'newSongAcademy', name: 'New Song Academy', emoji: '🎶', data: myBreakdown.newSongAcademy },
  ];

  const selectedActivityInfo = activityFilters.find(a => a.id === selectedActivity) || activityFilters[0];

  return (
    <div className="space-y-4 pb-20 pt-1 animate-in fade-in duration-300">
      {/* ⏰ Continuous Today 11:59:59 PM Input Deadline Countdown Banner */}
      <TodayDeadlineCountdown variant="banner" />

      {/* 👑 Admin Mode Toggle (Personal Status vs All Members Standings) */}
      {isAdmin && (
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setAdminViewMode('personal')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer text-center ${
              adminViewMode === 'personal'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👤 My Personal Status
          </button>
          <button
            type="button"
            onClick={() => setAdminViewMode('standings')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer text-center ${
              adminViewMode === 'standings'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👑 🏆 All Members Standings ({approvedMembers.length} Members)
          </button>
        </div>
      )}

      {/* If Admin is viewing Standings */}
      {isAdmin && adminViewMode === 'standings' ? (
        <div className="space-y-4 animate-in fade-in">
          {/* Standings Header */}
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-amber-950 rounded-3xl p-5 sm:p-6 shadow-md border border-amber-300">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-400/40">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-7 h-7 text-amber-950" />
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
                    All Members Rankings & Standings
                  </h2>
                  <p className="text-xs text-amber-900 font-semibold mt-0.5">
                    {timeScope === 'overall' ? '⭐ Overall Cumulative Stars' : '📅 Current Cycle Stars'} • {approvedMembers.length} Approved Members
                  </p>
                </div>
              </div>

              {/* Time Scope Toggle: Current Range vs Overall All-Time */}
              <div className="flex items-center gap-1.5 bg-amber-400/50 backdrop-blur-md p-1 rounded-2xl border border-amber-400 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTimeScope('current')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    timeScope === 'current'
                      ? 'bg-amber-950 text-amber-100 shadow-xs font-black'
                      : 'text-amber-950 hover:bg-amber-300/60'
                  }`}
                >
                  Current Cycle
                </button>
                <button
                  type="button"
                  onClick={() => setTimeScope('overall')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    timeScope === 'overall'
                      ? 'bg-amber-950 text-amber-100 shadow-xs font-black'
                      : 'text-amber-950 hover:bg-amber-300/60'
                  }`}
                >
                  Overall All-Time
                </button>
              </div>
            </div>

            {/* Date Filter if timeScope === 'current' */}
            {timeScope === 'current' && (
              <div className="mt-3 pt-3 border-t border-amber-400/40 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-amber-950 font-bold">
                  Date period for cycle rankings:
                </span>
                <CompactDateFilter />
              </div>
            )}
          </div>

          {/* 🎛️ Activities Selector Pills for Standings */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Filter Rankings by Activity:</span>
              </span>
              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                {selectedActivityInfo.emoji} {selectedActivityInfo.name}
              </span>
            </div>

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
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-xs scale-102 border border-amber-400 font-black'
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

          {/* 🏆 Member Rankings List */}
          <div className="space-y-2.5">
            {memberRankings.map((member, index) => {
              const rank = index + 1;
              const isTop1 = rank === 1;
              const isTop2 = rank === 2;
              const isTop3 = rank === 3;

              let medalBadge = `#${rank}`;
              let medalBg = 'bg-slate-100 text-slate-700 border-slate-200';
              let rowBg = 'bg-white hover:bg-slate-50 border-slate-200';

              if (isTop1) {
                medalBadge = '🥇 1';
                medalBg = 'bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-amber-950 border-amber-400 font-black shadow-xs';
                rowBg = 'bg-gradient-to-r from-amber-50/90 via-yellow-50/60 to-white border-amber-300 shadow-xs';
              } else if (isTop2) {
                medalBadge = '🥈 2';
                medalBg = 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-900 border-slate-300 font-black shadow-xs';
                rowBg = 'bg-gradient-to-r from-slate-50/90 to-white border-slate-300';
              } else if (isTop3) {
                medalBadge = '🥉 3';
                medalBg = 'bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-amber-100 border-amber-700 font-black shadow-xs';
                rowBg = 'bg-gradient-to-r from-amber-50/40 to-white border-amber-200';
              }

              return (
                <div
                  key={member.id}
                  className={`flex flex-wrap items-center justify-between p-3.5 sm:p-4 rounded-3xl border-2 transition-all duration-200 gap-3 ${rowBg}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`min-w-10 h-10 px-2 rounded-2xl flex items-center justify-center text-xs border font-black ${medalBg}`}>
                      <span>{medalBadge}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                          {member.name}
                        </h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase">
                          {member.role || 'member'}
                        </span>
                        {isTop1 && (
                          <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded-full">
                            Top #1
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                        {member.detail} • {member.place || 'Sanctuary'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Stars */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-2xl shadow-2xs font-black text-amber-900 text-xs sm:text-sm">
                      <span>{member.stars}</span>
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMemberId(member.id);
                        setActiveTab('activities');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs transition cursor-pointer shadow-xs"
                      title="Manage activities & stars for this member"
                    >
                      👑 Manage Activities →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Personal Status View */
        <>
          {/* 🌟 Personal Star Status Hero Banner */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-700 text-white rounded-3xl p-5 sm:p-6 border border-blue-400/30 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/20">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-300 animate-bounce" />
                  <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
                    My Personal Star Status
                  </h2>
                </div>
                <p className="text-xs text-sky-100 mt-0.5">
                  {timeScope === 'overall' ? '⭐ Overall Total (From Beginning to Present)' : '📅 Current Cycle Status'} • {currentUser?.name}
                </p>
              </div>

              {/* Time Scope Toggle: Current Range vs Overall All-Time */}
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md p-1 rounded-2xl border border-white/20 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTimeScope('current')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    timeScope === 'current'
                      ? 'bg-amber-400 text-amber-950 shadow-xs font-black'
                      : 'text-slate-100 hover:text-white'
                  }`}
                >
                  Current Cycle
                </button>
                <button
                  type="button"
                  onClick={() => setTimeScope('overall')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    timeScope === 'overall'
                      ? 'bg-amber-400 text-amber-950 shadow-xs font-black'
                      : 'text-slate-100 hover:text-white'
                  }`}
                >
                  Overall All-Time
                </button>
              </div>
            </div>

            {/* Big Dual Stars Metrics (Cycle & Overall) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-sky-200 block">Date Cycle Stars (This Week)</span>
                  <span className="text-3xl font-black text-amber-300 mt-1 block">
                    {myCycleBreakdown.totalStars} ⭐
                  </span>
                </div>
                <Sparkles className="w-8 h-8 text-amber-300" />
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-sky-200 block">All-Time Cumulative Stars</span>
                  <span className="text-3xl font-black text-white mt-1 block">
                    {myOverallBreakdown.totalStars} ⭐
                  </span>
                </div>
                <Award className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            {/* Date Filter row if timeScope === 'current' */}
            {timeScope === 'current' && (
              <div className="mt-3 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-sky-200 font-semibold">
                  Select date period for cycle calculations:
                </span>
                <CompactDateFilter />
              </div>
            )}
          </div>

          {/* 🎛️ Activities Selector Pills */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select Activity Filter:</span>
              </span>
              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
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
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs scale-102 border border-blue-500'
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

          {/* 📊 Personal Activity Breakdown Grid (10 Activities Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activityFilters.filter(a => a.id !== 'all').map(act => {
              const isHighlighted = selectedActivity === 'all' || selectedActivity === act.id;
              if (!isHighlighted) return null;
              const actData = act.data || {};
              const starsEarned = actData.stars || 0;
              const count = actData.count || 0;

              return (
                <div
                  key={act.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                      {act.emoji}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
                        {act.name}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {count} {act.id === 'education' ? 'days attended' : act.id === 'elohimAcademy' ? 'lessons completed' : 'recorded count'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl font-black text-amber-900 text-xs sm:text-sm">
                    <span>{starsEarned}</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
