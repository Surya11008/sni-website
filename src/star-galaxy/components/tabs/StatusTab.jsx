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
    t,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const [adminViewMode, setAdminViewMode] = useState('personal'); // 'personal' | 'standings' | 'all_status'

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
    </div>
  );
}
