import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime, formatTimeOnly } from '../../utils/dateUtils';
import {
  calculatePreachingAcademyStars,
  calculatePreachingAcademyDateBreakdown,
  calculatePreachingAcademyStarsInRange,
} from '../../utils/starCalculations';
import {
  ArrowLeft,
  Star,
  BookMarked,
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
  BookOpen,
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

export default function PreachingAcademy({ onBack }) {
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
  const targetMemberId = currentUser?.id;

  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
  const activityData = getMemberActivity(targetMemberId);
  const preachingData = activityData.preachingAcademy || { bookChecks: [], timestamps: {} };
  const overallBreakdown = getMemberOverallStarsBreakdown(targetMemberId);

  const canEdit = canEditMember(targetMemberId);
  const canModifyDates = canUserModifyPastDates(currentUser);
  const isTodayOnlyUser = !canModifyDates;
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isMember = currentUser?.role === 'member';
  const isAdminOrManager = isAdmin || isManager;

  const bookChecks = preachingData.bookChecks || [];
  const timestamps = preachingData.timestamps || {};

  const totalStars = calculatePreachingAcademyStars(bookChecks);

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
    return calculatePreachingAcademyDateBreakdown(bookChecks, timestamps);
  }, [bookChecks, timestamps]);

  const selectedDateStars = dateBreakdown.starsByDate[selectedDate] || 0;

  const rangeResult = useMemo(() => {
    return calculatePreachingAcademyStarsInRange(
      bookChecks,
      timestamps,
      dateRange?.startDate,
      dateRange?.endDate
    );
  }, [bookChecks, timestamps, dateRange?.startDate, dateRange?.endDate]);

  const rangeStars = rangeResult.stars;
  const rangeBooksCount = rangeResult.count;
  const milestoneKeys = dateBreakdown.milestoneKeys;

  // Next Milestone calculation: 5 checks = 10⭐, then every 2 checks = +10⭐
  const totalCount = bookChecks.length;
  let nextMilestoneCount = 5;
  if (totalCount >= 5) {
    nextMilestoneCount = 5 + (Math.floor((totalCount - 5) / 2) + 1) * 2;
  }
  const itemsNeededForNextMilestone = nextMilestoneCount - totalCount;

  // Items completed on selected date
  const itemsOnSelectedDate = useMemo(() => {
    return bookChecks.filter(key => {
      const stamp = timestamps[key];
      if (!stamp) return false;
      const parsed = parseStampToDateAndTime(stamp);
      return parsed.date === selectedDate;
    });
  }, [bookChecks, timestamps, selectedDate]);

  // History grouped by date with stars
  const historyByDate = useMemo(() => {
    const map = {};
    bookChecks.forEach(key => {
      const stamp = timestamps[key];
      const parsed = parseStampToDateAndTime(stamp);
      const d = parsed.date;
      if (!map[d]) map[d] = [];
      map[d].push({ key, time12: parsed.time12 });
    });

    const sortedDates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(dateKey => ({
      date: dateKey,
      items: map[dateKey],
      count: map[dateKey].length,
      stars: dateBreakdown.starsByDate[dateKey] || 0,
    }));
  }, [bookChecks, timestamps, dateBreakdown]);

  // Toggle Check
  const toggleCheck = (key) => {
    if (!canEdit) return;
    const isChecked = bookChecks.includes(key);

    if (isChecked) {
      if (canModifyDates) {
        const parsed = parseStampToDateAndTime(timestamps[key]);
        setEditingKey(key);
        setEditDate(parsed.date);
        setEditTime(parsed.time24);
        return;
      } else {
        if (confirm(`Uncheck ${key}?`)) {
          const newChecks = bookChecks.filter(k => k !== key);
          const newTimestamps = { ...timestamps };
          delete newTimestamps[key];
          updateMemberActivity(targetMemberId, 'preachingAcademy', {
            ...preachingData,
            bookChecks: newChecks,
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

    const newChecks = [...bookChecks, key];
    const newTimestamps = { ...timestamps, [key]: newStamp };

    updateMemberActivity(targetMemberId, 'preachingAcademy', {
      ...preachingData,
      bookChecks: newChecks,
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

    updateMemberActivity(targetMemberId, 'preachingAcademy', {
      ...preachingData,
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
    const newChecks = bookChecks.filter(k => k !== keyToRemove);
    const newTimestamps = { ...timestamps };
    delete newTimestamps[keyToRemove];

    updateMemberActivity(targetMemberId, 'preachingAcademy', {
      ...preachingData,
      bookChecks: newChecks,
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
        <div className="rounded-3xl bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-700 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-sky-400/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-100 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-200" />
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

          <div className="flex items-center justify-between text-[11px] text-sky-100 font-semibold border-t border-white/20 pt-2">
            <span>{itemsOnSelectedDate.length} lessons on {selectedDate}</span>
            <span className="text-[10px] text-sky-200 font-bold">Single Day</span>
          </div>
        </div>

        {/* 2. Date Range / This Week Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-600 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-teal-300/40">
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

          <div className="flex items-center justify-between text-[11px] text-teal-100 font-semibold border-t border-white/20 pt-2">
            <span>{rangeBooksCount} lessons in this cycle</span>
            <span className="text-[10px] text-teal-200 font-bold">Week Cycle</span>
          </div>
        </div>

        {/* 3. All-Time Overall Total Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-600 to-sky-700 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-amber-300/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
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
            <span>{bookChecks.length} / 120 completed</span>
            <span className="text-[10px] text-amber-300 font-bold">Curriculum</span>
          </div>
        </div>
      </div>

      {/* Motivational Milestone Progress Banner */}
      <div className="p-3 bg-gradient-to-r from-sky-50 to-teal-50 rounded-2xl border border-sky-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            🎯
          </div>
          <div>
            <span className="font-extrabold text-slate-800">
              {totalCount < 5
                ? `Rule: First 5 lessons = 10 ⭐ (${totalCount}/5 completed)`
                : `Next Milestone: +10 ⭐ at ${nextMilestoneCount} lessons`}
            </span>
            <p className="text-[10px] text-slate-500 font-medium">
              Complete <strong className="text-sky-700 font-bold">{itemsNeededForNextMilestone}</strong> more lesson{itemsNeededForNextMilestone === 1 ? '' : 's'} on any date to unlock the next <strong className="text-amber-600">+10 ⭐</strong>!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-teal-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${totalCount < 5 ? (totalCount / 5) * 100 : (((totalCount - 5) % 2) / 2) * 100}%`
              }}
            />
          </div>
          <span className="text-[10px] font-black text-sky-700 font-mono">
            {totalCount < 5 ? `${totalCount}/5` : `${(totalCount - 5) % 2}/2`}
          </span>
        </div>
      </div>

      {/* 📅 Interactive Calendar & Date Modify Control Center */}
      <div className="bg-gradient-to-br from-white to-sky-50/50 rounded-3xl p-4 sm:p-5 border-2 border-sky-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shadow-inner">
              <Calendar className="w-5 h-5 text-sky-600" />
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
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white hover:bg-sky-50 text-slate-600 border border-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white hover:bg-sky-50 text-slate-600 border border-slate-200'
              }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Active Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 bg-sky-50/50 text-slate-800 cursor-pointer w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-sky-800 bg-sky-50 font-bold px-2.5 py-1 rounded-xl border border-sky-200 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>{selectedDateStars} Stars on this date</span>
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-t border-sky-100 pt-3 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>All 12 Books</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('dateOnly')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'dateOnly'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Completed on {selectedDate}</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-white text-sky-900 font-black">
              {itemsOnSelectedDate.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'history'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Practice Calendar History</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-900 font-bold">
              {historyByDate.length} days
            </span>
          </button>
        </div>
      </div>

      {/* 12 BOOKS GRID */}
      {viewMode !== 'history' && (
        <div className="space-y-4">
        {viewMode === 'dateOnly' && (
          <div className="p-3.5 bg-sky-50/80 rounded-2xl border border-sky-200 flex items-center justify-between text-xs">
            <span className="font-bold text-sky-950">
              Filtered: Displaying only lessons completed on <strong>{selectedDate}</strong> ({itemsOnSelectedDate.length} lessons)
            </span>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className="text-xs font-black text-sky-600 hover:text-sky-800 underline cursor-pointer"
            >
              Switch to All Books
            </button>
          </div>
        )}

        {/* Book 1 to 12 Cards */}
        {Array.from({ length: 12 }, (_, i) => i + 1).map(bookNum => {
          const bookSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          const visibleSteps = viewMode === 'dateOnly'
            ? bookSteps.filter(s => {
                const key = `B${bookNum}-${s}`;
                const parsed = timestamps[key] ? parseStampToDateAndTime(timestamps[key]) : null;
                return bookChecks.includes(key) && parsed?.date === selectedDate;
              })
            : bookSteps;

          if (viewMode === 'dateOnly' && visibleSteps.length === 0) return null;

          return (
            <div key={bookNum} className="bg-white rounded-3xl p-4 border-2 border-sky-100 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-sky-900 flex items-center gap-1.5">
                  <BookMarked className="w-3.5 h-3.5 text-sky-600" />
                  <span>Book-{bookNum}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">10 Lessons</span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {visibleSteps.map(step => {
                  const key = `B${bookNum}-${step}`;
                  const isChecked = bookChecks.includes(key);
                  const stamp = timestamps[key];
                  const parsed = stamp ? parseStampToDateAndTime(stamp) : null;
                  const isMatchingActiveDate = parsed?.date === selectedDate;
                  const isMilestone = milestoneKeys.has(key);

                  return (
                    <div
                      key={key}
                      onClick={() => toggleCheck(key)}
                      className={`relative group py-2 px-1 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer ${
                        isChecked
                          ? isMatchingActiveDate
                            ? 'bg-gradient-to-br from-sky-600 to-teal-700 text-white border-sky-500 shadow-xs scale-102 font-black ring-2 ring-sky-300'
                            : 'bg-sky-600 text-white border-sky-600 shadow-xs font-black'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-sky-50 hover:border-sky-300 active:scale-95'
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
                        <span className="text-[7px] text-sky-100 mt-0.5 leading-none scale-90 truncate max-w-full font-semibold">
                          {parsed?.date ? parsed.date.slice(5) : stamp.split('•')[0] || stamp}
                        </span>
                      )}

                      {isChecked && canEdit && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenModifyModal(e, key)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-sky-700 shadow-xs flex items-center justify-center hover:scale-110 transition-all opacity-80 group-hover:opacity-100"
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
      </div>
    )}

      {/* 📜 Practice History by Date (Only shown when History tab is clicked) */}
      {viewMode === 'history' && (
        <div id="preaching-history-section" className="bg-white rounded-3xl p-5 border-2 border-sky-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-sky-600" />
              <span>📜 Practice History by Date</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological log of every book lesson completed with date, time, and stars earned
            </p>
          </div>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200">
            Total Active Days: {historyByDate.length}
          </span>
        </div>

        {historyByDate.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <BookMarked className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No lessons completed yet. Check lessons in the books above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyByDate.map((group) => (
              <div
                key={group.date}
                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                  group.stars > 0
                    ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                    : 'bg-slate-50 hover:bg-sky-50/40 border-slate-200'
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
                    <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.2 rounded-full">
                      {group.count} {group.count === 1 ? 'lesson' : 'lessons'}
                    </span>

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
                    className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View in Grid</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.items.map(({ key, time12 }) => {
                    const isMilestone = milestoneKeys.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={(e) => canModifyDates && handleOpenModifyModal(e, key)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                          canModifyDates ? 'cursor-pointer group hover:bg-sky-100 hover:border-sky-300' : 'cursor-default'
                        } ${
                          isMilestone
                            ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 font-black'
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                        title={canModifyDates ? `Click to modify date for ${key}` : `${key} completed at ${time12}`}
                      >
                        <span className={isMilestone ? 'text-amber-800' : 'text-sky-700'}>{key}</span>
                        {isMilestone && <Star className="w-3 h-3 fill-amber-500 text-amber-600" />}
                        <span className="text-[10px] text-slate-400 font-medium">({time12})</span>
                        {canModifyDates && <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-sky-600" />}
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

      {/* 📅 Date Modification Modal for Checked Lesson */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-sky-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Modify Completion Date
                  </h3>
                  <p className="text-[11px] text-sky-700 font-semibold">
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
                      className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold hover:bg-sky-100"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDate(yesterdayStr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold hover:bg-sky-100"
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
                  className="w-full px-3 py-2 text-xs font-bold border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 bg-slate-50 text-slate-900 cursor-pointer"
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
                  className="w-full px-3 py-2 text-xs font-bold border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 bg-slate-50 text-slate-900 cursor-pointer"
                />
              </div>

              {/* Formatted Output Preview */}
              <div className="p-2.5 bg-sky-50/70 rounded-xl border border-sky-100 text-xs">
                <span className="text-[10px] font-bold text-sky-600 block uppercase">
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
                    className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
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
