import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime, formatTimeOnly } from '../../utils/dateUtils';
import {
  calculateElohimAcademyStars,
  calculateElohimDateBreakdown,
  calculateElohimAcademyStarsInRange,
} from '../../utils/starCalculations';
import {
  ArrowLeft,
  Star,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Edit3,
  Sparkles,
  History,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

function time12To24(time12) {
  if (!time12) return '12:00';
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '12:00';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function time24To12(time24) {
  if (!time24) return '12:00 PM';
  const parts = time24.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

function createStampFromDateAndTime(dateStr, time12Str = '12:00 PM') {
  if (!dateStr) return formatDateTime(new Date());
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd}-${mm}-${yyyy} • ${time12Str}`;
  }
  return `${dateStr} • ${time12Str}`;
}

function parseStampToDateAndTime(stamp) {
  if (!stamp) {
    const today = formatDate(new Date());
    const time = formatTimeOnly(new Date());
    return { date: today, time12: time, time24: time12To24(time) };
  }

  let datePart = '';
  let timePart = '12:00 PM';

  if (stamp.includes('•')) {
    const [d, t] = stamp.split('•');
    datePart = d.trim();
    timePart = t ? t.trim() : '12:00 PM';
  } else {
    datePart = stamp.trim();
  }

  let yyyyMmDd = '';
  const dmyMatch = datePart.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmyMatch) {
    yyyyMmDd = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  } else {
    const ymdMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      yyyyMmDd = `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
    } else {
      try {
        const d = new Date(datePart);
        if (!isNaN(d.getTime())) yyyyMmDd = formatDate(d);
      } catch (e) {}
    }
  }

  if (!yyyyMmDd) yyyyMmDd = formatDate(new Date());

  return {
    date: yyyyMmDd,
    time12: timePart,
    time24: time12To24(timePart),
  };
}

