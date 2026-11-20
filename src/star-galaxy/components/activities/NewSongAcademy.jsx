import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime, formatTimeOnly } from '../../utils/dateUtils';
import {
  calculateNewSongAcademyStars,
  calculateNewSongDateBreakdown,
  calculateNewSongAcademyStarsInRange,
} from '../../utils/starCalculations';
import {
  ArrowLeft,
  Star,
  Music,
  Search,
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
  Filter,
  ChevronRight,
  Award,
  TrendingUp,
} from 'lucide-react';

/**
 * Time and Date Helpers for New Song Academy
 */
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

export default function NewSongAcademy({ onBack }) {
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
  const songData = activityData.newSongAcademy || { songChecks: [], timestamps: {} };
  const overallBreakdown = getMemberOverallStarsBreakdown(targetMemberId);

  const canEdit = canEditMember(targetMemberId);
  const canModifyDates = canUserModifyPastDates(currentUser);
  const isTodayOnlyUser = !canModifyDates;
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isMember = currentUser?.role === 'member';
  const isAdminOrManager = isAdmin || isManager;

  const songChecks = songData.songChecks || [];
  const timestamps = songData.timestamps || {};

  const totalStars = calculateNewSongAcademyStars(songChecks);

  // Dates
  const todayStr = formatDate(new Date());
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayObj);

  // Calendar & View State
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'dateOnly' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRange, setSelectedRange] = useState('1-50');

  // Date Modification Modal State
  const [editingSongNum, setEditingSongNum] = useState(null);
  const [editDate, setEditDate] = useState(todayStr);
  const [editTime, setEditTime] = useState('12:00');

  // Toast message
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // 🌟 Date-Based Star Breakdown Calculations
  const dateBreakdown = useMemo(() => {
    return calculateNewSongDateBreakdown(songChecks, timestamps);
  }, [songChecks, timestamps]);

  // Stars earned on the selected calendar date
  const selectedDateStars = dateBreakdown.starsByDate[selectedDate] || 0;

  // Stars earned in the active dateRange (e.g. this week Saturday to Friday or custom filter)
  const rangeResult = useMemo(() => {
    return calculateNewSongAcademyStarsInRange(
      songChecks,
      timestamps,
      dateRange?.startDate,
      dateRange?.endDate
    );
  }, [songChecks, timestamps, dateRange?.startDate, dateRange?.endDate]);

  const rangeStars = rangeResult.stars;
  const rangeSongsCount = rangeResult.count;

  // Milestone songs set
  const milestoneSongs = dateBreakdown.milestoneSongs;

  // Weekly Cycle Milestone calculation (Resets every week cycle)
  let nextMilestoneInWeek = 6;
  if (rangeSongsCount >= 6) {
    nextMilestoneInWeek = 6 + (Math.floor((rangeSongsCount - 6) / 3) + 1) * 3;
  }
  const songsNeededForNextMilestoneInWeek = nextMilestoneInWeek - rangeSongsCount;

  // Range Chunks up to 485 songs
  const ranges = [
    { label: '1 - 50', start: 1, end: 50 },
    { label: '51 - 100', start: 51, end: 100 },
    { label: '101 - 150', start: 101, end: 150 },
    { label: '151 - 200', start: 151, end: 200 },
    { label: '201 - 250', start: 201, end: 250 },
    { label: '251 - 300', start: 251, end: 300 },
    { label: '301 - 350', start: 301, end: 350 },
    { label: '351 - 400', start: 351, end: 400 },
    { label: '401 - 450', start: 401, end: 450 },
    { label: '451 - 485', start: 451, end: 485 },
  ];

  // Songs completed on the selected calendar date
  const songsOnSelectedDate = useMemo(() => {
    return songChecks.filter(songNum => {
      const stamp = timestamps[songNum];
      if (!stamp) return false;
      const parsed = parseStampToDateAndTime(stamp);
      return parsed.date === selectedDate;
    });
  }, [songChecks, timestamps, selectedDate]);

  // Date-wise Practice History groups with stars per date!
  const historyByDate = useMemo(() => {
    const map = {};
    songChecks.forEach(songNum => {
      const stamp = timestamps[songNum];
      const parsed = parseStampToDateAndTime(stamp);
      const d = parsed.date;
      if (!map[d]) {
        map[d] = [];
      }
      map[d].push({
        songNum,
        time12: parsed.time12,
        stamp,
      });
    });

    const sortedDates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(dateKey => ({
      date: dateKey,
      songs: map[dateKey].sort((a, b) => a.songNum - b.songNum),
      count: map[dateKey].length,
      stars: dateBreakdown.starsByDate[dateKey] || 0,
    }));
  }, [songChecks, timestamps, dateBreakdown]);

  // Determine songs to display in grid
  const currentRangeObj = ranges.find(r => r.label === selectedRange) || ranges[0];
  const allSongsToDisplay = useMemo(() => {
    if (viewMode === 'dateOnly') {
      return [...songsOnSelectedDate].sort((a, b) => a - b);
    }
    if (searchQuery.trim()) {
      const q = parseInt(searchQuery.trim(), 10);
      if (!isNaN(q) && q >= 1 && q <= 485) {
        return [q];
      }
      return [];
    }
    const list = [];
    for (let i = currentRangeObj.start; i <= currentRangeObj.end; i++) {
      list.push(i);
    }
    return list;
  }, [viewMode, songsOnSelectedDate, searchQuery, currentRangeObj]);

  // Toggle or open date modify modal
  const handleSongClick = (songNum) => {
    if (!canEdit) return;

    const isChecked = songChecks.includes(songNum);

    if (isChecked) {
      if (canModifyDates) {
        // Open Modify Date Modal for this song (Authorized users only)!
        const currentParsed = parseStampToDateAndTime(timestamps[songNum]);
        setEditingSongNum(songNum);
        setEditDate(currentParsed.date);
        setEditTime(currentParsed.time24);
        return;
      } else {
        // Users without past date permission cannot change historical dates, but can uncheck if mistakenly clicked
        if (confirm(`Uncheck Song #${songNum}?`)) {
          const newChecks = songChecks.filter(n => n !== songNum);
          const newTimestamps = { ...timestamps };
          delete newTimestamps[songNum];
          updateMemberActivity(targetMemberId, 'newSongAcademy', {
            ...songData,
            songChecks: newChecks,
            timestamps: newTimestamps,
          });
          showToast(`Song #${songNum} unchecked.`);
        }
        return;
      }
    }

    // RULE: Users without past date permission can ONLY record inputs for Today (todayStr)
    const targetDate = isTodayOnlyUser ? todayStr : selectedDate;

    // Checking a new song -> Stamped with targetDate (Today for members) and current time!
    const now = new Date();
    const currentTime12 = formatTimeOnly(now);
    const newStamp = createStampFromDateAndTime(targetDate, currentTime12);

    const newChecks = [...songChecks, songNum];
    const newTimestamps = { ...timestamps, [songNum]: newStamp };

    updateMemberActivity(targetMemberId, 'newSongAcademy', {
      ...songData,
      songChecks: newChecks,
      timestamps: newTimestamps,
    });

    showToast(`✓ Song #${songNum} recorded for ${isTodayOnlyUser ? `Today (${targetDate})` : targetDate}!`);
  };

  // Directly open date modification modal for a song (Authorized Users Only)
  const handleOpenModifyModal = (e, songNum) => {
    e.stopPropagation();
    if (!canModifyDates) return;
    const currentParsed = parseStampToDateAndTime(timestamps[songNum]);
    setEditingSongNum(songNum);
    setEditDate(currentParsed.date);
    setEditTime(currentParsed.time24);
  };

  // Save modified date and time (Authorized Users Only)
  const handleSaveModifiedDate = (e) => {
    e.preventDefault();
    if (!canModifyDates) return;
    if (!editingSongNum) return;

    const time12Str = time24To12(editTime);
    const newStamp = createStampFromDateAndTime(editDate, time12Str);

    const newTimestamps = {
      ...timestamps,
      [editingSongNum]: newStamp,
    };

    updateMemberActivity(targetMemberId, 'newSongAcademy', {
      ...songData,
      timestamps: newTimestamps,
    });

    showToast(`✓ Song #${editingSongNum} updated to ${editDate} (${time12Str})`);
    setEditingSongNum(null);
  };

  // Uncheck song from modal
  const handleUncheckSong = () => {
    if (!editingSongNum) return;
    const songToRemove = editingSongNum;
    const newChecks = songChecks.filter(n => n !== songToRemove);
    const newTimestamps = { ...timestamps };
    delete newTimestamps[songToRemove];

    updateMemberActivity(targetMemberId, 'newSongAcademy', {
      ...songData,
      songChecks: newChecks,
      timestamps: newTimestamps,
    });

    showToast(`Song #${songToRemove} unchecked.`);
    setEditingSongNum(null);
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
        <div className="rounded-3xl bg-gradient-to-br from-pink-500 via-rose-600 to-pink-700 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-pink-400/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-100 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-pink-200" />
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

          <div className="flex items-center justify-between text-[11px] text-pink-100 font-semibold border-t border-white/20 pt-2">
            <span>{songsOnSelectedDate.length} {songsOnSelectedDate.length === 1 ? 'song' : 'songs'} on {selectedDate}</span>
            <span className="text-[10px] text-pink-200 font-bold">Single Day</span>
          </div>
        </div>

        {/* 2. Date Range / This Week Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-900 to-blue-900 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-indigo-400/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Date Cycle Stars</span>
            </span>
            <span className="text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-sky-200 backdrop-blur-xs">
              {dateRange?.startDate} → {dateRange?.endDate}
            </span>
          </div>

          <div className="my-2.5 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-300">
              {rangeStars}
            </span>
            <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-sky-200 font-semibold border-t border-white/10 pt-2">
            <span>{rangeSongsCount} {rangeSongsCount === 1 ? 'song' : 'songs'} in this cycle</span>
            <span className="text-[10px] text-sky-300 font-bold">Week Cycle (6=10⭐, +3=+10⭐)</span>
          </div>
        </div>

        {/* 3. All-Time Overall Total Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-amber-400/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
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

          <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold border-t border-white/10 pt-2">
            <span>{songChecks.length} / 485 completed</span>
            <span className="text-[10px] text-amber-300 font-bold">Sum of Week Cycles</span>
          </div>
        </div>
      </div>

      {/* Motivational Milestone Progress Banner (Weekly Cycle Rule) */}
      <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            🎯
          </div>
          <div>
            <span className="font-extrabold text-slate-800">
              {rangeSongsCount < 6
                ? `Weekly Cycle: 6 songs = 10 ⭐ (This week: ${rangeSongsCount}/6 completed)`
                : `Weekly Milestone: ${rangeStars} ⭐ earned! Next +10 ⭐ at ${nextMilestoneInWeek} songs`}
            </span>
            <p className="text-[10px] text-slate-500 font-medium">
              {rangeSongsCount < 6
                ? `Complete ${6 - rangeSongsCount} more songs within this week cycle to unlock 10 ⭐!`
                : `Complete ${songsNeededForNextMilestoneInWeek} more songs this week to unlock +10 ⭐! (Cycles reset every Saturday)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-pink-500 to-rose-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${rangeSongsCount < 6 ? (rangeSongsCount / 6) * 100 : (((rangeSongsCount - 6) % 3) / 3) * 100}%`
              }}
            />
          </div>
          <span className="text-[11px] font-black text-pink-700">
            {rangeSongsCount < 6 ? `${rangeSongsCount}/6` : `${(rangeSongsCount - 6) % 3}/3`}
          </span>
        </div>
      </div>

      {/* 📅 Interactive Calendar & Date Modify Control Center */}
      <div className="bg-gradient-to-br from-white to-pink-50/50 rounded-3xl p-4 sm:p-5 border-2 border-pink-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold shadow-inner">
              <Calendar className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800">
                Practice Date & Calendar Control
              </h3>
              <p className="text-[11px] text-slate-500">
                Select date to record new songs or modify completed song dates
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
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-white hover:bg-pink-50 text-slate-600 border border-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-white hover:bg-pink-50 text-slate-600 border border-slate-200'
              }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-pink-100 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Active Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-400 bg-pink-50/50 text-slate-800 cursor-pointer w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-pink-800 bg-pink-50 font-bold px-2.5 py-1 rounded-xl border border-pink-200 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>{selectedDateStars} Stars on this date</span>
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-t border-pink-100 pt-3 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'all'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>All 485 Songs</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('dateOnly')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'dateOnly'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Songs on {selectedDate}</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-white text-pink-900 font-black">
              {songsOnSelectedDate.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'history'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Practice Calendar History</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-pink-100 text-pink-900 font-bold">
              {historyByDate.length} days
            </span>
          </button>
        </div>
      </div>

      {/* SONGS GRID (All Songs OR Selected Date Only) */}
      {viewMode !== 'history' && (
        <div className="space-y-4">
        {/* Quick Search & Range Selector (in 'all' mode) */}
        {viewMode === 'all' && (
            <div className="bg-white rounded-3xl p-4 border-2 border-pink-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="1"
                    max="485"
                    placeholder="Search Song number (1 - 485)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-400 font-bold"
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Range Tabs */}
              {!searchQuery && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {ranges.map(r => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setSelectedRange(r.label)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedRange === r.label
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Songs Grid Container */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-pink-100 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Music className="w-4 h-4 text-pink-600" />
                <span>
                  {viewMode === 'dateOnly'
                    ? `Showing Songs completed on: ${selectedDate} (${songsOnSelectedDate.length}) • ${selectedDateStars} Stars`
                    : searchQuery
                    ? `Displaying Song #${searchQuery}`
                    : `Range: ${selectedRange}`}
                </span>
              </span>

              <div className="flex items-center gap-2">
                {isTodayOnlyUser ? (
                  <span className="text-[10px] text-pink-700 font-bold bg-pink-50 px-2.5 py-1 rounded-xl border border-pink-200">
                    ✨ Today-Only Input: Songs recorded for Today ({todayStr})
                  </span>
                ) : (
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                    💡 Click checked song to modify completion date
                  </span>
                )}
              </div>
            </div>

            {allSongsToDisplay.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Calendar className="w-8 h-8 text-pink-300 mx-auto" />
                <p className="font-bold text-slate-600">
                  No songs recorded on {selectedDate} yet.
                </p>
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className="px-4 py-1.5 bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-pink-700 transition-all cursor-pointer"
                >
                  Switch to "All 485 Songs" to record songs
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
                {allSongsToDisplay.map(songNum => {
                  const isChecked = songChecks.includes(songNum);
                  const stamp = timestamps[songNum];
                  const parsed = stamp ? parseStampToDateAndTime(stamp) : null;
                  const isMatchingActiveDate = parsed?.date === selectedDate;
                  const isMilestone = milestoneSongs.has(songNum);

                  return (
                    <div
                      key={songNum}
                      onClick={() => handleSongClick(songNum)}
                      className={`relative group py-2 px-1 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer ${
                        isChecked
                          ? isMatchingActiveDate
                            ? 'bg-gradient-to-br from-pink-600 to-rose-700 text-white border-pink-500 shadow-xs scale-102 font-black ring-2 ring-pink-300'
                            : 'bg-pink-600 text-white border-pink-600 shadow-xs font-black'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-pink-50 hover:border-pink-300 active:scale-95'
                      }`}
                      title={
                        isChecked
                          ? `Song #${songNum} completed on ${stamp}${isMilestone ? ' (Unlocked +10 Stars!)' : ''} (Click to Modify Date)`
                          : `Click to record Song #${songNum} for ${selectedDate}`
                      }
                    >
                      {/* Milestone Star Indicator */}
                      {isChecked && isMilestone && (
                        <div
                          className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs border border-amber-200 animate-pulse"
                          title="Milestone Song! Earned +10 Stars on completion date"
                        >
                          <Star className="w-2.5 h-2.5 fill-amber-950" />
                        </div>
                      )}

                      {/* Song Number */}
                      <span className="text-xs font-black">#{songNum}</span>

                      {/* Check Status */}
                      <span className="text-[10px] mt-0.5">
                        {isChecked ? '✓' : '□'}
                      </span>

                      {/* Date/Time Badge */}
                      {isChecked && stamp && (
                        <span className="text-[7.5px] text-pink-100 mt-0.5 leading-none scale-90 truncate max-w-full font-semibold">
                          {parsed?.date ? parsed.date.slice(5) : stamp.split('•')[0] || stamp}
                        </span>
                      )}

                      {/* Edit Pencil Icon on hover for checked songs */}
                      {isChecked && canEdit && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenModifyModal(e, songNum)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-pink-700 shadow-xs flex items-center justify-center hover:scale-110 transition-all opacity-80 group-hover:opacity-100"
                          title="Modify completion date"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📜 Practice History by Date (Only shown when History tab is clicked) */}
      {viewMode === 'history' && (
        <div id="new-song-history-section" className="bg-white rounded-3xl p-5 border-2 border-pink-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-pink-600" />
              <span>📜 Practice History by Date</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Detailed chronological record of every song completed, date-wise with stars earned
            </p>
          </div>
          <span className="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-xl border border-pink-200">
            Total Active Days: {historyByDate.length}
          </span>
        </div>

        {historyByDate.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Music className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No songs completed yet. Start checking songs in the grid above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyByDate.map((group) => (
              <div
                key={group.date}
                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                  group.stars > 0
                    ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                    : 'bg-slate-50 hover:bg-pink-50/40 border-slate-200'
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
                    <span className="text-xs font-bold text-pink-700 bg-pink-100 px-2 py-0.2 rounded-full">
                      {group.count} {group.count === 1 ? 'song' : 'songs'}
                    </span>

                    {/* 🌟 Stars earned on this date */}
                    {group.stars > 0 ? (
                      <span className="text-xs font-black text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-2.5 py-0.5 rounded-full border border-amber-400 shadow-2xs flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-700 text-amber-800" />
                        <span>+{group.stars} Stars Earned!</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        (Weekly cycle milestone progress)
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

                {/* Song Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.songs.map(({ songNum, time12 }) => {
                    const isMilestone = milestoneSongs.has(songNum);
                    return (
                      <button
                        key={songNum}
                        type="button"
                        onClick={(e) => canModifyDates && handleOpenModifyModal(e, songNum)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                          canModifyDates ? 'cursor-pointer group hover:bg-pink-100 hover:border-pink-300' : 'cursor-default'
                        } ${
                          isMilestone
                            ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 font-black'
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                        title={canModifyDates ? `Click to modify date for Song #${songNum}` : `Song #${songNum} completed at ${time12}`}
                      >
                        <span className={isMilestone ? 'text-amber-800' : 'text-pink-600'}>
                          #{songNum}
                        </span>
                        {isMilestone && (
                          <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">({time12})</span>
                        {canModifyDates && <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-pink-600" />}
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

      {/* 📅 Date Modification Modal for Checked Song */}
      {editingSongNum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-pink-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Modify Completion Date
                  </h3>
                  <p className="text-[11px] text-pink-700 font-semibold">
                    New Song #{editingSongNum}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSongNum(null)}
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
                      className="text-[10px] px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 font-bold hover:bg-pink-100"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDate(yesterdayStr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 font-bold hover:bg-pink-100"
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
                  className="w-full px-3 py-2 text-xs font-bold border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-400 bg-slate-50 text-slate-900 cursor-pointer"
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
                  className="w-full px-3 py-2 text-xs font-bold border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-400 bg-slate-50 text-slate-900 cursor-pointer"
                />
              </div>

              {/* Formatted Output Preview */}
              <div className="p-2.5 bg-pink-50/70 rounded-xl border border-pink-100 text-xs">
                <span className="text-[10px] font-bold text-pink-600 block uppercase">
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
                  onClick={handleUncheckSong}
                  className="px-3 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                  title="Remove this song from completed list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Uncheck</span>
                </button>

                <div className="flex-1 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingSongNum(null)}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
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
