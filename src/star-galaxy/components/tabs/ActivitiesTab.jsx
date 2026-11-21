import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Megaphone,
  Network,
  Grape,
  Sparkle,
  CalendarCheck,
  Clock,
  GraduationCap,
  Award,
  BookOpen,
  Music,
  Star,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import CompactDateFilter from '../common/CompactDateFilter';
import TodayDeadlineCountdown from '../common/TodayDeadlineCountdown';
import SimplePreaching from '../activities/SimplePreaching';
import Connections from '../activities/Connections';
import Fruits from '../activities/Fruits';
import LostSheep from '../activities/LostSheep';
import PreachingMeeting from '../activities/PreachingMeeting';
import WorshipArrival from '../activities/WorshipArrival';
import Education from '../activities/Education';
import ElohimAcademy from '../activities/ElohimAcademy';
import PreachingAcademy from '../activities/PreachingAcademy';
import NewSongAcademy from '../activities/NewSongAcademy';

export default function ActivitiesTab() {
  const { selectedMemberId, setSelectedMemberId, data, getMemberStarsBreakdown, getMemberOverallStarsBreakdown, currentUser, t } = useApp();
  const [selectedActivity, setSelectedActivityState] = useState(() => {
    try {
      return localStorage.getItem('star_galaxy_selected_activity') || null;
    } catch (e) {
      return null;
    }
  });

  const setSelectedActivity = (actId) => {
    setSelectedActivityState(actId);
    try {
      if (actId) {
        localStorage.setItem('star_galaxy_selected_activity', actId);
      } else {
        localStorage.removeItem('star_galaxy_selected_activity');
      }
    } catch (e) {}
  };

  // Listen for direct navigation events from Admin All Status Feed
  useEffect(() => {
    const handleSelectAct = (e) => {
      if (e.detail?.activityId) {
        setSelectedActivityState(e.detail.activityId);
      }
    };
    window.addEventListener('star-galaxy-select-activity', handleSelectAct);
    return () => window.removeEventListener('star-galaxy-select-activity', handleSelectAct);
  }, []);

  const isAdmin = currentUser?.role === 'admin' ||
    currentUser?.email === 'surya11008@sni.org.in' ||
    String(currentUser?.id).toLowerCase() === 'surya11008';

  // Admin can view and edit ANY member's activities; regular members view their own
  const targetMemberId = (isAdmin && selectedMemberId) ? selectedMemberId : currentUser?.id;
  const selectedMember = (isAdmin && selectedMemberId)
    ? ((data.users || []).find(u => String(u.id) === String(selectedMemberId)) || currentUser)
    : currentUser;
  const breakdown = getMemberStarsBreakdown(targetMemberId);
  const overallBreakdown = getMemberOverallStarsBreakdown(targetMemberId);

  // 10 Clean Activities list with pure translated names
  const activities = [
    {
      id: 'simplePreaching',
      name: t('actSimplePreaching') || 'Simple Preaching',
      icon: Megaphone,
      emoji: '📢',
      stars: breakdown.simplePreaching.stars,
      overallStars: overallBreakdown.simplePreaching.stars,
      color: 'from-white via-slate-50 to-sky-50/50 border-2 border-slate-200 hover:border-sky-400 text-slate-800',
      badgeColor: 'bg-sky-100/80 text-sky-900 border border-sky-300 font-black shadow-2xs',
      iconBg: 'bg-sky-500 text-white shadow-xs',
      component: SimplePreaching,
    },
    {
      id: 'connections',
      name: t('actConnections') || 'Connections',
      icon: Network,
      emoji: '🌐',
      stars: breakdown.connections.stars,
      overallStars: overallBreakdown.connections.stars,
      color: 'from-white via-slate-50 to-purple-50/50 border-2 border-slate-200 hover:border-purple-400 text-slate-800',
      badgeColor: 'bg-purple-100/80 text-purple-900 border border-purple-300 font-black shadow-2xs',
      iconBg: 'bg-purple-500 text-white shadow-xs',
      component: Connections,
    },
    {
      id: 'fruits',
      name: t('actFruits') || 'Fruits 🍇',
      icon: Grape,
      emoji: '🍇',
      stars: breakdown.fruits.stars,
      overallStars: overallBreakdown.fruits.stars,
      color: 'from-white via-slate-50 to-rose-50/50 border-2 border-slate-200 hover:border-rose-400 text-slate-800',
      badgeColor: 'bg-rose-100/80 text-rose-900 border border-rose-300 font-black shadow-2xs',
      iconBg: 'bg-rose-500 text-white shadow-xs',
      component: Fruits,
    },
    {
      id: 'lostSheep',
      name: t('actLostSheep') || 'Lost Sheep 🐑',
      icon: Sparkle,
      emoji: '🐑',
      stars: breakdown.lostSheep.stars,
      overallStars: overallBreakdown.lostSheep.stars,
      color: 'from-white via-slate-50 to-emerald-50/50 border-2 border-slate-200 hover:border-emerald-400 text-slate-800',
      badgeColor: 'bg-emerald-100/80 text-emerald-900 border border-emerald-300 font-black shadow-2xs',
      iconBg: 'bg-emerald-500 text-white shadow-xs',
      component: LostSheep,
    },
    {
      id: 'preachingMeeting',
      name: t('actPreachingMeeting') || 'Preaching Meeting',
      icon: CalendarCheck,
      emoji: '📅',
      stars: breakdown.preachingMeeting.stars,
      overallStars: overallBreakdown.preachingMeeting.stars,
      color: 'from-white via-slate-50 to-amber-50/50 border-2 border-slate-200 hover:border-amber-400 text-slate-800',
      badgeColor: 'bg-amber-100/80 text-amber-950 border border-amber-300 font-black shadow-2xs',
      iconBg: 'bg-amber-500 text-white shadow-xs',
      component: PreachingMeeting,
    },
    {
      id: 'worshipArrival',
      name: t('actWorshipArrival') || 'Worship Arrival',
      icon: Clock,
      emoji: '⏰',
      stars: breakdown.worshipArrival.stars,
      overallStars: overallBreakdown.worshipArrival.stars,
      color: 'from-white via-slate-50 to-blue-50/50 border-2 border-slate-200 hover:border-blue-400 text-slate-800',
      badgeColor: 'bg-blue-100/80 text-blue-900 border border-blue-300 font-black shadow-2xs',
      iconBg: 'bg-blue-500 text-white shadow-xs',
      component: WorshipArrival,
    },
    {
      id: 'education',
      name: t('actEducation') || 'Education 📚',
      icon: GraduationCap,
      emoji: '📚',
      stars: breakdown.education.stars,
      overallStars: overallBreakdown.education.stars,
      color: 'from-white via-slate-50 to-orange-50/50 border-2 border-slate-200 hover:border-orange-400 text-slate-800',
      badgeColor: 'bg-orange-100/80 text-orange-950 border border-orange-300 font-black shadow-2xs',
      iconBg: 'bg-orange-500 text-white shadow-xs',
      component: Education,
    },
    {
      id: 'elohimAcademy',
      name: t('actElohimAcademy') || 'Elohim Academy',
      icon: Award,
      emoji: '🏆',
      stars: breakdown.elohimAcademy.stars,
      overallStars: overallBreakdown.elohimAcademy.stars,
      color: 'from-white via-indigo-50/40 to-purple-50/40 border-2 border-indigo-200 hover:border-indigo-400 text-slate-800 ring-1 ring-indigo-200/50',
      badgeColor: 'bg-indigo-100 text-indigo-950 border border-indigo-300 font-black shadow-2xs',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-amber-300 shadow-xs',
      component: ElohimAcademy,
    },
    {
      id: 'preachingAcademy',
      name: t('actPreachingAcademy') || 'Preaching Academy 📖',
      icon: BookOpen,
      emoji: '📖',
      stars: breakdown.preachingAcademy.stars,
      overallStars: overallBreakdown.preachingAcademy.stars,
      color: 'from-white via-slate-50 to-teal-50/50 border-2 border-slate-200 hover:border-teal-400 text-slate-800',
      badgeColor: 'bg-teal-100/80 text-teal-900 border border-teal-300 font-black shadow-2xs',
      iconBg: 'bg-teal-500 text-white shadow-xs',
      component: PreachingAcademy,
    },
    {
      id: 'newSongAcademy',
      name: t('actNewSongAcademy') || 'New Song Academy 🎶',
      icon: Music,
      emoji: '🎶',
      stars: breakdown.newSongAcademy.stars,
      overallStars: overallBreakdown.newSongAcademy.stars,
      color: 'from-white via-slate-50 to-pink-50/50 border-2 border-slate-200 hover:border-pink-400 text-slate-800',
      badgeColor: 'bg-pink-100/80 text-pink-900 border border-pink-300 font-black shadow-2xs',
      iconBg: 'bg-pink-500 text-white shadow-xs',
      component: NewSongAcademy,
    },
  ];

  if (selectedActivity) {
    const act = activities.find(a => a.id === selectedActivity);
    if (act && act.component) {
      const Comp = act.component;
      return (
        <div className="animate-in zoom-in-95 duration-200">
          <Comp onBack={() => setSelectedActivity(null)} />
        </div>
      );
    }
  }

  return (
    <div className="space-y-4 pb-20 pt-1 animate-in fade-in duration-300">
      {/* ⏰ Continuous Today 11:59:59 PM Input Deadline Countdown Banner */}
      <TodayDeadlineCountdown variant="banner" />

      {/* 👑 Admin Managing Member Notice Banner */}
      {isAdmin && selectedMemberId && selectedMemberId !== currentUser?.id && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-3xl p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              👑
            </span>
            <div>
              <span className="font-extrabold text-xs sm:text-sm text-amber-950 block">
                Admin Control Active: Managing Activities & Stars for "{selectedMember?.name}"
              </span>
              <p className="text-[11px] text-amber-800">
                Any stars, activities, checkboxes, or scores you modify below directly update this member's official record.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedMemberId(currentUser?.id)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs transition cursor-pointer shrink-0 shadow-2xs"
          >
            Switch to My Account
          </button>
        </div>
      )}

      {/* 🌟 Cute Colorful Top Bar: Total Stars on Left, Cute Date Filter on Right */}
      <div className="bg-gradient-to-r from-white via-amber-50/40 to-white border-2 border-amber-200/80 rounded-3xl p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 font-black text-blue-950 text-2xl sm:text-3xl">
            <Star className="w-7 h-7 fill-[#F4B942] text-amber-300 animate-spin-slow" />
            <span>{breakdown.totalStars}</span>
          </div>
          <div>
            <span className="text-xs font-black text-blue-950 uppercase tracking-wider block">
              {t('totalStars') || 'Total Stars'}
            </span>
            <span className="text-[11px] text-amber-800 font-bold">
              {selectedMember?.name}
            </span>
          </div>
        </div>

        {/* Small & Cute Date Filter with ONLY dates */}
        <CompactDateFilter />
      </div>

      {/* 10 Clean Activities Cards with Cute Colorful Borders & Bouncy Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activities.map((act, index) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              onClick={() => setSelectedActivity(act.id)}
              className={`bg-gradient-to-r ${act.color} rounded-3xl p-3.5 sm:p-4 border-2 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between group active:scale-95 hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${act.iconBg} border border-white flex items-center justify-center shadow-2xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-200`}>
                  <span className="text-lg animate-cute-wiggle">{act.emoji}</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
                    {index + 1}. {act.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Click to enter & view</span>
                    <span className="text-[10px] text-indigo-700 font-extrabold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                      Overall: {act.overallStars} ⭐
                    </span>
                  </div>
                </div>
              </div>

              {/* Stars badge on Right side */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border ${act.badgeColor} font-black text-xs sm:text-sm shadow-2xs group-hover:scale-105 transition-transform`}>
                  <span>{act.stars}</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 👑 Overall Summary Card (From the Beginning to Present) at bottom */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-700 text-white rounded-3xl p-5 border-2 border-amber-300/50 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/20">
          <div>
            <span className="text-xs font-black text-amber-300 uppercase tracking-widest block">
              Overall (From Beginning to Present)
            </span>
            <span className="text-xs text-sky-200 font-bold">
              Cumulative All-Time Stars • {selectedMember?.name}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400 animate-spin-slow" />
            <span className="text-2xl sm:text-3xl font-black text-amber-300">
              {overallBreakdown.totalStars}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3.5 text-xs">
          {activities.map((act) => (
            <div key={act.id} className="bg-white/5 rounded-2xl p-2.5 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] text-slate-300 font-semibold truncate">
                {act.emoji} {act.name}
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-amber-200/80">Overall</span>
                <span className="font-black text-amber-300 text-xs">
                  {act.overallStars} ⭐
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