export default function ElohimAcademy({ onBack }) {
  const {
    selectedMemberId,
    data,
    getMemberActivity,
    updateMemberActivity,
    currentUser,
    canEditMember,
    canUserModifyPastDates,
    getMemberOverallStarsBreakdown,
    dateRange,
  } = useApp();

  // Enforce privacy: regular member always sees own activity
  const targetMemberId = (currentUser?.role === 'admin' || currentUser?.role === 'manager')
    ? selectedMemberId
    : currentUser?.id;

  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
  const activityData = getMemberActivity(targetMemberId);
  const elohimData = activityData.elohimAcademy || { levelChecks: [], somChecks: [], timestamps: {} };
  const overallBreakdown = getMemberOverallStarsBreakdown(targetMemberId);

  const canEdit = canEditMember(targetMemberId);
  const canModifyDates = canUserModifyPastDates(currentUser);
  const isTodayOnlyUser = !canModifyDates;
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isMember = currentUser?.role === 'member';
  const isAdminOrManager = isAdmin || isManager;

  const levelChecks = elohimData.levelChecks || [];
  const somChecks = elohimData.somChecks || [];
  const timestamps = elohimData.timestamps || {};

  const totalStars = calculateElohimAcademyStars(levelChecks, somChecks);

  // Dates
  const todayStr = formatDate(new Date());
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayObj);

  // Calendar & View State
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'dateOnly' | 'history'

  // Date Modification Modal State
  const [editingKey, setEditingKey] = useState(null);
  const [editDate, setEditDate] = useState(todayStr);
  const [editTime, setEditTime] = useState('12:00');

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // 🌟 Date-Based Star Breakdown Calculations
  const dateBreakdown = useMemo(() => {
    return calculateElohimDateBreakdown(levelChecks, somChecks, timestamps);
  }, [levelChecks, somChecks, timestamps]);

  const selectedDateStars = dateBreakdown.starsByDate[selectedDate] || 0;

  const rangeResult = useMemo(() => {
    return calculateElohimAcademyStarsInRange(
      levelChecks,
      somChecks,
      timestamps,
      dateRange?.startDate,
      dateRange?.endDate
    );
  }, [levelChecks, somChecks, timestamps, dateRange?.startDate, dateRange?.endDate]);

  const rangeStars = rangeResult.stars;
  const rangeItemsCount = rangeResult.count;
  const milestoneKeys = dateBreakdown.milestoneKeys;

  // Next Milestone calculations
  // 1. Levels (Levels 1-5, total 50 lessons): 2 checks = 10⭐, then every 1 check = +10⭐
  const levelCount = levelChecks.length;
  let nextLevelMilestone = 2;
  if (levelCount >= 2) {
    nextLevelMilestone = Math.min(50, levelCount + 1);
  }
  const levelsNeededForNextMilestone = levelCount >= 50 ? 0 : (levelCount < 2 ? 2 - levelCount : 1);

  // 2. SOM (SOM 1-20, total 20 lessons): 4 checks = 10⭐, then every 2 checks = +10⭐
  const somCount = somChecks.length;
  let nextSomMilestone = 4;
  if (somCount >= 4) {
    nextSomMilestone = Math.min(20, 4 + (Math.floor((somCount - 4) / 2) + 1) * 2);
  }
  const somNeededForNextMilestone = somCount >= 20 ? 0 : (somCount < 4 ? 4 - somCount : nextSomMilestone - somCount);

  // Items completed on selected date
  const itemsOnSelectedDate = useMemo(() => {
    const list = [];
    [...levelChecks, ...somChecks].forEach(key => {
      const stamp = timestamps[key];
      if (!stamp) return;
      const parsed = parseStampToDateAndTime(stamp);
      if (parsed.date === selectedDate) {
        list.push({ key, isSom: key.startsWith('SOM-') });
      }
    });
    return list;
  }, [levelChecks, somChecks, timestamps, selectedDate]);

  // History grouped by date with stars
  const historyByDate = useMemo(() => {
    const map = {};
    [...levelChecks, ...somChecks].forEach(key => {
      const stamp = timestamps[key];
      const parsed = parseStampToDateAndTime(stamp);
      const d = parsed.date;
      if (!map[d]) map[d] = [];
      map[d].push({ key, isSom: key.startsWith('SOM-'), time12: parsed.time12 });
    });

    const sortedDates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(dateKey => ({
      date: dateKey,
      items: map[dateKey],
      count: map[dateKey].length,
      stars: dateBreakdown.starsByDate[dateKey] || 0,
    }));
  }, [levelChecks, somChecks, timestamps, dateBreakdown]);

  // Toggle Level Check
  const toggleLevelCheck = (key) => {
    if (!canEdit) return;
    const isChecked = levelChecks.includes(key);

    if (isChecked) {
      if (canModifyDates) {
        const parsed = parseStampToDateAndTime(timestamps[key]);
        setEditingKey(key);
        setEditDate(parsed.date);
        setEditTime(parsed.time24);
        return;
      } else {
        if (confirm(`Uncheck ${key}?`)) {
          const newLevelChecks = levelChecks.filter(k => k !== key);
          const newTimestamps = { ...timestamps };
          delete newTimestamps[key];
          updateMemberActivity(targetMemberId, 'elohimAcademy', {
            ...elohimData,
            levelChecks: newLevelChecks,
            timestamps: newTimestamps,
          });
          showToast(`${key} unchecked.`);
        }
        return;
      }
    }

    // RULE: Users without past date permission can ONLY record inputs for Today (todayStr)
    const targetDate = isTodayOnlyUser ? todayStr : selectedDate;
    const now = new Date();
    const time12 = formatTimeOnly(now);
    const newStamp = createStampFromDateAndTime(targetDate, time12);

    const newLevelChecks = [...levelChecks, key];
    const newTimestamps = { ...timestamps, [key]: newStamp };

    updateMemberActivity(targetMemberId, 'elohimAcademy', {
      ...elohimData,
      levelChecks: newLevelChecks,
      timestamps: newTimestamps,
    });
    showToast(`✓ ${key} completed on ${isTodayOnlyUser ? `Today (${targetDate})` : targetDate}!`);
  };

  // Toggle SOM Check
  const toggleSomCheck = (key) => {
    if (!canEdit) return;
    const isChecked = somChecks.includes(key);

    if (isChecked) {
      if (canModifyDates) {
        const parsed = parseStampToDateAndTime(timestamps[key]);
        setEditingKey(key);
        setEditDate(parsed.date);
        setEditTime(parsed.time24);
        return;
      } else {
        if (confirm(`Uncheck ${key}?`)) {
          const newSomChecks = somChecks.filter(k => k !== key);
          const newTimestamps = { ...timestamps };
          delete newTimestamps[key];
          updateMemberActivity(targetMemberId, 'elohimAcademy', {
            ...elohimData,
            somChecks: newSomChecks,
            timestamps: newTimestamps,
          });
          showToast(`${key} unchecked.`);
        }
        return;
      }
    }

    // RULE: Users without past date permission can ONLY record inputs for Today (todayStr)
    const targetDate = isTodayOnlyUser ? todayStr : selectedDate;
    const now = new Date();
    const time12 = formatTimeOnly(now);
    const newStamp = createStampFromDateAndTime(targetDate, time12);

    const newSomChecks = [...somChecks, key];
    const newTimestamps = { ...timestamps, [key]: newStamp };

    updateMemberActivity(targetMemberId, 'elohimAcademy', {
      ...elohimData,
      somChecks: newSomChecks,
      timestamps: newTimestamps,
    });
    showToast(`✓ ${key} completed on ${isTodayOnlyUser ? `Today (${targetDate})` : targetDate}!`);
  };

  const handleOpenModifyModal = (e, key) => {
    e.stopPropagation();
    if (!canModifyDates) return;
    const parsed = parseStampToDateAndTime(timestamps[key]);
    setEditingKey(key);
    setEditDate(parsed.date);
    setEditTime(parsed.time24);
  };

  const handleSaveModifiedDate = (e) => {
    e.preventDefault();
    if (!canModifyDates) return;
    if (!editingKey) return;

    const time12Str = time24To12(editTime);
    const newStamp = createStampFromDateAndTime(editDate, time12Str);

    updateMemberActivity(targetMemberId, 'elohimAcademy', {
      ...elohimData,
      timestamps: {
        ...timestamps,
        [editingKey]: newStamp,
      },
    });

    showToast(`✓ ${editingKey} updated to ${editDate} (${time12Str})`);
    setEditingKey(null);
  };

  const handleUncheckItem = () => {
    if (!editingKey) return;
    const keyToRemove = editingKey;
    const isLevel = keyToRemove.startsWith('L');
    const newLevelChecks = isLevel ? levelChecks.filter(k => k !== keyToRemove) : levelChecks;
    const newSomChecks = !isLevel ? somChecks.filter(k => k !== keyToRemove) : somChecks;
    const newTimestamps = { ...timestamps };
    delete newTimestamps[keyToRemove];

    updateMemberActivity(targetMemberId, 'elohimAcademy', {
      ...elohimData,
      levelChecks: newLevelChecks,
      somChecks: newSomChecks,
      timestamps: newTimestamps,
    });

    showToast(`${keyToRemove} unchecked.`);
    setEditingKey(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Activities</span>
        </button>
        <span className="text-xs font-semibold text-slate-500">
          Member: <strong className="text-slate-800">{selectedMember?.name}</strong>
        </span>
      </div>

      {/* Floating Action Feedback Toast */}
      {toastMsg && (
        <div className="p-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center shadow-lg animate-in slide-in-from-top-2 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ⭐ STAR CALCULATION ACCORDING TO DATES (DASHBOARD) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Selected Calendar Date Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-indigo-300/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-100 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-200" />
              <span>Selected Date</span>
            </span>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
              {selectedDate}
            </span>
          </div>

          {/* Interactive Date Change Option directly on Selected Date Card */}
          <div className="mt-2 flex items-center justify-between gap-1.5 bg-black/20 p-1.5 rounded-2xl border border-white/20">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-2 py-1 rounded-xl text-xs font-black bg-white/20 hover:bg-white/30 text-white border border-white/30 focus:outline-none focus:ring-1 focus:ring-amber-300 cursor-pointer w-full text-center"
              title="Click to select or change date"
            />
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  selectedDate === todayStr ? 'bg-amber-300 text-amber-950 font-black' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  selectedDate === yesterdayStr ? 'bg-amber-300 text-amber-950 font-black' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Yesterday
              </button>
            </div>
          </div>

          <div className="my-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {selectedDateStars}
              </span>
              <Star className="w-7 h-7 fill-amber-300 text-amber-300 animate-pulse" />
            </div>
            {selectedDateStars > 0 && (
              <span className="bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-lg text-[10px] shadow-xs">
                Milestone Hit!
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-indigo-100 font-semibold border-t border-white/20 pt-2">
            <span>{itemsOnSelectedDate.length} items on {selectedDate}</span>
            <span className="text-[10px] text-indigo-200 font-bold">Single Day</span>
          </div>
        </div>

        {/* 2. Date Range / This Week Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-sky-600 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-purple-300/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Date Cycle Stars</span>
            </span>
            <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white backdrop-blur-xs">
              {dateRange?.startDate} → {dateRange?.endDate}
            </span>
          </div>

          <div className="my-2.5 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-300">
              {rangeStars}
            </span>
            <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-purple-100 font-semibold border-t border-white/20 pt-2">
            <span>{rangeItemsCount} items in this cycle</span>
            <span className="text-[10px] text-purple-200 font-bold">Week Cycle</span>
          </div>
        </div>

        {/* 3. All-Time Overall Total Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-600 to-sky-700 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-amber-300/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              <span>Overall Total Stars</span>
            </span>
            <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/30">
              All-Time
            </span>
          </div>

          <div className="my-2.5 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {totalStars}
            </span>
            <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-blue-100 font-semibold border-t border-white/20 pt-2">
            <span>Levels: {levelChecks.length}/50 • SOM: {somChecks.length}/20</span>
            <span className="text-[10px] text-amber-300 font-bold">Curriculum</span>
          </div>
        </div>
      </div>

      {/* 🌟 Motivational Milestone Progress Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Levels 1 to 5 Milestone Banner */}
        <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              🎯
            </div>
            <div>
              <span className="font-extrabold text-slate-800">
                {levelCount < 2
                  ? `Rule: First 2 lessons = 10 ⭐ (${levelCount}/2 completed)`
                  : levelCount >= 50
                  ? `Levels: All 50 Completed! 🏆 (50/50)`
                  : `Next Milestone: +10 ⭐ at ${nextLevelMilestone} lessons`}
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                {levelCount >= 50 ? (
                  'All 50 level lessons completed. Max stars earned!'
                ) : (
                  <>
                    Complete <strong className="text-indigo-700 font-bold">{levelsNeededForNextMilestone}</strong> more lesson{levelsNeededForNextMilestone === 1 ? '' : 's'} on any date to unlock the next <strong className="text-amber-600">+10 ⭐</strong>!
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-20 sm:w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${levelCount < 2 ? (levelCount / 2) * 100 : (levelCount >= 50 ? 100 : (levelCount / 50) * 100)}%`
                }}
              />
            </div>
            <span className="text-[10px] font-black text-indigo-700 font-mono">
              {levelCount < 2 ? `${levelCount}/2` : (levelCount >= 50 ? '50/50' : `${levelCount}/50`)}
            </span>
          </div>
        </div>

        {/* SOM 1 to 20 Milestone Banner */}
        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              🎯
            </div>
            <div>
              <span className="font-extrabold text-slate-800">
                {somCount < 4
                  ? `Rule: First 4 lessons = 10 ⭐ (${somCount}/4 completed)`
                  : somCount >= 20
                  ? `SOM: All 20 Completed! 🏆 (20/20)`
                  : `Next Milestone: +10 ⭐ at ${nextSomMilestone} lessons`}
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                {somCount >= 20 ? (
                  'All 20 Sermon of Mission checkboxes completed. Max stars earned!'
                ) : (
                  <>
                    Complete <strong className="text-amber-800 font-bold">{somNeededForNextMilestone}</strong> more lesson{somNeededForNextMilestone === 1 ? '' : 's'} on any date to unlock the next <strong className="text-amber-600">+10 ⭐</strong>!
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-20 sm:w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-600 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${somCount < 4 ? (somCount / 4) * 100 : (somCount >= 20 ? 100 : (((somCount - 4) % 2) / 2) * 100)}%`
                }}
              />
            </div>
            <span className="text-[10px] font-black text-amber-800 font-mono">
              {somCount < 4 ? `${somCount}/4` : (somCount >= 20 ? '20/20' : `${(somCount - 4) % 2}/2`)}
            </span>
          </div>
        </div>
      </div>

      {/* 📅 Interactive Calendar & Date Modify Control Center */}
      <div className="bg-gradient-to-br from-white to-indigo-50/50 rounded-3xl p-4 sm:p-5 border-2 border-indigo-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-inner">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800">
                Practice Date & Calendar Control
              </h3>
              <p className="text-[11px] text-slate-500">
                Select date to record completed lessons or modify completion dates
              </p>
            </div>
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white hover:bg-indigo-50 text-slate-600 border border-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white hover:bg-indigo-50 text-slate-600 border border-slate-200'
              }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-indigo-100 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Active Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 bg-indigo-50/50 text-slate-800 cursor-pointer w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-indigo-800 bg-indigo-50 font-bold px-2.5 py-1 rounded-xl border border-indigo-200 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>{selectedDateStars} Stars on this date</span>
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-t border-indigo-100 pt-3 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>All Levels & SOM</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('dateOnly')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'dateOnly'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Completed on {selectedDate}</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-white text-indigo-900 font-black">
              {itemsOnSelectedDate.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Practice Calendar History</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-900 font-bold">
              {historyByDate.length} days
            </span>
          </button>
        </div>
      </div>

      {/* LEVELS & SOM GRID */}
      {viewMode !== 'history' && (
        <div className="space-y-4">
          {viewMode === 'dateOnly' && (
            <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-200 flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-950">
                Filtered: Displaying only items completed on <strong>{selectedDate}</strong> ({itemsOnSelectedDate.length} items)
              </span>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Switch to All
              </button>
            </div>
          )}

          {/* Level 1 to Level 5 Cards */}
          {[1, 2, 3, 4, 5].map(lvl => {
            const levelSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const visibleSteps = viewMode === 'dateOnly'
              ? levelSteps.filter(s => {
                  const key = `L${lvl}-${s}`;
                  const parsed = timestamps[key] ? parseStampToDateAndTime(timestamps[key]) : null;
                  return levelChecks.includes(key) && parsed?.date === selectedDate;
                })
              : levelSteps;

            if (viewMode === 'dateOnly' && visibleSteps.length === 0) return null;

            return (
              <div key={lvl} className="bg-white rounded-3xl p-4 border-2 border-indigo-100 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-indigo-800">Level-{lvl}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">10 Lessons</span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {visibleSteps.map(step => {
                    const key = `L${lvl}-${step}`;
                    const isChecked = levelChecks.includes(key);
                    const stamp = timestamps[key];
                    const parsed = stamp ? parseStampToDateAndTime(stamp) : null;
                    const isMatchingActiveDate = parsed?.date === selectedDate;
                    const isMilestone = milestoneKeys.has(key);

                    return (
                      <div
                        key={key}
                        onClick={() => toggleLevelCheck(key)}
                        className={`relative group py-2 px-1 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer ${
                          isChecked
                            ? isMatchingActiveDate
                              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-indigo-500 shadow-xs scale-102 font-black ring-2 ring-indigo-300'
                              : 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-black'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 active:scale-95'
                        }`}
                        title={
                          isChecked
                            ? `${key} completed on ${stamp} (Click to Modify Date)`
                            : `Click to record ${key} for ${selectedDate}`
                        }
                      >
                        {isChecked && isMilestone && (
                          <div
                            className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs border border-amber-200 animate-pulse"
                            title="Milestone Lesson! Earned +10 Stars on completion date"
                          >
                            <Star className="w-2.5 h-2.5 fill-amber-950" />
                          </div>
                        )}

                        <span className="text-xs font-black">{step}</span>
                        <span className="text-[9px] mt-0.5">{isChecked ? '✓' : '□'}</span>
                        {isChecked && stamp && (
                          <span className="text-[7px] text-indigo-100 mt-0.5 leading-none scale-90 truncate max-w-full font-semibold">
                            {parsed?.date ? parsed.date.slice(5) : stamp.split('•')[0] || stamp}
                          </span>
                        )}

                        {isChecked && canEdit && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenModifyModal(e, key)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-indigo-700 shadow-xs flex items-center justify-center hover:scale-110 transition-all opacity-80 group-hover:opacity-100"
                            title="Modify completion date"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* SOM 1 to 20 Section */}
          {(() => {
            const somNums = Array.from({ length: 20 }, (_, i) => i + 1);
            const visibleSom = viewMode === 'dateOnly'
              ? somNums.filter(num => {
                  const key = `SOM-${num}`;
                  const parsed = timestamps[key] ? parseStampToDateAndTime(timestamps[key]) : null;
                  return somChecks.includes(key) && parsed?.date === selectedDate;
                })
              : somNums;

            if (viewMode === 'dateOnly' && visibleSom.length === 0) return null;

            return (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-amber-300 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs sm:text-sm font-black text-amber-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>SOM 1 to 20 Checkboxes</span>
                  </h3>
                  <span className="text-[11px] text-amber-800 font-bold bg-amber-100 px-2.5 py-0.5 rounded-lg">
                    4 checks: 10 ⭐, then every 2 checks: 10 ⭐
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
                  {visibleSom.map(num => {
                    const key = `SOM-${num}`;
                    const isChecked = somChecks.includes(key);
                    const stamp = timestamps[key];
                    const parsed = stamp ? parseStampToDateAndTime(stamp) : null;
                    const isMatchingActiveDate = parsed?.date === selectedDate;
                    const isMilestone = milestoneKeys.has(key);

                    return (
                      <div
                        key={key}
                        onClick={() => toggleSomCheck(key)}
                        className={`relative group py-2.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer ${
                          isChecked
                            ? isMatchingActiveDate
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400 shadow-xs scale-102 font-black ring-2 ring-amber-300'
                              : 'bg-amber-500 text-white border-amber-500 shadow-xs font-black'
                            : 'bg-amber-50/40 text-amber-900 border-amber-200 hover:bg-amber-100/50 active:scale-95'
                        }`}
                        title={
                          isChecked
                            ? `${key} completed on ${stamp} (Click to Modify Date)`
                            : `Click to record ${key} for ${selectedDate}`
                        }
                      >
                        {isChecked && isMilestone && (
                          <div
                            className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-white text-amber-800 flex items-center justify-center shadow-xs border border-amber-300 animate-pulse"
                            title="Milestone SOM! Earned +10 Stars on completion date"
                          >
                            <Star className="w-2.5 h-2.5 fill-amber-500" />
                          </div>
                        )}

                        <span className="text-xs font-black">{num}</span>
                        <span className="text-[10px]">{isChecked ? '✓' : '□'}</span>
                        {isChecked && stamp && (
                          <span className="text-[7px] text-amber-100 mt-0.5 leading-none scale-90 truncate max-w-full font-semibold">
                            {parsed?.date ? parsed.date.slice(5) : stamp.split('•')[0] || stamp}
                          </span>
                        )}

                        {isChecked && canEdit && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenModifyModal(e, key)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-amber-800 shadow-xs flex items-center justify-center hover:scale-110 transition-all opacity-80 group-hover:opacity-100"
                            title="Modify completion date"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 📜 Practice History by Date (Only shown when History tab is clicked) */}
      {viewMode === 'history' && (
        <div id="elohim-history-section" className="bg-white rounded-3xl p-5 border-2 border-indigo-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>📜 Practice History by Date</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological log of every lesson and SOM completed with date, time, and stars earned
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
            Total Active Days: {historyByDate.length}
          </span>
        </div>

        {historyByDate.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No lessons completed yet. Check lessons in the grid above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyByDate.map((group) => (
              <div
                key={group.date}
                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                  group.stars > 0
                    ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                    : 'bg-slate-50 hover:bg-indigo-50/40 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900 font-mono">
                      📅 {group.date}
                    </span>
                    {group.date === todayStr && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                        Today
                      </span>
                    )}
                    {group.date === yesterdayStr && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full">
                        Yesterday
                      </span>
                    )}
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.2 rounded-full">
                      {group.count} {group.count === 1 ? 'lesson' : 'lessons'}
                    </span>

                    {/* Stars earned on this date */}
                    {group.stars > 0 ? (
                      <span className="text-xs font-black text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-2.5 py-0.5 rounded-full border border-amber-400 shadow-2xs flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-700 text-amber-800" />
                        <span>+{group.stars} Stars Earned!</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        (Progress towards next milestone)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(group.date);
                      setViewMode('dateOnly');
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View in Grid</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.items.map(({ key, isSom, time12 }) => {
                    const isMilestone = milestoneKeys.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={(e) => canModifyDates && handleOpenModifyModal(e, key)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                          canModifyDates ? 'cursor-pointer group hover:bg-indigo-100 hover:border-indigo-300' : 'cursor-default'
                        } ${
                          isMilestone
                            ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 font-black'
                            : isSom
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                        title={canModifyDates ? `Click to modify date for ${key}` : `${key} completed at ${time12}`}
                      >
                        <span>{key}</span>
                        {isMilestone && <Star className="w-3 h-3 fill-amber-500 text-amber-600" />}
                        <span className="text-[10px] text-slate-400 font-medium">({time12})</span>
                        {canModifyDates && <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* 📅 Date Modification Modal for Checked Item */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-indigo-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Modify Completion Date
                  </h3>
                  <p className="text-[11px] text-indigo-700 font-semibold">
                    Lesson: {editingKey}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingKey(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2.5 mb-3">
              Member: <strong className="text-slate-800">{selectedMember?.name}</strong>
            </p>

            {/* Date Modify Form */}
            <form onSubmit={handleSaveModifiedDate} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Completion Date:
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditDate(todayStr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDate(yesterdayStr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Completion Time:
                </label>
                <input
                  type="time"
                  required
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-slate-900 cursor-pointer"
                />
              </div>

              {/* Formatted Output Preview */}
              <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs">
                <span className="text-[10px] font-bold text-indigo-600 block uppercase">
                  Formatted Timestamp Preview:
                </span>
                <span className="font-extrabold text-slate-800 font-mono text-[11px]">
                  📅 {createStampFromDateAndTime(editDate, time24To12(editTime))}
                </span>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUncheckItem}
                  className="px-3 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                  title="Remove this lesson from completed list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Uncheck</span>
                </button>

                <div className="flex-1 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingKey(null)}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Date</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
