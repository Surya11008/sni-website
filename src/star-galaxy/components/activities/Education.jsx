import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatDate, formatTimeOnly } from '../../utils/dateUtils';
import { calculateEducationStars } from '../../utils/starCalculations';
import {
  ArrowLeft,
  BookOpen,
  Star,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  Edit3,
  ShieldCheck,
  History,
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

export default function Education({ onBack }) {
  const {
    selectedMemberId,
    data,
    getMemberActivity,
    updateMemberActivity,
    currentUser,
    dateRange,
    canEditMember,
    canUserModifyPastDates,
    getMemberOverallStarsBreakdown,
  } = useApp();

  // Enforce privacy: regular member always sees own activity
  const targetMemberId = currentUser?.id;

  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
  const activityData = getMemberActivity(targetMemberId);
  const eduRecords = activityData.education || [];
  const overallBreakdown = getMemberOverallStarsBreakdown(targetMemberId);

  const todayStr = formatDate(new Date());
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayObj);

  const canModifyDates = canUserModifyPastDates(currentUser);
  const isTodayOnlyUser = !canModifyDates;
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isMember = currentUser?.role === 'member';
  const isAdminOrManager = isAdmin || isManager;
  const canEdit = canEditMember(targetMemberId);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('sessions'); // 'sessions' | 'history'
  const [showBlessingPopup, setShowBlessingPopup] = useState(false);

  // Edit Stamp Modal state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editDateValue, setEditDateValue] = useState(todayStr);
  const [editTimeValue, setEditTimeValue] = useState('12:00');

  // Filter in active date range (This Week)
  const activeEdu = useMemo(() => {
    return eduRecords.filter(e => e.date >= dateRange.startDate && e.date <= dateRange.endDate);
  }, [eduRecords, dateRange]);

  const weekStars = calculateEducationStars(activeEdu);
  const uniqueDaysInWeek = useMemo(() => new Set(activeEdu.map(e => e.date)).size, [activeEdu]);

  // Sessions on selected calendar date
  const sessionsOnSelectedDate = useMemo(() => {
    return eduRecords.filter(e => e.date === selectedDate);
  }, [eduRecords, selectedDate]);

  // History grouped by date
  const historyByDate = useMemo(() => {
    const map = {};
    eduRecords.forEach(rec => {
      const d = rec.date || 'unknown';
      if (!map[d]) map[d] = [];
      map[d].push(rec);
    });
    const sortedDates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(dateKey => ({
      date: dateKey,
      records: map[dateKey],
      count: map[dateKey].length,
    }));
  }, [eduRecords]);

  const sessions = [
    { key: 'morning', label: 'Morning Session', emoji: '🌅' },
    { key: 'afternoon', label: 'Afternoon Session', emoji: '☀️' },
    { key: 'evening', label: 'Evening Session', emoji: '🌙' },
  ];

  const handleCheckSession = (sessionKey) => {
    if (!canEdit) return;

    // RULE: Users without past date permission can ONLY check in sessions for Today (todayStr)
    const targetDate = isTodayOnlyUser ? todayStr : selectedDate;

    const alreadyChecked = eduRecords.some(e => e.date === targetDate && e.session === sessionKey);
    if (alreadyChecked) return;

    const now = new Date();
    const newRecord = {
      date: targetDate,
      session: sessionKey,
      timestamp: createStampFromDateAndTime(targetDate, formatTimeOnly(now)),
    };

    updateMemberActivity(targetMemberId, 'education', [...eduRecords, newRecord]);
    setShowBlessingPopup(true);
    setTimeout(() => setShowBlessingPopup(false), 2500);
  };

  const openModifyModal = (record) => {
    if (!canModifyDates) return;
    setEditingRecord(record);
    setEditDateValue(record.date || todayStr);
    const timeMatch = (record.timestamp || '').match(/•\s*(.*)/);
    setEditTimeValue(time12To24(timeMatch ? timeMatch[1].trim() : '12:00 PM'));
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!canModifyDates) return;
    if (!editingRecord || !editDateValue) return;

    const time12Str = time24To12(editTimeValue);
    const newStamp = createStampFromDateAndTime(editDateValue, time12Str);

    const updated = eduRecords.map(r => {
      if (r === editingRecord) {
        return {
          ...r,
          date: editDateValue,
          timestamp: newStamp,
        };
      }
      return r;
    });

    updateMemberActivity(targetMemberId, 'education', updated);
    setEditingRecord(null);
  };

  const handleDeleteSession = (record) => {
    if (!canModifyDates) return;
    if (!confirm('Delete this session record?')) return;
    updateMemberActivity(targetMemberId, 'education', eduRecords.filter(r => r !== record));
    if (editingRecord === record) setEditingRecord(null);
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

      {/* Blessing Popup on Check-in */}
      {showBlessingPopup && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold text-center shadow-lg animate-in slide-in-from-top-2 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-200 animate-spin-slow" />
          <span>✓ Session recorded for {selectedDate}! Elohim God Bless You!</span>
        </div>
      )}

      {/* ⭐ STAR CALCULATION ACCORDING TO DATES (DASHBOARD) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Selected Calendar Date */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-amber-300/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-100 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-200" />
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

          <div className="my-2 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {sessionsOnSelectedDate.length}
            </span>
            <span className="text-xs font-bold text-amber-100">Sessions on {selectedDate}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-amber-100 font-semibold border-t border-white/20 pt-2">
            <span>{sessionsOnSelectedDate.length > 0 ? 'Attended on this date ✓' : 'Not Attended Yet'}</span>
            <span className="text-[10px] font-bold text-amber-200">Daily Track</span>
          </div>
        </div>

        {/* 2. Date Cycle / This Week Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-orange-600 via-amber-700 to-yellow-800 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-orange-400/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Date Cycle Stars</span>
            </span>
            <span className="text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-amber-100 backdrop-blur-xs">
              {dateRange?.startDate} → {dateRange?.endDate}
            </span>
          </div>

          <div className="my-2.5 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-200">
              {weekStars}
            </span>
            <Star className="w-7 h-7 fill-amber-300 text-amber-300 animate-pulse" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-amber-100 font-semibold border-t border-white/10 pt-2">
            <span>{uniqueDaysInWeek} Days Attended this cycle</span>
            <span className="text-[10px] text-amber-200 font-bold">Week Ladder</span>
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
              {overallBreakdown.education.stars}
            </span>
            <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-blue-100 font-semibold border-t border-white/20 pt-2">
            <span>{overallBreakdown.education.count} Total Days Attended</span>
            <span className="text-[10px] text-amber-300 font-bold">All History</span>
          </div>
        </div>
      </div>

      {/* Weekly Ladder Milestone Rule Banner */}
      <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            🎯
          </div>
          <div>
            <span className="font-extrabold text-slate-800">
              Education Weekly Ladder Rule: 3–5 Days = 10 ⭐ • 6–7 Days = 20 ⭐
            </span>
            <p className="text-[10px] text-slate-500 font-medium">
              Currently attended <strong className="text-amber-800 font-bold">{uniqueDaysInWeek} day(s)</strong> in this date cycle.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-bold">
          <span className={`px-2.5 py-0.5 rounded-lg text-xs ${uniqueDaysInWeek >= 3 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
            3+ Days (10⭐)
          </span>
          <span className={`px-2.5 py-0.5 rounded-lg text-xs ${uniqueDaysInWeek >= 6 ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            6+ Days (20⭐)
          </span>
        </div>
      </div>

      {/* 📅 Interactive Calendar & Date Modify Control Center */}
      <div className="bg-gradient-to-br from-white to-amber-50/50 rounded-3xl p-4 sm:p-5 border-2 border-amber-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-inner">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800">
                Attendance Date & Calendar Control
              </h3>
              <p className="text-[11px] text-slate-500">
                Select date to record sessions or view/modify previous attendance
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
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-slate-600 border border-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-slate-600 border border-slate-200'
              }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-amber-100 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Active Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 bg-amber-50/50 text-slate-800 cursor-pointer w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-amber-900 bg-amber-100 font-bold px-2.5 py-1 rounded-xl border border-amber-200">
              ✨ Recording for: <strong>{selectedDate}</strong>
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-t border-amber-100 pt-3 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('sessions')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'sessions'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Daily Sessions for {selectedDate}</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-white text-amber-900 font-black">
              {sessionsOnSelectedDate.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'history'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Attendance Calendar History</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
              {historyByDate.length} days
            </span>
          </button>
        </div>
      </div>

      {/* DAILY SESSIONS FOR SELECTED DATE */}
      {viewMode === 'sessions' && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-amber-100 shadow-xs space-y-3">
        <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Sessions for {isTodayOnlyUser ? `Today (${todayStr})` : selectedDate}</span>
          </span>
          <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
            {eduRecords.filter(e => e.date === (isTodayOnlyUser ? todayStr : selectedDate)).length} / 3 Completed
          </span>
        </h3>

        {isTodayOnlyUser && selectedDate !== todayStr && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
            <span>ℹ️</span>
            <span>
              Viewing <strong>{selectedDate}</strong>. Today-only mode active: session check-in will be recorded for <strong>Today ({todayStr})</strong>.
            </span>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map(sess => {
            const activeDate = isTodayOnlyUser ? todayStr : selectedDate;
            const checkedRecord = eduRecords.find(e => e.date === activeDate && e.session === sess.key);
            return (
              <div
                key={sess.key}
                onClick={() => !checkedRecord && canEdit && handleCheckSession(sess.key)}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  checkedRecord
                    ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-amber-50/40 cursor-pointer active:scale-98'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg inline-block">{sess.emoji}</span>
                    <span className="font-extrabold text-sm text-slate-800">
                      {sess.label}
                    </span>
                  </div>
                  {checkedRecord ? (
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-amber-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Checked-in: {checkedRecord.timestamp}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click to check in for {isTodayOnlyUser ? `Today (${todayStr})` : selectedDate}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {checkedRecord ? (
                    <div className="flex items-center gap-1.5">
                      <span className="px-3 py-1 rounded-xl bg-amber-200 text-amber-900 font-bold text-xs">
                        Completed ✓
                      </span>
                      {canModifyDates && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModifyModal(checkedRecord);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-bold border border-indigo-200 shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="Modify Date / Time (Authorized Users Only)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Modify</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    canEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckSession(sess.key);
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        Check-in
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

      {/* 📜 Attendance History by Date (Only shown when History tab is clicked) */}
      {viewMode === 'history' && (
        <div id="education-history-section" className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <span>📜 Attendance History by Date</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological log of every session attended with date, time, and session name
            </p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
            Total Active Days: {historyByDate.length}
          </span>
        </div>

        {historyByDate.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No education sessions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyByDate.map((group) => (
              <div
                key={group.date}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-amber-50/40 transition-all space-y-2.5"
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
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      {group.count} {group.count === 1 ? 'session' : 'sessions'} attended
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(group.date);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Select Date</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Session Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {group.records.map((rec, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => canModifyDates && openModifyModal(rec)}
                      className={`px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 transition-all flex items-center gap-1.5 shadow-2xs ${
                        canModifyDates ? 'hover:bg-amber-100 hover:border-amber-300 group cursor-pointer' : 'cursor-default'
                      }`}
                      title={canModifyDates ? "Click to modify date/time (Authorized Users Only)" : `Session: ${rec.timestamp}`}
                    >
                      <span className="capitalize">{rec.session} Session</span>
                      <span className="text-[10px] text-slate-400 font-medium">({rec.timestamp?.split('•')[1]?.trim() || rec.timestamp})</span>
                      {canModifyDates && <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* 📅 Modify Attendance Date & Timestamp Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-amber-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Modify Attendance Date
                  </h3>
                  <p className="text-[11px] text-amber-700 font-semibold capitalize">
                    {editingRecord.session} Session
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2.5 mb-3">
              Member: <strong className="text-slate-800">{selectedMember?.name}</strong>
            </p>

            {/* Date Modify Form */}
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Attendance Date:
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditDateValue(todayStr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold hover:bg-amber-100"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDateValue(yesterdayStr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold hover:bg-amber-100"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={editDateValue}
                  onChange={(e) => setEditDateValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 bg-slate-50 text-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Attendance Time:
                </label>
                <input
                  type="time"
                  required
                  value={editTimeValue}
                  onChange={(e) => setEditTimeValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 bg-slate-50 text-slate-900 cursor-pointer"
                />
              </div>

              {/* Formatted Output Preview */}
              <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-100 text-xs">
                <span className="text-[10px] font-bold text-amber-700 block uppercase">
                  Formatted Timestamp Preview:
                </span>
                <span className="font-extrabold text-slate-800 font-mono text-[11px]">
                  📅 {createStampFromDateAndTime(editDateValue, time24To12(editTimeValue))}
                </span>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteSession(editingRecord)}
                  className="px-3 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                  title="Delete this session record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex-1 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
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
