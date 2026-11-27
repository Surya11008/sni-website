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
  const { selectedMemberId, data, getMemberStarsBreakdown, getMemberOverallStarsBreakdown, currentUser, t } = useApp();
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

  // Privacy Rule: Regular members see ONLY their own stars!
  const targetMemberId = (currentUser?.role === 'admin' || currentUser?.role === 'manager')
    ? selectedMemberId
    : currentUser?.id;

  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
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
      color: 'from-sky-100 via-sky-50 to-blue-100 border-2 border-sky-400 text-sky-950',
      badgeColor: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black shadow-xs',
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs',
      component: SimplePreaching,
    },
    {
      id: 'connections',
      name: t('actConnections') || 'Connections',
      icon: Network,
      emoji: '🌐',
      stars: breakdown.connections.stars,
      overallStars: overallBreakdown.connections.stars,
      color: 'from-purple-100 via-purple-50 to-indigo-100 border-2 border-purple-400 text-purple-950',
      badgeColor: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black shadow-xs',
      iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xs',
      component: Connections,
    },
    {
      id: 'fruits',
      name: t('actFruits') || 'Fruits 🍇',
      icon: Grape,
      emoji: '🍇',
      stars: breakdown.fruits.stars,
      overallStars: overallBreakdown.fruits.stars,
      color: 'from-pink-100 via-pink-50 to-rose-100 border-2 border-pink-400 text-pink-950',
      badgeColor: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black shadow-xs',
      iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-xs',
      component: Fruits,
    },
    {
      id: 'lostSheep',
      name: t('actLostSheep') || 'Lost Sheep 🐑',
      icon: Sparkle,
      emoji: '🐑',
      stars: breakdown.lostSheep.stars,
      overallStars: overallBreakdown.lostSheep.stars,
      color: 'from-emerald-100 via-emerald-50 to-teal-100 border-2 border-emerald-400 text-emerald-950',
      badgeColor: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-xs',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs',
      component: LostSheep,
    },
    {
      id: 'preachingMeeting',
      name: t('actPreachingMeeting') || 'Preaching Meeting',
      icon: CalendarCheck,
      emoji: '📅',
      stars: breakdown.preachingMeeting.stars,
      overallStars: overallBreakdown.preachingMeeting.stars,
      color: 'from-amber-100 via-amber-50 to-yellow-100 border-2 border-amber-400 text-amber-950',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-black shadow-xs',
      iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-xs',
      component: PreachingMeeting,
    },
    {
      id: 'worshipArrival',
      name: t('actWorshipArrival') || 'Worship Arrival',
      icon: Clock,
      emoji: '⏰',
      stars: breakdown.worshipArrival.stars,
      overallStars: overallBreakdown.worshipArrival.stars,
      color: 'from-blue-100 via-cyan-50 to-sky-100 border-2 border-blue-400 text-blue-950',
      badgeColor: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-black shadow-xs',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-xs',
      component: WorshipArrival,
    },
    {
      id: 'education',
      name: t('actEducation') || 'Education 📚',
      icon: GraduationCap,
      emoji: '📚',
      stars: breakdown.education.stars,
      overallStars: overallBreakdown.education.stars,
      color: 'from-orange-100 via-orange-50 to-amber-100 border-2 border-orange-400 text-orange-950',
      badgeColor: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black shadow-xs',
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xs',
      component: Education,
    },
    {
      id: 'elohimAcademy',
      name: t('actElohimAcademy') || 'Elohim Academy',
      icon: Award,
      emoji: '🏆',
      stars: breakdown.elohimAcademy.stars,
      overallStars: overallBreakdown.elohimAcademy.stars,
      color: 'from-indigo-100 via-indigo-50 to-purple-100 border-2 border-indigo-400 text-indigo-950',
      badgeColor: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black shadow-xs',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs',
      component: ElohimAcademy,
    },
    {
      id: 'preachingAcademy',
      name: t('actPreachingAcademy') || 'Preaching Academy 📖',
      icon: BookOpen,
      emoji: '📖',
      stars: breakdown.preachingAcademy.stars,
      overallStars: overallBreakdown.preachingAcademy.stars,
      color: 'from-teal-100 via-teal-50 to-emerald-100 border-2 border-teal-400 text-teal-950',
      badgeColor: 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black shadow-xs',
      iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xs',
      component: PreachingAcademy,
    },
    {
      id: 'newSongAcademy',
      name: t('actNewSongAcademy') || 'New Song Academy 🎶',
      icon: Music,
      emoji: '🎶',
      stars: breakdown.newSongAcademy.stars,
      overallStars: overallBreakdown.newSongAcademy.stars,
      color: 'from-rose-100 via-rose-50 to-pink-100 border-2 border-rose-400 text-rose-950',
      badgeColor: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black shadow-xs',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs',
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

      {/* 🌟 Cute Colorful Top Bar: Total Stars on Left, Cute Date Filter on Right */}
      <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100 border-2 border-amber-300 rounded-3xl p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-sm cute-glow-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 font-black text-amber-950 text-2xl sm:text-3xl">
            <Star className="w-7 h-7 fill-amber-400 text-amber-500 animate-spin-slow" />
            <span>{breakdown.totalStars}</span>
          </div>
          <div>
            <span className="text-xs font-black text-amber-800 uppercase tracking-wider block">
              {t('totalStars') || 'Total Stars'}
            </span>
            <span className="text-[11px] text-amber-700/80 font-bold">
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
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 border-2 border-amber-300 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-800">
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
